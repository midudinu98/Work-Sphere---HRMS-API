from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from decimal import Decimal
from typing import Literal

class EmployeeBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    designation: str = Field(min_length=2, max_length=100)
    department: str = Field(min_length=2, max_length=100)
    joining_date: date
    salary: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"

class EmployeeCreate(EmployeeBase):
    user_id: int = Field(gt=0)

class EmployeeUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    designation: str | None = Field(default=None, min_length=2, max_length=100)
    department: str | None = Field(default=None, min_length=2, max_length=100)
    joining_date: date | None = None
    salary: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    status: Literal["ACTIVE", "INACTIVE"] | None = None

class EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
