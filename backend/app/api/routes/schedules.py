from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.api.deps import get_database
from app.schemas.fixed_schedule import (
    FixedScheduleCreate, FixedScheduleUpdate, FixedScheduleOut,
    FixedScheduleOccurrenceCreate, FixedScheduleOccurrenceOut, FreeTimeResponse
)
from app.services.schedule_service import ScheduleService

router = APIRouter()

@router.get("", response_model=List[FixedScheduleOut])
def list_schedules(is_active: Optional[bool] = None, db: Session = Depends(get_database)):
    return ScheduleService.list_schedules(db, is_active)

@router.post("", response_model=FixedScheduleOut)
def create_schedule(schedule_in: FixedScheduleCreate, db: Session = Depends(get_database)):
    return ScheduleService.create_schedule(db, schedule_in)

@router.get("/{schedule_id}", response_model=FixedScheduleOut)
def get_schedule(schedule_id: int, db: Session = Depends(get_database)):
    schedule = ScheduleService.get_schedule_by_id(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Fixed schedule not found")
    return schedule

@router.put("/{schedule_id}", response_model=FixedScheduleOut)
def update_schedule(schedule_id: int, schedule_in: FixedScheduleUpdate, db: Session = Depends(get_database)):
    schedule = ScheduleService.update_schedule(db, schedule_id, schedule_in)
    if not schedule:
        raise HTTPException(status_code=404, detail="Fixed schedule not found")
    return schedule

@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_database)):
    success = ScheduleService.delete_schedule(db, schedule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Fixed schedule not found")
    return {"message": "Fixed schedule deleted successfully"}

@router.post("/{schedule_id}/override", response_model=FixedScheduleOccurrenceOut)
def set_override(
    schedule_id: int,
    req: FixedScheduleOccurrenceCreate,
    db: Session = Depends(get_database)
):
    """
    Sets an override for a specific occurrence date (e.g. SKIPPED or MODIFIED start/end times).
    """
    return ScheduleService.set_occurrence_override(
        db,
        schedule_id=schedule_id,
        occ_date=req.occurrence_date,
        status=req.status,
        override_start=req.override_start_time,
        override_end=req.override_end_time,
        notes=req.notes
    )

@router.get("/free-time/{target_date}", response_model=FreeTimeResponse)
def get_free_time(target_date: str, db: Session = Depends(get_database)):
    try:
        d = date.fromisoformat(target_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
    return ScheduleService.calculate_free_time(db, d)
