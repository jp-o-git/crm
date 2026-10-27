"""create invoice sequence

Revision ID: b2ff6b756644
Revises: 8102e13f4b5a
Create Date: 2026-10-27 12:23:27.529848

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2ff6b756644'
down_revision: Union[str, Sequence[str], None] = '8102e13f4b5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1001")


def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS invoice_seq")
