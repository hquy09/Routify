from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.api.deps import get_database
from app.services.telegram_service import TelegramService
from app.models.sync import AppSetting

router = APIRouter()

class TelegramConfigRequest(BaseModel):
    bot_token: Optional[str] = None
    chat_id: Optional[str] = None
    is_enabled: Optional[bool] = None
    reminder_minutes: Optional[int] = 15
    check_interval: Optional[int] = 60
    morning_briefing_enabled: Optional[bool] = True
    morning_briefing_time: Optional[str] = "05:00"
    include_philosophy: Optional[bool] = True
    notify_schedules: Optional[bool] = True
    notify_tasks: Optional[bool] = True

class TelegramTokenPayload(BaseModel):
    bot_token: Optional[str] = None
    chat_id: Optional[str] = None

@router.get("/config")
def get_telegram_config(db: Session = Depends(get_database)):
    """Get current Telegram bot configuration."""
    return TelegramService.get_config(db)

@router.post("/config")
def update_telegram_config(
    payload: TelegramConfigRequest,
    db: Session = Depends(get_database)
):
    """Update Telegram bot settings."""
    updated = TelegramService.save_config(
        db,
        bot_token=payload.bot_token,
        chat_id=payload.chat_id,
        is_enabled=payload.is_enabled,
        reminder_minutes=payload.reminder_minutes,
        check_interval=payload.check_interval,
        morning_briefing_enabled=payload.morning_briefing_enabled,
        morning_briefing_time=payload.morning_briefing_time,
        include_philosophy=payload.include_philosophy,
        notify_schedules=payload.notify_schedules,
        notify_tasks=payload.notify_tasks,
    )
    return {"message": "Đã lưu cài đặt Telegram thành công", "config": updated}

@router.post("/clear")
def clear_telegram_config(db: Session = Depends(get_database)):
    """Clear Telegram bot token and chat ID, resetting configuration."""
    cleared = TelegramService.clear_config(db)
    return {"message": "Đã xóa toàn bộ cấu hình kết nối Telegram", "config": cleared}

@router.get("/bot-info")
def get_bot_info(
    bot_token: Optional[str] = Query(None),
    db: Session = Depends(get_database)
):
    """Get bot information (username, display name) via Telegram getMe API."""
    token_to_use = bot_token
    if not token_to_use:
        setting = db.query(AppSetting).filter(AppSetting.key == "telegram_bot_token").first()
        token_to_use = setting.value if setting else None

    if not token_to_use:
        raise HTTPException(status_code=400, detail="Chưa cấu hình Bot Token")

    res = TelegramService.get_bot_info(token_to_use)
    return res

@router.post("/detect-chat-id")
def detect_chat_id(
    payload: Optional[TelegramTokenPayload] = None,
    db: Session = Depends(get_database)
):
    """
    Detect the latest user who sent a message or started the bot via getUpdates.
    Returns chat ID, user name, and handles auto-detection without manual ID searching.
    """
    token_to_use = payload.bot_token if payload and payload.bot_token else None
    if not token_to_use:
        setting = db.query(AppSetting).filter(AppSetting.key == "telegram_bot_token").first()
        token_to_use = setting.value if setting else None

    if not token_to_use:
        return {"ok": False, "error": "Vui lòng nhập Bot Token trước khi dò tìm Chat ID"}

    res = TelegramService.detect_latest_chat_id(token_to_use)
    return res

@router.post("/test")
def test_telegram_connection(
    payload: Optional[TelegramTokenPayload] = None,
    db: Session = Depends(get_database)
):
    """Send an immediate test notification to verify the bot connection."""
    bot_token = payload.bot_token if payload else None
    chat_id = payload.chat_id if payload else None
    res = TelegramService.test_connection(db, bot_token=bot_token, chat_id=chat_id)
    if not res.get("ok"):
        raise HTTPException(status_code=400, detail=res.get("error", "Lỗi kết nối Telegram"))
    return {"message": "Đã gửi tin nhắn thử nghiệm thành công! Vui lòng kiểm tra Telegram của bạn."}

@router.post("/check-upcoming")
def check_upcoming_schedules(db: Session = Depends(get_database)):
    """Check for upcoming schedules and tasks and send Telegram alerts if due."""
    sent = TelegramService.check_and_send_reminders(db)
    return {
        "message": f"Đã quét lịch trình. Đã gửi {len(sent)} thông báo.",
        "sent_events": sent
    }

@router.post("/morning-briefing")
def send_morning_briefing(db: Session = Depends(get_database)):
    """Trigger morning briefing summary immediately (today's schedule, tasks & philosophy)."""
    res = TelegramService.send_morning_briefing(db, force=True)
    if not res.get("ok"):
        raise HTTPException(status_code=400, detail=res.get("error", "Không thể gửi báo cáo sáng"))
    return {"message": "Đã gửi báo cáo lịch trình sáng sớm vào Telegram thành công!"}

@router.post("/daily-briefing")
def send_daily_briefing(db: Session = Depends(get_database)):
    """Alias for morning briefing."""
    return send_morning_briefing(db)
