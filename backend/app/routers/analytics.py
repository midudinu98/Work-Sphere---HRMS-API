from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from datetime import date
from decimal import Decimal

from app.database import get_db

from app.models import Employee, Attendance, Leave, Payroll
from app.models.user import UserRole, User

from app.routers.auth import require_role, get_current_user


router = APIRouter(prefix="/analytics",tags=["Dashboard & Analytics"])


# --------------------------------------------------
# COMMON HELPERS
# --------------------------------------------------

def normalize_status(value):
    return str(value or "").upper().split(".")[-1].replace(" ", "_")


def validate_date_range(start_date, end_date):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400,detail="start_date must be before or equal to end_date")


# --------------------------------------------------
# EXISTING: HR / ADMIN DASHBOARD
# GET /analytics/dashboard
# --------------------------------------------------

@router.get("/dashboard")
def get_dashboard_analytics(db: Session = Depends(get_db),current_user=Depends(require_role(UserRole.HR, UserRole.ADMIN))):
    
    today = date.today()

    total_employees = db.query(Employee).count()

    active_employees = db.query(Employee).filter(Employee.status == "ACTIVE").count()

    attendance_records = (db.query(Attendance.status,func.count(Attendance.id)).filter(Attendance.date == today).group_by(Attendance.status).all())

    attendance_summary = {"total_records": 0,"present": 0,"absent": 0,"on_leave": 0}

    for status, count in attendance_records:
        status_name = normalize_status(status)
        attendance_summary["total_records"] += count

        if status_name == "PRESENT":
            attendance_summary["present"] += count
        elif status_name == "ABSENT":
            attendance_summary["absent"] += count
        elif status_name == "ON_LEAVE":
            attendance_summary["on_leave"] += count

    leave_records = (db.query(Leave.status,func.count(Leave.id)).group_by(Leave.status).all())

    leave_summary = {"total": 0,"pending": 0,"approved": 0,"rejected": 0}

    for status, count in leave_records:
        status_name = normalize_status(status)
        leave_summary["total"] += count

        if status_name in leave_summary:
            leave_summary[status_name] += count

    current_month = today.strftime("%Y-%m")

    payroll_records = (db.query(func.count(Payroll.id),func.coalesce(func.sum(Payroll.net_salary), 0)).filter(Payroll.month == current_month).first())

    return {"date": today.isoformat(),
        "employees": {"total": total_employees,"active": active_employees},
        "attendance": attendance_summary,
        "leaves": leave_summary,
        "payroll": {"month": current_month,"payroll_records": payroll_records[0] or 0,
            "total_net_salary": float(payroll_records[1] or Decimal("0.00"))}}


# --------------------------------------------------
# EXISTING: EMPLOYEE DASHBOARD
# GET /analytics/employee-dashboard
# --------------------------------------------------

@router.get("/employee-dashboard")
def get_employee_dashboard(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee profile not found")

    attendance_records = db.query(Attendance).filter(Attendance.employee_id == employee.id).all()

    attendance_summary = {"total_records": len(attendance_records),
        "present": sum(1 for record in attendance_records if normalize_status(record.status) == "PRESENT"),
        "absent": sum(1 for record in attendance_records if normalize_status(record.status) == "ABSENT")}

    leave_records = db.query(Leave).filter(Leave.employee_id == employee.id).all()

    leave_summary = {"total": len(leave_records),"pending": 0,"approved": 0,"rejected": 0}

    for record in leave_records:
        status_name = normalize_status(record.status)

        if status_name in leave_summary:
            leave_summary[status_name] += 1

    payroll_records = (db.query(Payroll).filter(Payroll.employee_id == employee.id).order_by(Payroll.id.desc()).all())

    salary_records = [{"month": record.month,
            "basic_salary": float(record.basic_salary or 0),
            "deductions": float(record.deductions or 0),
            "bonus": float(record.bonus or 0),
            "net_salary": float(record.net_salary or 0)
        }
        for record in payroll_records
    ]

    return {"profile": {
            "employee_id": employee.id,
            "full_name": employee.full_name,
            "designation": employee.designation,
            "department": employee.department,
            "status": str(employee.status)},
        "attendance": attendance_summary,
        "leaves": leave_summary,
        "payroll": salary_records}


# --------------------------------------------------
# MODULE 18: ATTENDANCE TRENDS
# GET /analytics/attendance-trends
# --------------------------------------------------

@router.get("/attendance-trends")
def get_attendance_trends(start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    department: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.HR, UserRole.ADMIN))):
    
    validate_date_range(start_date, end_date)

    query = (db.query(Attendance.date,Attendance.status,func.count(Attendance.id)).join(Employee, Attendance.employee_id == Employee.id))

    if start_date:
        query = query.filter(Attendance.date >= start_date)

    if end_date:
        query = query.filter(Attendance.date <= end_date)

    if department:
        query = query.filter(Employee.department == department)

    rows = (query.group_by(Attendance.date, Attendance.status).order_by(Attendance.date).all())

    trends = {}

    for attendance_date, status, count in rows:
        day = attendance_date.isoformat()

        trends.setdefault(day, {"date": day,"present": 0,"absent": 0,"half_day": 0,"other": 0})

        status_name = normalize_status(status)

        if status_name == "PRESENT":
            trends[day]["present"] += count
        elif status_name == "ABSENT":
            trends[day]["absent"] += count
        elif status_name == "HALF_DAY":
            trends[day]["half_day"] += count
        else:
            trends[day]["other"] += count

    return {"filters": {"start_date": start_date,
            "end_date": end_date,
            "department": department},
        "total_days_with_records": len(trends),
        "trends": list(trends.values())}


# --------------------------------------------------
# MODULE 18: LEAVE TRENDS
# GET /analytics/leave-trends
# --------------------------------------------------

