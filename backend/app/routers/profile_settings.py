from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.user import User
from app.models.employee import Employee
from app.models.notification_preference import NotificationPreference

from app.schemas.profile_settings import ProfileUpdate,PasswordChange,NotificationPreferenceUpdate,NotificationPreferenceResponse
from app.schemas.user import UserResponse

from app.routers.auth import get_current_user

from app.core.security import hash_password, verify_password

router = APIRouter(prefix="/profile-settings", tags=["Profile & Settings"])

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(profile_data: ProfileUpdate,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    username = profile_data.username.strip()
    email = str(profile_data.email).strip().lower()

    if len(username) < 3:
        raise HTTPException(status_code=422,detail="Username must contain at least 3 non-space characters")

    existing_username = db.query(User).filter(User.username == username,User.id != current_user.id).first()

    if existing_username:
        raise HTTPException(status_code=409,detail="Username is already in use")

    existing_email = db.query(User).filter(User.email == email,User.id != current_user.id).first()

    if existing_email:
        raise HTTPException(status_code=409,detail="Email is already in use")

    current_user.username = username
    current_user.email = email

    db.commit()
    db.refresh(current_user)

    return current_user

@router.post("/change-password")
def change_password(password_data: PasswordChange,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    if password_data.current_password == password_data.new_password:
        raise HTTPException(status_code=400,detail="New password must be different from the current password")

    if not verify_password(password_data.current_password,current_user.hashed_password):
        raise HTTPException(status_code=400,detail="Current password is incorrect")

    current_user.hashed_password = hash_password(password_data.new_password)

    db.commit()

    return {"message": "Password changed successfully"}

@router.get("/notifications",response_model=NotificationPreferenceResponse)
def get_notification_preferences(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    preferences = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()

    if not preferences:
        preferences = NotificationPreference(user_id=current_user.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    return preferences

@router.put("/notifications",response_model=NotificationPreferenceResponse,)
def update_notification_preferences(preference_data: NotificationPreferenceUpdate,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    preferences = db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).first()

    if not preferences:
        preferences = NotificationPreference(user_id=current_user.id)
        db.add(preferences)

    for field, value in preference_data.model_dump().items():
        setattr(preferences, field, value)

    db.commit()
    db.refresh(preferences)

    return preferences