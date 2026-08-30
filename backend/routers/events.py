import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import Event, User, UserSwipe
from routers.auth import get_current_user
from schemas import EventResponse, SwipePayload

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
    target_state = state_id or current_user.state_id
    now = datetime.now(timezone.utc)

    # Subquery: get all event IDs swiped by this user
    swiped_ids_subquery = (
        select(UserSwipe.event_id)
        .where(UserSwipe.user_id == current_user.id)
        .scalar_subquery()
    )

    # Query active events in target state not in swiped list
    query = (
        select(Event)
        .where(
            Event.is_active == True,
            Event.state_id == target_state,
            Event.start_time >= now,
            ~Event.id.in_(swiped_ids_subquery),
        )
        .order_by(Event.start_time.asc())
        .limit(limit)
    )

    if category:
        query = query.where(Event.category == category.lower())

    result = await db.execute(query)
    events = result.scalars().all()
    return events


@router.post("/swipe", status_code=status.HTTP_200_OK)
async def record_swipe(
    data: SwipePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Records a left (pass) or right (RSVP) swipe.
    """
    if data.direction not in ("left", "right"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Direction must be 'left' or 'right'",
        )

    # Ensure event exists
    event_result = await db.execute(select(Event).where(Event.id == data.event_id))
    event = event_result.scalars().first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Check if already swiped
    existing = await db.execute(
        select(UserSwipe).where(
            UserSwipe.user_id == current_user.id,
            UserSwipe.event_id == data.event_id,
        )
    )
    if existing.scalars().first():
        return {"message": "Already recorded", "status": "exists"}

    # Save swipe
    swipe = UserSwipe(
        id=str(uuid.uuid4()),
        user_id=str(current_user.id),
        event_id=data.event_id,
        direction=data.direction,
    )
    db.add(swipe)
    await db.commit()

    return {
        "message": "Swipe recorded",
        "direction": data.direction,
        "event_id": data.event_id,
    }