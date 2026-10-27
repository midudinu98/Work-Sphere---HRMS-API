from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.models import Attendance, Employee
from app.models.shift import EmployeeShift, Shift
from app.core.notification import create_notification

def auto_mark_absent():
    db: Session = SessionLocal()

    try:
        now = datetime.now()
        today = now.date()

        employees = (db.query(Employee).filter(Employee.status == "ACTIVE").all())

        for employee in employees:
            assignment = (db.query(EmployeeShift).filter(EmployeeShift.employee_id == employee.id).order_by(EmployeeShift.id.desc()).first())

            if not assignment:
                continue

            shift = (db.query(Shift).filter(Shift.id == assignment.shift_id).first())

            if not shift:
                continue

            # Determine the shift's starting date.
            shift_start_date = today

            if shift.end_time <= shift.start_time:
                if now.time() < shift.end_time:
                    shift_start_date = today - timedelta(days=1)

            scheduled_end = datetime.combine(shift_start_date,shift.end_time)

            if shift.end_time <= shift.start_time:
                scheduled_end += timedelta(days=1)

            # Do not mark absent before the assigned shift ends.
            if now < scheduled_end:
                continue

            existing_record = (db.query(Attendance).filter(Attendance.employee_id == employee.id,Attendance.date == shift_start_date).first())

            if existing_record:
                continue

            record = Attendance(employee_id=employee.id,date=shift_start_date,status="ABSENT")

            db.add(record)
            db.flush()

            if employee.user_id:
                create_notification(db=db,user_id=employee.user_id,title="Attendance Alert",
                    message=("You have been marked absent because no "
                        "check-in was recorded for your assigned shift."))

        db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

scheduler = BackgroundScheduler()

def start_attendance_scheduler():
    if not scheduler.running:
        scheduler.add_job(auto_mark_absent,
            trigger="interval",
            minutes=5,
            id="automatic_absent_marking",
            replace_existing=True,
            max_instances=1)
        scheduler.start()

def stop_attendance_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
