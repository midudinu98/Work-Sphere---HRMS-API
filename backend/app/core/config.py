import os
import secrets

SECRET_KEY = os.getenv("WORKSPHERE_SECRET_KEY")

if not SECRET_KEY:
    SECRET_KEY = secrets.token_urlsafe(32)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
