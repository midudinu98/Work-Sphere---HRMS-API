from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from datetime import date, datetime, time, timedelta

from app.database import get_db
from app.models import Attendance, Employee
from app.models.user import User, UserRole
from app.models.shift import Shift, EmployeeShift
from app.routers.auth import get_current_user
from app.schemas.attendance import AttendanceResponse
from app.core.notification import create_notification
from app.core.attendance_timing import calculate_late_minutes,calculate_early_checkout_minutes

router = APIRouter(prefix="/attendance", tags=["Attendance"])

LATE_ENTRY_CUTOFF = time(9, 15)

def calculate_working_hours(check_in: datetime | None,check_out: datetime | None,) -> float:
    
    if check_in is None or check_out is None:
        return 0.0

    seconds = (check_out - check_in).total_seconds()
    return round(max(seconds, 0) / 3600, 2)

def get_arrival_status(check_in: datetime | None) -> str:
    
    if check_in is None:
        return "NOT_CHECKED_IN"

    return "LATE" if check_in.time() > LATE_ENTRY_CUTOFF else "ON_TIME"

def get_authorized_employee(employee_id: int,current_user: User,db: Session,) -> Employee:
    
    employee = (db.query(Employee).filter(Employee.id == employee_id).first())

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if current_user.role == UserRole.EMPLOYEE:
        
        own_employee = (db.query(Employee).filter(Employee.user_id == current_user.id).first())

        if not own_employee or own_employee.id != employee_id:
            raise HTTPException(status_code=403,detail="You can access only your own attendance")

    elif current_user.role not in (UserRole.HR, UserRole.ADMIN):
        raise HTTPException(status_code=403,detail="You do not have permission to access attendance")

    return employee

def get_employee_for_attendance_action(employee_id: int,current_user: User,db: Session) -> Employee:
    
    if current_user.role == UserRole.HR:
        raise HTTPException(status_code=403,detail="HR cannot mark attendance for employees")

    return get_authorized_employee(employee_id, current_user, db)

def get_employee_shift(db: Session, employee_id: int):
    
    assignment = (db.query(EmployeeShift).filter(EmployeeShift.employee_id == employee_id).order_by(EmployeeShift.id.desc()).first())

    if not assignment:
        return None

    return (db.query(Shift).filter(Shift.id == assignment.shift_id).first())

def attendance_response(record: Attendance) -> dict:
    
    late_minutes = getattr(record, "late_minutes", 0) or 0

    if record.check_in is None:
        arrival_status = "NOT_CHECKED_IN"
    elif late_minutes > 0:
        arrival_status = "LATE"
    else:
        arrival_status = "ON_TIME"

    return {"id": record.id,
        "employee_id": record.employee_id,
        "check_in": record.check_in,
        "check_out": record.check_out,
        "date": record.date,
        "status": record.status,
        "working_hours": calculate_working_hours(record.check_in,record.check_out),
        "arrival_status": arrival_status,
        "late_minutes": late_minutes,
        "early_checkout_minutes": (getattr(record, "early_checkout_minutes", 0) or 0)}

