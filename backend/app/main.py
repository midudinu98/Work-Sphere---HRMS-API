from fastapi import FastAPI
from app.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

import app.models

from app.routers.auth import router as auth_router
from app.routers.employee import router as emp_router
from app.routers.attendance import router as attend_router
from app.routers.leave import router as leave_router
from app.routers.payroll import router as payroll_router
from app.routers.analytics import router as analytics_router
from app.routers.notification import router as notify_router

Base.metadata.create_all(bind=engine)

app=FastAPI(title="WorkSphere-HR Management System ")

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

@app.get("/")
def home():
    return{"message":"API is RUNNING"}

