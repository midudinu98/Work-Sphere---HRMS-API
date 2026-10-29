from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.shift import Shift, EmployeeShift

from app.schemas.shift import ShiftCreate,ShiftResponse,EmployeeShiftCreate,EmployeeShiftResponse

from app.models.user import User, UserRole
from app.routers.auth import get_current_user, require_role

router = APIRouter(prefix="/shifts", tags=["Shift Management"])

@router.post("/", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(shift_data: ShiftCreate,db: Session = Depends(get_db),current_user: User = Depends(require_role(UserRole.HR, UserRole.ADMIN))):
    
    existing_shift = (db.query(Shift).filter(Shift.name == shift_data.name).first())

    if existing_shift:
        raise HTTPException(status_code=400,detail="Shift already exists")

    shift = Shift(name=shift_data.name,start_time=shift_data.start_time,end_time=shift_data.end_time)

    db.add(shift)
    db.commit()
    db.refresh(shift)

    return shift

@router.get("/", response_model=list[ShiftResponse])
def get_shifts(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    return db.query(Shift).order_by(Shift.id).all()

@router.post("/assign",response_model=EmployeeShiftResponse,status_code=status.HTTP_201_CREATED,)
def assign_shift(assignment: EmployeeShiftCreate,db: Session = Depends(get_db),current_user: User = Depends(require_role(UserRole.HR, UserRole.ADMIN))):
    
    shift = db.query(Shift).filter(Shift.id == assignment.shift_id).first()

    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    # Verify that the employee exists.
    from app.models.employee import Employee

    employee = db.query(Employee).filter(Employee.id == assignment.employee_id).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if employee.status != "ACTIVE":
         raise HTTPException(status_code=400,detail="Cannot assign a shift to an inactive employee")
    
    existing = (db.query(EmployeeShift).filter(EmployeeShift.employee_id == assignment.employee_id).first())
    
    if existing:
       existing.shift_id = assignment.shift_id
       db.commit()
       db.refresh(existing)
       return existing

    employee_shift = EmployeeShift(employee_id=assignment.employee_id,shift_id=assignment.shift_id)

    db.add(employee_shift)
    db.commit()
    db.refresh(employee_shift)

    return employee_shift

@router.get("/assignments", response_model=list[EmployeeShiftResponse])
def get_shift_assignments(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    query = db.query(EmployeeShift).order_by(EmployeeShift.id)

    if current_user.role == UserRole.EMPLOYEE:
        from app.models.employee import Employee

        employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()

        if not employee:
            return []

        query = query.filter(EmployeeShift.employee_id == employee.id)

    elif current_user.role not in (UserRole.HR, UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You do not have permission to view shift assignments")

    return query.all()

@router.get("/my-schedule", response_model=list[EmployeeShiftResponse])
def get_my_shift_schedule(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    from app.models.employee import Employee

    employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if not employee:
        return []

    return (db.query(EmployeeShift).filter(EmployeeShift.employee_id == employee.id).order_by(EmployeeShift.id).all())

