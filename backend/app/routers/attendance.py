from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime,time

from app.database import get_db

from app.models import Attendance,Employee
from app.models.user import User, UserRole

from app.routers.auth import get_current_user

from app.schemas.attendance import AttendanceResponse

from app.core.notification import create_notification

router = APIRouter(prefix="/attendance", tags=["Attendance"])

# Module 10 configuration
LATE_ENTRY_CUTOFF = time(9, 15)

def calculate_working_hours(check_in: datetime | None,check_out: datetime | None) -> float:
    
    if check_in is None or check_out is None:
        return 0.0

    seconds = (check_out - check_in).total_seconds()
    
    return round(max(seconds, 0) / 3600, 2)

def get_arrival_status(check_in: datetime | None) -> str:
    
    if check_in is None:
        return "NOT_CHECKED_IN"

    if check_in.time() > LATE_ENTRY_CUTOFF:
        return "LATE"

    return "ON_TIME"

def get_authorized_employee(employee_id: int,current_user: User,db: Session) -> Employee:
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    if current_user.role == UserRole.EMPLOYEE:
        own_employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()

        if not own_employee or own_employee.id != employee_id:
            raise HTTPException(status_code=403,detail="You can access only your own attendance")

    elif current_user.role not in (UserRole.HR, UserRole.ADMIN):
        raise HTTPException(status_code=403,detail="You do not have permission to access attendance")

    return employee

def get_employee_for_attendance_action(employee_id: int,current_user: User,db: Session) -> Employee:
    # HR can view attendance, but cannot mark attendance for employees
    if current_user.role == UserRole.HR:
        raise HTTPException(status_code=403, detail="HR cannot mark attendance for employees")

    # Employees can mark attendance only for themselves.
    # Admins retain system-wide access.
    return get_authorized_employee(employee_id, current_user, db)

def attendance_response(record: Attendance) -> dict:
    
    return {"id": record.id,
        "employee_id": record.employee_id,
        "check_in": record.check_in,
        "check_out": record.check_out,
        "date": record.date,
        "status": record.status,
        "working_hours": calculate_working_hours(record.check_in,record.check_out)}

@router.post("/check-in", response_model=AttendanceResponse)
def check_in(employee_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    get_employee_for_attendance_action(employee_id, current_user, db)

    now = datetime.now()
    today = now.date()

    record = db.query(Attendance).filter(Attendance.employee_id == employee_id,Attendance.date == today).first()

    if record:
        raise HTTPException(status_code=400,detail="Attendance already marked for today")

    record = Attendance(employee_id=employee_id,
        check_in=datetime.now(),
        date=today,
        status="PRESENT")

    try:
        db.add(record)
        db.flush()

        arrival_status = get_arrival_status(now)    

        create_notification(db=db,
            user_id=employee_id,
            title="Attendance Check-in",
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

    today = date.today()

    record = db.query(Attendance).filter(Attendance.employee_id == employee_id,Attendance.date == today).first()

    if not record:
        raise HTTPException(status_code=404,detail="No check-in record found for today")

    if record.check_out is not None:
        raise HTTPException(status_code=400,detail="Already checked out today")

    now = datetime.now()

    if now < record.check_in:
        raise HTTPException(status_code=400,detail="Check-out cannot be earlier than check-in")
    
    record.check_out = datetime.now()

    hours = calculate_working_hours(record.check_in,record.check_out)

    record.status = "HALF_DAY" if hours < 4 else "PRESENT"

    try:
        create_notification(db=db,
            user_id=employee_id,
            title="Attendance Check-out",
            message=(f"Your check-out has been recorded. "
                f"Working hours: {hours:.2f}. "
                f"Attendance status: {record.status}."))

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
        "attendance": [attendance_response(record)
            for record in records]}

@router.post("/mark-absent")
def mark_absent(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    # Only HR and Admin can trigger absent marking.
    if current_user.role not in (UserRole.HR, UserRole.ADMIN):
        raise HTTPException(status_code=403,detail="Only HR or Admin can mark absent attendance")

    today = date.today()

    # Do not mark absences before the workday has ended.
    if datetime.now().time() < time(18, 0):
        raise HTTPException(status_code=400,detail="Absent marking is allowed only after 6:00 PM")

    employees = (db.query(Employee).filter(Employee.status == "ACTIVE").all())

    marked_absent = 0

    try:
        for employee in employees:
            existing_record = (db.query(Attendance)
                .filter(Attendance.employee_id == employee.id,
                    Attendance.date == today).first())

            if existing_record:
                continue

            record = Attendance(employee_id=employee.id,date=today,status="ABSENT")

            db.add(record)
            marked_absent += 1

            if employee.user_id:
                create_notification(db=db,
                    user_id=employee.user_id,
                    title="Attendance Alert",
                    message=("You have been marked absent today "
                        "because no check-in was recorded."))

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {"message": "Absent marking completed",
        "date": str(today),
        "employees_checked": len(employees),
        "absent_marked": marked_absent}
