from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db

from app.models.task import Task
from app.models.user import User, UserRole

from app.schemas.task import TaskCreate, TaskStatusUpdate, TaskResponse

from app.routers.auth import get_current_user

from app.core.email_service import send_email

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def require_hr_admin(user: User):
    if user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only HR and Admin can perform this action")

@router.post("/",response_model=TaskResponse,status_code=status.HTTP_201_CREATED)
async def assign_task(task_data: TaskCreate,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    require_hr_admin(current_user)

    employee = db.query(User).filter(User.id == task_data.assigned_to).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    if employee.role != UserRole.EMPLOYEE:
        raise HTTPException(status_code=400,detail="Tasks can only be assigned to employees")

    task = Task(assigned_to=task_data.assigned_to,
        title=task_data.title,
        description=task_data.description,
        due_date=task_data.due_date,
        status="PENDING")

    db.add(task)
    db.commit()
    db.refresh(task)

    # Send an email notification after the task is saved.
    # Email failure must not undo the task assignment.
    if employee.email:
        subject = "New Task Assigned - WorkSphere"

        body = (f"Hello {employee.username},\n\n"
            "A new task has been assigned to you in WorkSphere.\n\n"
            f"Task: {task.title}\n"
            f"Description: {task.description or 'No description provided'}\n"
            f"Due date: {task.due_date or 'Not specified'}\n"
            f"Status: {task.status}\n\n"
            "Please log in to WorkSphere to review your task.\n\n"
            "Regards,\n"
            "WorkSphere HR Team")

        try:
            await send_email(recipient=employee.email,subject=subject,body=body)
        except Exception:
            # Keep the saved task even if email delivery fails.
            print(f"Task {task.id} was saved, but its email "
                "notification could not be delivered.")

    return task

@router.get("/", response_model=list[TaskResponse])
def list_tasks(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    query = db.query(Task)

    if current_user.role == UserRole.EMPLOYEE:
        query = query.filter(Task.assigned_to == current_user.id)
    elif current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(status_code=403,detail="Access denied")

    return query.order_by(desc(Task.id)).all()

@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_task_status(task_id: int,status_data: TaskStatusUpdate,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404,detail="Task not found")

    if current_user.role == UserRole.EMPLOYEE:
        if task.assigned_to != current_user.id:
            raise HTTPException(status_code=403,detail="Access denied")
    elif current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(status_code=403,detail="Access denied")

    task.status = status_data.status
    db.commit()
    db.refresh(task)

    return task
