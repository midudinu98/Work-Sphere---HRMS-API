from datetime import datetime
from pydantic import BaseModel, Field

class CalendarEventRequest(BaseModel):
    summary: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    start_time: datetime
    end_time: datetime
    timezone: str = "Asia/Kolkata"
