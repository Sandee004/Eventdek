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

from database import get_db
from models import User

router = APIRouter(prefix="/auth", tags=["auth"])
ph = PasswordHasher()
security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("JWT_SECRET", "eventdek-secret-key-change-in-production-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError):
        return False


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_raw: Optional[str] = payload.get("sub")
        if not user_id_raw:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        user_id = str(user_id_raw)
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user



STATE_LOOKUP = {
    "lagos": ["lagos", "ikeja", "lekki", "victoria island", "yaba", "surulere", "ikoyi", "maryland"],
    "abuja": ["abuja", "fct", "maitama", "wuse", "garki", "jabi", "asokoro", "federal capital territory"],
    "rivers": ["rivers", "port harcourt", "phc", "trans amadi", "eleme", "diobu"],
    "oyo": ["oyo", "ibadan", "bodija", "dugbe", "ring road"],
    "enugu": ["enugu", "nsukka", "new haven", "independence layout"],
    "kano": ["kano", "fagge", "dala", "nasarawa"],
    "kaduna": ["kaduna", "zaria", "barnawa"],
    "delta": ["delta", "warri", "asaba"],
    "edo": ["edo", "benin city", "benin", "uromi"],
    "ogun": ["ogun", "abeokuta", "ota", "sagamu"],
    "anambra": ["anambra", "awka", "onitsha", "nnewi"],
    "cross_river": ["cross river", "calabar"],
    "akwa_ibom": ["akwa ibom", "uyo", "eket"],
    "imo": ["imo", "owerri"],
    "abia": ["abia", "aba", "umuahia"],
    "kwara": ["kwara", "ilorin"],
    "osun": ["osun", "osogbo", "ife"],
    "ondo": ["ondo", "akure"],
    "ekiti": ["ekiti", "ado ekiti"],
    "plateau": ["plateau", "jos"],
    "benue": ["benue", "makurdi"],
    "adamawa": ["adamawa", "yola"],
    "bauchi": ["bauchi"],
    "bayelsa": ["bayelsa", "yenagoa"],
    "borno": ["borno", "maiduguri"],
    "ebonyi": ["ebonyi", "abakaliki"],
    "gombe": ["gombe"],
    "jigawa": ["jigawa", "dutse"],
    "katsina": ["katsina"],
    "kebbi": ["kebbi", "birnin kebbi"],
    "kogi": ["kogi", "lokoja"],
    "nasarawa": ["nasarawa", "lafia"],
    "niger": ["niger", "minna"],
    "sokoto": ["sokoto"],
    "taraba": ["taraba", "jalingo"],
    "yobe": ["yobe", "damaturu"],
    "zamfara": ["zamfara", "gusau"],
    "virtual": ["virtual", "online", "webinar", "zoom", "google meet", "livestream", "remote"],
}