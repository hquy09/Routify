from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SubtaskBase(BaseModel):
    title: str
    is_completed: bool = False
    order_index: int = 0

class SubtaskCreate(SubtaskBase):
    pass

class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    order_index: Optional[int] = None

class SubtaskOut(SubtaskBase):
    id: int
    task_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AttachmentOut(BaseModel):
    id: int
    task_id: Optional[int] = None
    filename: str
    file_type: str
    file_size: int
    storage_path: Optional[str] = None
    url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    goal_id: Optional[int] = None
    project_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    course_node_id: Optional[int] = None
    scheduled_with_fixed_id: Optional[int] = None
    start_datetime: Optional[datetime] = None
    due_datetime: Optional[datetime] = None
    difficulty: int = Field(default=2, ge=1, le=5)
    priority: str = Field(default="MEDIUM")  # LOW, MEDIUM, HIGH, URGENT
    status: str = Field(default="TODO")      # TODO, IN_PROGRESS, PARTIAL, COMPLETED, DELAYED, TRANSFERRED, CANCELLED
    recurrence_rule: Optional[str] = None


class TaskCreate(TaskBase):
    subtask_titles: Optional[List[str]] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    goal_id: Optional[int] = None
    project_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    course_node_id: Optional[int] = None
    scheduled_with_fixed_id: Optional[int] = None
    start_datetime: Optional[datetime] = None
    due_datetime: Optional[datetime] = None
    completed_datetime: Optional[datetime] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    priority: Optional[str] = None
    status: Optional[str] = None
    recurrence_rule: Optional[str] = None


class TaskTransferRequest(BaseModel):
    new_due_datetime: datetime
    keep_subtasks: bool = True
    notes: Optional[str] = None


class TaskOut(TaskBase):
    id: int
    completed_datetime: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime] = None
    transferred_from_id: Optional[int] = None
    transferred_to_id: Optional[int] = None

    # Computed fields
    subtasks: List[SubtaskOut] = []
    attachments: List[AttachmentOut] = []
    subtasks_count: int = 0
    subtasks_completed_count: int = 0
    subtask_progress: float = 0.0

    goal_title: Optional[str] = None
    project_title: Optional[str] = None
    course_title: Optional[str] = None
    scheduled_with_fixed_title: Optional[str] = None
    transferred_from_title: Optional[str] = None
    transferred_from_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConflictCheckRequest(BaseModel):
    start_datetime: datetime
    end_datetime: datetime
    exclude_task_id: Optional[int] = None

class ConflictItem(BaseModel):
    fixed_schedule_id: int
    title: str
    category: str
    start_time: str
    end_time: str
    date: str

class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    conflicts: List[ConflictItem] = []
