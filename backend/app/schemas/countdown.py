from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CountdownBase(BaseModel):
    title: str
    category: str = "EXAM"  # EXAM, GOAL, EVENT, OTHER
    target_date: datetime
    icon: Optional[str] = "🎓"
    color: Optional[str] = "#000000"
    display_mode: Optional[str] = "CIRCULAR"
    notes: Optional[str] = None
    is_pinned: bool = False
    cover_style: Optional[str] = "DEFAULT"
    cover_config: Optional[str] = None

class CountdownCreate(CountdownBase):
    pass

class CountdownUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[datetime] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    display_mode: Optional[str] = None
    notes: Optional[str] = None
    is_pinned: Optional[bool] = None
    cover_style: Optional[str] = None
    cover_config: Optional[str] = None

class CountdownOut(CountdownBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
