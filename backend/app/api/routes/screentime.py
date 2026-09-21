from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.api.deps import get_database
from app.models.screentime import ScreenTimeLimit, ScreenTimeLog
from app.models.sync import AppSetting
from app.schemas.screentime import (
    ScreenTimeLogCreate, ScreenTimeLogOut, ScreenTimeLimitOut,
    ScreenTimeLimitCreate, ScreenTimeLimitUpdate, DailyDisciplineSummary, ScreenTimeOverview
)
from app.services.screentime_service import (
    get_daily_summary, get_screentime_overview, ensure_default_limits,
    get_discipline_config, save_discipline_config
)

router = APIRouter()

@router.get("/status")
def get_screentime_status(db: Session = Depends(get_database)):
    setting = db.query(AppSetting).filter(AppSetting.key == "screentime_enabled").first()
    enabled = (setting.value.lower() != "false") if setting and setting.value else True
    return {"enabled": enabled}

@router.post("/toggle")
def toggle_screentime(
    payload: dict = Body(...),
    db: Session = Depends(get_database)
):
    enabled = payload.get("enabled", True)
    setting = db.query(AppSetting).filter(AppSetting.key == "screentime_enabled").first()
    if not setting:
        setting = AppSetting(key="screentime_enabled", value="true" if enabled else "false")
        db.add(setting)
    else:
        setting.value = "true" if enabled else "false"

    if not enabled:
        # RESET ALL SCREENTIME DATA
        db.query(ScreenTimeLog).delete()
        db.query(ScreenTimeLimit).delete()
        db.query(AppSetting).filter(AppSetting.key == "custom_category_types").delete()
        db.commit()
        return {
            "message": "Đã tắt Quản lý sức khoẻ kỹ thuật số và đặt lại toàn bộ dữ liệu.",
            "enabled": False
        }
    else:
        ensure_default_limits(db, force_seed=True)
        db.commit()
        return {
            "message": "Đã bật Quản lý sức khoẻ kỹ thuật số.",
            "enabled": True
        }

@router.get("/overview", response_model=ScreenTimeOverview)
def get_overview(
    target_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_database)
):
    d = date.fromisoformat(target_date) if target_date else date.today()
    return get_screentime_overview(db, d)

@router.get("/daily", response_model=DailyDisciplineSummary)
def get_daily(
    target_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_database)
):
    d = date.fromisoformat(target_date) if target_date else date.today()
    return get_daily_summary(db, d)

@router.post("/logs", response_model=ScreenTimeLogOut)
def create_log(
    payload: ScreenTimeLogCreate,
    db: Session = Depends(get_database)
):
    log_d = payload.log_date if payload.log_date else date.today()
    new_log = ScreenTimeLog(
        log_date=log_d,
        category=payload.category,
        minutes_spent=payload.minutes_spent,
        app_name=payload.app_name,
        notes=payload.notes
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.delete("/logs/{log_id}")
def delete_log(
    log_id: int,
    db: Session = Depends(get_database)
):
    log = db.query(ScreenTimeLog).filter(ScreenTimeLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Screen time log not found")
    db.delete(log)
    db.commit()
    return {"message": "Log deleted successfully", "id": log_id}

@router.get("/limits", response_model=List[ScreenTimeLimitOut])
def list_limits(db: Session = Depends(get_database)):
    return ensure_default_limits(db)

@router.post("/limits", response_model=ScreenTimeLimitOut)
def create_limit(
    payload: ScreenTimeLimitCreate = Body(...),
    db: Session = Depends(get_database)
):
    existing = db.query(ScreenTimeLimit).filter(ScreenTimeLimit.category == payload.category).first()
    if existing:
        raise HTTPException(status_code=400, detail="Danh mục với mã này đã tồn tại")
    
    new_limit = ScreenTimeLimit(
        category=payload.category,
        label=payload.label or payload.category,
        category_type=payload.category_type,
        daily_limit_minutes=payload.daily_limit_minutes,
        is_active=payload.is_active,
        description=payload.description
    )
    db.add(new_limit)
    db.commit()
    db.refresh(new_limit)
    return new_limit

@router.put("/limits/{limit_id}", response_model=ScreenTimeLimitOut)
def update_limit(
    limit_id: int,
    payload: ScreenTimeLimitUpdate = Body(...),
    db: Session = Depends(get_database)
):
    lim = db.query(ScreenTimeLimit).filter(ScreenTimeLimit.id == limit_id).first()
    if not lim:
        raise HTTPException(status_code=404, detail="Limit not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lim, field, value)

    db.commit()
    db.refresh(lim)
    return lim

@router.delete("/limits/{limit_id}")
def delete_limit(
    limit_id: int,
    db: Session = Depends(get_database)
):
    lim = db.query(ScreenTimeLimit).filter(ScreenTimeLimit.id == limit_id).first()
    if not lim:
        raise HTTPException(status_code=404, detail="Limit not found")
    db.delete(lim)
    db.commit()
    return {"message": "Danh mục đã được xóa thành công", "id": limit_id}

@router.get("/discipline-config")
def get_discipline_scoring_config(db: Session = Depends(get_database)):
    """Get advanced discipline rating configuration."""
    return get_discipline_config(db)

@router.post("/discipline-config")
def update_discipline_scoring_config(
    payload: dict = Body(...),
    db: Session = Depends(get_database)
):
    """Update advanced discipline rating configuration."""
    updated = save_discipline_config(db, payload)
    return {"message": "Đã lưu cài đặt tính điểm kỷ luật thành công", "config": updated}
