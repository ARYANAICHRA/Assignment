from models.db import db
from models import User, Team, Project, ProjectMember, BoardColumn, Item, Comment, TeamMember, ProjectTeam, ActivityLog, Notification, Role, Permission
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
from app import app

def create_roles_and_permissions(project=None):
    # Define roles and their permissions
    role_defs = {
        'admin': [
            'view_tasks', 'create_task', 'edit_any_task', 'edit_own_task', 'delete_any_task', 'delete_own_task',
            'manage_project', 'add_remove_members', 'change_roles', 'view_project_settings', 'delete_project', 'transfer_admin',
            # New granular permissions for comments
            'add_comment', 'edit_any_comment', 'delete_any_comment'
        ],
        'manager': [
            'view_tasks', 'create_task', 'edit_any_task', 'edit_own_task', 'delete_any_task', 'delete_own_task',
            'manage_project', 'add_remove_members', 'change_roles', 'view_project_settings',
            # New granular permissions for comments
            'add_comment', 'edit_any_comment', 'delete_any_comment'
        ],
        'member': [
            'view_tasks', 'create_task', 'edit_own_task', 'delete_own_task', 'view_project_settings',
            # New granular permissions for comments
            'add_comment', 'edit_own_comment'
        ],
        'visitor': [
            'view_tasks', 'view_project_settings'
            # Visitors can view but not add/edit comments
        ]
    }
    roles = {}
    for role_name, actions in role_defs.items():
        role = Role(name=role_name, project_id=project.id if project else None)
        db.session.add(role)
        db.session.flush()  # get role.id
        for action in actions:
            perm = Permission(action=action, role_id=role.id)
            db.session.add(perm)
        roles[role_name] = role
    db.session.commit()
    return roles

def main():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Create demo users with a safe, non-admin default global role
        users = [
            User(username='alice', email='alice@example.com', password_hash=generate_password_hash('password'), role='member'),
            User(username='bob', email='bob@example.com', password_hash=generate_password_hash('password'), role='member'),
            User(username='carol', email='carol@example.com', password_hash=generate_password_hash('password'), role='member'),
            User(username='dave', email='dave@example.com', password_hash=generate_password_hash('password'), role='visitor'),
        ]
        db.session.add_all(users)
        db.session.commit()

        # Create a team
        team = Team(name='Demo Team', description='A demo team', admin_id=users[0].id)
        db.session.add(team)
        db.session.commit()

        # Add team members
        for user in users:
            db.session.add(TeamMember(team_id=team.id, user_id=user.id))
        db.session.commit()

        # Create a project
        project = Project(name='Demo Project', description='A demo project', admin_id=users[0].id, owner_team_id=team.id)
        db.session.add(project)
        db.session.commit()

        # Create roles and permissions for this project
        roles = create_roles_and_permissions(project)

        # Add project members with roles (project-specific roles)
        db.session.add(ProjectMember(user_id=users[0].id, project_id=project.id, role_id=roles['admin'].id))
        db.session.add(ProjectMember(user_id=users[1].id, project_id=project.id, role_id=roles['manager'].id))
        db.session.add(ProjectMember(user_id=users[2].id, project_id=project.id, role_id=roles['member'].id))
        db.session.add(ProjectMember(user_id=users[3].id, project_id=project.id, role_id=roles['visitor'].id))
        db.session.commit()

        # Create board columns
        todo = BoardColumn(name='To Do', project_id=project.id, order=1)
        inprogress = BoardColumn(name='In Progress', project_id=project.id, order=2)
        inreview = BoardColumn(name='In Review', project_id=project.id, order=3)
        done = BoardColumn(name='Done', project_id=project.id, order=4)
        db.session.add_all([todo, inprogress, inreview, done])
        db.session.commit()

        # Create items (tasks) with correct status/type/priority values
        item1 = Item(title='Setup project', description='Initial setup', type='task', status='todo', column_id=todo.id, project_id=project.id, reporter_id=users[0].id, assignee_id=users[1].id, due_date=datetime.utcnow()+timedelta(days=7), priority='high', severity='major', created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        item2 = Item(title='Design database', description='Design the DB schema', type='feature', status='inprogress', column_id=inprogress.id, project_id=project.id, reporter_id=users[1].id, assignee_id=users[2].id, due_date=datetime.utcnow()+timedelta(days=10), priority='medium', severity='minor', created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        item3 = Item(title='Create epic', description='Big feature epic', type='epic', status='inreview', column_id=inreview.id, project_id=project.id, reporter_id=users[2].id, assignee_id=users[3].id, due_date=datetime.utcnow()+timedelta(days=15), priority='low', severity='minor', created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        item4 = Item(title='Fix bug', description='Critical bug fix', type='bug', status='done', column_id=done.id, project_id=project.id, reporter_id=users[3].id, assignee_id=users[0].id, due_date=datetime.utcnow()+timedelta(days=2), priority='high', severity='major', created_at=datetime.utcnow(), updated_at=datetime.utcnow())
        db.session.add_all([item1, item2, item3, item4])
        db.session.commit()

        # Comments
        comment1 = Comment(item_id=item1.id, user_id=users[0].id, content='Let’s get started!', created_at=datetime.utcnow())
        comment2 = Comment(item_id=item2.id, user_id=users[1].id, content='Working on DB design.', created_at=datetime.utcnow())
        db.session.add_all([comment1, comment2])
        db.session.commit()

        # Notifications
        notif1 = Notification(user_id=users[1].id, message='You have been assigned a new task.', is_read=False)
        notif2 = Notification(user_id=users[2].id, message='You have been assigned a new task.', is_read=False)
        db.session.add_all([notif1, notif2])
        db.session.commit()

        # Activity logs
        log1 = ActivityLog(item_id=item1.id, user_id=users[0].id, action='created', details='Created task', created_at=datetime.utcnow())
        log2 = ActivityLog(item_id=item2.id, user_id=users[1].id, action='created', details='Created task', created_at=datetime.utcnow())
        db.session.add_all([log1, log2])
        db.session.commit()

        # Project-Team mapping
        db.session.add(ProjectTeam(project_id=project.id, team_id=team.id))
        db.session.commit()

        print('Demo data generated successfully!')

if __name__ == '__main__':
    main()