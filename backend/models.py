import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    state_id = Column(String(50), nullable=False, index=True)
    city_area = Column(String(100), nullable=True)
    role = Column(String(100), nullable=True)
    handle = Column(String(100), nullable=True)
    calendar_sync = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    banner_url = Column(String(500), nullable=True)
    venue_name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    state_id = Column(String(50), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False)
    category = Column(String(50), default="tech")
    is_free = Column(Boolean, default=True)
    price_ngn = Column(Numeric(10, 2), default=0.0)
    currency = Column(String(10), default="NGN")
    source_platform = Column(String(50), default="native")
    source_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    requires_custom_fields = Column(Boolean, default=False)
    custom_fields_schema = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class UserSwipe(Base):
    __tablename__ = "user_swipes"
    __table_args__ = (UniqueConstraint("user_id", "event_id", name="uq_user_event_swipe"),)

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    direction = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Registration(Base):
    __tablename__ = "registrations"
    __table_args__ = (UniqueConstraint("user_id", "event_id", name="uq_user_event_registration"),)

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="SET NULL"), nullable=True, index=True)

    # Ticket & Payment Snapshot
    ticket_tier = Column(String(50), default="free")
    amount_paid = Column(Numeric(10, 2), default=0.0)
    currency = Column(String(10), default="NGN")
    payment_reference = Column(String(100), nullable=True)

    # Pass & Check-in Details
    qr_code_token = Column(String(255), unique=True, nullable=False)
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime(timezone=True), nullable=True)
    registration_status = Column(String(50), default="confirmed")

    # Event Snapshot Fields (Frozen Receipt Data)
    event_title = Column(String(255), nullable=True)
    event_banner_url = Column(Text, nullable=True)
    event_venue_name = Column(String(255), nullable=True)
    event_start_time = Column(DateTime(timezone=True), nullable=True)
    event_end_time = Column(DateTime(timezone=True), nullable=True)
    event_source_url = Column(Text, nullable=True)
    custom_answers = Column(JSON, default=dict)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))