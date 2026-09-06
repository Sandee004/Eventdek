import logging
import uuid
import os
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
    data: SwipePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch event
    event_res = await db.execute(select(Event).where(Event.id == data.event_id))
    event = event_res.scalars().first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # 2. Record UserSwipe
    swipe = UserSwipe(
        id=str(uuid.uuid4()),
        user_id=str(current_user.id),
        event_id=data.event_id,
        direction=data.direction,
    )
    db.add(swipe)

    # 3. If right swipe, save metadata snapshot for "My Dek"
    if data.direction == "right":
        reg = Registration(
            id=str(uuid.uuid4()),
            user_id=str(current_user.id),
            event_id=event.id,
            event_title=event.title,
            event_banner_url=event.banner_url,
            event_venue_name=event.venue_name,
            event_start_time=event.start_time,
            event_end_time=event.end_time,
            event_source_url=event.source_url,
            registration_status="external",
            qr_code_token=str(uuid.uuid4()),
        )
        db.add(reg)

    await db.commit()
    return {"status": "ok", "source_url": event.source_url if data.direction == "right" else None}

    
# @router.post("/swipe", status_code=status.HTTP_200_OK)
# async def record_swipe(
#     payload: SwipePayload,
#     background_tasks: BackgroundTasks,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db),
# ):
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
#                 event_title=event.title,
#                 event_banner_url=event.banner_url,
#                 event_venue_name=event.venue_name,
#                 event_start_time=event.start_time,
#                 event_end_time=event.end_time,
#                 event_source_url=event.source_url,
#                 custom_answers=payload.custom_answers or {},
#                 qr_code_token=str(uuid.uuid4()),
#                 registration_status="processing",
#             )
#             db.add(new_reg)
#             registration_created = True

#             # Trigger Background Worker with Dry-Run enabled for safety
#             source_url = getattr(event, "source_url", None)
#             if source_url:
#                 user_email = str(getattr(current_user, "email", ""))
#                 # Automatically dry-run if demo account or if global PROXY_DRY_RUN is set
#                 is_demo_user = any(domain in user_email for domain in ["@test.", "@demo.", "@example."])

#                 background_tasks.add_task(
#                     execute_proxy_registration,
#                     registration_id=reg_id,
#                     source_url=source_url,
#                     full_name=str(getattr(current_user, "name", "")),
#                     email=user_email,
#                     phone=str(getattr(current_user, "phone", "")),
#                     custom_answers=payload.custom_answers or {},
#                     dry_run=is_demo_user or os.getenv("PROXY_DRY_RUN", "true").lower() == "true",
#                 )

#     await db.commit()

#     return {
#         "status": "ok",
#         "event_id": payload.event_id,
#         "direction": direction_clean,
#         "registered": registration_created,
#     }



@router.get("/my-dek", status_code=status.HTTP_200_OK)
async def get_my_dek(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches all confirmed event passes registered by the authenticated user.
    """
    current_user_id_str = str(current_user.id)

    query = (
        select(Registration)
        .where(Registration.user_id == current_user_id_str)
        .order_by(Registration.event_start_time.asc())
    )

    result = await db.execute(query)
    registrations = result.scalars().all()

    passes = []
    for reg in registrations:
        qr_token = str(getattr(reg, "qr_code_token", "") or "")
        start_time = getattr(reg, "event_start_time", None)
        end_time = getattr(reg, "event_end_time", None)
        created = getattr(reg, "created_at", None)

        passes.append({
            "id": str(getattr(reg, "id", "")),
            "event_id": str(getattr(reg, "event_id", "")),
            "event_title": getattr(reg, "event_title", None),
            "event_banner_url": getattr(reg, "event_banner_url", None),
            "event_venue_name": getattr(reg, "event_venue_name", None),
            "event_address": getattr(reg, "event_venue_name", None),
            "event_start_time": start_time.isoformat() if start_time else None,
            "event_end_time": end_time.isoformat() if end_time else None,
            "event_source_url": getattr(reg, "event_source_url", None),
            "qr_code_token": qr_token,
            "reference": qr_token[:8].upper() if qr_token else "DEK-PASS",
            "registration_status": getattr(reg, "registration_status", "confirmed"),
            "created_at": created.isoformat() if created else None,
        })

    return passes