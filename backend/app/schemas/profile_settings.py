from pydantic import BaseModel, ConfigDict, EmailStr, Field

class ProfileUpdate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr

class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

class NotificationPreferenceUpdate(BaseModel):
    email_notifications: bool = True
    attendance_notifications: bool = True
    leave_notifications: bool = True
    payroll_notifications: bool = True

class NotificationPreferenceResponse(BaseModel):
    id: int
    user_id: int
    email_notifications: bool
    attendance_notifications: bool
    leave_notifications: bool
    payroll_notifications: bool

    model_config = ConfigDict(from_attributes=True)
