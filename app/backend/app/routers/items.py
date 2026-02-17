from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import User, Wishlist, WishlistItem
from app.realtime import manager


class ItemBase(BaseModel):
    title: str
    url: Optional[str] = None
    image_url: Optional[str] = None
    price_cents: Optional[int] = None
    allow_group_funding: bool = False
    target_amount_cents: Optional[int] = None
    min_contribution_cents: Optional[int] = None
    source_unavailable: bool = False


class ItemPublic(ItemBase):
    id: int

    class Config:
        from_attributes = True


router = APIRouter(prefix="/items", tags=["items"])


@router.post(
    "/wishlist/{wishlist_id}",
    response_model=ItemPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    wishlist_id: int,
    item_in: ItemBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wishlist = (
        db.query(Wishlist)
        .filter(Wishlist.id == wishlist_id, Wishlist.owner_id == current_user.id)
        .first()
    )
    if not wishlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wishlist not found")

    item = WishlistItem(
        wishlist_id=wishlist_id,
        title=item_in.title,
        url=item_in.url,
        image_url=item_in.image_url,
        price_cents=item_in.price_cents,
        allow_group_funding=item_in.allow_group_funding,
        target_amount_cents=item_in.target_amount_cents,
        min_contribution_cents=item_in.min_contribution_cents,
        source_unavailable=item_in.source_unavailable,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    room = str(item.wishlist_id)
    await manager.broadcast(room, {"type": "item_created"})
    return item


@router.patch("/{item_id}", response_model=ItemPublic)
async def update_item(
    item_id: int,
    item_in: ItemBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(WishlistItem)
        .join(Wishlist, Wishlist.id == WishlistItem.wishlist_id)
        .filter(WishlistItem.id == item_id, Wishlist.owner_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    for field, value in item_in.model_dump().items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)

    room = str(item.wishlist_id)
    await manager.broadcast(room, {"type": "item_updated"})
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(WishlistItem)
        .join(Wishlist, Wishlist.id == WishlistItem.wishlist_id)
        .filter(WishlistItem.id == item_id, Wishlist.owner_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    wishlist_id = item.wishlist_id
    db.delete(item)
    db.commit()
    room = str(wishlist_id)
    await manager.broadcast(room, {"type": "item_deleted"})
    return

