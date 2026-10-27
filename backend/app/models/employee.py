from sqlalchemy import Column,Integer,String,Date,Numeric,ForeignKey

from app.database import Base

class Employee(Base):
    
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer,ForeignKey("users.id"),unique=True,nullable=False)
    full_name = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    joining_date = Column(Date, nullable=False)
    salary = Column(Numeric(12, 2), nullable=False)
    status = Column(String(10),nullable=False,default="ACTIVE")