from pydantic import BaseModel, ConfigDict, Field
from datetime import date

from typing import Optional, Literal

TaskStatus = Literal["PENDING", "COMPLETED"]

class TaskCreate(BaseModel):
    assigned_to: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    due_date: date

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class TaskResponse(BaseModel):
    id: int
    assigned_to: int
    title: str
    description: Optional[str] = None
    due_date: date
    status: TaskStatus

    model_config = ConfigDict(from_attributes=True)
