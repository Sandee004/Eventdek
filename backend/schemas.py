from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr


# --- User & Auth Schemas ---

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    state_id: str
    city_area: Optional[str] = None
    role: Optional[str] = None
    handle: Optional[str] = None
    calendar_sync: bool = True

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
    id: str
    created_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


# --- Event & Deck Schemas ---

class ExtraQuestion(BaseModel):
    id: str
    label: str
    placeholder: Optional[str] = None
    type: str = "text"
    options: Optional[List[str]] = None
    required: bool = True


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
    currency: str = "NGN"
    source_platform: str
    source_url: Optional[str] = None
    requires_custom_fields: bool = False
    custom_fields_schema: List[ExtraQuestion] = []
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


# --- Swipe & Interaction Schemas ---

class SwipePayload(BaseModel):
    event_id: str
    direction: str  # "left" or "right"
    custom_answers: Optional[Dict[str, Any]] = None  # e.g., {"github": "octocat", "tshirt_size": "L"}


class SwipeResponse(BaseModel):
    status: str
    event_id: str
    direction: str
    registered: bool = False


# --- Registration & Ticket Pass Snapshot Schemas ---

class RegistrationResponse(BaseModel):
    id: str
    user_id: str
    event_id: Optional[str] = None
    ticket_tier: str = "free"
    amount_paid: float = 0.0
    currency: str = "NGN"
    payment_reference: Optional[str] = None
    qr_code_token: str
    checked_in: bool = False
    checked_in_at: Optional[datetime] = None
    registration_status: str = "confirmed"
    
    # Frozen Event Metadata (Self-contained ticket pass)
    event_title: Optional[str] = None
    event_banner_url: Optional[str] = None
    event_venue_name: Optional[str] = None
    event_start_time: Optional[datetime] = None
    event_end_time: Optional[datetime] = None
    event_source_url: Optional[str] = None
    custom_answers: Dict[str, Any] = {}
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)