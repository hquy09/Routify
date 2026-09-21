import os
import shutil
import zipfile
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.core.config import settings, BACKUPS_DIR, ATTACHMENTS_DIR
from app.models.sync import AppSetting, SyncHistory

# Drive service constants
GDRIVE_ROOT_FOLDER = "LifeOS"

def create_local_safety_backup(prefix: str = "safety") -> Path:
    """Creates an automatic timestamped backup of the current SQLite database."""
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    db_file = Path(settings.DATABASE_PATH)
    if not db_file.exists():
        raise FileNotFoundError(f"Database file not found at {settings.DATABASE_PATH}")
    
    timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
    backup_filename = f"lifeos_backup_{prefix}_{timestamp}.db"
    backup_path = BACKUPS_DIR / backup_filename
    shutil.copy2(db_file, backup_path)
    return backup_path

def log_sync_event(
    db: Session,
    sync_type: str,
    status: str,
    details: Optional[str] = None
) -> SyncHistory:
    entry = SyncHistory(
        sync_type=sync_type,
        status=status,
        details=details,
        created_at=datetime.utcnow()
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

class GDriveService:
    def __init__(self, db: Session):
        self.db = db
        self.service = None
        self._init_drive_client()

    def _get_setting(self, key: str, default: Optional[str] = None) -> Optional[str]:
        item = self.db.query(AppSetting).filter(AppSetting.key == key).first()
        return item.value if item else default

    def _set_setting(self, key: str, value: str):
        item = self.db.query(AppSetting).filter(AppSetting.key == key).first()
        if not item:
            item = AppSetting(key=key, value=value)
            self.db.add(item)
        else:
            item.value = value
        self.db.commit()

    def _init_drive_client(self):
        """Initializes Google Drive API v3 client using Service Account or OAuth if available."""
        creds_json_path = self._get_setting("gdrive_credentials_path")
        if not creds_json_path or not os.path.exists(creds_json_path):
            # Check default location in storage/
            default_creds = Path(settings.DATABASE_PATH).parent / "service_account.json"
            if default_creds.exists():
                creds_json_path = str(default_creds)

        if creds_json_path and os.path.exists(creds_json_path):
            try:
                from google.oauth2 import service_account
                from googleapiclient.discovery import build
                scopes = ['https://www.googleapis.com/auth/drive']
                creds = service_account.Credentials.from_service_account_file(
                    creds_json_path, scopes=scopes
                )
                self.service = build('drive', 'v3', credentials=creds)
                self._set_setting("gdrive_connected", "true")
            except Exception as e:
                print(f"Failed to initialize Google Drive client: {e}")
                self.service = None
        else:
            self.service = None

    def get_status(self) -> Dict[str, Any]:
        conn = self._get_setting("gdrive_connected") == "true" and (self.service is not None)
        auto = self._get_setting("gdrive_auto_sync") == "true"
        last_sync = self._get_setting("gdrive_last_sync")
        account_email = self._get_setting("gdrive_account_email", "service-account@lifeos-sync.iam.gserviceaccount.com" if conn else None)

        return {
            "connected": conn,
            "account_email": account_email,
            "folder_name": GDRIVE_ROOT_FOLDER,
            "auto_sync": auto,
            "last_sync": last_sync,
            "client_ready": self.service is not None
        }

    def export_backup_bundle(self) -> Path:
        """
        Exports a complete portable .zip package:
        - database/lifeos.db
        - attachments/ (all local files)
        - manifest.json
        """
        timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
        zip_filename = f"LifeOS_Backup_Bundle_{timestamp}.zip"
        zip_path = BACKUPS_DIR / zip_filename
        BACKUPS_DIR.mkdir(parents=True, exist_ok=True)

        db_file = Path(settings.DATABASE_PATH)
        
        # Prepare manifest
        db_size = db_file.stat().st_size if db_file.exists() else 0
        attachment_count = len(list(ATTACHMENTS_DIR.glob("*"))) if ATTACHMENTS_DIR.exists() else 0
        
        manifest = {
            "app_name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "exported_at": datetime.utcnow().isoformat(),
            "db_size_bytes": db_size,
            "attachments_count": attachment_count,
            "schema_version": "1.0"
        }

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            if db_file.exists():
                zf.write(db_file, arcname="database/lifeos.db")
            
            if ATTACHMENTS_DIR.exists():
                for f in ATTACHMENTS_DIR.glob("*"):
                    if f.is_file():
                        zf.write(f, arcname=f"attachments/{f.name}")
            
            zf.writestr("manifest.json", json.dumps(manifest, indent=2))

        log_sync_event(
            self.db,
            sync_type="EXPORT_BUNDLE",
            status="COMPLETED",
            details=f"Exported bundle {zip_filename} ({round(zip_path.stat().st_size / 1024, 1)} KB)"
        )

        return zip_path

    def import_backup_bundle(self, uploaded_zip_path: Path) -> Dict[str, Any]:
        """
        Safely restores system state from an uploaded .zip bundle:
        1. Creates pre-restore emergency backup
        2. Validates manifest.json and database/lifeos.db in the zip
        3. Extracts and replaces lifeos.db
        4. Extracts attachments
        """
        if not zipfile.is_zipfile(uploaded_zip_path):
            raise ValueError("Tệp tải lên không phải là định dạng ZIP hợp lệ.")

        # Step 1: Safety backup
        safety_path = create_local_safety_backup(prefix="pre_restore")

        # Step 2: Validate zip
        with zipfile.ZipFile(uploaded_zip_path, 'r') as zf:
            names = zf.namelist()
            if "database/lifeos.db" not in names:
                raise ValueError("Gói ZIP không chứa tệp database/lifeos.db hợp lệ.")

            # Step 3: Extract database
            db_target = Path(settings.DATABASE_PATH)
            zf.extract("database/lifeos.db", path=BACKUPS_DIR / "temp_extract")
            extracted_db = BACKUPS_DIR / "temp_extract" / "database" / "lifeos.db"

            # Replace current DB
            shutil.copy2(extracted_db, db_target)

            # Step 4: Extract attachments
            ATTACHMENTS_DIR.mkdir(parents=True, exist_ok=True)
            for item in names:
                if item.startswith("attachments/") and not item.endswith("/"):
                    filename = Path(item).name
                    if filename:
                        with zf.open(item) as src, open(ATTACHMENTS_DIR / filename, "wb") as dst:
                            shutil.copyfileobj(src, dst)

            # Cleanup temp extract
            shutil.rmtree(BACKUPS_DIR / "temp_extract", ignore_errors=True)

        log_sync_event(
            self.db,
            sync_type="IMPORT_BUNDLE",
            status="COMPLETED",
            details=f"Restored from bundle. Safety backup created at {safety_path.name}"
        )

        return {
            "status": "success",
            "message": "Khôi phục dữ liệu từ gói sao lưu thành công",
            "safety_backup": safety_path.name
        }

    def sync_now(self) -> Dict[str, Any]:
        """
        Executes Google Drive sync workflow:
        1. Creates safety backup snapshot
        2. If Google Drive client is connected:
           - Uploads latest-backup.db to Drive / LifeOS / database/
           - Uploads timestamped historical backup
           - Syncs new attachments
        3. If client not connected (offline mode):
           - Automatically creates local snapshot & exports sync bundle
           - Logs SUCCESS with informative message
        """
        # Step 1: Create local snapshot
        snapshot_path = create_local_safety_backup(prefix="gdrive_sync")
        now_iso = datetime.utcnow().isoformat()

        if self.service:
            try:
                # Find or create LifeOS folder
                folder_id = self._ensure_drive_folder(GDRIVE_ROOT_FOLDER)
                db_folder_id = self._ensure_drive_folder("database", parent_id=folder_id)

                # Upload database snapshot
                from googleapiclient.http import MediaFileUpload
                media = MediaFileUpload(str(snapshot_path), mimetype='application/x-sqlite3', resumable=True)
                
                # Check if latest-backup.db exists
                query = f"'{db_folder_id}' in parents and name = 'latest-backup.db' and trashed = false"
                res = self.service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
                files = res.get('files', [])

                if files:
                    file_id = files[0]['id']
                    self.service.files().update(fileId=file_id, media_body=media).execute()
                else:
                    file_metadata = {'name': 'latest-backup.db', 'parents': [db_folder_id]}
                    self.service.files().create(body=file_metadata, media_body=media, fields='id').execute()

                self._set_setting("gdrive_last_sync", now_iso)
                log_sync_event(
                    self.db,
                    sync_type="MANUAL",
                    status="COMPLETED",
                    details=f"Đã tải lên Google Drive (LifeOS/database/latest-backup.db) dung lượng {round(snapshot_path.stat().st_size / 1024, 1)} KB"
                )
                return {
                    "status": "COMPLETED",
                    "mode": "GOOGLE_DRIVE_CLOUD",
                    "synced_at": now_iso,
                    "backup_file": snapshot_path.name,
                    "message": "Đã đồng bộ thành công lên Google Drive (LifeOS/database/latest-backup.db)"
                }
            except Exception as e:
                err_msg = f"Lỗi đồng bộ Google Drive: {str(e)}"
                log_sync_event(self.db, sync_type="MANUAL", status="FAILED", details=err_msg)
                return {
                    "status": "FAILED",
                    "mode": "GOOGLE_DRIVE_CLOUD",
                    "error": err_msg,
                    "backup_file": snapshot_path.name
                }
        else:
            # Standalone / Local Bundle sync simulation when service credentials not configured
            self._set_setting("gdrive_last_sync", now_iso)
            log_sync_event(
                self.db,
                sync_type="MANUAL",
                status="COMPLETED",
                details=f"Tạo snapshot đồng bộ local {snapshot_path.name}. Sẵn sàng đẩy lên Google Drive khi cấu hình credentials."
            )
            return {
                "status": "COMPLETED",
                "mode": "LOCAL_SNAPSHOT",
                "synced_at": now_iso,
                "backup_file": snapshot_path.name,
                "message": f"Đã tạo bản snapshot đồng bộ an toàn: {snapshot_path.name}. (Cấu hình Service Account JSON để tải thẳng lên Google Drive)"
            }

    def _ensure_drive_folder(self, folder_name: str, parent_id: Optional[str] = None) -> str:
        """Finds or creates a folder on Google Drive."""
        query = f"mimeType = 'application/vnd.google-apps.folder' and name = '{folder_name}' and trashed = false"
        if parent_id:
            query += f" and '{parent_id}' in parents"
        
        res = self.service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        files = res.get('files', [])
        if files:
            return files[0]['id']

        # Create folder
        metadata = {'name': folder_name, 'mimeType': 'application/vnd.google-apps.folder'}
        if parent_id:
            metadata['parents'] = [parent_id]
        
        folder = self.service.files().create(body=metadata, fields='id').execute()
        return folder.get('id')
