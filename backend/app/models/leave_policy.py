from sqlalchemy import Column, Integer, String

from app.database import Base

class LeavePolicy(Base):

    __tablename__ = "leave_policies"

    id = Column(Integer, primary_key=True, index=True)
    leave_type = Column(String, unique=True, nullable=False, index=True)
    total_days_allowed = Column(Integer, nullable=False)
