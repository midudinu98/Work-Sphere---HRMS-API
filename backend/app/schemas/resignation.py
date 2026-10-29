from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

from datetime import datetime

class ResignationCreate(BaseModel):
    reason: str = Field(...,min_length=1,max_length=2000)
    notice_period: int = Field(...,ge=0,le=365)

class ResignationDecision(BaseModel):
    status: Literal["APPROVED", "REJECTED"]

class ResignationResponse(BaseModel):
    id: int
    employee_id: int
    reason: str
    notice_period: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
