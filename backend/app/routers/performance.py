from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.performance import Performance
from app.models.employee import Employee

from app.schemas.performance import PerformanceCreate,PerformanceResponse

from app.routers.auth import get_current_user

router = APIRouter(prefix="/performance",tags=["Performance Management"])

@router.post("/", response_model=PerformanceResponse, status_code=201)
def create_performance_review(review: PerformanceCreate,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    employee = db.query(Employee).filter(Employee.id == review.employee_id).first()

    if not employee:
        raise HTTPException(status_code=404,detail="Employee not found")

    new_review = Performance(employee_id=review.employee_id,review_period=review.review_period.strip(),rating=review.rating,feedback=review.feedback.strip())

    if not new_review.review_period or not new_review.feedback:
        raise HTTPException(status_code=400,detail="Review period and feedback cannot be empty")

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review

@router.get("/", response_model=list[PerformanceResponse])
def get_performance_reviews(employee_id: int | None = None,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    query = db.query(Performance)

    if employee_id is not None:
        query = query.filter(Performance.employee_id == employee_id)

    return query.order_by(Performance.created_at.desc()).all()

@router.get("/{review_id}", response_model=PerformanceResponse)
def get_performance_review(review_id: int,db: Session = Depends(get_db),current_user=Depends(get_current_user)):
    
    review = db.query(Performance).filter(Performance.id == review_id).first()

    if not review:
        raise HTTPException(status_code=404,detail="Performance review not found")

    return review
