import os
import shutil
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from pathlib import Path
from app.api.deps import get_database
from app.core.config import settings, ATTACHMENTS_DIR
from app.models.attachment import Attachment
from app.schemas.task import AttachmentOut

router = APIRouter()

@router.post("/upload", response_model=AttachmentOut)
async def upload_attachment(
    task_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_database)
):
    safe_filename = file.filename or "attachment"
    ext = Path(safe_filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex[:12]}_{safe_filename}"
    target_path = ATTACHMENTS_DIR / unique_name

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    size = os.path.getsize(target_path)
    
    file_type = "FILE"
    if ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]:
        file_type = "IMAGE"
    elif ext in [".pdf"]:
        file_type = "PDF"
    elif ext in [".doc", ".docx", ".txt", ".md", ".rtf"]:
        file_type = "DOCUMENT"

    attachment = Attachment(
        task_id=task_id,
        filename=safe_filename,
        file_type=file_type,
        file_size=size,
        storage_path=str(target_path),
        url=f"/api/attachments/download/{unique_name}"
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment

@router.get("/download/{filename}")
def download_file(filename: str):
    file_path = ATTACHMENTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=file_path, filename=filename)

@router.delete("/{attachment_id}")
def delete_attachment(attachment_id: int, db: Session = Depends(get_database)):
    att = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    if att.storage_path and os.path.exists(att.storage_path):
        try:
            os.remove(att.storage_path)
        except OSError:
            pass
    db.delete(att)
    db.commit()
    return {"message": "Attachment deleted successfully"}
