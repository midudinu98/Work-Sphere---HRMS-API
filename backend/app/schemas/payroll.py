from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional

class PayrollCreate(BaseModel):
    employee_id: int = Field(gt=0)
    basic_salary: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    allowances: Decimal = Field(default=Decimal("0.00"),ge=0, max_digits=10, decimal_places=2)
    deductions: Decimal = Field(default=Decimal("0.00"),ge=0, max_digits=10, decimal_places=2)
    bonus: Decimal = Field(default=Decimal("0.00"),ge=0, max_digits=10, decimal_places=2)
    month: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")

class PayrollResponse(BaseModel):
    id: int
    employee_id: int
    basic_salary: Decimal
    allowances: Decimal
    deductions: Decimal
    bonus: Decimal
    net_salary: Decimal
    month: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
