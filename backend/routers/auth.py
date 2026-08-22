import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
import jwt

from core.database import get_db
from utils import hash_password, verify_password, create_access_token, get_current_user
from models import User
from schemas import AuthResponse, UserLogin, UserProfile, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    email_clean = data.email.lower().strip()

    existing = await db.execute(select(User).where(User.email == email_clean))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    hashed_pw = hash_password(data.password)

    new_user = User(
        id=str(uuid.uuid4()),
        name=data.name.strip(),
        email=email_clean,
        hashed_password=hashed_pw,
        phone=data.phone.strip(),
        state_id=data.state_id,
        city_area=data.city_area.strip() if data.city_area else None,
        role=data.role.strip() if data.role else None,
        handle=data.handle.strip().lstrip("@") if data.handle else None,
        calendar_sync=data.calendar_sync,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token(str(new_user.id))
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile.model_validate(new_user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    email_clean = data.email.lower().strip()

    result = await db.execute(select(User).where(User.email == email_clean))
    user = result.scalars().first()

    if not user or not verify_password(data.password, str(user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(str(user.id))
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfile.model_validate(user),
    )


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserProfile.model_validate(current_user)
    