"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-02-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "wishlists",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=True),
        sa.Column("public_slug", sa.String(length=80), nullable=False),
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("public_slug", name="uq_wishlists_public_slug"),
    )
    op.create_index("ix_wishlists_public_slug", "wishlists", ["public_slug"])

    op.create_table(
        "wishlist_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "wishlist_id",
            sa.Integer(),
            sa.ForeignKey("wishlists.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("price_cents", sa.Integer(), nullable=True),
        sa.Column("allow_group_funding", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("target_amount_cents", sa.Integer(), nullable=True),
        sa.Column("min_contribution_cents", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "(target_amount_cents IS NULL) OR (target_amount_cents >= 0)",
            name="ck_items_target_non_negative",
        ),
        sa.CheckConstraint(
            "(min_contribution_cents IS NULL) OR (min_contribution_cents > 0)",
            name="ck_items_min_contribution_positive",
        ),
    )
    op.create_index("ix_wishlist_items_wishlist_id", "wishlist_items", ["wishlist_id"])

    op.create_table(
        "reservations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "item_id",
            sa.Integer(),
            sa.ForeignKey("wishlist_items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("reserver_name", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("is_group", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_reservations_item_id", "reservations", ["item_id"])

    op.create_table(
        "contributions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "reservation_id",
            sa.Integer(),
            sa.ForeignKey("reservations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("contributor_name", sa.String(length=255), nullable=False),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("amount_cents > 0", name="ck_contributions_amount_positive"),
    )
    op.create_index("ix_contributions_reservation_id", "contributions", ["reservation_id"])


def downgrade() -> None:
    op.drop_index("ix_contributions_reservation_id", table_name="contributions")
    op.drop_table("contributions")

    op.drop_index("ix_reservations_item_id", table_name="reservations")
    op.drop_table("reservations")

    op.drop_index("ix_wishlist_items_wishlist_id", table_name="wishlist_items")
    op.drop_table("wishlist_items")

    op.drop_index("ix_wishlists_public_slug", table_name="wishlists")
    op.drop_table("wishlists")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")

