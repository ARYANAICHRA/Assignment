"""
Demo Data Generator for Jira Clone Backend

Demo Users (login with these credentials):
- admin@example.com / adminpass (Firm Admin, not a member of any team/project)
- alice@example.com / password123 (Team Alpha Manager, Project X Owner)
- bob@example.com / password123 (Team Alpha Member, Project X Contributor)
- carol@example.com / password123 (Team Beta Manager, Project Y Owner)
- dave@example.com / password123 (Team Beta Member, Project Y Contributor)

This script will:
- Create users, teams, projects, roles, permissions, and tasks
- Assign users to teams and projects with appropriate roles
- Assign permissions to roles as per RBAC
"""
from datetime import datetime, timedelta
from models.db import db
from models.user import User
from models.team import Team
from models.project import Project
from models.role import Role, role_permissions
from models.permission import Permission
from models.team_member import TeamMember
from models.project_member import ProjectMember
from models.item import Item
from models.board_column import BoardColumn
from werkzeug.security import generate_password_hash
from app import app

def reset_db():
    db.drop_all()
    db.create_all()

def seed_data():
    # --- Permissions ---
    PERMISSIONS = [
        Permission(action='create_team', description='Create a new team'),
        Permission(action='delete_team', description='Delete a team'),
        Permission(action='add_team_member', description='Add member to team'),
        Permission(action='remove_team_member', description='Remove member from team'),
        Permission(action='assign_team_role', description='Assign team role'),
        Permission(action='create_project', description='Create a new project'),
        Permission(action='delete_project', description='Delete a project'),
        Permission(action='assign_project_role', description='Assign project role'),
        Permission(action='view_team_members', description='View team members'),
        Permission(action='view_project', description='View project'),
        Permission(action='edit_project', description='Edit project settings'),
        Permission(action='create_task', description='Create tasks'),
        Permission(action='edit_any_task', description='Edit any task'),
        Permission(action='edit_own_task', description='Edit own/assigned task'),
        Permission(action='delete_any_task', description='Delete any task'),
        Permission(action='delete_own_task', description='Delete own/assigned task'),
        Permission(action='comment_task', description='Comment on tasks'),
        Permission(action='view_reports', description='View reports'),
        Permission(action='assign_project_to_team', description='Assign project to team'),
        Permission(action='view_project_settings', description='View project settings'),
        Permission(action='manage_project', description='Manage project settings and members'),
        Permission(action='view_tasks', description='View all project tasks'),
        Permission(action='add_remove_members', description='Add or remove members from project'),
    ]
    db.session.add_all(PERMISSIONS)
    db.session.commit()
    perm_map = {p.action: p for p in Permission.query.all()}

    # --- Roles ---
    roles = {}
    roles['Firm Admin'] = Role(name='Firm Admin', scope='firm')
    roles['Team Manager'] = Role(name='Team Manager', scope='team')
    roles['Team Member'] = Role(name='Team Member', scope='team')
    roles['Project Owner'] = Role(name='Project Owner', scope='project')
    roles['Project Contributor'] = Role(name='Project Contributor', scope='project')
    db.session.add_all(list(roles.values()))
    db.session.commit()

    # Assign permissions to roles
    roles['Firm Admin'].permissions = list(perm_map.values())
    roles['Team Manager'].permissions = [perm_map[a] for a in ['add_team_member', 'remove_team_member', 'assign_team_role', 'view_team_members']]
    roles['Team Member'].permissions = [perm_map['view_team_members']]
    # Project Owner has all project management permissions, including add/remove members
    roles['Project Owner'].permissions = [perm_map[a] for a in [
        'view_project', 'edit_project', 'create_task', 'edit_any_task', 'delete_any_task', 'comment_task', 'view_reports',
        'view_project_settings', 'manage_project', 'view_tasks', 'assign_project_role', 'add_remove_members', 'delete_project']]
    roles['Project Contributor'].permissions = [perm_map[a] for a in [
        'view_project', 'create_task', 'edit_own_task', 'delete_own_task', 'comment_task', 'view_project_settings', 'view_tasks']]
    db.session.commit()

    # --- Users ---
    user_objs = {}
    user_defs = [
        {'username': 'admin', 'email': 'admin@example.com', 'password': 'adminpass'},
        {'username': 'alice', 'email': 'alice@example.com', 'password': 'password123'},
        {'username': 'bob', 'email': 'bob@example.com', 'password': 'password123'},
        {'username': 'carol', 'email': 'carol@example.com', 'password': 'password123'},
        {'username': 'dave', 'email': 'dave@example.com', 'password': 'password123'},
    ]
    for u in user_defs:
        user = User(username=u['username'], email=u['email'], password_hash=generate_password_hash(u['password']))
        db.session.add(user)
        user_objs[u['username']] = user
        db.session.commit()

    # --- Teams ---
    team_objs = {}
    team_defs = [
        {'name': 'Alpha', 'description': 'Alpha team', 'manager': 'alice'},
        {'name': 'Beta', 'description': 'Beta team', 'manager': 'carol'},
    ]
    for t in team_defs:
        manager_user = user_objs[t['manager']]
        team = Team(name=t['name'], description=t['description'], manager_id=manager_user.id)
        db.session.add(team)
        team_objs[t['name']] = team
        db.session.commit()

    # --- Team Memberships ---
    db.session.add(TeamMember(team_id=team_objs['Alpha'].id, user_id=user_objs['alice'].id, role_id=roles['Team Manager'].id))
    db.session.add(TeamMember(team_id=team_objs['Alpha'].id, user_id=user_objs['bob'].id, role_id=roles['Team Member'].id))
    db.session.add(TeamMember(team_id=team_objs['Beta'].id, user_id=user_objs['carol'].id, role_id=roles['Team Manager'].id))
    db.session.add(TeamMember(team_id=team_objs['Beta'].id, user_id=user_objs['dave'].id, role_id=roles['Team Member'].id))
    db.session.commit()

    # --- Projects ---
    project_objs = {}
    project_columns = {}
    project_defs = [
        {'name': 'Project X', 'description': 'Top secret', 'team': 'Alpha', 'owner': 'alice', 'contributors': ['bob']},
        {'name': 'Project Y', 'description': 'Beta project', 'team': 'Beta', 'owner': 'carol', 'contributors': ['dave']},
    ]
    for p in project_defs:
        team = team_objs[p['team']]
        owner_user = user_objs[p['owner']]
        project = Project(name=p['name'], description=p['description'], owner_id=owner_user.id, owner_team_id=team.id)
        db.session.add(project)
        db.session.flush()
        project_objs[p['name']] = project
        # Create board columns
        columns = {}
        for idx, (status, name) in enumerate([
            ('todo', 'To Do'),
            ('inprogress', 'In Progress'),
            ('inreview', 'In Review'),
            ('done', 'Done')
        ]):
            col = BoardColumn(name=name, project_id=project.id, order=idx)
            db.session.add(col)
            db.session.flush()
            columns[status] = col
        project_columns[p['name']] = columns
        db.session.commit()

    # --- Project Memberships ---
    # Only the owning team's members are assigned to the project
    db.session.add(ProjectMember(user_id=user_objs['alice'].id, project_id=project_objs['Project X'].id, role_id=roles['Project Owner'].id))
    db.session.add(ProjectMember(user_id=user_objs['bob'].id, project_id=project_objs['Project X'].id, role_id=roles['Project Contributor'].id))
    db.session.add(ProjectMember(user_id=user_objs['carol'].id, project_id=project_objs['Project Y'].id, role_id=roles['Project Owner'].id))
    db.session.add(ProjectMember(user_id=user_objs['dave'].id, project_id=project_objs['Project Y'].id, role_id=roles['Project Contributor'].id))
    db.session.commit()

    # --- Tasks ---
    now = datetime.utcnow()
    # Project X tasks (owned by Alpha)
    db.session.add(Item(title='Setup project', description='Initial setup', type='task', status='todo', project_id=project_objs['Project X'].id, reporter_id=user_objs['alice'].id, assignee_id=user_objs['bob'].id, due_date=now + timedelta(days=7), priority='High', created_at=now, updated_at=now, column_id=project_columns['Project X']['todo'].id))
    db.session.add(Item(title='Design database', description='Design the DB schema', type='feature', status='inprogress', project_id=project_objs['Project X'].id, reporter_id=user_objs['bob'].id, assignee_id=user_objs['alice'].id, due_date=now + timedelta(days=10), priority='Medium', created_at=now, updated_at=now, column_id=project_columns['Project X']['inprogress'].id))
    # Project Y tasks (owned by Beta)
    db.session.add(Item(title='Create epic', description='Big feature epic', type='epic', status='inreview', project_id=project_objs['Project Y'].id, reporter_id=user_objs['carol'].id, assignee_id=user_objs['dave'].id, due_date=now + timedelta(days=15), priority='Low', created_at=now, updated_at=now, column_id=project_columns['Project Y']['inreview'].id))
    db.session.add(Item(title='Fix bug', description='Critical bug fix', type='bug', status='done', project_id=project_objs['Project Y'].id, reporter_id=user_objs['dave'].id, assignee_id=user_objs['carol'].id, due_date=now + timedelta(days=2), priority='High', created_at=now, updated_at=now, column_id=project_columns['Project Y']['done'].id))
    db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        reset_db()
        seed_data()
        print('Demo data generated.')