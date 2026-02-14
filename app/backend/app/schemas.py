from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# Auth


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserPublic(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: str


# Wishlists / items (частично, для дальнейших шагов)


class WishlistBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: Optional[date] = None


class WishlistCreate(WishlistBase):
    is_public: bool = True


class WishlistPublic(WishlistBase):
    id: int
    public_slug: str
    is_public: bool
    created_at: datetime

    class Config:
        from_attributes = True

