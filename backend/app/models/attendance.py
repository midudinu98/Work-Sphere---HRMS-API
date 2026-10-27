from sqlalchemy import Column, Integer, Date, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base

class Attendance(Base):
    
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer,ForeignKey("employees.id"),nullable=False,index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(String,nullable=False,default="PRESENT")
    late_minutes = Column(Integer, nullable=False, default=0)
    early_checkout_minutes = Column(Integer, nullable=False, default=0)
    created_at=Column(DateTime(timezone=True),default=datetime.utcnow)
