from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.api.deps import get_database
from app.models.countdown import Countdown
from app.schemas.countdown import CountdownCreate, CountdownUpdate, CountdownOut

router = APIRouter()

@router.get("", response_model=List[CountdownOut])
def list_countdowns(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_database)
):
    query = db.query(Countdown)
    if category and category != "ALL":
        query = query.filter(Countdown.category == category)
    
    # Sort: pinned first, then nearest target_date
    items = query.order_by(Countdown.is_pinned.desc(), Countdown.target_date.asc()).all()
    return items

@router.post("", response_model=CountdownOut)
def create_countdown(
    data: CountdownCreate,
    db: Session = Depends(get_database)
):
    cd = Countdown(
        title=data.title.strip(),
        category=data.category,
        target_date=data.target_date,
        icon=data.icon or "🎓",
        color=data.color or "#000000",
        notes=data.notes,
        is_pinned=data.is_pinned,
        display_mode=data.display_mode or "CIRCULAR",
        cover_style=data.cover_style or "DEFAULT",
        cover_config=data.cover_config,
    )
    db.add(cd)
    db.commit()
    db.refresh(cd)
    return cd

@router.put("/{countdown_id}", response_model=CountdownOut)
def update_countdown(
    countdown_id: int,
    data: CountdownUpdate,
    db: Session = Depends(get_database)
):
    cd = db.query(Countdown).filter(Countdown.id == countdown_id).first()
    if not cd:
        raise HTTPException(status_code=404, detail="Countdown not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cd, field, value)
    
    cd.updated_at = datetime.now()
    db.commit()
    db.refresh(cd)
    return cd

@router.delete("/{countdown_id}")
def delete_countdown(
    countdown_id: int,
    db: Session = Depends(get_database)
):
    cd = db.query(Countdown).filter(Countdown.id == countdown_id).first()
    if not cd:
        raise HTTPException(status_code=404, detail="Countdown not found")
    
    db.delete(cd)
    db.commit()
    return {"ok": True, "message": "Countdown deleted successfully"}
