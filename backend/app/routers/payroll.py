from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal

from app.database import get_db

from app.models import Payroll,Employee

from app.schemas.payroll import PayrollCreate, PayrollResponse

from app.routers.auth import get_current_user

from app.core.notification import create_notification

router = APIRouter(prefix="/payroll",tags=["Payroll"])

@router.post("/", response_model=PayrollResponse)
def generate_payroll(payroll_data: PayrollCreate,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    # Only HR and Admin can generate payroll
    role = getattr(current_user, "role", None)

    if role not in ["HR", "ADMIN"]:
        raise HTTPException(status_code=403,detail="Only HR or Admin can generate payroll")

    employee = db.query(Employee).filter(Employee.id == payroll_data.employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    # Prevent duplicate payroll for the same employee and month
    existing_payroll = db.query(Payroll).filter(Payroll.employee_id == payroll_data.employee_id,Payroll.month == payroll_data.month).first()

    if existing_payroll:
        raise HTTPException(status_code=400,detail="Payroll already exists for this employee and month")

    net_salary = (payroll_data.basic_salary-payroll_data.deductions+payroll_data.bonus)

    payroll = Payroll(employee_id=payroll_data.employee_id,
        basic_salary=payroll_data.basic_salary,
        deductions=payroll_data.deductions,
        bonus=payroll_data.bonus,
        net_salary=net_salary,
        month=payroll_data.month)

    try:
        db.add(payroll)
        db.flush()

        create_notification(db=db,
            user_id=employee.user_id,
            title="Payroll Update",
            message=(f"Your payroll for {payroll_data.month} "
                "has been generated."))

        db.commit()
        db.refresh(payroll)

    except Exception:
        db.rollback()
        raise

    return payroll

@router.get("/", response_model=list[PayrollResponse])
def get_payrolls(db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    role = getattr(current_user, "role", None)

    if role in ["HR", "ADMIN"]:
        return db.query(Payroll).order_by(Payroll.month.desc()).all()

    # Employees can view only their own payroll
    employee_id = getattr(current_user, "employee_id", None)

    if employee_id is None:
        raise HTTPException(status_code=403,detail="Employee payroll access is not available")

    return db.query(Payroll).filter(Payroll.employee_id == employee_id).order_by(Payroll.month.desc()).all()

@router.get("/{payroll_id}", response_model=PayrollResponse)
def get_payroll_details(payroll_id: int,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()

    if not payroll:
        raise HTTPException(status_code=404,detail="Payroll record not found")

    role = getattr(current_user, "role", None)
    employee_id = getattr(current_user, "employee_id", None)

    if role not in ["HR", "ADMIN"] and payroll.employee_id != employee_id:
        raise HTTPException(status_code=403,detail="You cannot access another employee's salary details")

    return payroll
