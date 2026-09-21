import json
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

class TelegramService:
    @staticmethod
    def send_telegram_message(bot_token: str, chat_id: str, text: str, parse_mode: str = "HTML") -> Dict[str, Any]:
        """Send message to Telegram chat using Bot API via standard urllib."""
        if not bot_token or not chat_id:
            return {"ok": False, "error": "Bot token và Chat ID không được để trống"}

        url = f"https://api.telegram.org/bot{bot_token.strip()}/sendMessage"
        payload = {
            "chat_id": str(chat_id).strip(),
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
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else str(e)
            try:
                err_json = json.loads(err_body)
                err_msg = err_json.get("description", str(e))
            except Exception:
                err_msg = err_body or str(e)
            return {"ok": False, "error": f"Lỗi Telegram ({e.code}): {err_msg}"}
        except Exception as e:
            return {"ok": False, "error": f"Lỗi kết nối: {str(e)}"}

    @classmethod
    def get_config(cls, db: Session) -> Dict[str, Any]:
        """Get Telegram configuration settings from AppSetting table."""
        keys = [
            "telegram_bot_token",
            "telegram_chat_id",
            "telegram_enabled",
            "telegram_reminder_minutes",
        ]
        settings_map: Dict[str, str] = {}
        for s in db.query(AppSetting).filter(AppSetting.key.in_(keys)).all():
            settings_map[s.key] = s.value

        raw_token = settings_map.get("telegram_bot_token", "")
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

        return {
            "has_token": bool(raw_token),
            "masked_token": masked_token,
            "chat_id": settings_map.get("telegram_chat_id", ""),
            "is_enabled": settings_map.get("telegram_enabled", "false") == "true",
            "reminder_minutes": int(settings_map.get("telegram_reminder_minutes", "15")),
        }

    @classmethod
    def save_config(
        cls,
        db: Session,
        bot_token: Optional[str] = None,
        chat_id: Optional[str] = None,
        is_enabled: Optional[bool] = None,
        reminder_minutes: Optional[int] = None,
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
            set_val("telegram_bot_token", bot_token.strip())
        if chat_id is not None:
            set_val("telegram_chat_id", chat_id.strip())
        if is_enabled is not None:
            set_val("telegram_enabled", "true" if is_enabled else "false")
        if reminder_minutes is not None:
            set_val("telegram_reminder_minutes", str(reminder_minutes))

        db.commit()
        return cls.get_config(db)

    @classmethod
    def test_connection(cls, db: Session, bot_token: Optional[str] = None, chat_id: Optional[str] = None) -> Dict[str, Any]:
        """Send a test message to verify the bot can deliver to the user."""
        token_to_use = bot_token
        chat_to_use = chat_id

        if not token_to_use or not chat_to_use:
            # Read from DB
            token_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_bot_token").first()
            chat_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_chat_id").first()
            token_to_use = token_setting.value if token_setting else None
            chat_to_use = chat_setting.value if chat_setting else None

        if not token_to_use or not chat_to_use:
            return {"ok": False, "error": "Vui lòng nhập Bot Token và Chat ID trước khi kiểm tra"}

        now_str = datetime.now().strftime("%H:%M:%S - %d/%m/%Y")
        text = (
            "✨ <b>LifeOS - Kết Nối Telegram Thành Công!</b> ✨\n\n"
            "Xin chào! Bot thông báo cá nhân đã được kết nối thành công với hệ thống <b>LifeOS</b> của bạn.\n\n"
            f"🕒 <i>Thời gian kiểm tra:</i> <code>{now_str}</code>\n"
            "🔔 <b>Tính năng tự động:</b>\n"
            " • Nhắc nhở trước khi tiết học / ca làm việc sắp diễn ra\n"
            " • Báo cáo hạn chót nhiệm vụ quan trọng\n"
            " • Tóm tắt lịch học & công việc hằng ngày\n\n"
            "🚀 <i>Chúc bạn một ngày học tập và làm việc thật năng suất!</i>"
        )
        return cls.send_telegram_message(token_to_use, chat_to_use, text)

    @classmethod
    def check_and_send_reminders(cls, db: Session) -> List[str]:
        """
        Check for upcoming fixed schedules and tasks today within `reminder_minutes`
        and send Telegram alerts for ones not yet notified.
        """
        token_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_bot_token").first()
        chat_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_chat_id").first()
        enabled_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_enabled").first()
        mins_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_reminder_minutes").first()

        if not enabled_setting or enabled_setting.value != "true":
            return []
        if not token_setting or not token_setting.value or not chat_setting or not chat_setting.value:
            return []

        bot_token = token_setting.value.strip()
        chat_id = chat_setting.value.strip()
        reminder_minutes = int(mins_setting.value) if mins_setting and mins_setting.value.isdigit() else 15

        now = datetime.now()
        today = now.date()
        sent_messages: List[str] = []

        # 1. Check Fixed Schedules for today
        occurrences = ScheduleService.get_occurrences_for_date(db, today)
        for occ in occurrences:
            try:
                # occ.start_time is "HH:MM"
                start_hour, start_minute = map(int, occ.start_time.split(":"))
                event_dt = datetime.combine(today, datetime.min.time()).replace(
                    hour=start_hour, minute=start_minute
                )
                diff_seconds = (event_dt - now).total_seconds()
                diff_minutes = diff_seconds / 60

                # Window: within [0, reminder_minutes]
                # Also allow small grace period of 2 mins after start in case worker checked slightly late
                if -2 <= diff_minutes <= reminder_minutes:
                    cache_key = f"sched_{occ.fixed_schedule_id}_{today.isoformat()}_{occ.start_time}"
                    if cache_key not in _SENT_REMINDERS_CACHE:
                        # Format alert
                        minutes_text = (
                            "ngay bây giờ!" if diff_minutes <= 1
                            else f"sau {int(diff_minutes)} phút nữa"
                        )
                        location_part = f"📍 <b>Địa điểm:</b> {occ.location}\n" if occ.location else ""
                        desc_part = f"📝 <i>Ghi chú:</i> {occ.description}\n" if occ.description else ""

                        msg = (
                            f"⏰ <b>[NHẮC NHỞ LỊCH SẮP DIỄN RA]</b>\n\n"
                            f"📌 <b>{occ.icon or '📌'} {occ.title}</b>\n"
                            f"⏱ <b>Khung giờ:</b> <code>{occ.start_time} - {occ.end_time}</code> (Bắt đầu {minutes_text})\n"
                            f"🏷 <b>Danh mục:</b> {occ.category}\n"
                            f"{location_part}"
                            f"{desc_part}\n"
                            f"⚡ <i>Hãy chuẩn bị sẵn sàng sách vở và tài liệu nhé!</i>"
                        )
                        res = cls.send_telegram_message(bot_token, chat_id, msg)
                        if res.get("ok"):
                            _SENT_REMINDERS_CACHE.add(cache_key)
                            sent_messages.append(f"FixedSchedule: {occ.title} ({occ.start_time})")
            except Exception as e:
                print(f"[TelegramService] Error checking schedule {occ}: {e}")

        # 2. Check Tasks scheduled for today with start_datetime
        try:
            today_start = datetime.combine(today, datetime.min.time())
            today_end = datetime.combine(today, datetime.max.time())
            upcoming_tasks = db.query(Task).filter(
                Task.status.in_(["TODO", "IN_PROGRESS"]),
                Task.start_datetime >= today_start,
                Task.start_datetime <= today_end
            ).all()

            for t in upcoming_tasks:
                if not t.start_datetime:
                    continue
                diff_seconds = (t.start_datetime - now).total_seconds()
                diff_minutes = diff_seconds / 60
                if -2 <= diff_minutes <= reminder_minutes:
                    cache_key = f"task_{t.id}_{today.isoformat()}_{t.start_datetime.strftime('%H%M')}"
                    if cache_key not in _SENT_REMINDERS_CACHE:
                        minutes_text = (
                            "ngay bây giờ!" if diff_minutes <= 1
                            else f"sau {int(diff_minutes)} phút nữa"
                        )
                        time_str = t.start_datetime.strftime("%H:%M")
                        priority_text = {"URGENT": "🔥 Khẩn cấp", "HIGH": "⚡ Cao", "MEDIUM": "Trung bình", "LOW": "Thấp"}.get(t.priority, t.priority)

                        msg = (
                            f"🎯 <b>[NHẮC NHỞ NHIỆM VỤ ĐẾN GIỜ]</b>\n\n"
                            f"📝 <b>{t.title}</b>\n"
                            f"⏱ <b>Bắt đầu:</b> <code>{time_str}</code> (Bắt đầu {minutes_text})\n"
                            f"🎖 <b>Ưu tiên:</b> {priority_text} | <b>Độ khó:</b> {t.difficulty}★ (+{t.difficulty} điểm)\n"
                            f"✨ <i>Tập trung giải quyết để tích lũy điểm thưởng nhé!</i>"
                        )
                        res = cls.send_telegram_message(bot_token, chat_id, msg)
                        if res.get("ok"):
                            _SENT_REMINDERS_CACHE.add(cache_key)
                            sent_messages.append(f"Task: {t.title} ({time_str})")
        except Exception as e:
            print(f"[TelegramService] Error checking tasks: {e}")

        return sent_messages

    @classmethod
    def send_daily_briefing(cls, db: Session) -> Dict[str, Any]:
        """Send a comprehensive summary of today's schedule and tasks to Telegram."""
        token_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_bot_token").first()
        chat_setting = db.query(AppSetting).filter(AppSetting.key == "telegram_chat_id").first()

        if not token_setting or not token_setting.value or not chat_setting or not chat_setting.value:
            return {"ok": False, "error": "Chưa cấu hình Bot Token hoặc Chat ID Telegram"}

        bot_token = token_setting.value.strip()
        chat_id = chat_setting.value.strip()

        now = datetime.now()
        today = now.date()
        date_display = today.strftime("%d/%m/%Y")
        dow_names = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
        dow_name = dow_names[today.weekday()]

        # 1. Occurrences today
        occurrences = ScheduleService.get_occurrences_for_date(db, today)
        # Sort occurrences by start_time
        occurrences.sort(key=lambda o: o.start_time)

        # 2. Tasks today
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        tasks_today = db.query(Task).filter(
            ((Task.due_datetime >= today_start) & (Task.due_datetime <= today_end)) |
            ((Task.start_datetime >= today_start) & (Task.start_datetime <= today_end))
        ).all()

        lines = [
            f"🌅 <b>BÁO CÁO LỊCH TRÌNH NGÀY {date_display.upper()}</b>",
            f"📅 <i>{dow_name}</i>\n",
            f"🏫 <b>LỊCH CỐ ĐỊNH & THỜI KHÓA BIỂU ({len(occurrences)}):</b>",
        ]

        if not occurrences:
            lines.append("  • <i>Hôm nay không có lịch cố định. Thảnh thơi hoặc tự học tự do!</i>")
        else:
            for idx, occ in enumerate(occurrences, start=1):
                icon = occ.icon or "📌"
                loc = f" ({occ.location})" if occ.location else ""
                lines.append(f"  {idx}. {icon} <b>{occ.title}</b>: <code>{occ.start_time} - {occ.end_time}</code>{loc}")

        lines.append(f"\n🎯 <b>NHIỆM VỤ CẦN LÀM ({len(tasks_today)}):</b>")
        if not tasks_today:
            lines.append("  • <i>Chưa có nhiệm vụ nào được lên lịch cho hôm nay.</i>")
        else:
            for idx, t in enumerate(tasks_today[:15], start=1):
                status_icon = "✅" if t.status == "COMPLETED" else "⏳"
                due_str = f" [Hạn: {t.due_datetime.strftime('%H:%M')}]" if t.due_datetime else ""
                lines.append(f"  {idx}. {status_icon} {t.title}{due_str}")
            if len(tasks_today) > 15:
                lines.append(f"  <i>...và {len(tasks_today) - 15} nhiệm vụ khác nữa</i>")

        lines.append("\n💪 <i>Chúc bạn một ngày học tập tập trung và gặt hái nhiều kết quả!</i>")

        full_text = "\n".join(lines)
        return cls.send_telegram_message(bot_token, chat_id, full_text)
