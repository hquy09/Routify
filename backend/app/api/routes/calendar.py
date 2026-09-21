from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.api.deps import get_database
from app.models.calendar_note import CalendarNote
from app.schemas.calendar import (
    CalendarWeeklyResponse, CalendarMonthlyResponse, CalendarNoteCreate, CalendarNoteOut,
    CalendarDayView
)
from app.services.calendar_service import CalendarService

router = APIRouter()

@router.get("/daily", response_model=CalendarDayView)
def get_daily_calendar(
    date_str: Optional[str] = Query(None, description="ISO date YYYY-MM-DD for day"),
    db: Session = Depends(get_database)
):
    ref_d = None
    if date_str:
        try:
            ref_d = date.fromisoformat(date_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
    return CalendarService.get_daily_view(db, ref_d)

@router.get("/weekly", response_model=CalendarWeeklyResponse)
def get_weekly_calendar(
    date_str: Optional[str] = Query(None, description="ISO date YYYY-MM-DD for week"),
    db: Session = Depends(get_database)
):
    ref_d = None
    if date_str:
        try:
            ref_d = date.fromisoformat(date_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
    return CalendarService.get_weekly_view(db, ref_d)

@router.get("/monthly", response_model=CalendarMonthlyResponse)
def get_monthly_calendar(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_database)
):
    return CalendarService.get_monthly_view(db, year, month)

@router.post("/notes", response_model=CalendarNoteOut)
def add_note(note_in: CalendarNoteCreate, db: Session = Depends(get_database)):
    note = CalendarNote(note_date=note_in.note_date, content=note_in.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_database)):
    note = db.query(CalendarNote).filter(CalendarNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}
