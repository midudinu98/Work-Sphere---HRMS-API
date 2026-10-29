from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.leave_policy import LeavePolicy
from app.models.leave_balance import LeaveBalance
from app.models.employee import Employee
from app.models.user import User, UserRole

from app.routers.auth import get_current_user

router = APIRouter(prefix="/leave-policies", tags=["Leave Policies"])

@router.get("/")
def get_leave_policies(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    return db.query(LeavePolicy).all()

@router.post("/")
def create_leave_policy(leave_type: str,total_days_allowed: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    if current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    leave_type = leave_type.strip().upper()

    if leave_type not in ["SICK", "CASUAL", "PAID"]:
        raise HTTPException(status_code=400, detail="Invalid leave type")

    if total_days_allowed < 0:
        raise HTTPException(status_code=400,detail="Allowed days cannot be negative")

    existing = db.query(LeavePolicy).filter(LeavePolicy.leave_type == leave_type).first()

    if existing:
        existing.total_days_allowed = total_days_allowed
        db.commit()
        db.refresh(existing)
        return existing

    policy = LeavePolicy(leave_type=leave_type,total_days_allowed=total_days_allowed)

    db.add(policy)
    db.commit()
    db.refresh(policy)

    return policy

@router.get("/my-balance")
def get_my_leave_balance(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    return db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee.id).all()

@router.get("/balances")
def get_all_leave_balances(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    if current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    return db.query(LeaveBalance).all()

@router.post("/initialize-balances")
def initialize_leave_balances(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    if current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")

    policies = db.query(LeavePolicy).all()
    employees = db.query(Employee).all()

    if not policies:
        raise HTTPException(status_code=400,detail="Create leave policies before initializing balances")

    created_count = 0

    try:
        for employee in employees:
            for policy in policies:
                existing = db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee.id,LeaveBalance.leave_type == policy.leave_type).first()

                if not existing:
                    balance = LeaveBalance(employee_id=employee.id,leave_type=policy.leave_type,remaining_days=policy.total_days_allowed)
                    db.add(balance)
                    created_count += 1

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {"message": "Leave balances initialized successfully","created_balances": created_count}
