from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

class Task(Base):
   
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    assigned_to = Column(Integer,ForeignKey("users.id"),nullable=False,index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=False)
    status = Column(String(20),nullable=False,default="PENDING")

    assigned_employee = relationship("User")
