import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import Event, Registration, User, UserSwipe
from routers.auth import get_current_user
from schemas import EventResponse, SwipePayload
import uuid

logger = logging.getLogger("eventdek.deck")
router = APIRouter(prefix="/events", tags=["events"])


@router.get("/deck", response_model=List[EventResponse])
async def get_deck(
    state_id: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(15, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches the next batch of unswiped upcoming events for the user's state.
    """
    target_state = (state_id or current_user.state_id or "lagos").strip().lower()
    current_user_id_str = str(current_user.id)

    # 2. Buffer time by 24 hours so today's scraped events are not excluded
    time_buffer = datetime.now(timezone.utc) - timedelta(days=1)

    # 3. Subquery: Swiped event IDs by current user
    swiped_ids_subquery = (
        select(UserSwipe.event_id)
        .where(UserSwipe.user_id == current_user_id_str)
        .scalar_subquery()
    )

    # 4. Build Deck Query
    query = (
        select(Event)
        .where(
            Event.is_active.is_(True),
            func.lower(Event.state_id) == target_state,
            Event.start_time >= time_buffer,
            ~Event.id.in_(swiped_ids_subquery),
        )
        .order_by(Event.start_time.asc())
        .limit(limit)
    )

    if category:
        query = query.where(func.lower(Event.category) == category.strip().lower())

    result = await db.execute(query)
    events = result.scalars().all()

    # Fallback: If no events found for current state, return active virtual events
    if not events and target_state != "virtual":
        fallback_query = (
            select(Event)
            .where(
                Event.is_active.is_(True),
                func.lower(Event.state_id) == "virtual",
                Event.start_time >= time_buffer,
                ~Event.id.in_(swiped_ids_subquery),
            )
            .order_by(Event.start_time.asc())
            .limit(limit)
        )
        fallback_res = await db.execute(fallback_query)
        events = fallback_res.scalars().all()

    return events


@router.post("/swipe", status_code=status.HTTP_200_OK)
async def record_swipe(
    payload: SwipePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Records a user's swipe (pass or rsvp).
    Freezes an immutable Registration snapshot when swiping right on free events.
    """
    direction_clean = payload.direction.lower().strip()
    if direction_clean not in ("left", "right"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direction must be 'left' or 'right'",
        )

    current_user_id_str = str(current_user.id)

    # 1. Fetch Event to validate existence and pull snapshot data
    event_res = await db.execute(select(Event).where(Event.id == payload.event_id))
    event = event_res.scalars().first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # 2. Record or Update UserSwipe using setattr
    existing_query = select(UserSwipe).where(
        UserSwipe.user_id == current_user_id_str,
        UserSwipe.event_id == payload.event_id,
    )
    res = await db.execute(existing_query)
    existing_swipe = res.scalars().first()

    if existing_swipe:
        setattr(existing_swipe, "direction", direction_clean)
    else:
        new_swipe = UserSwipe(
            id=str(uuid.uuid4()),
            user_id=current_user_id_str,
            event_id=payload.event_id,
            direction=direction_clean,
        )
        db.add(new_swipe)

        is_free_event = bool(getattr(event, "is_free", True))

        registration_created = False
        if direction_clean == "right" and is_free_event:
            existing_reg_res = await db.execute(
                select(Registration).where(
                    Registration.user_id == current_user_id_str,
                    Registration.event_id == payload.event_id,
                )
            )
            if not existing_reg_res.scalars().first():
                new_reg = Registration(
                    id=str(uuid.uuid4()),
                    user_id=current_user_id_str,
                    event_id=event.id,
                    event_title=event.title,
                    event_banner_url=event.banner_url,
                    event_venue_name=event.venue_name,
                    event_start_time=event.start_time,
                    event_end_time=event.end_time,
                    event_source_url=event.source_url,
                    qr_code_token=str(uuid.uuid4()),
                    registration_status="confirmed",
                )
                db.add(new_reg)
                registration_created = True
                
    await db.commit()

    return {
        "status": "ok",
        "event_id": payload.event_id,
        "direction": direction_clean,
        "registered": registration_created,
    }