from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db

from app.models import Onboarding, Employee
from app.models.user import User, UserRole

from app.schemas.onboarding import OnboardingCreate,OnboardingStatusUpdate,OnboardingResponse

from app.routers.auth import get_current_user

router = APIRouter(prefix="/onboarding",tags=["Employee Onboarding"])

def get_employee_for_user(db: Session, user: User):
    
    employee = (db.query(Employee).filter(Employee.user_id == user.id).first())

    if not employee:
        raise HTTPException(status_code=404,detail="Employee profile not found")

    return employee

def require_hr_or_admin(user: User):
    
    role = getattr(user.role, "value", user.role)

    if role not in ("HR", "ADMIN"):
        raise HTTPException(status_code=403,detail="Only HR or Admin can perform this action")

@router.post("/", response_model=OnboardingResponse, status_code=201)
def create_onboarding_task(payload: OnboardingCreate,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    require_hr_or_admin(current_user)

    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    if not payload.task_name.strip():
        raise HTTPException(status_code=422,detail="Task name cannot be empty")

    task = Onboarding(employee_id=payload.employee_id,
        task_name=payload.task_name.strip(),
        due_date=payload.due_date,
        status="PENDING")

    db.add(task)
    db.commit()
    db.refresh(task)

    return task

@router.get("/", response_model=list[OnboardingResponse])
def get_onboarding_tasks(employee_id: Optional[int] = None,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    role = getattr(current_user.role, "value", current_user.role)

    query = db.query(Onboarding)

    if role == "EMPLOYEE":
        employee = get_employee_for_user(db, current_user)
        query = query.filter(Onboarding.employee_id == employee.id)
    
    elif role in ("HR", "ADMIN"):
        if employee_id is not None:
            query = query.filter(Onboarding.employee_id == employee_id)
    else:
        raise HTTPException(status_code=403,detail="Access denied")

    return query.order_by(Onboarding.due_date.asc(),Onboarding.id.asc()).all()

@router.patch("/{task_id}/status", response_model=OnboardingResponse)
def update_onboarding_status(task_id: int,payload: OnboardingStatusUpdate,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    task = db.query(Onboarding).filter(Onboarding.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404,detail="Onboarding task not found")

    role = getattr(current_user.role, "value", current_user.role)

    if role == "EMPLOYEE":
        employee = get_employee_for_user(db, current_user)

        if task.employee_id != employee.id:
            raise HTTPException(status_code=403,detail="You cannot update another employee's task")
    
    elif role not in ("HR", "ADMIN"):
        raise HTTPException(status_code=403,detail="Access denied")

    task.status = payload.status

    db.commit()
    db.refresh(task)

    return task

@router.get("/progress/{employee_id}")
def get_onboarding_progress(employee_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    role = getattr(current_user.role, "value", current_user.role)

    if role == "EMPLOYEE":
        employee = get_employee_for_user(db, current_user)

        if employee.id != employee_id:
            raise HTTPException(status_code=403,detail="You cannot view another employee's progress")
    
    elif role not in ("HR", "ADMIN"):
        raise HTTPException(status_code=403,detail="Access denied")

    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    tasks = db.query(Onboarding).filter(Onboarding.employee_id == employee_id).all()

    total = len(tasks)
    completed = sum(1 for task in tasks if task.status == "COMPLETED")
    pending = total - completed

    return {"employee_id": employee_id,
        "total_tasks": total,
        "completed_tasks": completed,
        "pending_tasks": pending,
        "progress_percentage": round(completed / total * 100, 2) if total else 0}