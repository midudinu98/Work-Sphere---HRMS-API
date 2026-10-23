from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from decimal import Decimal

from app.database import get_db

from app.models import Employee, Attendance, Leave, Payroll
from app.models.user import UserRole,User

from app.routers.auth import require_role,get_current_user

router = APIRouter(prefix="/analytics",tags=["Dashboard & Analytics"])


@router.get("/dashboard")
def get_dashboard_analytics(db: Session = Depends(get_db),
    current_user=Depends( require_role(UserRole.HR, UserRole.ADMIN))):
    
    today = date.today()

    # 1. Employee statistics
    total_employees = db.query(Employee).count()

    active_employees = db.query(Employee).filter(Employee.status == "ACTIVE").count()

    # 2. Today's attendance statistics
    attendance_records = db.query(Attendance.status,func.count(Attendance.id)).filter(Attendance.date == today).group_by(Attendance.status).all()

    attendance_summary = {"total_records": 0,
        "present": 0,
        "absent": 0,
        "on_leave": 0}

    for attendance_status, count in attendance_records:
        status_name = attendance_status.upper()
        attendance_summary["total_records"] += count

        if status_name == "PRESENT":
            attendance_summary["present"] = count
        elif status_name == "ABSENT":
            attendance_summary["absent"] = count
        elif status_name in ("ON_LEAVE", "ON LEAVE"):
            attendance_summary["on_leave"] = count

    # 3. Leave statistics
    leave_records = db.query(Leave.status,func.count(Leave.id)).group_by(Leave.status).all()

    leave_summary = {"total": 0,
        "pending": 0,
        "approved": 0,
        "rejected": 0}

    for leave_status, count in leave_records:
        status_name = leave_status.upper()
        leave_summary["total"] += count

        if status_name == "PENDING":
            leave_summary["pending"] = count
        elif status_name == "APPROVED":
            leave_summary["approved"] = count
        elif status_name == "REJECTED":
            leave_summary["rejected"] = count

    # 4. Payroll overview for the current month
    current_month = today.strftime("%Y-%m")

    payroll_records = db.query(func.count(Payroll.id),func.coalesce(func.sum(Payroll.net_salary), 0)).filter(Payroll.month == current_month).first()

    payroll_count = payroll_records[0] or 0
    total_payroll = payroll_records[1] or Decimal("0.00")

    return {"date": today.isoformat(),
        "employees": {
            "total": total_employees,
            "active": active_employees},
        "attendance": attendance_summary,
        "leaves": leave_summary,
        "payroll": {"month": current_month,
            "payroll_records": payroll_count,
            "total_net_salary": float(total_payroll)}}

@router.get("/employee-dashboard")
def get_employee_dashboard(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    # Find the employee record belonging to the logged-in user
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee profile not found")

    # Employee's attendance summary
    attendance_records = db.query(Attendance).filter(Attendance.employee_id == employee.id).all()

    attendance_summary = {
        "total_records": len(attendance_records),
        "present": sum(
            1 for record in attendance_records
            if str(record.status).upper().split(".")[-1] == "PRESENT"
        ),
        "absent": sum(
            1 for record in attendance_records
            if str(record.status).upper().split(".")[-1] == "ABSENT"
        )}

    # Employee's leave summary
    leave_records = db.query(Leave).filter(Leave.employee_id == employee.id).all()

    leave_summary = {"total": len(leave_records),
        "pending": 0,
        "approved": 0,
        "rejected": 0}

    for record in leave_records:
        status_name = str(record.status).upper().split(".")[-1]
        if status_name in leave_summary:
            leave_summary[status_name] += 1

    # Employee's payroll records only
    payroll_records = db.query(Payroll).filter(Payroll.employee_id == employee.id).order_by(Payroll.id.desc()).all()

    salary_records = [{"month": record.month,
            "basic_salary": float(record.basic_salary or 0),
            "deductions": float(record.deductions or 0),
            "bonus": float(record.bonus or 0),
            "net_salary": float(record.net_salary or 0)}
        for record in payroll_records]

    return {
        "profile": {"employee_id": employee.id,
            "full_name": employee.full_name,
            "designation": employee.designation,
            "department": employee.department,
            "status": str(employee.status)},
        "attendance": attendance_summary,
        "leaves": leave_summary,
        "payroll": salary_records}

