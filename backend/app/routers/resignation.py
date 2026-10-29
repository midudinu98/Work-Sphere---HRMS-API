from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models import Resignation, Employee
from app.models.user import User

from app.schemas.resignation import ResignationCreate,ResignationDecision,ResignationResponse

from app.routers.auth import get_current_user

router = APIRouter(prefix="/resignations",tags=["Resignation & Exit Management"])

def get_user_role(user: User):
    
    return getattr(user.role, "value", user.role)

def get_employee_for_user(db: Session, user: User):
    
    employee = (db.query(Employee).filter(Employee.user_id == user.id).first())

    if not employee:
        raise HTTPException(status_code=404,detail="Employee profile not found")

    return employee

def require_hr_or_admin(user: User):
    
    if get_user_role(user) not in ("HR", "ADMIN"):
        raise HTTPException(status_code=403,detail="Only HR or Admin can perform this action")


# Submit a resignation
@router.post("/",response_model=ResignationResponse,status_code=201)
def submit_resignation(payload: ResignationCreate,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    role = get_user_role(current_user)

    if role != "EMPLOYEE":
        raise HTTPException(status_code=403,detail="Only employees can submit their own resignation")

    employee = get_employee_for_user(db, current_user)

    if not payload.reason.strip():
        raise HTTPException(status_code=422,detail="Resignation reason cannot be empty")

    existing = (db.query(Resignation).filter(Resignation.employee_id == employee.id,Resignation.status == "PENDING").first())

    if existing:
        raise HTTPException(status_code=409,detail="You already have a pending resignation")

    resignation = Resignation(employee_id=employee.id,
        reason=payload.reason.strip(),
        notice_period=payload.notice_period,
        status="PENDING")

    db.add(resignation)
    db.commit()
    db.refresh(resignation)

    return resignation

# View resignation requests
# Employees can view only their own requests.
# HR/Admin can view all requests or filter by employee_id.
@router.get("/",response_model=list[ResignationResponse])
def get_resignations(employee_id: int | None = None,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    role = get_user_role(current_user)

    query = db.query(Resignation)

    if role == "EMPLOYEE":
        employee = get_employee_for_user(db, current_user)

        query = query.filter(Resignation.employee_id == employee.id)

    elif role in ("HR", "ADMIN"):
        if employee_id is not None:
            query = query.filter(Resignation.employee_id == employee_id)

    else:
        raise HTTPException(status_code=403,detail="Access denied")

    return query.order_by(Resignation.created_at.desc(),Resignation.id.desc()).all()


# View one resignation request
@router.get("/{resignation_id}",response_model=ResignationResponse)
def get_resignation(resignation_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    resignation = db.query(Resignation).filter(Resignation.id == resignation_id).first()

    if not resignation:
        raise HTTPException(status_code=404,detail="Resignation request not found")

    role = get_user_role(current_user)

    if role == "EMPLOYEE":
        employee = get_employee_for_user(db, current_user)

        if resignation.employee_id != employee.id:
            raise HTTPException(status_code=403,detail="You cannot view another employee's resignation")

    elif role not in ("HR", "ADMIN"):
        raise HTTPException(status_code=403,detail="Access denied")

    return resignation

# Approve or reject a resignation (HR/Admin only)
@router.patch("/{resignation_id}/decision",response_model=ResignationResponse)
def decide_resignation(resignation_id: int,payload: ResignationDecision,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    require_hr_or_admin(current_user)

    resignation = db.query(Resignation).filter(Resignation.id == resignation_id).first()

    if not resignation:
        raise HTTPException(status_code=404,detail="Resignation request not found")

    if resignation.status != "PENDING":
        raise HTTPException(status_code=409,detail="This resignation has already been reviewed")

    resignation.status = payload.status

    db.commit()
    db.refresh(resignation)

    return resignation
