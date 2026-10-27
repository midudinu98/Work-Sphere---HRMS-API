from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from datetime import date

from app.database import get_db

from app.models import Leave, Employee
from app.models.user import UserRole
from app.models.leave_balance import LeaveBalance

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
    
    if current_user.role not in (UserRole.HR, UserRole.ADMIN):
        raise HTTPException(status_code=403,detail="Only HR/Admin can perform this action")

    return current_user

# Employee: Apply for leave
@router.post("/",response_model=LeaveResponse,status_code=status.HTTP_201_CREATED)
def apply_leave(leave_data: LeaveCreate,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    employee = get_employee(current_user, db)

    if leave_data.start_date > leave_data.end_date:
        raise HTTPException(status_code=400,detail="End date cannot be before start date")

    leave_type = str(leave_data.leave_type).upper()

    if leave_type not in ("SICK", "CASUAL", "PAID"):
        raise HTTPException(status_code=400,detail="Invalid leave type")

    leave = Leave(employee_id=employee.id,
        leave_type=leave_type,
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

# Employee: View own leave history
@router.get("/my", response_model=list[LeaveResponse])
def my_leaves(db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    employee = get_employee(current_user, db)

    return (db.query(Leave).filter(Leave.employee_id == employee.id).order_by(Leave.id.desc()).all())

# HR/Admin: View approved leaves on the team calendar
@router.get("/calendar")
def team_leave_calendar(start_date: date,end_date: date,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    require_hr_admin(current_user)

    if start_date > end_date:
        raise HTTPException(status_code=400,detail="Start date cannot be after end date")

    leaves = (db.query(Leave, Employee).join(Employee, Leave.employee_id == Employee.id).filter(Leave.status == "APPROVED",Leave.start_date <= end_date,Leave.end_date >= start_date).order_by(Leave.start_date.asc()).all())

    return [{"leave_id": leave.id,
            "employee_id": employee.id,
            "employee_name": employee.full_name,
            "department": employee.department,
            "leave_type": leave.leave_type,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "status": leave.status}for leave, employee in leaves]

# HR/Admin: View all leave requests
@router.get("/", response_model=list[LeaveResponse])
def all_leaves(db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    require_hr_admin(current_user)

    return db.query(Leave).order_by(Leave.id.desc()).all()

# HR/Admin: Approve or reject a leave request
@router.patch("/{leave_id}/status", response_model=LeaveResponse)
def update_leave_status(leave_id: int,update_data: LeaveStatusUpdate,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    require_hr_admin(current_user)

    requested_status = str(update_data.status).upper()

    if requested_status not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=400,detail="Status must be APPROVED or REJECTED")

    leave = (db.query(Leave).filter(Leave.id == leave_id).with_for_update().first())

    if not leave:
        raise HTTPException(status_code=404,detail="Leave request not found")

    if leave.status != "PENDING":
        raise HTTPException(status_code=400,detail="Only pending leave requests can be reviewed")

    employee = (db.query(Employee).filter(Employee.id == leave.employee_id).first())

    if not employee:
        raise HTTPException(status_code=404,detail="Employee profile not found")

    try:
        # Deduct leave balance only after validating approval.
        if requested_status == "APPROVED":
            requested_days = (leave.end_date - leave.start_date).days + 1

            conflicting_leave = (db.query(Leave).filter(
                    Leave.employee_id == leave.employee_id,
                    Leave.id != leave.id,
                    Leave.status == "APPROVED",
                    Leave.start_date <= leave.end_date,
                    Leave.end_date >= leave.start_date).first())

            if conflicting_leave:
                raise HTTPException(status_code=400,detail=("Leave dates conflict with an existing "f"approved leave request (ID: "f"{conflicting_leave.id})."))

            if requested_days <= 0:
                raise HTTPException(status_code=400,detail="Invalid leave date range")

            balance = (db.query(LeaveBalance).filter(LeaveBalance.employee_id == leave.employee_id,LeaveBalance.leave_type == leave.leave_type).with_for_update().first())

            if not balance:
                raise HTTPException(status_code=400,detail=(f"No {leave.leave_type} leave balance found ""for this employee. Initialize the balance first."))

            if balance.remaining_days < requested_days:
                raise HTTPException(status_code=400,detail=(f"Insufficient {leave.leave_type} leave balance. "f"Requested: {requested_days} days; "f"Remaining: {balance.remaining_days} days."))

            balance.remaining_days -= requested_days

        leave.status = requested_status

        # Send the notification to the employee who applied.
        if employee.user_id:
            if requested_status == "APPROVED":
                title = "Leave Approved"
                message = (f"Your {leave.leave_type} leave request "f"from {leave.start_date} to {leave.end_date} ""has been approved. ""Your leave balance has been updated.")
            else:
                title = "Leave Rejected"
                message = (f"Your {leave.leave_type} leave request "f"from {leave.start_date} to {leave.end_date} ""has been rejected. ""Your leave balance has not been deducted.")

            create_notification(db=db,user_id=employee.user_id,title=title,message=message)

        # Save the leave status, balance change and notification together.
        db.commit()
        db.refresh(leave)

    except Exception:
        db.rollback()
        raise

    return leave
