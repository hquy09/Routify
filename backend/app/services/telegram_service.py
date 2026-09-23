import json
import re
import urllib.request
import urllib.error
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Set
from sqlalchemy.orm import Session
from app.models.sync import AppSetting
from app.models.task import Task
from app.services.schedule_service import ScheduleService

# In-memory tracking of reminders sent today to avoid duplicates
_SENT_REMINDERS_CACHE: Set[str] = set()

# Cached bot info in memory
_CACHED_BOT_INFO: Dict[str, Any] = {}

def clean_bot_token(raw_token: Optional[str]) -> str:
    """Extract and sanitize a valid Telegram bot token from raw text or clipboard paste."""
    if not raw_token:
        return ""
    token_str = str(raw_token).strip()
    match = re.search(r"(\d{8,12}:[A-Za-z0-9_-]{25,50})", token_str)
    if match:
        return match.group(1)
    fallback = re.search(r"(\d+:[A-Za-z0-9_-]{20,})", token_str)
    if fallback:
        return fallback.group(1)
    return token_str.strip()

def format_telegram_error(e: Exception) -> str:
    """Format exceptions into concise, human-readable Vietnamese error descriptions."""
    if isinstance(e, urllib.error.HTTPError):
        if e.code == 401:
            return "Bot Token không hợp lệ hoặc đã bị thu hồi (401 Unauthorized)."
        if e.code == 404:
            return "Không tìm thấy Bot trên Telegram (404 Not Found). Vui lòng kiểm tra lại Token từ @BotFather."
        err_body = e.read().decode("utf-8") if e.fp else ""
        try:
            err_json = json.loads(err_body)
            desc = err_json.get("description", "")
            if desc:
                return f"Telegram: {desc}"
        except Exception:
            pass
        return f"Lỗi Telegram HTTP {e.code}"
    err_str = str(e)
    if "control characters" in err_str or "URL" in err_str:
        return "Bot Token chứa khoảng trắng hoặc ký tự không hợp lệ."
    if "timed out" in err_str.lower() or "timeout" in err_str.lower():
        return "Hết thời gian kết nối tới Telegram API (Timeout)."
    if "getaddrinfo failed" in err_str or "name resolution" in err_str.lower():
        return "Không thể kết nối Internet tới Telegram API (Lỗi mạng)."
    return "Không thể kết nối tới máy chủ Telegram."

