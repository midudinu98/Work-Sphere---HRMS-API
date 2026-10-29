from sqlalchemy import Column, Integer, Boolean, ForeignKey
from app.database import Base

class NotificationPreference(Base):
    
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer,ForeignKey("users.id"),unique=True,nullable=False,index=True)
    email_notifications = Column(Boolean,default=True,nullable=False)
    attendance_notifications = Column(Boolean,default=True,nullable=False)
    leave_notifications = Column(Boolean,default=True,nullable=False)
    payroll_notifications = Column(Boolean,default=True,nullable=False)
