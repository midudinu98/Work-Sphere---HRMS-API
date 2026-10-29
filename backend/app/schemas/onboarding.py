from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Literal,Optional

class OnboardingCreate(BaseModel):
    employee_id: int
    task_name: str
    due_date: Optional[date] = None


class OnboardingStatusUpdate(BaseModel):
    status: Literal["PENDING", "COMPLETED"]


class OnboardingResponse(BaseModel):
    id: int
    employee_id: int
    task_name: str
    status: str
    due_date: Optional[date]

    model_config = ConfigDict(from_attributes=True)