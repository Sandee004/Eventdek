from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    state_id: str
    city_area: Optional[str]
    role: Optional[str] = None
    handle: Optional[str] = None
    calendar_sync: bool

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )


class UserRegister(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(UserBase):
    id: UUID
   


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile