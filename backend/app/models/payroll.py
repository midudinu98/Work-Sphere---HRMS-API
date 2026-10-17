from sqlalchemy import Column, Integer, ForeignKey, Numeric, String, DateTime
from sqlalchemy.sql import func
from datetime import datetime

from app.database import Base

class Payroll(Base):
    
    __tablename__ = "payroll"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer,ForeignKey("employees.id"),nullable=False,index=True)
    basic_salary = Column(Numeric(10, 2), nullable=False)
    deductions = Column(Numeric(10, 2), default=0, nullable=False)
    bonus = Column(Numeric(10, 2), default=0, nullable=False)
    net_salary = Column(Numeric(10, 2), nullable=False)
    month = Column(String(7), nullable=False, index=True)

    created_at=Column(DateTime(timezone=True),default=datetime.utcnow)