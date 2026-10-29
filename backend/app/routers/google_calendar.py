import os
import json
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from cryptography.fernet import Fernet
from google_auth_oauthlib.flow import Flow

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

from app.database import get_db

from app.routers.auth import get_current_user

from app.models.user import User

from app.models.google_calendar import GoogleCalendarConnection,GoogleCalendarOAuthState

from app.schemas.google_calendar import CalendarEventRequest

router = APIRouter(prefix="/calendar/google", tags=["Google Calendar"])

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]

def get_encryption():
    key = os.getenv("GOOGLE_TOKEN_ENCRYPTION_KEY")
    if not key:
        raise HTTPException(status_code=500,detail="Google Calendar encryption key is not configured.")
    try:
        return Fernet(key.encode())
    except Exception:
        raise HTTPException(status_code=500,detail="Google Calendar encryption key is invalid.")

def get_google_flow(state=None):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(status_code=500,detail="Google OAuth environment variables are not configured.")

    client_config = {"web": {"client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [redirect_uri]}}

    flow = Flow.from_client_config(client_config,scopes=SCOPES,state=state)
    flow.redirect_uri = redirect_uri
    
    return flow

@router.get("/connect")
def connect_google_calendar(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    # Remove expired authorization states.
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=10)
    db.query(GoogleCalendarOAuthState).filter(GoogleCalendarOAuthState.created_at < cutoff).delete(synchronize_session=False)

    state = secrets.token_urlsafe(32)

    db.add(GoogleCalendarOAuthState(state=state,user_id=current_user.id))
    db.commit()

    flow = get_google_flow(state=state)
    authorization_url, _ = flow.authorization_url(access_type="offline",include_granted_scopes="true",prompt="consent")

    return {"authorization_url": authorization_url}

@router.get("/callback")
def google_calendar_callback(code: str | None = None,state: str | None = None,error: str | None = None,db: Session = Depends(get_db)):
    
    if error:
        raise HTTPException(status_code=400,detail=f"Google authorization was not completed: {error}")

    if not code or not state:
        raise HTTPException(status_code=400,detail="Missing Google authorization code or state.")

    state_record = (db.query(GoogleCalendarOAuthState).filter(GoogleCalendarOAuthState.state == state).first())

    if not state_record:
        raise HTTPException(status_code=400,detail="Invalid or expired Google authorization state.")

    created_at = state_record.created_at
    if created_at is None:
        db.delete(state_record)
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid authorization state.")

    if created_at.tzinfo is not None:
        created_at = created_at.astimezone(timezone.utc).replace(tzinfo=None)

    if datetime.now(timezone.utc).replace(tzinfo=None) - created_at > timedelta(minutes=10):
        db.delete(state_record)
        db.commit()
        raise HTTPException(status_code=400, detail="Google authorization state expired.")

    user_id = state_record.user_id

    # Consume the state so it cannot be reused.
    db.delete(state_record)
    db.commit()

    try:
        flow = get_google_flow(state=state)
        flow.fetch_token(code=code)
        credentials = flow.credentials

        token_data = json.loads(credentials.to_json())
        encrypted_token = get_encryption().encrypt(json.dumps(token_data).encode()).decode()

        connection = (db.query(GoogleCalendarConnection).filter(GoogleCalendarConnection.user_id == user_id).first())

        if connection:
            connection.encrypted_token_data = encrypted_token
            connection.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        else:
            db.add(GoogleCalendarConnection(user_id=user_id,encrypted_token_data=encrypted_token))

        db.commit()

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400,detail="Google Calendar connection failed. Check OAuth settings and try again.")

    # Redirect to the frontend integration page.
    return RedirectResponse(url="http://localhost:5173/integrations?google_calendar=connected",status_code=303)

@router.get("/status")
def google_calendar_status(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    connection = (db.query(GoogleCalendarConnection).filter(GoogleCalendarConnection.user_id == current_user.id).first())

    return {"connected": connection is not None,"provider": "Google Calendar"}

@router.delete("/disconnect")
def disconnect_google_calendar(db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    connection = (db.query(GoogleCalendarConnection).filter(GoogleCalendarConnection.user_id == current_user.id).first())

    if not connection:
        return {"message": "Google Calendar is already disconnected."}

    db.delete(connection)
    db.commit()

    return {"message": "Google Calendar disconnected successfully."}

@router.post("/events")
def create_google_calendar_event(event_data: CalendarEventRequest,db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    
    connection = (db.query(GoogleCalendarConnection).filter(GoogleCalendarConnection.user_id == current_user.id).first())

    if not connection:
        raise HTTPException(status_code=400,detail="Connect Google Calendar before creating events.")

    start_time = event_data.start_time
    end_time = event_data.end_time

    if start_time.tzinfo is None or end_time.tzinfo is None:
        raise HTTPException(status_code=422,detail="Start and end times must include a timezone offset.")

    if end_time <= start_time:
        raise HTTPException(status_code=422,detail="Event end time must be after start time.")

    try:
        encrypted_data = get_encryption().decrypt(connection.encrypted_token_data.encode())
        token_data = json.loads(encrypted_data)
        credentials = Credentials.from_authorized_user_info(token_data,scopes=SCOPES)

        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())

            updated_token = json.loads(credentials.to_json())
            connection.encrypted_token_data = get_encryption().encrypt(json.dumps(updated_token).encode()).decode()
            db.commit()

        if not credentials.valid:
            raise HTTPException(status_code=401,detail="Google authorization expired. Reconnect Google Calendar.")

        service = build("calendar","v3",credentials=credentials,cache_discovery=False,)

        event = {"summary": event_data.summary,
            "description": event_data.description,
            "start": {"dateTime": start_time.isoformat(),
                "timeZone": event_data.timezone},
            "end": {"dateTime": end_time.isoformat(),
                "timeZone": event_data.timezone}}

        created_event = (service.events().insert(calendarId="primary", body=event).execute())

        return {"message": "Google Calendar event created successfully.",
            "event_id": created_event.get("id"),
            "event_link": created_event.get("htmlLink"),
            "summary": created_event.get("summary")}

    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=502,detail="Could not create the Google Calendar event. Check your connection and try again.")
