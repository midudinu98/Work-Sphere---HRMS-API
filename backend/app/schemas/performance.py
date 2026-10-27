from pydantic import BaseModel, Field,ConfigDict
from datetime import datetime

class PerformanceCreate(BaseModel):
    employee_id: int = Field(gt=0)
    review_period: str = Field(min_length=1, max_length=50)
    rating: int = Field(ge=1, le=5)
    feedback: str = Field(min_length=1)

class PerformanceResponse(BaseModel):
    id: int
    employee_id: int
    review_period: str
    rating: int
    feedback: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
