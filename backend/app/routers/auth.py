from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt

from app.database import get_db

from app.models.user import User,UserRole

from app.schemas.user import UserRegister,UserLogin,UserResponse,TokenResponse

from app.core.security import hash_password,verify_password,create_access_token,decode_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

@router.post("/register",response_model=UserResponse,status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    
    existing_user = db.query(User).filter((User.email == user_data.email)|(User.username == user_data.username)).first()

    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Username or email already registered")

    new_user = User(username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=UserRole.EMPLOYEE)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"})

    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})

    return {"access_token": access_token,"token_type": "bearer"}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security),db: Session = Depends(get_db)):
    
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Invalid token")

        user_id = int(user_id)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},)

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="User not found")

    return user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    
    return current_user

def require_role(*allowed_roles: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)):
        
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource")

        return current_user

    return role_checker

@router.get("/hr-dashboard")
def hr_dashboard(current_user: User = Depends(require_role(UserRole.HR, UserRole.ADMIN))):
    
    return {"message": "Welcome to the HR dashboard",
        "username": current_user.username,
        "role": current_user.role.value}

@router.get("/employee-dashboard")
def employee_dashboard(current_user: User = Depends(require_role(UserRole.EMPLOYEE))):
    
    return {"message": "Welcome to the Employee dashboard",
        "username": current_user.username,
        "role": current_user.role.value}