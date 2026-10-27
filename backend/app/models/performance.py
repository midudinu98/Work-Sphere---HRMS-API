from sqlalchemy import Column, Integer, ForeignKey, Numeric, String, DateTime,Text
from datetime import datetime

from app.database import Base

class Performance(Base):
    
    __tablename__ = "performance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer,ForeignKey("employees.id"),nullable=False,index=True)
    review_period = Column(String(50), nullable=False)
    rating = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True),default=datetime.utcnow,nullable=False)
