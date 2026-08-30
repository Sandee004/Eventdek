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




from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EventResponse(BaseModel):
    id: str
    title: str
    description: str
    banner_url: Optional[str] = None
    venue_name: str
    address: Optional[str] = None
    state_id: str
    city_area: Optional[str] = None
    start_time: datetime
    end_time: datetime
    category: str
    is_free: bool
    price_ngn: float
    source_platform: str
    source_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SwipePayload(BaseModel):
    event_id: str
    direction: str