class TelegramService:
    @staticmethod
    def send_telegram_message(bot_token: str, chat_id: str, text: str, parse_mode: str = "HTML") -> Dict[str, Any]:
        """Send message to Telegram chat using Bot API via standard urllib."""
        token = clean_bot_token(bot_token)
        cid = str(chat_id).strip() if chat_id else ""
        if not token or not cid:
            return {"ok": False, "error": "Bot token và Chat ID không được để trống"}

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": cid,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True,
        }

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data,
                headers={"Content-Type": "application/json", "User-Agent": "LifeOS-Telegram-Bot/1.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode("utf-8"))
                return {"ok": True, "result": result}
        except Exception as e:
            return {"ok": False, "error": format_telegram_error(e)}

    @staticmethod
    def get_bot_info(bot_token: str) -> Dict[str, Any]:
        """Get information about the Telegram bot using getMe endpoint."""
        token = clean_bot_token(bot_token)
        if not token:
            return {"ok": False, "error": "Bot token không được để trống"}

        if token in _CACHED_BOT_INFO:
            return {"ok": True, "bot": _CACHED_BOT_INFO[token]}

        url = f"https://api.telegram.org/bot{token}/getMe"
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "LifeOS-Telegram-Bot/1.0"}
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                result = json.loads(response.read().decode("utf-8"))
                if result.get("ok"):
                    bot_data = result.get("result", {})
                    info = {
                        "id": bot_data.get("id"),
                        "is_bot": bot_data.get("is_bot", True),
                        "first_name": bot_data.get("first_name", ""),
                        "username": bot_data.get("username", ""),
                        "can_join_groups": bot_data.get("can_join_groups", True),
                    }
                    _CACHED_BOT_INFO[token] = info
                    return {"ok": True, "bot": info}
                return {"ok": False, "error": result.get("description", "Không thể lấy thông tin Bot")}
        except Exception as e:
            return {"ok": False, "error": format_telegram_error(e)}

    @staticmethod
    def detect_latest_chat_id(bot_token: str) -> Dict[str, Any]:
        """
        Detect latest chat ID from recent messages sent to the bot using getUpdates endpoint.
        Allows users to automatically retrieve their chat/user ID by simply starting or messaging the bot.
        """
        token = clean_bot_token(bot_token)
        if not token:
            return {"ok": False, "error": "Bot token không được để trống"}

        url = f"https://api.telegram.org/bot{token}/getUpdates?limit=20&offset=-20"
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "LifeOS-Telegram-Bot/1.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode("utf-8"))
                if not result.get("ok"):
                    return {"ok": False, "error": result.get("description", "Không thể lấy danh sách tin nhắn")}

                updates = result.get("result", [])
                if not updates:
                    return {
                        "ok": False,
                        "waiting": True,
                        "error": (
                            "Chưa tìm thấy tin nhắn nào gửi tới Bot. "
                            "Hãy mở Telegram, bấm Start hoặc gửi 1 tin nhắn bất kỳ cho Bot rồi thử lại!"
                        )
                    }

                # Reverse iterate to find the most recent user interaction
                for update in reversed(updates):
                    msg = update.get("message") or update.get("my_chat_member") or update.get("callback_query", {}).get("message")
                    if not msg:
                        continue

                    chat = msg.get("chat", {})
                    from_user = msg.get("from", {})
                    chat_id = chat.get("id") or from_user.get("id")
                    if chat_id:
                        first_name = chat.get("first_name") or from_user.get("first_name", "")
                        last_name = chat.get("last_name") or from_user.get("last_name", "")
                        username = chat.get("username") or from_user.get("username", "")
                        full_name = f"{first_name} {last_name}".strip() or first_name or "Người dùng Telegram"
                        msg_text = msg.get("text", "")
                        
                        return {
                            "ok": True,
                            "chat_id": str(chat_id),
                            "first_name": full_name,
                            "username": username,
                            "chat_type": chat.get("type", "private"),
                            "latest_message": msg_text,
                        }

                return {
                    "ok": False,
                    "waiting": True,
                    "error": "Chưa tìm thấy tin nhắn hợp lệ từ người dùng. Hãy nhắn 1 tin nhắn cho Bot rồi bấm lại nút này."
                }
        except Exception as e:
            return {"ok": False, "error": format_telegram_error(e)}

    @classmethod
    def get_config(cls, db: Session) -> Dict[str, Any]:
        """Get Telegram configuration settings from AppSetting table."""
        keys = [
            "telegram_bot_token",
            "telegram_chat_id",
            "telegram_enabled",
            "telegram_reminder_minutes",
            "telegram_check_interval",
            "telegram_morning_briefing_enabled",
            "telegram_morning_briefing_time",
            "telegram_last_morning_briefing_date",
            "telegram_include_philosophy",
            "telegram_notify_schedules",
            "telegram_notify_tasks",
        ]
        settings_map: Dict[str, str] = {}
        for s in db.query(AppSetting).filter(AppSetting.key.in_(keys)).all():
            settings_map[s.key] = s.value

        raw_token = clean_bot_token(settings_map.get("telegram_bot_token", ""))
        # Mask token for security when returning
        masked_token = ""
        if raw_token and len(raw_token) > 10:
            parts = raw_token.split(":")
            if len(parts) == 2:
                masked_token = f"{parts[0]}:{parts[1][:4]}...{parts[1][-4:]}"
            else:
                masked_token = f"{raw_token[:6]}...{raw_token[-4:]}"
        elif raw_token:
            masked_token = "***"

        # Try to resolve bot info if token exists
        bot_username = ""
        bot_first_name = ""
        if raw_token:
            if raw_token not in _CACHED_BOT_INFO:
                cls.get_bot_info(raw_token)
            if raw_token in _CACHED_BOT_INFO:
                bot_username = _CACHED_BOT_INFO[raw_token].get("username", "")
                bot_first_name = _CACHED_BOT_INFO[raw_token].get("first_name", "")

        return {
            "has_token": bool(raw_token),
            "masked_token": masked_token,
            "chat_id": settings_map.get("telegram_chat_id", ""),
            "is_enabled": settings_map.get("telegram_enabled", "false") == "true",
            "reminder_minutes": int(settings_map.get("telegram_reminder_minutes", "15")),
            "check_interval": int(settings_map.get("telegram_check_interval", "60")),
            "morning_briefing_enabled": settings_map.get("telegram_morning_briefing_enabled", "true") == "true",
            "morning_briefing_time": settings_map.get("telegram_morning_briefing_time", "05:00"),
            "last_morning_briefing_date": settings_map.get("telegram_last_morning_briefing_date", ""),
            "include_philosophy": settings_map.get("telegram_include_philosophy", "true") == "true",
            "notify_schedules": settings_map.get("telegram_notify_schedules", "true") == "true",
            "notify_tasks": settings_map.get("telegram_notify_tasks", "true") == "true",
            "bot_username": bot_username,
            "bot_first_name": bot_first_name,
        }

    @classmethod
    def save_config(
        cls,
        db: Session,
        bot_token: Optional[str] = None,
        chat_id: Optional[str] = None,
        is_enabled: Optional[bool] = None,
        reminder_minutes: Optional[int] = None,
        check_interval: Optional[int] = None,
        morning_briefing_enabled: Optional[bool] = None,
        morning_briefing_time: Optional[str] = None,
        include_philosophy: Optional[bool] = None,
        notify_schedules: Optional[bool] = None,
        notify_tasks: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """Save Telegram configuration settings."""
        def set_val(k: str, v: str):
            item = db.query(AppSetting).filter(AppSetting.key == k).first()
            if not item:
                item = AppSetting(key=k, value=v)
                db.add(item)
            else:
                item.value = v

        if bot_token is not None and bot_token.strip():
            cleaned_token = bot_token.strip()
            set_val("telegram_bot_token", cleaned_token)
            # Invalidate cached bot info if token changes
            _CACHED_BOT_INFO.pop(cleaned_token, None)
            # Pre-fetch bot info to have username ready
            cls.get_bot_info(cleaned_token)

        if chat_id is not None:
            set_val("telegram_chat_id", chat_id.strip())
        if is_enabled is not None:
            set_val("telegram_enabled", "true" if is_enabled else "false")
        if reminder_minutes is not None:
            set_val("telegram_reminder_minutes", str(reminder_minutes))
        if check_interval is not None:
            set_val("telegram_check_interval", str(max(15, check_interval)))
        if morning_briefing_enabled is not None:
            set_val("telegram_morning_briefing_enabled", "true" if morning_briefing_enabled else "false")
        if morning_briefing_time is not None:
            # Validate format HH:MM
            time_val = morning_briefing_time.strip()
            if len(time_val) == 5 and ":" in time_val:
                set_val("telegram_morning_briefing_time", time_val)
        if include_philosophy is not None:
            set_val("telegram_include_philosophy", "true" if include_philosophy else "false")
        if notify_schedules is not None:
            set_val("telegram_notify_schedules", "true" if notify_schedules else "false")
        if notify_tasks is not None:
            set_val("telegram_notify_tasks", "true" if notify_tasks else "false")

        db.commit()
        return cls.get_config(db)

    @classmethod
    def clear_config(cls, db: Session) -> Dict[str, Any]:
        """Clear Telegram bot token and chat ID, disabling bot."""
        keys = ["telegram_bot_token", "telegram_chat_id", "telegram_enabled", "telegram_last_morning_briefing_date"]
        for k in keys:
            item = db.query(AppSetting).filter(AppSetting.key == k).first()
            if item:
                item.value = "" if k != "telegram_enabled" else "false"
        _CACHED_BOT_INFO.clear()
        _SENT_REMINDERS_CACHE.clear()
        db.commit()
        return cls.get_config(db)

    @classmethod
    def test_connection(cls, db: Session, bot_token: Optional[str] = None, chat_id: Optional[str] = None) -> Dict[str, Any]:
        """Send a test message to verify the bot can deliver to the user."""
        token_to_use = bot_token
        chat_to_use = chat_id

        if not token_to_use or not chat_to_use:
            token_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_bot_token").first()
            chat_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_chat_id").first()
            token_to_use = token_to_use or (token_setting.value if token_setting else None)
            chat_to_use = chat_to_use or (chat_setting.value if chat_setting else None)

        if not token_to_use or not chat_to_use:
            return {"ok": False, "error": "Vui lòng nhập Bot Token và Chat ID trước khi kiểm tra"}

        now_str = datetime.now().strftime("%H:%M:%S • %d/%m/%Y")
        text = (
            "<b>LifeOS • Kết nối Telegram thành công</b>\n\n"
            f"⏱ <i>Thời gian:</i> <code>{now_str}</code>\n"
            "✓ Đã kích hoạt nhận thông báo lịch trình & nhiệm vụ."
        )
        return cls.send_telegram_message(token_to_use, chat_to_use, text)

    @classmethod
    def send_morning_briefing(cls, db: Session, force: bool = False) -> Dict[str, Any]:
        """
        Send a concise morning briefing of today's schedule, timetable, and tasks.
        Includes Stoic philosophical quote if enabled. Minimal text, no AI fluff.
        """
        token_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_bot_token").first()
        chat_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_chat_id").first()
        philo_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_include_philosophy").first()

        if not token_setting or not token_setting.value or not chat_setting or not chat_setting.value:
            return {"ok": False, "error": "Chưa cấu hình Bot Token hoặc Chat ID Telegram"}

        bot_token = clean_bot_token(token_setting.value)
        chat_id = chat_setting.value.strip()
        include_philosophy = (philo_setting.value == "true") if philo_setting else True

        now = datetime.now()
        today = now.date()
        date_display = today.strftime("%d/%m/%Y")
        dow_names = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
        dow_name = dow_names[today.weekday()]

        # 1. Fixed Schedules & Timetable today
        occurrences = ScheduleService.get_occurrences_for_date(db, today)
        occurrences.sort(key=lambda o: o.start_time)

        # 2. Tasks for today
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        tasks_today = db.query(Task).filter(
            ((Task.due_datetime >= today_start) & (Task.due_datetime <= today_end)) |
            ((Task.start_datetime >= today_start) & (Task.start_datetime <= today_end)) |
            (Task.status == "IN_PROGRESS")
        ).all()

        # Priority order
        priority_weights = {"URGENT": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
        tasks_today.sort(key=lambda t: priority_weights.get(t.priority or "MEDIUM", 2), reverse=True)

        lines = [
            f"🌅 <b>LIFEOS • {date_display} ({dow_name})</b>",
            "",
            f"📅 <b>LỊCH CỐ ĐỊNH ({len(occurrences)}):</b>",
        ]

        if not occurrences:
            lines.append("<i>Không có lịch cố định hôm nay.</i>")
        else:
            for idx, occ in enumerate(occurrences, start=1):
                icon = occ.icon or "📌"
                loc = f" (📍 {occ.location})" if occ.location else ""
                lines.append(f"{idx}. {icon} <b>{occ.title}</b>: <code>{occ.start_time} - {occ.end_time}</code>{loc}")

        lines.append("")
        lines.append(f"🎯 <b>NHIỆM VỤ ({len(tasks_today)}):</b>")
        if not tasks_today:
            lines.append("<i>Chưa có nhiệm vụ hôm nay.</i>")
        else:
            for idx, t in enumerate(tasks_today[:12], start=1):
                status_icon = "✓" if t.status == "COMPLETED" else ("⚡" if t.status == "IN_PROGRESS" else "•")
                due_str = f" [Hạn {t.due_datetime.strftime('%H:%M')}]" if t.due_datetime else ""
                lines.append(f"{idx}. {status_icon} <b>{t.title}</b>{due_str}")
            if len(tasks_today) > 12:
                lines.append(f"<i>(+{len(tasks_today) - 12} nhiệm vụ khác)</i>")

        # 3. Minimal Philosophy quote
        if include_philosophy:
            try:
                from app.api.routes.quotes import PHILOSOPHICAL_QUOTES
                if PHILOSOPHICAL_QUOTES:
                    quote_idx = (today.year * 365 + today.month * 31 + today.day) % len(PHILOSOPHICAL_QUOTES)
                    quote_item = PHILOSOPHICAL_QUOTES[quote_idx]
                    lines.append("")
                    lines.append("💡 <b>TRIẾT LÝ:</b>")
                    lines.append(f"« <i>{quote_item['quote']}</i> » — {quote_item['author']}")
            except Exception as e:
                pass

        full_text = "\n".join(lines)
        res = cls.send_telegram_message(bot_token, chat_id, full_text)
        
        if res.get("ok"):
            # Update last morning briefing date
            setting_date = db.query(AppSetting).filter(AppSetting.key == "telegram_last_morning_briefing_date").first()
            if not setting_date:
                db.add(AppSetting(key="telegram_last_morning_briefing_date", value=today.isoformat()))
            else:
                setting_date.value = today.isoformat()
            db.commit()

        return res

    @classmethod
    def check_and_send_reminders(cls, db: Session) -> List[str]:
        """
        Periodic check:
        1. Sends Morning Briefing if current time matches/passed morning_briefing_time and not yet sent today.
        2. Checks fixed schedules within reminder window if notify_schedules is True.
        3. Checks upcoming tasks within reminder window if notify_tasks is True.
        """
        token_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_bot_token").first()
        chat_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_chat_id").first()
        enabled_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_enabled").first()
        mins_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_reminder_minutes").first()
        briefing_en_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_morning_briefing_enabled").first()
        briefing_time_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_morning_briefing_time").first()
        last_briefing_date_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_last_morning_briefing_date").first()
        notify_sched_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_notify_schedules").first()
        notify_task_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_notify_tasks").first()

        if not enabled_setting or enabled_setting.value != "true":
            return []
        if not token_setting or not token_setting.value or not chat_setting or not chat_setting.value:
            return []

        bot_token = clean_bot_token(token_setting.value)
        chat_id = chat_setting.value.strip()
        reminder_minutes = int(mins_setting.value) if mins_setting and mins_setting.value.isdigit() else 15
        morning_briefing_enabled = briefing_en_setting.value != "false" if briefing_en_setting else True
        morning_briefing_time = briefing_time_setting.value if briefing_time_setting else "05:00"
        last_briefing_date = last_briefing_date_setting.value if last_briefing_date_setting else ""
        notify_schedules = notify_sched_setting.value != "false" if notify_sched_setting else True
        notify_tasks = notify_task_setting.value != "false" if notify_task_setting else True

        now = datetime.now()
        today = now.date()
        sent_messages: List[str] = []

        # -------------------------------------------------------------
        # 1. Check Morning Briefing (e.g., at 05:00 AM)
        # -------------------------------------------------------------
        if morning_briefing_enabled and last_briefing_date != today.isoformat():
            try:
                b_hour, b_minute = map(int, morning_briefing_time.split(":"))
                scheduled_briefing_dt = datetime.combine(today, datetime.min.time()).replace(
                    hour=b_hour, minute=b_minute
                )
                diff_sec = (now - scheduled_briefing_dt).total_seconds()
                if 0 <= diff_sec <= 3 * 3600:
                    res = cls.send_morning_briefing(db)
                    if res.get("ok"):
                        sent_messages.append(f"MorningBriefing: {today.isoformat()} at {morning_briefing_time}")
            except Exception as e:
                print(f"[TelegramService] Error checking morning briefing: {e}")

        # -------------------------------------------------------------
        # 2. Check Fixed Schedules for today
        # -------------------------------------------------------------
        if notify_schedules:
            try:
                occurrences = ScheduleService.get_occurrences_for_date(db, today)
                for occ in occurrences:
                    try:
                        start_hour, start_minute = map(int, occ.start_time.split(":"))
                        event_dt = datetime.combine(today, datetime.min.time()).replace(
                            hour=start_hour, minute=start_minute
                        )
                        diff_seconds = (event_dt - now).total_seconds()
                        diff_minutes = diff_seconds / 60

                        if -2 <= diff_minutes <= reminder_minutes:
                            cache_key = f"sched_{occ.fixed_schedule_id}_{today.isoformat()}_{occ.start_time}"
                            if cache_key not in _SENT_REMINDERS_CACHE:
                                minutes_text = (
                                    "ngay bây giờ" if diff_minutes <= 1
                                    else f"sau {int(diff_minutes)} phút"
                                )
                                location_part = f"\n📍 {occ.location}" if occ.location else ""

                                msg = (
                                    f"⏰ <b>LỊCH SẮP DIỄN RA</b>\n\n"
                                    f"📌 <b>{occ.title}</b>\n"
                                    f"⏱ <code>{occ.start_time} - {occ.end_time}</code> (Bắt đầu {minutes_text})"
                                    f"{location_part}"
                                )
                                res = cls.send_telegram_message(bot_token, chat_id, msg)
                                if res.get("ok"):
                                    _SENT_REMINDERS_CACHE.add(cache_key)
                                    sent_messages.append(f"FixedSchedule: {occ.title} ({occ.start_time})")
                    except Exception as e:
                        print(f"[TelegramService] Error checking schedule {occ}: {e}")
            except Exception as e:
                print(f"[TelegramService] Error fetching occurrences: {e}")

        # -------------------------------------------------------------
        # 3. Check Tasks scheduled for today with start_datetime or due_datetime
        # -------------------------------------------------------------
        if notify_tasks:
            try:
                today_start = datetime.combine(today, datetime.min.time())
                today_end = datetime.combine(today, datetime.max.time())
                
                # Check tasks starting today
                tasks_starting = db.query(Task).filter(
                    Task.status.in_(["TODO", "IN_PROGRESS"]),
                    Task.start_datetime >= today_start,
                    Task.start_datetime <= today_end
                ).all()

                for t in tasks_starting:
                    if not t.start_datetime:
                        continue
                    diff_seconds = (t.start_datetime - now).total_seconds()
                    diff_minutes = diff_seconds / 60
                    if -2 <= diff_minutes <= reminder_minutes:
                        cache_key = f"task_start_{t.id}_{today.isoformat()}_{t.start_datetime.strftime('%H%M')}"
                        if cache_key not in _SENT_REMINDERS_CACHE:
                            minutes_text = (
                                "ngay bây giờ" if diff_minutes <= 1
                                else f"sau {int(diff_minutes)} phút"
                            )
                            time_str = t.start_datetime.strftime("%H:%M")

                            msg = (
                                f"🎯 <b>NHIỆM VỤ ĐẾN GIỜ</b>\n\n"
                                f"📝 <b>{t.title}</b>\n"
                                f"⏱ Bắt đầu: <code>{time_str}</code> ({minutes_text})"
                            )
                            res = cls.send_telegram_message(bot_token, chat_id, msg)
                            if res.get("ok"):
                                _SENT_REMINDERS_CACHE.add(cache_key)
                                sent_messages.append(f"TaskStart: {t.title} ({time_str})")

                # Check tasks due soon today
                tasks_due = db.query(Task).filter(
                    Task.status.in_(["TODO", "IN_PROGRESS"]),
                    Task.due_datetime >= today_start,
                    Task.due_datetime <= today_end
                ).all()

                for t in tasks_due:
                    if not t.due_datetime:
                        continue
                    diff_seconds = (t.due_datetime - now).total_seconds()
                    diff_minutes = diff_seconds / 60
                    if 0 <= diff_minutes <= reminder_minutes:
                        cache_key = f"task_due_{t.id}_{today.isoformat()}_{t.due_datetime.strftime('%H%M')}"
                        if cache_key not in _SENT_REMINDERS_CACHE:
                            due_time_str = t.due_datetime.strftime("%H:%M")
                            msg = (
                                f"⏳ <b>HẠN CHÓT SẮP HẾT</b>\n\n"
                                f"📝 <b>{t.title}</b>\n"
                                f"⏰ Hạn chót: <code>{due_time_str}</code> (Còn {int(diff_minutes)} phút)"
                            )
                            res = cls.send_telegram_message(bot_token, chat_id, msg)
                            if res.get("ok"):
                                _SENT_REMINDERS_CACHE.add(cache_key)
                                sent_messages.append(f"TaskDue: {t.title} ({due_time_str})")
            except Exception as e:
                print(f"[TelegramService] Error checking tasks: {e}")

        return sent_messages

    # Backward compatibility alias
    send_daily_briefing = send_morning_briefing
