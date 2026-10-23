from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole

from app.schemas.user import UserResponse,AdminUserCreate,AdminUserUpdate

from app.core.security import hash_password

from app.routers.auth import get_current_user, require_role

router = APIRouter(prefix="/admin/users", tags=["Admin User Management"])

def check_duplicate_user(db: Session,username: str,email: str,exclude_user_id: int = None):
    
    query = db.query(User).filter((User.username == username) | (User.email == email))

    if exclude_user_id is not None:
        query = query.filter(User.id != exclude_user_id)

    if query.first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Username or email already exists")

@router.get("/", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db),current_user: User = Depends(require_role(UserRole.ADMIN))):
    
    return db.query(User).order_by(User.id.asc()).all()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: AdminUserCreate,db: Session = Depends(get_db),current_user: User = Depends(require_role(UserRole.ADMIN))):
    
    check_duplicate_user(db, user_data.username, user_data.email)

    user = User(username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        is_active=True)

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int,user_data: AdminUserUpdate,db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))):
    
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")

    changes = user_data.model_dump(exclude_unset=True)

    if "username" in changes and changes["username"] is not None:
        check_duplicate_user(db, changes["username"], user.email, exclude_user_id=user.id)
        user.username = changes["username"]

    if "email" in changes and changes["email"] is not None:
        check_duplicate_user(db, user.username, changes["email"], exclude_user_id=user.id)
        user.email = changes["email"]

    if "role" in changes and changes["role"] is not None:
        user.role = changes["role"]

    if "is_active" in changes and changes["is_active"] is not None:
        if user.id == current_user.id and changes["is_active"] is False:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="You cannot deactivate your own account")
        user.is_active = changes["is_active"]

    db.commit()
    db.refresh(user)

    return user

@router.delete("/{user_id}")
def delete_user(user_id: int,db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))):
    
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="You cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}
