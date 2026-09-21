from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    color: Optional[str] = "#3b82f6"
    status: Optional[str] = "ACTIVE"

class ProjectCreate(ProjectBase):
    goal_id: Optional[int] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    status: Optional[str] = None
    goal_id: Optional[int] = None

class ProjectOut(ProjectBase):
    id: int
    goal_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[datetime] = None
    status: Optional[str] = "ACTIVE"

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[datetime] = None
    status: Optional[str] = None

class GoalOut(GoalBase):
    id: int
    created_at: datetime
    updated_at: datetime
    projects: List[ProjectOut] = []

    class Config:
        from_attributes = True
