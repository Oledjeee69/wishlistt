from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    wishlists: Mapped[list["Wishlist"]] = relationship("Wishlist", back_populates="owner")


class Wishlist(Base):
    __tablename__ = "wishlists"
    __table_args__ = (
        UniqueConstraint("public_slug", name="uq_wishlists_public_slug"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    public_slug: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    owner: Mapped[User] = relationship("User", back_populates="wishlists")
    items: Mapped[list["WishlistItem"]] = relationship(
        "WishlistItem", back_populates="wishlist", cascade="all, delete-orphan"
    )


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    wishlist_id: Mapped[int] = mapped_column(
        ForeignKey("wishlists.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    price_cents: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    allow_group_funding: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    target_amount_cents: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    min_contribution_cents: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    wishlist: Mapped[Wishlist] = relationship("Wishlist", back_populates="items")
    reservations: Mapped[list["Reservation"]] = relationship(
        "Reservation", back_populates="item", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "(target_amount_cents IS NULL) OR (target_amount_cents >= 0)",
            name="ck_items_target_non_negative",
        ),
        CheckConstraint(
            "(min_contribution_cents IS NULL) OR (min_contribution_cents > 0)",
            name="ck_items_min_contribution_positive",
        ),
    )


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    item_id: Mapped[int] = mapped_column(
        ForeignKey("wishlist_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reserver_name: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_group: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    item: Mapped[WishlistItem] = relationship("WishlistItem", back_populates="reservations")
    contributions: Mapped[list["Contribution"]] = relationship(
        "Contribution", back_populates="reservation", cascade="all, delete-orphan"
    )


class Contribution(Base):
    __tablename__ = "contributions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    reservation_id: Mapped[int] = mapped_column(
        ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    contributor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    reservation: Mapped[Reservation] = relationship("Reservation", back_populates="contributions")

    __table_args__ = (
        CheckConstraint("amount_cents > 0", name="ck_contributions_amount_positive"),
    )

