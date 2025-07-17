"""add role column to user

Revision ID: add_role_column_to_user
Revises: rename_owner_id_to_admin_id
Create Date: 2025-07-16 21:00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_role_column_to_user'
down_revision = '20240715_rename_owner_id'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('user', sa.Column('role', sa.String(length=20), nullable=True))
    op.execute("UPDATE \"user\" SET role = 'member'")
    op.alter_column('user', 'role', nullable=False)

def downgrade():
    op.drop_column('user', 'role') 