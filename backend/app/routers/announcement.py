from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db

from app.models.announcement import Announcement
from app.models.user import UserRole

from app.schemas.announcement import AnnouncementCreate,AnnouncementResponse

from app.routers.auth import get_current_user

router = APIRouter(prefix="/announcements",tags=["Announcements"])

def require_hr_or_admin(current_user):
    
    role = getattr(current_user.role, "value", current_user.role)

    if role not in (UserRole.HR.value, UserRole.ADMIN.value):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only HR or Admin can post announcements.")


@router.post("/",response_model=AnnouncementResponse,status_code=status.HTTP_201_CREATED)
def create_announcement(announcement_data: AnnouncementCreate,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    require_hr_or_admin(current_user)

    title = announcement_data.title.strip()
    message = announcement_data.message.strip()

    if not title or not message:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,detail="Title and message cannot be empty.")

    announcement = Announcement(title=title,message=message,created_by=current_user.id)

    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    return announcement

@router.get("/",response_model=list[AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    return (db.query(Announcement).order_by(Announcement.created_at.desc(), Announcement.id.desc()).all())

@router.get("/{announcement_id}",response_model=AnnouncementResponse)
def get_announcement(announcement_id: int,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    announcement = (db.query(Announcement).filter(Announcement.id == announcement_id).first())

    if announcement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Announcement not found.")

    return announcement
