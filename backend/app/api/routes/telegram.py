from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.api.deps import get_database
from app.services.telegram_service import TelegramService

router = APIRouter()

class TelegramConfigRequest(BaseModel):
    bot_token: Optional[str] = None
    chat_id: Optional[str] = None
    is_enabled: Optional[bool] = None
    reminder_minutes: Optional[int] = 15

class TelegramTestRequest(BaseModel):
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
    )
    return {"message": "Đã lưu cài đặt Telegram thành công", "config": updated}

@router.post("/test")
def test_telegram_connection(
    payload: Optional[TelegramTestRequest] = None,
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

@router.post("/daily-briefing")
def send_daily_briefing(db: Session = Depends(get_database)):
    """Send today's schedule and task summary to Telegram."""
    res = TelegramService.send_daily_briefing(db)
    if not res.get("ok"):
        raise HTTPException(status_code=400, detail=res.get("error", "Không thể gửi báo cáo ngày"))
    return {"message": "Đã gửi báo cáo lịch trình hôm nay vào Telegram thành công!"}
