"""Rename owner_id to admin_id in project and team tables

Revision ID: 20240715_rename_owner_id
Revises: c40092851473
Create Date: 2024-07-15 20:00:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20240715_rename_owner_id'
down_revision = 'c40092851473'
branch_labels = None
depends_on = None

def upgrade():
    # Project table
    with op.batch_alter_table('project') as batch_op:
        batch_op.alter_column('owner_id', new_column_name='admin_id')
        batch_op.drop_constraint('project_owner_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key('project_admin_id_fkey', 'user', ['admin_id'], ['id'])

    # Team table
    with op.batch_alter_table('team') as batch_op:
        batch_op.alter_column('owner_id', new_column_name='admin_id')
        batch_op.drop_constraint('team_owner_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key('team_admin_id_fkey', 'user', ['admin_id'], ['id'])

def downgrade():
    # Project table
    with op.batch_alter_table('project') as batch_op:
        batch_op.alter_column('admin_id', new_column_name='owner_id')
        batch_op.drop_constraint('project_admin_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key('project_owner_id_fkey', 'user', ['owner_id'], ['id'])

    # Team table
    with op.batch_alter_table('team') as batch_op:
        batch_op.alter_column('admin_id', new_column_name='owner_id')
        batch_op.drop_constraint('team_admin_id_fkey', type_='foreignkey')
        batch_op.create_foreign_key('team_owner_id_fkey', 'user', ['owner_id'], ['id']) 