import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import Event, Registration, User, UserSwipe
from routers.auth import get_current_user
from schemas import EventResponse, SwipePayload
from services.registration_proxy import execute_proxy_registration

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
    target_state = (state_id or getattr(current_user, "state_id", "lagos")).strip().lower()
    current_user_id_str = str(current_user.id)

    time_buffer = datetime.now(timezone.utc) - timedelta(days=1)

    swiped_ids_subquery = (
        select(UserSwipe.event_id)
        .where(UserSwipe.user_id == current_user_id_str)
        .scalar_subquery()
    )

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

    # 1. Fetch Event
    event_res = await db.execute(select(Event).where(Event.id == payload.event_id))
    event = event_res.scalars().first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # 2. Record or Update UserSwipe
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

    # 3. Create Registration snapshot (Executed outside the else block)
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
                ticket_tier="free",
                amount_paid=0.0,
                currency=str(getattr(event, "currency", "NGN")),
                event_title=event.title,
                event_banner_url=event.banner_url,
                event_venue_name=event.venue_name,
                event_start_time=event.start_time,
                event_end_time=event.end_time,
                event_source_url=event.source_url,
                custom_answers=payload.custom_answers or {},
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


# @router.post("/swipe", status_code=status.HTTP_200_OK)
# async def record_swipe(
#     payload: SwipePayload,
#     background_tasks: BackgroundTasks,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db),
# ):
#     """
#     Records swipe direction.
#     If right swipe on a free event:
#     1. Writes immutable Registration snapshot into DB.
#     2. Enqueues background Playwright task to register user on external host.
#     """
#     direction_clean = payload.direction.lower().strip()
#     if direction_clean not in ("left", "right"):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Direction must be 'left' or 'right'",
#         )

#     current_user_id_str = str(current_user.id)

#     # 1. Fetch Event
#     event_res = await db.execute(select(Event).where(Event.id == payload.event_id))
#     event = event_res.scalars().first()
#     if not event:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Event not found",
#         )

#     # 2. Record or Update UserSwipe
#     existing_query = select(UserSwipe).where(
#         UserSwipe.user_id == current_user_id_str,
#         UserSwipe.event_id == payload.event_id,
#     )
#     res = await db.execute(existing_query)
#     existing_swipe = res.scalars().first()

#     if existing_swipe:
#         setattr(existing_swipe, "direction", direction_clean)
#     else:
#         new_swipe = UserSwipe(
#             id=str(uuid.uuid4()),
#             user_id=current_user_id_str,
#             event_id=payload.event_id,
#             direction=direction_clean,
#         )
#         db.add(new_swipe)

#     # 3. Create Registration snapshot & trigger background registration worker
#     is_free_event = bool(getattr(event, "is_free", True))
#     registration_created = False

#     if direction_clean == "right" and is_free_event:
#         existing_reg_res = await db.execute(
#             select(Registration).where(
#                 Registration.user_id == current_user_id_str,
#                 Registration.event_id == payload.event_id,
#             )
#         )
#         existing_reg = existing_reg_res.scalars().first()

#         reg_id = str(uuid.uuid4())
#         if not existing_reg:
#             new_reg = Registration(
#                 id=reg_id,
#                 user_id=current_user_id_str,
#                 event_id=event.id,
#                 ticket_tier="free",
#                 amount_paid=0.0,
#                 currency=str(getattr(event, "currency", "NGN")),
#                 event_title=event.title,
#                 event_banner_url=event.banner_url,
#                 event_venue_name=event.venue_name,
#                 event_start_time=event.start_time,
#                 event_end_time=event.end_time,
#                 event_source_url=event.source_url,
#                 custom_answers=payload.custom_answers or {},
#                 qr_code_token=str(uuid.uuid4()),
#                 registration_status="processing",  # Updated by worker
#             )
#             db.add(new_reg)
#             registration_created = True

#             # Trigger Background Registration Worker
#             source_url = getattr(event, "source_url", None)
#             if source_url:
#                 background_tasks.add_task(
#                     execute_proxy_registration,
#                     registration_id=reg_id,
#                     source_url=source_url,
#                     full_name=str(getattr(current_user, "name", "")),
#                     email=str(getattr(current_user, "email", "")),
#                     phone=str(getattr(current_user, "phone", "")),
#                     custom_answers=payload.custom_answers or {},
#                 )

#     await db.commit()

#     return {
#         "status": "ok",
#         "event_id": payload.event_id,
#         "direction": direction_clean,
#         "registered": registration_created,
#     }

