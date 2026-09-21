from datetime import date, timedelta
from typing import List, Dict, Tuple, Optional, Any
from sqlalchemy.orm import Session
from app.models.screentime import ScreenTimeLimit, ScreenTimeLog
from app.schemas.screentime import (
    CategoryUsage, DailyDisciplineSummary, WeeklyDisciplineDay,
    ScreenTimeOverview, ScreenTimeLogOut, ScreenTimeLimitOut
)

DEFAULT_LIMITS = [
    {
        "category": "SOCIAL",
        "label": "Mạng xã hội",
        "category_type": "DISTRACTION",
        "daily_limit_minutes": 60,
        "description": "Facebook, TikTok, Instagram, X"
    },
    {
        "category": "ENTERTAINMENT",
        "label": "Giải trí & Game",
        "category_type": "DISTRACTION",
        "daily_limit_minutes": 90,
        "description": "YouTube giải trí, Phim, Chơi game"
    },
    {
        "category": "STUDY_WORK",
        "label": "Học tập & Làm việc",
        "category_type": "PRODUCTIVE",
        "daily_limit_minutes": 360,
        "description": "Học tập, lập trình, đọc tài liệu"
    },
    {
        "category": "OTHER",
        "label": "Khác",
        "category_type": "OTHER",
        "daily_limit_minutes": 60,
        "description": "Tin tức, lướt web tự do"
    },
]

VI_DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]

def is_screentime_enabled(db: Session) -> bool:
    try:
        from app.models.sync import AppSetting
        setting = db.query(AppSetting).filter(AppSetting.key == "screentime_enabled").first()
        if setting and setting.value:
            return setting.value.lower() != "false"
    except Exception:
        pass
    return True

def ensure_default_limits(db: Session, force_seed: bool = False) -> List[ScreenTimeLimit]:
    existing = db.query(ScreenTimeLimit).all()
    if not existing:
        if not force_seed and not is_screentime_enabled(db):
            return []
        for item in DEFAULT_LIMITS:
            lim = ScreenTimeLimit(
                category=item["category"],
                label=item["label"],
                category_type=item["category_type"],
                daily_limit_minutes=item["daily_limit_minutes"],
                description=item["description"],
                is_active=True
            )
            db.add(lim)
        db.commit()
        existing = db.query(ScreenTimeLimit).all()
    return existing

def get_discipline_config(db: Session) -> Dict[str, Any]:
    """Retrieve advanced discipline scoring configuration from AppSetting."""
    try:
        from app.models.sync import AppSetting
        import json
        setting = db.query(AppSetting).filter(AppSetting.key == "discipline_rating_config").first()
        if setting and setting.value:
            cfg = json.loads(setting.value)
            if isinstance(cfg, dict):
                return {
                    "early_penalty_enabled": bool(cfg.get("early_penalty_enabled", True)),
                    "warning_threshold_pct": int(cfg.get("warning_threshold_pct", 80)),
                    "penalty_multiplier": float(cfg.get("penalty_multiplier", 1.0)),
                    "early_penalty_rate": float(cfg.get("early_penalty_rate", 0.05)),
                }
    except Exception:
        pass
    return {
        "early_penalty_enabled": True,
        "warning_threshold_pct": 80,
        "penalty_multiplier": 1.0,
        "early_penalty_rate": 0.05,
    }

def save_discipline_config(db: Session, config: Dict[str, Any]) -> Dict[str, Any]:
    """Save advanced discipline scoring configuration to AppSetting."""
    from app.models.sync import AppSetting
    import json
    clean_config = {
        "early_penalty_enabled": bool(config.get("early_penalty_enabled", True)),
        "warning_threshold_pct": max(50, min(100, int(config.get("warning_threshold_pct", 80)))),
        "penalty_multiplier": max(0.1, min(5.0, float(config.get("penalty_multiplier", 1.0)))),
        "early_penalty_rate": max(0.01, min(0.5, float(config.get("early_penalty_rate", 0.05)))),
    }
    val_str = json.dumps(clean_config)
    setting = db.query(AppSetting).filter(AppSetting.key == "discipline_rating_config").first()
    if not setting:
        setting = AppSetting(key="discipline_rating_config", value=val_str)
        db.add(setting)
    else:
        setting.value = val_str
    db.commit()
    return clean_config

