from sqlalchemy import Column,Integer,Enum,String,DateTime,Boolean
from enum import Enum as PyEnum
from datetime import datetime

from app.database import Base

class UserRole(str,PyEnum):
   EMPLOYEE = "EMPLOYEE"
   HR = "HR"
   ADMIN = "ADMIN"

class User(Base):

   __tablename__="users"

   id=Column(Integer,primary_key=True,index=True)
   username=Column(String(50),unique=True,index=True,nullable=False)
   email=Column(String(255),unique=True,index=True,nullable=False)
   hashed_password=Column(String(255),nullable=False)

   role=Column(Enum(UserRole,name="user_role"),default=UserRole.EMPLOYEE,nullable=False)

   is_active = Column(Boolean, default=True, nullable=False)
    
   created_at=Column(DateTime(timezone=True),default=datetime.utcnow)