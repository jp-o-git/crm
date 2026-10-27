import hashlib
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette import status

from shared_package.db.get_session import get_session
from shared_package.db.model.refresh_token import RefreshTokens
from shared_package.db.model.signup_verification import SignupVerifications
from shared_package.db.model.users import Users
from shared_package.sync_function.email_services import (
    EMAIL_VERIFY_EXPIRE_MINUTES,
    send_signup_email,
)
from shared_package.sync_function.auth_user import (
    REFRESH_TOKEN_EXPIRE_DAYS,
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
)
from shared_package.sync_function.token_cleanup import delete_stale_tokens
from .models import (
    SignupCompleteRequest,
    SignupStartRequest,
    SignupTokenRequest,
    Token,
)
from shared_package.sync_function.auth_dep import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

db_dependency = Annotated[Session, Depends(get_session)]

REFRESH_COOKIE = "refresh_token"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true").lower() == "true"
SIGNUP_RESEND_COOLDOWN_SECONDS = 60


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()

def ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)

def _issue_tokens(user: Users, db: Session, response: Response, family_id: str | None = None) -> str:
    family_id = family_id or str(uuid.uuid4())

    access = create_access_token({"sub": str(user.user_id)})
    refresh = create_refresh_token({"sub": str(user.user_id), "fam": family_id})

    claims = decode_token(refresh, expected_type="refresh")
    db.add(RefreshTokens(
        user_id=user.user_id,
        jti_hash=_hash(claims["jti"]),
        family_id=family_id,
        expires_at=datetime.fromtimestamp(claims["exp"], tz=timezone.utc),
    ))
    db.commit()

    response.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/auth",
    )
    return access

def _get_valid_signup(db: Session, token: str) -> SignupVerifications:
    row = db.query(SignupVerifications).filter_by(token_hash=_hash(token)).first()
    if (
            not row
            or row.used_at is not None
            or ensure_utc(row.expires_at) < datetime.now(timezone.utc)
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired link")
    return row

# ---------------------------------------------------------------- signup

@router.post("/signup/start", status_code=status.HTTP_202_ACCEPTED)
def signup_start(req: SignupStartRequest, db: db_dependency, background_tasks: BackgroundTasks):
    """Step 1: user enters an email. We email a link. No account is created yet."""
    email = req.email.strip().lower()
    now = datetime.now(timezone.utc)

    already_registered = (
        db.query(Users)
        .filter(Users.email == email, Users.deleted_at.is_(None))
        .first()
    )

    if not already_registered:
        latest = (
            db.query(SignupVerifications)
            .filter_by(email=email)
            .order_by(SignupVerifications.created_at.desc())
            .first()
        )
        too_soon = (
                latest is not None
                and (
                        now - ensure_utc(latest.created_at)
                ).total_seconds() < SIGNUP_RESEND_COOLDOWN_SECONDS
        )
        if not too_soon:
            # only one live link per email
            db.query(SignupVerifications).filter(
                SignupVerifications.email == email,
                SignupVerifications.used_at.is_(None),
            ).delete()

            raw = secrets.token_urlsafe(32)
            db.add(SignupVerifications(
                email=email,
                token_hash=_hash(raw),
                expires_at=now + timedelta(minutes=EMAIL_VERIFY_EXPIRE_MINUTES),
            ))
            db.commit()
            background_tasks.add_task(send_signup_email, email, raw)

    # identical answer whether or not the email is registered, so attackers can't probe accounts
    return {"message": "If this email can be used, a link to finish signing up has been sent."}

@router.get("/me")
def me(user: Annotated[Users, Depends(get_current_user)]):
    return {
        "user_id": str(user.user_id),
        "email": user.email,
        "full_name": user.full_name,
        # "staff_type": user.staff_type,
    }

@router.post("/signup/check")
def signup_check(req: SignupTokenRequest, db: db_dependency):
    """Step 2: React opens the link and asks if the token is still valid."""
    row = _get_valid_signup(db, req.token)
    return {"email": row.email}


@router.post("/signup/complete", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup_complete(req: SignupCompleteRequest, db: db_dependency, response: Response):
    """Step 3: user sets name and password. The account is created already verified."""
    now = datetime.now(timezone.utc)

    row = (
        db.query(SignupVerifications)
        .filter_by(token_hash=_hash(req.token))
        .with_for_update()          # lock the row so a double submit can't create two accounts
        .first()
    )
    if (
        not row
        or row.used_at is not None
        or ensure_utc(row.expires_at) < now
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired link")

    user = Users(
        email=row.email,
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        email_verified_at=now,
    )
    db.add(user)
    row.used_at = now
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    access = _issue_tokens(user, db, response)   # signed in right after signup
    return {"access_token": access, "token_type": "bearer"}


# ---------------------------------------------------------------- session

@router.post("/token", response_model=Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
          db: db_dependency, response: Response):
    user = authenticate_user(form_data.username, form_data.password, db)  # username field carries the email
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if user.email_verified_at is None:      # safety net, e.g. staff accounts created by hand
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Email not verified")
    access = _issue_tokens(user, db, response)
    return {"access_token": access, "token_type": "bearer"}



@router.post("/refresh", response_model=Token)
def refresh(
    db: db_dependency,
    response: Response,
    refresh_token: Annotated[
        str | None,
        Cookie(alias=REFRESH_COOKIE),
    ] = None,
):
    print("[refresh] Cookie received:", refresh_token is not None)

    claims = (
        decode_token(refresh_token, expected_type="refresh")
        if refresh_token
        else None
    )

    print("[refresh] Token decoded:", claims is not None)

    if not claims:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid refresh token",
        )

    jti = claims.get("jti")
    if not jti:
        print("[refresh] Missing jti claim")
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid refresh token",
        )

    row = (
        db.query(RefreshTokens)
        .filter_by(jti_hash=_hash(jti))
        .with_for_update()  # lock the row so a second request waits until the first commits
        .first()
    )

    print("[refresh] Database record found:", row is not None)

    if not row:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid refresh token",
        )

    print("[refresh] Token revoked:", row.revoked)

    if row.revoked:
        db.query(RefreshTokens).filter_by(
            family_id=row.family_id
        ).update({"revoked": True})
        db.commit()

        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Refresh token reuse detected",
        )

    user = db.get(Users, row.user_id)

    print("[refresh] User found:", user is not None)

    if (
        not user
        or not user.is_active
        or user.deleted_at is not None
        or user.email_verified_at is None
    ):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid refresh token",
        )

    row.revoked = True
    db.commit()
    delete_stale_tokens(db, user.user_id)
    db.commit()

    access = _issue_tokens(
        user,
        db,
        response,
        family_id=row.family_id,
    )

    print("[refresh] Rotation successful")
    return {
        "access_token": access,
        "token_type": "bearer",
    }



@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(db: db_dependency, response: Response,
           refresh_token: Annotated[str | None, Cookie(alias=REFRESH_COOKIE)] = None):
    claims = decode_token(refresh_token, expected_type="refresh") if refresh_token else None
    if claims:
        row = db.query(RefreshTokens).filter_by(jti_hash=_hash(claims["jti"])).first()
        if row:
            db.query(RefreshTokens).filter_by(family_id=row.family_id).delete()
            db.commit()

    response.delete_cookie(REFRESH_COOKIE, path="/auth")