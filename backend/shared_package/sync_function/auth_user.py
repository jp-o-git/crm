import os
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from shared_package.db.model.users import Users

load_dotenv()

ALGORITHM = os.environ["ALGORITHM"]
SECRET_KEY = os.environ["SECRET_KEY"]
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))

password_hash = PasswordHash.recommended()

# Used to keep response time similar when the email doesn't exist
DUMMY_HASH = password_hash.hash("not-a-real-password")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def authenticate_user(email: str, password: str, db: Session):
    email = email.strip().lower()
    user = (
        db.query(Users)
        .filter(Users.email == email, Users.deleted_at.is_(None))
        .first()
    )

    if not user or not user.hashed_password:
        password_hash.verify(password, DUMMY_HASH)   # burn the same time, ignore result
        return False

    valid, new_hash = password_hash.verify_and_update(password, user.hashed_password)
    if not valid:
        return False
    if not user.is_active:
        return False

    if new_hash:                      # hash parameters were upgraded, so save the new hash
        user.hashed_password = new_hash
        db.commit()

    return user


def _create_token(data: dict, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        **data,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(data: dict) -> str:
    return _create_token(data, "access", timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(data: dict) -> str:
    return _create_token(data, "refresh", timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))


def decode_token(token: str, expected_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    if payload.get("type") != expected_type:
        return None
    return payload