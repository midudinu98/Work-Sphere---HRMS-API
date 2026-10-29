from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.user import User, UserRole

from app.routers.auth import get_current_user

from app.core.email_service import send_email

router = APIRouter(prefix="/email", tags=["Email Integration"])

class TestEmailRequest(BaseModel):
    recipient: str = Field(min_length=5, max_length=254)
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)

@router.post("/test")
async def send_test_email(email_data: TestEmailRequest,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    if current_user.role not in [UserRole.HR, UserRole.ADMIN]:
        raise HTTPException(status_code=403,detail="Only HR and Admin can send test emails")

    try:
        await send_email(recipient=email_data.recipient,subject=email_data.subject,body=email_data.message)
    except Exception:
        raise HTTPException(status_code=503,detail="Email delivery failed. Check SMTP configuration.")

    return {"message": "Test email sent successfully",
        "recipient": email_data.recipient}
