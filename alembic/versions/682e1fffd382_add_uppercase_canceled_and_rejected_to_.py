"""add uppercase CANCELED and REJECTED to loanstatus

Revision ID: 682e1fffd382
Revises: accb3238e6be
Create Date: 2026-07-06 04:37:17.742149

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '682e1fffd382'
down_revision: Union[str, Sequence[str], None] = 'accb3238e6be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE loanstatus ADD VALUE 'CANCELED'")
    op.execute("ALTER TYPE loanstatus ADD VALUE 'REJECTED'")
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
