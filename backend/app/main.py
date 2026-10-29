from fastapi import FastAPI
from app.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.attendance_scheduler import start_attendance_scheduler,stop_attendance_scheduler

import app.models

from app.routers.auth import router as auth_router
from app.routers.employee import router as emp_router
from app.routers.attendance import router as attend_router
from app.routers.leave import router as leave_router
from app.routers.payroll import router as payroll_router
from app.routers.analytics import router as analytics_router
from app.routers.notification import router as notify_router
from app.routers.leave_policy import router as leave_policy
from app.routers.admin_users import router as admin_users
from app.routers.shift import router as shift_router
from app.routers.documents import router as documents_router
from app.routers.performance import router as performance_router
from app.routers.onboarding import router as onboarding_router
from app.routers.resignation import router as resignation_router
from app.routers.announcement import router as announce_router
from app.routers.tasks import router as tasks_router
from app.routers.exports import router as exports_router
from app.routers.email import router as email_router
from app.routers.google_calendar import router as google_calendar
from app.routers.feedback import router as feedback
from app.routers.profile_settings import router as profile_settings

Base.metadata.create_all(bind=engine)

app=FastAPI(title="WorkSphere-HR Management System ")

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_attendance_scheduler()
    try:
        yield
    finally:
        stop_attendance_scheduler()

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"])

app.include_router(auth_router)
app.include_router(emp_router)
app.include_router(attend_router)
app.include_router(leave_router)
app.include_router(payroll_router)
app.include_router(analytics_router)
app.include_router(notify_router)
app.include_router(leave_policy)
app.include_router(admin_users)
app.include_router(shift_router)
app.include_router(documents_router)
app.include_router(performance_router)
app.include_router(onboarding_router)
app.include_router(resignation_router)
app.include_router(announce_router)
app.include_router(tasks_router)
app.include_router(exports_router)
app.include_router(email_router)
app.include_router(google_calendar)
app.include_router(feedback)
app.include_router(profile_settings)

@app.get("/")
def home():
    return{"message":"API is RUNNING"}

