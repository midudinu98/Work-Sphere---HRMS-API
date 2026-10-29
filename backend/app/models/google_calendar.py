from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from datetime import datetime

from app.database import Base

class GoogleCalendarConnection(Base):
    
    __tablename__ = "google_calendar_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer,ForeignKey("users.id"),unique=True,nullable=False,index=True)
    encrypted_token_data = Column(String, nullable=False)
    created_at=Column(DateTime(timezone=True),default=datetime.utcnow)
    updated_at = Column(DateTime,server_default=func.now(),onupdate=func.now())

class GoogleCalendarOAuthState(Base):
    
    __tablename__ = "google_calendar_oauth_states"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String(128), unique=True, nullable=False, index=True)
    user_id = Column(Integer,ForeignKey("users.id"),nullable=False)
    created_at=Column(DateTime(timezone=True),default=datetime.utcnow)
