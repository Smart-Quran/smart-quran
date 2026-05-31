from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, field_validator
import uuid

from database import get_db
from models.user import User
from services.telegram_auth import validate_telegram_init_data
from services.jwt_service import create_access_token
from middleware.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


class TelegramLoginRequest(BaseModel):
    init_data: str

    @field_validator("init_data")
    @classmethod
    def validate_init_data(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("init_data is required")
        if len(v) > 4096:
            raise ValueError("init_data too long")
        return v.strip()


class AuthResponse(BaseModel):
    user: dict
    token: str


@router.post("/telegram", response_model=AuthResponse)
@limiter.limit("20/minute")
async def telegram_login(
    request: Request,
    body: TelegramLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        tg_user = validate_telegram_init_data(body.init_data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    user_id = int(tg_user["id"])

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            id=user_id,
            first_name=tg_user.get("first_name", "")[:128],
            last_name=(tg_user.get("last_name") or "")[:128] or None,
            username=(tg_user.get("username") or "")[:128] or None,
            photo_url=(tg_user.get("photo_url") or "")[:512] or None,
            language_code=(tg_user.get("language_code") or "")[:10] or None,
            is_guest=False,
        )
        db.add(user)
    else:
        user.first_name = tg_user.get("first_name", user.first_name)[:128]
        user.last_name = (tg_user.get("last_name") or "")[:128] or None
        user.username = (tg_user.get("username") or "")[:128] or None

    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, is_guest=False)
    return {
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "photo_url": user.photo_url,
        },
        "token": token,
    }


@router.post("/guest", response_model=AuthResponse)
@limiter.limit("10/minute")
async def guest_login(request: Request, db: AsyncSession = Depends(get_db)):
    """Create an anonymous guest session."""
    guest_id = -abs(hash(str(uuid.uuid4()))) % (10**15)

    user = User(id=guest_id, first_name="Guest", is_guest=True)
    db.add(user)
    await db.commit()

    token = create_access_token(guest_id, is_guest=True)
    return {
        "user": {
            "id": guest_id,
            "first_name": "Guest",
            "last_name": None,
            "username": None,
            "photo_url": None,
        },
        "token": token,
    }
