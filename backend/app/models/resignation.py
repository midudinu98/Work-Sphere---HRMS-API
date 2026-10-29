from sqlalchemy import Column,Integer,String,DateTime,ForeignKey,CheckConstraint
from sqlalchemy.sql import func

from app.database import Base

class Resignation(Base):
    
    __tablename__ = "resignations"

    __table_args__ = (CheckConstraint("status IN ('PENDING', 'APPROVED', 'REJECTED')",name="check_resignation_status"),
        CheckConstraint("notice_period >= 0",name="check_resignation_notice_period"))

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer,ForeignKey("employees.id"),nullable=False,index=True)
    reason = Column(String, nullable=False)
    notice_period = Column(Integer, nullable=False)
    status = Column(String,nullable=False,default="PENDING",server_default="PENDING")

    created_at = Column(DateTime(timezone=True),nullable=False,server_default=func.now())
