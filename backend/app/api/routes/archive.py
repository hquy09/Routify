from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.api.deps import get_database
from app.schemas.analytics import ArchiveRecordOut
from app.services.archive_service import ArchiveService

router = APIRouter()

@router.get("")
def get_archives(db: Session = Depends(get_database)):
    return ArchiveService.list_archives(db)

@router.post("/finalize", response_model=ArchiveRecordOut)
def finalize_week(
    year: int = Query(...),
    week_number: int = Query(...),
    db: Session = Depends(get_database)
):
    return ArchiveService.finalize_week(db, year, week_number)
