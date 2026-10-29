from pydantic import BaseModel, Field, ConfigDict

from datetime import datetime

class FeedbackCreate(BaseModel):
    message: str = Field(...,min_length=3,max_length=5000)
    rating: int = Field(...,ge=1,le=5)

class FeedbackResponse(BaseModel):
    id: int
    employee_id: int
    message: str
    rating: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)