def calculate_daily_rating(
    limits: List[ScreenTimeLimit],
    usages: Dict[str, int],
    type_effects: Optional[Dict[str, str]] = None,
    discipline_config: Optional[Dict[str, Any]] = None
) -> Tuple[float, str, str, int, int, int]:
    """
    Calculate Rating 0.0 -> 10.0 dynamically based on categories.
    Distractions / over-limit categories deduct rating:
      - Early penalty if near limit (e.g. >= 80% limit): proportional deduction.
      - Hard penalty if exceeded limit: -0.1 per 5 mins exceeded * penalty_multiplier.
    Productive categories reward rating: +0.5 if >= 120m, +1.0 if >= 240m.
    Supports custom category types with effect ('BONUS', 'PENALTY', 'NEUTRAL').
    """
    score = 10.0
    violations = 0
    study_mins = 0
    distraction_mins = 0

    cfg = discipline_config or {
        "early_penalty_enabled": True,
        "warning_threshold_pct": 80,
        "penalty_multiplier": 1.0,
        "early_penalty_rate": 0.05,
    }
    early_enabled = cfg.get("early_penalty_enabled", True)
    thresh_pct = cfg.get("warning_threshold_pct", 80)
    multiplier = cfg.get("penalty_multiplier", 1.0)
    early_rate = cfg.get("early_penalty_rate", 0.05)

    for lim in limits:
        spent = usages.get(lim.category, 0)
        c_type = lim.category_type or "DISTRACTION"
        eff = type_effects.get(c_type) if type_effects else None

        is_bonus = (eff == "BONUS" or (eff is None and c_type == "PRODUCTIVE"))
        is_penalty = (eff == "PENALTY" or (eff is None and c_type == "DISTRACTION"))
        is_neutral = (eff == "NEUTRAL" or c_type == "OTHER")

        if is_bonus:
            study_mins += spent
        elif is_penalty:
            distraction_mins += spent
        elif is_neutral:
            pass
        else:
            distraction_mins += spent

        if lim.is_active and lim.daily_limit_minutes > 0:
            l_mins = lim.daily_limit_minutes
            warn_mins = (thresh_pct / 100.0) * l_mins

            if spent > l_mins:
                violations += 1
                hard_excess = spent - l_mins
                hard_deduction = (hard_excess / 5.0) * 0.1 * multiplier

                if early_enabled and thresh_pct < 100:
                    early_excess = l_mins - warn_mins
                    early_deduction = (early_excess / 5.0) * early_rate * multiplier
                    score -= (early_deduction + hard_deduction)
                else:
                    score -= hard_deduction
            elif early_enabled and thresh_pct < 100 and spent >= warn_mins and (is_penalty or eff != "BONUS"):
                # Early deduction when nearing limit (e.g. playing games almost full)
                near_excess = spent - warn_mins
                early_deduction = (near_excess / 5.0) * early_rate * multiplier
                score -= early_deduction

    # Reward for productive study/work
    if study_mins >= 240:
        score += 1.0
    elif study_mins >= 120:
        score += 0.5

    # Clamp 0.0 -> 10.0
    score = max(0.0, min(10.0, score))
    rating = round(score, 1)

    if rating >= 9.0:
        tier = "EXCELLENT"
        label = "Xuất sắc (Kỷ luật thép)"
    elif rating >= 7.5:
        tier = "GOOD"
        label = "Tốt (Kiểm soát tốt)"
    elif rating >= 5.0:
        tier = "FAIR"
        label = "Cần cải thiện (Hơi xao nhãng)"
    else:
        tier = "ALERT"
        label = "Báo động (Mất kiểm soát)"

    return rating, tier, label, violations, study_mins, distraction_mins

def get_daily_summary(db: Session, target_date: date) -> DailyDisciplineSummary:
    limits = ensure_default_limits(db)
    logs = db.query(ScreenTimeLog).filter(ScreenTimeLog.log_date == target_date).all()

    # Load custom category types config if available
    type_effects: Dict[str, str] = {}
    try:
        from app.models.sync import AppSetting
        import json
        cat_setting = db.query(AppSetting).filter(AppSetting.key == "custom_category_types").first()
        if cat_setting and cat_setting.value:
            items = json.loads(cat_setting.value)
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict) and "id" in item and "effect" in item:
                        type_effects[item["id"]] = item["effect"]
    except Exception:
        pass

    discipline_cfg = get_discipline_config(db)

    usages: Dict[str, int] = {}
    for log in logs:
        usages[log.category] = usages.get(log.category, 0) + log.minutes_spent

    rating, tier, label_vi, violations, study_mins, distraction_mins = calculate_daily_rating(
        limits, usages, type_effects, discipline_cfg
    )

    categories_usage: List[CategoryUsage] = []
    warn_thresh_pct = discipline_cfg.get("warning_threshold_pct", 80)
    for lim in limits:
        spent = usages.get(lim.category, 0)
        l_mins = lim.daily_limit_minutes
        pct = round((spent / l_mins * 100), 1) if l_mins > 0 else 0.0
        exceeded = max(0, spent - l_mins)

        if lim.is_active and l_mins > 0 and spent > l_mins:
            st = "VIOLATED"
        elif lim.is_active and l_mins > 0 and pct >= warn_thresh_pct:
            st = "WARNING"
        else:
            st = "SAFE"

        categories_usage.append(CategoryUsage(
            category=lim.category,
            category_label=lim.label or lim.category,
            category_type=lim.category_type or "DISTRACTION",
            minutes_spent=spent,
            daily_limit_minutes=l_mins,
            percentage=pct,
            status=st,
            exceeded_minutes=exceeded
        ))

    total_mins = sum(usages.values())

    return DailyDisciplineSummary(
        date=target_date.isoformat(),
        rating=rating,
        rating_tier=tier,
        rating_label_vi=label_vi,
        total_minutes=total_mins,
        study_work_minutes=study_mins,
        entertainment_social_minutes=distraction_mins,
        violations_count=violations,
        categories=categories_usage,
        logs=[ScreenTimeLogOut.model_validate(l) for l in logs]
    )

def get_screentime_overview(db: Session, target_date: date) -> ScreenTimeOverview:
    limits = ensure_default_limits(db)
    today_summary = get_daily_summary(db, target_date)

    # 7-day trend
    weekly_trend: List[WeeklyDisciplineDay] = []
    ratings: List[float] = []

    for i in range(6, -1, -1):
        d = target_date - timedelta(days=i)
        summary = get_daily_summary(db, d)
        ratings.append(summary.rating)
        day_vi = VI_DAY_NAMES[d.weekday()]
        weekly_trend.append(WeeklyDisciplineDay(
            date=d.isoformat(),
            day_name_vi=day_vi,
            rating=summary.rating,
            study_work_minutes=summary.study_work_minutes,
            entertainment_social_minutes=summary.entertainment_social_minutes,
            has_violation=(summary.violations_count > 0)
        ))

    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 10.0

    return ScreenTimeOverview(
        today=today_summary,
        weekly_trend=weekly_trend,
        average_rating_7d=avg_rating,
        limits=[ScreenTimeLimitOut.model_validate(l) for l in limits]
    )
