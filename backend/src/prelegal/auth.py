import sqlite3

from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr, Field

from .config import Settings
from .db import get_db
from .security import create_token, decode_token, hash_password, verify_password


router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: str


def _settings(request: Request) -> Settings:
    return request.app.state.settings


def _set_auth_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_expiry_hours * 3600,
    )


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, response: Response, request: Request) -> UserResponse:
    settings = _settings(request)
    pwd_hash = hash_password(body.password)
    with get_db(settings.db_path) as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (body.email.lower(), pwd_hash),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=409, detail="email already registered")
        row = conn.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?",
            (cur.lastrowid,),
        ).fetchone()
    token = create_token(row["id"], settings)
    _set_auth_cookie(response, token, settings)
    return UserResponse(id=row["id"], email=row["email"], created_at=row["created_at"])


@router.post("/signin", response_model=UserResponse)
def signin(body: SigninRequest, response: Response, request: Request) -> UserResponse:
    settings = _settings(request)
    with get_db(settings.db_path) as conn:
        row = conn.execute(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
            (body.email.lower(),),
        ).fetchone()
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="invalid email or password")
    token = create_token(row["id"], settings)
    _set_auth_cookie(response, token, settings)
    return UserResponse(id=row["id"], email=row["email"], created_at=row["created_at"])


@router.post("/signout")
def signout(response: Response, request: Request) -> dict:
    settings = _settings(request)
    response.delete_cookie(settings.auth_cookie_name)
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
def me(request: Request) -> UserResponse:
    settings = _settings(request)
    token = request.cookies.get(settings.auth_cookie_name)
    if not token:
        raise HTTPException(status_code=401, detail="not authenticated")
    payload = decode_token(token, settings)
    if payload is None:
        raise HTTPException(status_code=401, detail="invalid or expired token")
    try:
        user_id = int(payload["sub"])
    except (KeyError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="invalid token payload")
    with get_db(settings.db_path) as conn:
        row = conn.execute(
            "SELECT id, email, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=401, detail="user not found")
    return UserResponse(id=row["id"], email=row["email"], created_at=row["created_at"])
