from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base

class Announcement(Base):
   
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)

    created_by = Column(Integer,ForeignKey("users.id"),nullable=False,index=True)

    created_at = Column(DateTime(timezone=True),nullable=False,server_default=func.now())
