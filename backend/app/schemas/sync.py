from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AppSettingItem(BaseModel):
    key: str
    value: str

class SyncHistoryOut(BaseModel):
    id: int
    sync_type: str
    status: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BackupResponse(BaseModel):
    filename: str
    file_path: str
    file_size_bytes: int
    created_at: datetime

class GoogleDriveStatusResponse(BaseModel):
    connected: bool
    account_email: Optional[str] = None
    folder_id: Optional[str] = None
    folder_name: Optional[str] = None
    auto_sync: bool = False
    last_sync: Optional[datetime] = None
    last_backup_file: Optional[str] = None
