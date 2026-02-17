from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import User, Wishlist, WishlistItem, Reservation, Contribution
from app.schemas import WishlistBase, WishlistCreate, WishlistPublic
from app.utils import generate_slug


router = APIRouter(prefix="/wishlists", tags=["wishlists"])


@router.get("/me", response_model=List[WishlistPublic])
def get_my_wishlists(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    wishlists = (
        db.query(Wishlist)
        .filter(Wishlist.owner_id == current_user.id)
        .order_by(Wishlist.created_at.desc())
        .all()
    )
    return wishlists


@router.post("", response_model=WishlistPublic, status_code=status.HTTP_201_CREATED)
def create_wishlist(
    wishlist_in: WishlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # генерируем уникальный slug
    slug = generate_slug()
    while db.query(Wishlist).filter(Wishlist.public_slug == slug).first() is not None:
        slug = generate_slug()

    wishlist = Wishlist(
        owner_id=current_user.id,
        title=wishlist_in.title,
        description=wishlist_in.description,
        event_date=wishlist_in.event_date,
        public_slug=slug,
        is_public=wishlist_in.is_public,
    )
    db.add(wishlist)
    db.commit()
    db.refresh(wishlist)
    return wishlist


@router.get("/{wishlist_id}")
def get_wishlist_detail(
    wishlist_id: int,
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

    # агрегаты для владельца без раскрытия имён и конкретных сумм
    items_data = []
    for item in wishlist.items:
        total_reserved = len(item.reservations)
        total_contributed = (
            db.query(Contribution)
            .join(Reservation, Reservation.id == Contribution.reservation_id)
            .filter(Reservation.item_id == item.id)
            .with_entities(
                (Contribution.amount_cents).label("amount"),
            )
            .all()
        )
        collected = sum(row.amount for row in total_contributed)
        items_data.append(
            {
                "id": item.id,
                "title": item.title,
                "url": item.url,
                "image_url": item.image_url,
                "price_cents": item.price_cents,
                "allow_group_funding": item.allow_group_funding,
                "target_amount_cents": item.target_amount_cents,
                "min_contribution_cents": item.min_contribution_cents,
                "source_unavailable": item.source_unavailable,
                "reserved_count": total_reserved,
                "collected_amount_cents": collected,
            }
        )

    return {
        "id": wishlist.id,
        "title": wishlist.title,
        "description": wishlist.description,
        "event_date": wishlist.event_date,
        "public_slug": wishlist.public_slug,
        "is_public": wishlist.is_public,
        "created_at": wishlist.created_at,
        "items": items_data,
    }


@router.patch("/{wishlist_id}", response_model=WishlistPublic)
def update_wishlist(
    wishlist_id: int,
    wishlist_in: WishlistBase,
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
    wishlist.title = wishlist_in.title
    wishlist.description = wishlist_in.description
    wishlist.event_date = wishlist_in.event_date
    db.commit()
    db.refresh(wishlist)
    return wishlist


@router.delete("/{wishlist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wishlist(
    wishlist_id: int,
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
    db.delete(wishlist)
    db.commit()
    return


@router.get("/public/{slug}")
def get_public_wishlist(slug: str, db: Session = Depends(get_db)):
    wishlist = (
        db.query(Wishlist)
        .filter(Wishlist.public_slug == slug, Wishlist.is_public == True)  # noqa: E712
        .first()
    )
    if not wishlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wishlist not found")

    # публичный ответ: гости видят статусы, имена резервирующих и вкладчиков
    items_data = []
    for item in wishlist.items:
        reservations = []
        total_contributed = 0
        for r in item.reservations:
            contribs = []
            for c in r.contributions:
                total_contributed += c.amount_cents
                contribs.append(
                    {
                        "id": c.id,
                        "amount_cents": c.amount_cents,
                        "contributor_name": None if c.is_anonymous else c.contributor_name,
                        "is_anonymous": c.is_anonymous,
                    }
                )
            reservations.append(
                {
                    "id": r.id,
                    "reserver_name": r.reserver_name,
                    "message": r.message,
                    "is_group": r.is_group,
                    "created_at": r.created_at,
                    "contributions": contribs,
                }
            )
        items_data.append(
            {
                "id": item.id,
                "title": item.title,
                "url": item.url,
                "image_url": item.image_url,
                "price_cents": item.price_cents,
                "allow_group_funding": item.allow_group_funding,
                "target_amount_cents": item.target_amount_cents,
                "min_contribution_cents": item.min_contribution_cents,
                "source_unavailable": item.source_unavailable,
                "reservations": reservations,
                "collected_amount_cents": total_contributed,
            }
        )

    return {
        "id": wishlist.id,
        "title": wishlist.title,
        "description": wishlist.description,
        "event_date": wishlist.event_date,
        "public_slug": wishlist.public_slug,
        "is_public": wishlist.is_public,
        "created_at": wishlist.created_at,
        "items": items_data,
    }

