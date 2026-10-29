from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.feedback import Feedback
from app.models.employee import Employee
from app.models.user import UserRole

from app.schemas.feedback import FeedbackCreate, FeedbackResponse

from app.routers.auth import get_current_user

router = APIRouter(prefix="/feedback",tags=["Feedback"])

def require_hr_or_admin(current_user):
    
    role = getattr(current_user.role, "value", current_user.role)

    if role not in (UserRole.HR.value, UserRole.ADMIN.value):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only HR or Admin can view employee feedback.")

@router.post("/",response_model=FeedbackResponse,status_code=status.HTTP_201_CREATED)
def submit_feedback(feedback_data: FeedbackCreate,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    employee = (db.query(Employee).filter(Employee.user_id == current_user.id).first())

    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Employee profile not found.")

    message = feedback_data.message.strip()

    if not message:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,detail="Feedback message cannot be empty.")

    feedback = Feedback(employee_id=employee.id,message=message,rating=feedback_data.rating)

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return feedback

@router.get("/",response_model=list[FeedbackResponse])
def get_feedback(db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    require_hr_or_admin(current_user)

    return (db.query(Feedback).order_by(Feedback.created_at.desc(),Feedback.id.desc()).all())
