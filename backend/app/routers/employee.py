from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.employee import Employee
from app.models.user import User, UserRole

from app.schemas.employee import EmployeeCreate,EmployeeUpdate,EmployeeResponse

from app.routers.auth import require_role, get_current_user

from app.models.attendance import Attendance
from app.models.performance import Performance

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
    department: str | None = None,
    designation: str | None = None,
    role: UserRole | None = None,
    status: str | None = Query(default=None,pattern="^(ACTIVE|INACTIVE)$"),
    attendance: str | None = Query(default=None,pattern="^(PRESENT|ABSENT|HALF_DAY)$"),
    performance: int | None = Query(default=None,ge=1,le=5),
    db: Session = Depends(get_db),
    current_user: User = Depends(HR_ACCESS)):
    
    query = db.query(Employee)

    # Search employee name
    if search:
        query = query.filter(Employee.full_name.ilike(f"%{search.strip()}%"))

    # Filter department
    if department:
        query = query.filter(Employee.department.ilike(f"%{department.strip()}%"))

    # Filter designation
    if designation:
        query = query.filter(Employee.designation.ilike(f"%{designation.strip()}%"))

    # Filter by linked user role
    if role:
        query = query.filter(Employee.user_id.in_(db.query(User.id).filter(User.role == role)))

    # Filter by employee status
    if status:
        query = query.filter(Employee.status == status)

    # Filter by attendance status
    if attendance:
        query = query.filter(Employee.id.in_(db.query(Attendance.employee_id).filter(Attendance.status == attendance)))

    # Filter by performance rating
    if performance is not None:
           query = query.filter(Employee.id.in_(db.query(Performance.employee_id).filter(Performance.rating == performance)))    

    return query.order_by(Employee.id.desc()).all()

# View one employee: HR/Admin can view anyone; employees can view only themselves
@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")
    
    # HR and ADMIN can view any employee
    if current_user.role not in [UserRole.HR, UserRole.ADMIN]:
    # EMPLOYEE can view only their own record
        if employee.user_id != current_user.id:
            raise HTTPException(status_code=403,detail="You do not have permission to view this employee")

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

    return {"message": "Employee deleted successfully","employee_id": employee_id,}
