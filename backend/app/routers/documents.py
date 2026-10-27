from fastapi import APIRouter,Depends,File,HTTPException,UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

import os
import uuid
from pathlib import Path

from app.database import get_db

from app.models.document import Document
from app.models.employee import Employee

from app.routers.auth import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = Path("uploads/documents").resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 5 * 1024 * 1024

def get_employee(db: Session, user):
    
    employee = (db.query(Employee).filter(Employee.user_id == user.id).first())
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    return employee

def can_access_document(document, user, db):
    
    if user.role in ("HR", "ADMIN"):
        return True

    employee = get_employee(db, user)
    
    return document.employee_id == employee.id

@router.post("/upload")
def upload_document(file: UploadFile = File(...),db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    employee = get_employee(db, current_user)

    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400,detail="Only PDF, PNG, JPG and JPEG files are allowed")

    stored_name = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / stored_name
    size = 0

    try:
        with destination.open("wb") as output:
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)

                if size > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413,detail="File size must not exceed 5 MB")

                output.write(chunk)

        with destination.open("rb") as uploaded:
            signature = uploaded.read(8)

        valid_signature = ((extension == ".pdf" and signature.startswith(b"%PDF-"))
            or (extension == ".png" and signature.startswith(b"\x89PNG\r\n\x1a\n"))
            or (extension in {".jpg", ".jpeg"} and signature.startswith(b"\xff\xd8\xff")))

        if not valid_signature:
            raise HTTPException(status_code=400,detail="File content does not match the selected file type")

        document = Document(employee_id=employee.id,
            file_name=original_name,
            file_url=stored_name)

        db.add(document)
        db.commit()
        db.refresh(document)

        return {"message": "Document uploaded successfully",
            "id": document.id,
            "employee_id": document.employee_id,
            "file_name": document.file_name,
            "uploaded_at": document.uploaded_at}

    except Exception:
        if destination.exists():
            destination.unlink()
        raise

    finally:
        file.file.close()

@router.get("/")
def list_documents(db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    query = db.query(Document)

    if current_user.role not in ("HR", "ADMIN"):
        employee = get_employee(db, current_user)
        query = query.filter(Document.employee_id == employee.id)

    return query.order_by(Document.uploaded_at.desc()).all()

@router.get("/{document_id}/download")
def download_document(document_id: int,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not can_access_document(document, current_user, db):
        raise HTTPException(status_code=403, detail="Access denied")

    path = (UPLOAD_DIR / document.file_url).resolve()

    if path.parent != UPLOAD_DIR or not path.is_file():
        raise HTTPException(status_code=404, detail="Document file not found")

    return FileResponse(path=str(path),filename=document.file_name,media_type="application/octet-stream")