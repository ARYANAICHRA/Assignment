"""add owner_team_id to project

Revision ID: add_owner_team_id_to_project
Revises: add_role_column_to_user
Create Date: 2025-07-16 23:59:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_owner_team_id_to_project'
down_revision = 'add_role_column_to_user'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('project', sa.Column('owner_team_id', sa.Integer(), nullable=True))
    op.create_foreign_key('project_owner_team_id_fkey', 'project', 'team', ['owner_team_id'], ['id'])

def downgrade():
    op.drop_constraint('project_owner_team_id_fkey', 'project', type_='foreignkey')
    op.drop_column('project', 'owner_team_id') 