@router.get("/leave-trends")
def get_leave_trends(start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    department: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.HR, UserRole.ADMIN))):
    
    validate_date_range(start_date, end_date)

    query = (db.query(Leave).join(Employee, Leave.employee_id == Employee.id))

    if start_date:
        query = query.filter(Leave.start_date >= start_date)

    if end_date:
        query = query.filter(Leave.start_date <= end_date)

    if department:
        query = query.filter(Employee.department == department)

    records = query.order_by(Leave.start_date).all()
    trends = {}

    for record in records:
        month = record.start_date.strftime("%Y-%m")

        trends.setdefault(month, {"month": month,"total": 0,"pending": 0,"approved": 0,"rejected": 0})

        trends[month]["total"] += 1
        status_name = normalize_status(record.status)

        if status_name in trends[month]:
            trends[month][status_name] += 1

    return {"filters": {"start_date": start_date,
            "end_date": end_date,
            "department": department},
        "total_leave_requests": len(records),
        "trends": list(trends.values())}


# --------------------------------------------------
# MODULE 18: EMPLOYEE PERFORMANCE INSIGHTS
# GET /analytics/performance
# --------------------------------------------------

@router.get("/performance")
def get_employee_performance(start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    department: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.HR, UserRole.ADMIN))):
    
    validate_date_range(start_date, end_date)

    employee_query = db.query(Employee)

    if department:
        employee_query = employee_query.filter(Employee.department == department)

    employees = employee_query.order_by(Employee.full_name).all()
    performance = []

    for employee in employees:
        attendance_query = db.query(Attendance).filter(Attendance.employee_id == employee.id)

        if start_date:
            attendance_query = attendance_query.filter(Attendance.date >= start_date)

        if end_date:
            attendance_query = attendance_query.filter(Attendance.date <= end_date)

        records = attendance_query.all()

        present = sum(1 for record in records if normalize_status(record.status) == "PRESENT")

        absent = sum(1 for record in records if normalize_status(record.status) == "ABSENT")

        half_day = sum(1 for record in records if normalize_status(record.status) == "HALF_DAY")

        counted_days = present + absent + half_day

        attendance_rate = (round((present + half_day * 0.5) / counted_days * 100,2)
            if counted_days else None)

        late_minutes = sum(max(0, record.late_minutes or 0)for record in records)

        early_checkout_minutes = sum(max(0, record.early_checkout_minutes or 0)for record in records)

        performance.append({"employee_id": employee.id,
            "full_name": employee.full_name,
            "designation": employee.designation,
            "department": employee.department,
            "attendance_records": len(records),
            "present_days": present,
            "absent_days": absent,
            "half_days": half_day,
            "attendance_rate_percent": attendance_rate,
            "total_late_minutes": late_minutes,
            "total_early_checkout_minutes": early_checkout_minutes})

    return {"filters": {"start_date": start_date,
            "end_date": end_date,
            "department": department},
        "total_employees": len(performance),
        "performance": performance,
        "note": ("These are attendance and punctuality indicators, "
            "not a complete measure of employee job performance.")}


# --------------------------------------------------
# MODULE 18: DEPARTMENT-WISE REPORTS
# GET /analytics/department-reports
# --------------------------------------------------

@router.get("/department-reports")
def get_department_reports(start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    department: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(UserRole.HR, UserRole.ADMIN))):
    
    validate_date_range(start_date, end_date)

    employee_query = db.query(Employee.department,func.count(Employee.id),func.sum(case((Employee.status == "ACTIVE", 1),else_=0)))

    if department:
        employee_query = employee_query.filter(Employee.department == department)

    employee_rows = employee_query.group_by(Employee.department).all()

    reports = {}

    for dept, total, active in employee_rows:
        reports[dept] = {"department": dept,
            "total_employees": total or 0,
            "active_employees": active or 0,
            "attendance_records": 0,
            "present": 0,
            "absent": 0,
            "leave_requests": 0,
            "pending_leaves": 0,
            "approved_leaves": 0,
            "rejected_leaves": 0}

    attendance_query = (db.query(Employee.department,Attendance.status,func.count(Attendance.id)).join(Employee, Attendance.employee_id == Employee.id))

    if start_date:
        attendance_query = attendance_query.filter(Attendance.date >= start_date)

    if end_date:
        attendance_query = attendance_query.filter(Attendance.date <= end_date)

    if department:
        attendance_query = attendance_query.filter(Employee.department == department)

    attendance_rows = attendance_query.group_by(Employee.department,Attendance.status).all()

    for dept, status, count in attendance_rows:
        if dept not in reports:
            continue

        reports[dept]["attendance_records"] += count
        status_name = normalize_status(status)

        if status_name == "PRESENT":
            reports[dept]["present"] += count
        elif status_name == "ABSENT":
            reports[dept]["absent"] += count

    leave_query = (db.query(Employee.department,Leave.status,func.count(Leave.id)).join(Employee, Leave.employee_id == Employee.id))

    if start_date:
        leave_query = leave_query.filter(Leave.start_date >= start_date)

    if end_date:
        leave_query = leave_query.filter(Leave.start_date <= end_date)

    if department:
        leave_query = leave_query.filter(Employee.department == department)

    leave_rows = leave_query.group_by(Employee.department,Leave.status).all()

    for dept, status, count in leave_rows:
        if dept not in reports:
            continue

        reports[dept]["leave_requests"] += count
        status_name = normalize_status(status)

        key = f"{status_name.lower()}_leaves"

        if key in reports[dept]:
            reports[dept][key] += count

    return {"filters": {"start_date": start_date,
            "end_date": end_date,
            "department": department},
        "total_departments": len(reports),
        "departments": list(reports.values())}
