from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from datetime import datetime

from app.database import Base

class Feedback(Base):
    
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer,ForeignKey("employees.id"),nullable=False,index=True)
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)
    created_at = Column(DateTime,default=datetime.utcnow,nullable=False)

    employee = relationship("Employee")
