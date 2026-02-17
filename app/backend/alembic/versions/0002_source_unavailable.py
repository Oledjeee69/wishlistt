"""add source_unavailable to wishlist_items

Revision ID: 0002_source_unavailable
Revises: 0001_initial
Create Date: 2026-02-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002_source_unavailable"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "wishlist_items",
        sa.Column("source_unavailable", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("wishlist_items", "source_unavailable")
