from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint

from app.database import Base

class LeaveBalance(Base):

    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer,ForeignKey("employees.id"),nullable=False,index=True)
    leave_type = Column(String, nullable=False)
    remaining_days = Column(Integer,nullable=False,default=0)

    __table_args__ = (UniqueConstraint("employee_id","leave_type",name="uq_employee_leave_type"),)