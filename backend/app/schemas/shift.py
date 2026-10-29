from pydantic import BaseModel, ConfigDict, Field
from datetime import time

class ShiftCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    start_time: time
    end_time: time

class ShiftResponse(BaseModel):
    id: int
    name: str
    start_time: time
    end_time: time

    model_config = ConfigDict(from_attributes=True)

class EmployeeShiftCreate(BaseModel):
    employee_id: int = Field(gt=0)
    shift_id: int = Field(gt=0)

class EmployeeShiftResponse(BaseModel):
    id: int
    employee_id: int
    shift_id: int
    shift: ShiftResponse

    model_config = ConfigDict(from_attributes=True)

