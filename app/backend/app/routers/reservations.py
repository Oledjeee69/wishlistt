from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Contribution, Reservation, WishlistItem
from app.realtime import manager


class ReserveCreate(BaseModel):
    reserver_name: str = Field(min_length=1)
    message: Optional[str] = None
    is_group: bool = False


class ContributionCreate(BaseModel):
    contributor_name: str = Field(min_length=1)
    amount_cents: int = Field(gt=0)
    is_anonymous: bool = False


router = APIRouter(prefix="/items", tags=["reservations"])


@router.post("/{item_id}/reserve", status_code=status.HTTP_201_CREATED)
async def reserve_item(
    item_id: int,
    payload: ReserveCreate,
    db: Session = Depends(get_db),
):
    item = db.query(WishlistItem).filter(WishlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # одиночный подарок — запрещаем второй резерв
    if not item.allow_group_funding:
        existing = db.query(Reservation).filter(Reservation.item_id == item.id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item is already reserved",
            )

    reservation = Reservation(
        item_id=item.id,
        reserver_name=payload.reserver_name,
        message=payload.message,
        is_group=payload.is_group,
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    room = str(item.wishlist_id)
    await manager.broadcast(room, {"type": "item_reserved"})
    return {"id": reservation.id}


@router.post("/{item_id}/contributions", status_code=status.HTTP_201_CREATED)
async def contribute_to_item(
    item_id: int,
    payload: ContributionCreate,
    db: Session = Depends(get_db),
):
    item = db.query(WishlistItem).filter(WishlistItem.id == item_id).first()
    if not item or not item.allow_group_funding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    target = item.target_amount_cents or item.price_cents
    if not target:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target amount is not set for this item",
        )

    if item.min_contribution_cents and payload.amount_cents < item.min_contribution_cents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contribution below minimum amount",
        )

    total_contributed = (
        db.query(func.coalesce(func.sum(Contribution.amount_cents), 0))
        .join(Reservation, Reservation.id == Contribution.reservation_id)
        .filter(Reservation.item_id == item_id)
        .scalar()
    )
    remaining = target - total_contributed
    if payload.amount_cents > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contribution exceeds remaining amount",
        )

    # создаём (или переиспользуем) «групповой» резерв
    reservation = (
        db.query(Reservation)
            .filter(Reservation.item_id == item_id, Reservation.is_group == True)  # noqa: E712
            .first()
    )
    if not reservation:
        reservation = Reservation(
            item_id=item_id,
            reserver_name=payload.contributor_name,
            message=None,
            is_group=True,
        )
        db.add(reservation)
        db.flush()

    contribution = Contribution(
        reservation_id=reservation.id,
        amount_cents=payload.amount_cents,
        contributor_name=payload.contributor_name,
        is_anonymous=payload.is_anonymous,
    )
    db.add(contribution)
    db.commit()
    db.refresh(contribution)

    room = str(item.wishlist_id)
    await manager.broadcast(room, {"type": "contribution_added"})
    return {"id": contribution.id}

