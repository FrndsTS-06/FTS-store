"""add_newsletter_subscriptions_table

Revision ID: 52c53439b783
Revises: a67dd0b0425e
Create Date: 2026-10-13 20:44:31.260344

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52c53439b783'
down_revision: Union[str, None] = 'a67dd0b0425e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'newsletter_subscriptions' not in existing_tables:
        op.create_table(
            'newsletter_subscriptions',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
            sa.Column('source', sa.String(length=50), nullable=False, server_default='homepage_strip'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_newsletter_subscriptions_email'), 'newsletter_subscriptions', ['email'], unique=True)

    # Safe index creation for orders idempotency_key
    order_indexes = [idx['name'] for idx in inspector.get_indexes('orders')]
    if 'ix_orders_idempotency_key' not in order_indexes:
        op.create_index(op.f('ix_orders_idempotency_key'), 'orders', ['idempotency_key'], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'newsletter_subscriptions' in existing_tables:
        op.drop_index(op.f('ix_newsletter_subscriptions_email'), table_name='newsletter_subscriptions')
        op.drop_table('newsletter_subscriptions')

    order_indexes = [idx['name'] for idx in inspector.get_indexes('orders')]
    if 'ix_orders_idempotency_key' in order_indexes:
        op.drop_index(op.f('ix_orders_idempotency_key'), table_name='orders')
