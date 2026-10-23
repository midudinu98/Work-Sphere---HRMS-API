from fastapi import APIRouter, Depends, HTTPException,Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from app.database import get_db

from app.models import Payroll, Employee
from app.models.user import User, UserRole

from app.schemas.payroll import PayrollCreate, PayrollResponse

from app.routers.auth import get_current_user

from app.core.notification import create_notification

router = APIRouter(prefix="/payroll", tags=["Payroll"])

def require_payroll_access(current_user: User):
    
    if current_user.role not in (UserRole.HR, UserRole.ADMIN):
        raise HTTPException(status_code=403,detail="Only HR or Admin can perform this action")

def get_own_employee(current_user: User, db: Session) -> Employee:
    
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee profile not found")

    return employee

# HR/Admin: Generate payroll
@router.post("/", response_model=PayrollResponse)
def generate_payroll(payroll_data: PayrollCreate,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    require_payroll_access(current_user)

    employee = db.query(Employee).filter(Employee.id == payroll_data.employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    existing_payroll = db.query(Payroll).filter(
        Payroll.employee_id == payroll_data.employee_id,
        Payroll.month == payroll_data.month).first()

    if existing_payroll:
        raise HTTPException(status_code=400,detail="Payroll already exists for this employee and month")

    net_salary = (payroll_data.basic_salary + payroll_data.allowances + payroll_data.bonus - payroll_data.deductions)

   
    payroll = Payroll(employee_id=payroll_data.employee_id,
        basic_salary=payroll_data.basic_salary,
        allowances=payroll_data.allowances,
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
            message=f"Your payroll for {payroll_data.month} has been generated.")

        db.commit()
        db.refresh(payroll)

    except Exception:
        db.rollback()
        raise

    return payroll

# HR/Admin: View all payroll; Employee: View own payroll

@router.get("/", response_model=list[PayrollResponse])
def get_payrolls(month: str | None = Query(default=None,pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    query = db.query(Payroll)

    if current_user.role in (UserRole.HR, UserRole.ADMIN):
        pass
    else:
        employee = get_own_employee(current_user, db)
        query = query.filter(Payroll.employee_id == employee.id)

    if month:
        query = query.filter(Payroll.month == month)

    return query.order_by(Payroll.month.desc(),Payroll.id.desc()).all()

@router.get("/summary/monthly")
def monthly_payroll_summary(month: str = Query(...,pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    require_payroll_access(current_user)

    result = db.query(func.count(Payroll.id),
        func.coalesce(func.sum(Payroll.basic_salary), 0),
        func.coalesce(func.sum(Payroll.allowances), 0),
        func.coalesce(func.sum(Payroll.deductions), 0),
        func.coalesce(func.sum(Payroll.net_salary), 0)
    ).filter(Payroll.month == month).one()

    return {"month": month,
        "employees_paid": result[0],
        "total_basic_salary": result[1],
        "total_allowances": result[2],
        "total_deductions": result[3],
        "total_net_salary": result[4]}

# HR/Admin: View any payroll; Employee: View own payroll only
@router.get("/{payroll_id}", response_model=PayrollResponse)
def get_payroll_details(payroll_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()

    if not payroll:
        raise HTTPException(status_code=404,detail="Payroll record not found")

    if current_user.role in (UserRole.HR, UserRole.ADMIN):
        return payroll

    employee = get_own_employee(current_user, db)

    if payroll.employee_id != employee.id:
        raise HTTPException(status_code=403,detail="You cannot access another employee's salary details")

    return payroll
