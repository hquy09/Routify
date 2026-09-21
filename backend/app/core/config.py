from pydantic_settings import BaseSettings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
ATTACHMENTS_DIR = STORAGE_DIR / "attachments"
BACKUPS_DIR = STORAGE_DIR / "backups"

# Ensure storage directories exist
ATTACHMENTS_DIR.mkdir(parents=True, exist_ok=True)
BACKUPS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Personal Life OS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # SQLite local database
    DATABASE_PATH: str = str(BASE_DIR / "lifeos.db")
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # SQLite URL format
        db_path = self.DATABASE_PATH.replace("\\", "/")
        return f"sqlite:///{db_path}"

    ATTACHMENTS_PATH: str = str(ATTACHMENTS_DIR)
    BACKUPS_PATH: str = str(BACKUPS_DIR)
    
    # Defaults
    DEFAULT_DIFFICULTY: int = 2
    DEFAULT_PRIORITY: str = "MEDIUM"
    WEEK_STARTS_ON_MONDAY: bool = True
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    class Config:
        case_sensitive = True

settings = Settings()