@router.post("/check-in", response_model=AttendanceResponse)
def check_in(employee_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    employee = get_employee_for_attendance_action(employee_id, current_user, db)

    now = datetime.now()
    today = now.date()

    existing_record = (db.query(Attendance).filter(Attendance.employee_id == employee_id,Attendance.date == today).first())

    if existing_record:
        raise HTTPException(status_code=400,detail="Attendance already marked for today")

    shift = get_employee_shift(db, employee_id)

    late_minutes = 0
    if shift:
        late_minutes = calculate_late_minutes(actual_check_in=now,shift_start=shift.start_time,grace_minutes=0)

    record = Attendance(employee_id=employee_id,
        check_in=now,
        date=today,
        status="PRESENT",
        late_minutes=late_minutes)

    try:
        db.add(record)
        db.flush()

        arrival_status = ("LATE"
            if late_minutes > 0
            else ("ON_TIME"
                if shift
                else get_arrival_status(now)))

        if employee.user_id:
            if late_minutes > 0:
                create_notification(db=db,user_id=employee.user_id,title="Late Attendance Alert",
                    message=(f"You checked in at {now.strftime('%I:%M %p')}. "
                        f"You are {late_minutes} minutes late "
                        "for your assigned shift."))
            else:
                create_notification(db=db,user_id=employee.user_id,title="Attendance Check-in",
                    message=(f"Your check-in was recorded at "
                        f"{now.strftime('%I:%M %p')}. "
                        f"Arrival status: {arrival_status}."))

        db.commit()
        db.refresh(record)

    except Exception:
        db.rollback()
        raise

    return attendance_response(record)

@router.post("/check-out", response_model=AttendanceResponse)
def check_out(employee_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    get_employee_for_attendance_action(employee_id, current_user, db)

    now = datetime.now()
    today = now.date()
    shift = get_employee_shift(db, employee_id)

    record = (db.query(Attendance).filter(Attendance.employee_id == employee_id,Attendance.date == today).first())

    # Support overnight shifts that finish after midnight.
    if (record is None and shift and shift.end_time <= shift.start_time and now.time() < shift.end_time):
        
        yesterday = today - timedelta(days=1)

        record = (db.query(Attendance).filter(Attendance.employee_id == employee_id,Attendance.date == yesterday).first())

    if not record:
        raise HTTPException(status_code=404,detail="No check-in record found")

    if record.check_out is not None:
        raise HTTPException(status_code=400,detail="Already checked out")

    if record.check_in is None:
        raise HTTPException(status_code=400,detail="Cannot check out without a valid check-in")

    if now < record.check_in:
        raise HTTPException(status_code=400,detail="Check-out cannot be earlier than check-in")

    early_checkout_minutes = 0
    if shift:
        early_checkout_minutes = calculate_early_checkout_minutes(actual_check_out=now,
            shift_end=shift.end_time,
            grace_minutes=0,
            overnight=shift.end_time <= shift.start_time,
            shift_start=shift.start_time)

    record.check_out = now
    record.early_checkout_minutes = early_checkout_minutes

    hours = calculate_working_hours(record.check_in, now)
    record.status = "HALF_DAY" if hours < 4 else "PRESENT"

    try:
        employee = (db.query(Employee).filter(Employee.id == employee_id).first())

        if employee and employee.user_id:
            create_notification(db=db,user_id=employee.user_id,
                title="Attendance Check-out",
                message=("Your check-out has been recorded. "
                    f"Working hours: {hours:.2f}. "
                    f"Attendance status: {record.status}. "
                    f"Early checkout minutes: {early_checkout_minutes}."))

        db.commit()
        db.refresh(record)

    except Exception:
        db.rollback()
        raise

    return attendance_response(record)

@router.get("/history")
def attendance_history(employee_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    get_authorized_employee(employee_id, current_user, db)

    records = (db.query(Attendance).filter(Attendance.employee_id == employee_id).order_by(Attendance.date.desc()).all())

    return {"employee_id": employee_id,
        "total_records": len(records),
        "attendance": [attendance_response(record) for record in records]}

@router.post("/mark-absent")
def mark_absent(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    if current_user.role not in (UserRole.HR, UserRole.ADMIN):
        raise HTTPException(status_code=403,detail="Only HR or Admin can mark absent attendance")

    now = datetime.now()
    today = now.date()

    employees = (db.query(Employee).filter(Employee.status == "ACTIVE").all())

    marked_absent = 0

    try:
        for employee in employees:
            shift = get_employee_shift(db, employee.id)

            attendance_date = today

            if shift:
                if (shift.end_time <= shift.start_time and now.time() < shift.end_time):
                    attendance_date = today - timedelta(days=1)

                scheduled_end = datetime.combine(attendance_date,shift.end_time)

                if shift.end_time <= shift.start_time:
                    scheduled_end += timedelta(days=1)

                if now < scheduled_end:
                    continue

            elif now.time() < time(18, 0):
                continue

            existing_record = (db.query(Attendance).filter(Attendance.employee_id == employee.id,Attendance.date == attendance_date).first())

            if existing_record:
                continue

            db.add(Attendance(employee_id=employee.id,date=attendance_date,status="ABSENT"))
            
            marked_absent += 1

            if employee.user_id:
                create_notification(db=db,user_id=employee.user_id,
                    title="Attendance Alert",
                    message=("You have been marked absent because no "
                        "check-in was recorded for your shift."))

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {"message": "Absent marking completed",
        "date": str(today),
        "employees_checked": len(employees),
        "absent_marked": marked_absent}
