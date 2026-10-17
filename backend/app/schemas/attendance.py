from pydantic import BaseModel, ConfigDict

from datetime import date, datetime
from typing import Literal

AttendanceStatus = Literal["PRESENT", "ABSENT", "HALF_DAY"]

class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    check_in: datetime | None = None
    check_out: datetime | None = None
    date: date
    status: AttendanceStatus
    working_hours: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class AttendanceHistoryResponse(BaseModel):
    records: list[AttendanceResponse]
    total: int
