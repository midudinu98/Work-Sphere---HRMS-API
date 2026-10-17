from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.employee import Employee
from app.models.user import User, UserRole

from app.schemas.employee import EmployeeCreate,EmployeeUpdate,EmployeeResponse

from app.routers.auth import require_role, get_current_user

router = APIRouter(prefix="/employees", tags=["Employees"])

HR_ACCESS = require_role(UserRole.HR, UserRole.ADMIN)

# Add employee
@router.post("/", response_model=EmployeeResponse, status_code=201)
def create_employee(employee_data: EmployeeCreate,db: Session = Depends(get_db),current_user: User = Depends(HR_ACCESS)):
    
    user = db.query(User).filter(User.id == employee_data.user_id).first()

    if not user:
        raise HTTPException(status_code=404,detail="User account not found")

    existing_employee = db.query(Employee).filter(Employee.user_id == employee_data.user_id).first()

    if existing_employee:
        raise HTTPException(status_code=409,detail="An employee record already exists for this user")

    employee = Employee(**employee_data.model_dump())

    db.add(employee)
    db.commit()
    db.refresh(employee)

    return employee

# List, search, and filter employees
@router.get("/", response_model=list[EmployeeResponse])
def list_employees(search: str | None = Query(default=None, min_length=1),
    department: str | None = None,designation: str | None = None,
    status: str | None = Query(default=None,pattern="^(ACTIVE|INACTIVE)$",),
    db: Session = Depends(get_db),current_user: User = Depends(HR_ACCESS)):
    
    query = db.query(Employee)

    if search:
        query = query.filter(Employee.full_name.ilike(f"%{search}%"))

    if department:
        query = query.filter(Employee.department.ilike(f"%{department}%"))

    if designation:
        query = query.filter(Employee.designation.ilike(f"%{designation}%"))

    if status:
        query = query.filter(Employee.status == status)

    return query.order_by(Employee.id.desc()).all()

# View one employee
@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int,db: Session = Depends(get_db),current_user: User = Depends(HR_ACCESS)):
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    return employee

# Update employee
@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int,employee_data: EmployeeUpdate,db: Session = Depends(get_db),current_user: User = Depends(HR_ACCESS)):
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    update_data = employee_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400,detail="No update fields provided")

    if any(value is None for value in update_data.values()):
        raise HTTPException(status_code=422,detail="Employee fields cannot be null")

    for field, value in update_data.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)

    return employee

@router.delete("/{employee_id}")
def delete_employee(employee_id: int,db: Session = Depends(get_db),current_user: User = Depends(HR_ACCESS)):

    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    db.delete(employee)
    db.commit()

    return {"message": "Employee deleted successfully",
        "employee_id": employee_id,}
