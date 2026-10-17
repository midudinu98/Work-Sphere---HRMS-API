from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db

from app.models import Leave,Employee

from app.schemas.leave import LeaveCreate,LeaveResponse,LeaveStatusUpdate

from app.routers.auth import get_current_user

from app.core.notification import create_notification

router = APIRouter(prefix="/leaves", tags=["Leave Management"])

def get_employee(current_user, db: Session):
    
    employee = (db.query(Employee).filter(Employee.user_id == current_user.id).first())

    if not employee:
        raise HTTPException(status_code=404,detail="Employee profile not found")

    return employee

def require_hr_admin(current_user):
    
    role = str(current_user.role).upper()

    if role not in ["HR", "ADMIN"]:
        raise HTTPException(status_code=403,detail="Only HR/Admin can perform this action")

# Apply for leave
@router.post( "/",response_model=LeaveResponse,status_code=status.HTTP_201_CREATED)
def apply_leave(leave_data: LeaveCreate,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    employee = get_employee(current_user, db)

    leave = Leave( employee_id=employee.id,
        leave_type=leave_data.leave_type,
        start_date=leave_data.start_date,
        end_date=leave_data.end_date,
        reason=leave_data.reason,
        status="PENDING")

    try:
        db.add(leave)
        db.commit()
        db.refresh(leave)
    except Exception:
        db.rollback()
        raise

    return leave

# View own leave history
@router.get("/my", response_model=list[LeaveResponse])
def my_leaves(db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    employee = get_employee(current_user, db)

    return (db.query(Leave).filter(Leave.employee_id == employee.id).order_by(Leave.id.desc()).all())

# HR/Admin: view all leave requests
@router.get("/", response_model=list[LeaveResponse])
def all_leaves(db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    require_hr_admin(current_user)

    return db.query(Leave).order_by(Leave.id.desc()).all()

# HR/Admin: approve or reject a leave request
@router.patch("/{leave_id}/status", response_model=LeaveResponse)
def update_leave_status(leave_id: int,update_data: LeaveStatusUpdate,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    require_hr_admin(current_user)

    leave = db.query(Leave).filter(Leave.id == leave_id).first()

    if not leave:
        raise HTTPException(status_code=404,detail="Leave request not found")

    if leave.status != "PENDING":
        raise HTTPException(status_code=400,detail="Only pending leave requests can be reviewed")

    leave.status = update_data.status
   
    employee = (db.query(Employee).filter(Employee.id == leave.employee_id).first())

    try:
        leave.status = update_data.status

        if employee:
            create_notification(db=db,
                user_id=employee.user_id,
                title="Leave Request Update",
                message=(f"Your leave request has been "
                    f"{str(leave.status).lower()}."))

        db.commit()
        db.refresh(leave)

    except Exception:
        db.rollback()
        raise

    return leave
