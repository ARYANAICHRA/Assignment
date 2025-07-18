from flask import request, jsonify
from models.db import db
from models.project import Project
from models.user import User
from models.project_member import ProjectMember
from models.team import Team
from models.item import Item
from models.board_column import BoardColumn
from models.project_team import ProjectTeam
from models.team_member import TeamMember
from controllers.jwt_utils import jwt_required
from controllers.rbac import require_project_role

# Utility function to determine user access level for a project

def get_user_project_access(user_id, project_id):
    project = Project.query.get(project_id)
    if not project:
        return "no_access"
    owner_team_id = project.owner_team_id
    # All teams associated with the project
    associated_team_ids = [pt.team_id for pt in ProjectTeam.query.filter_by(project_id=project_id)]
    # All teams the user is a member of
    user_team_ids = [tm.team_id for tm in TeamMember.query.filter_by(user_id=user_id)]
    if owner_team_id and owner_team_id in user_team_ids:
        return "member"
    elif any(tid in associated_team_ids for tid in user_team_ids):
        return "viewer"
    else:
        return "no_access"

def create_project():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    user = getattr(request, 'user', None)
    if not name:
        return jsonify({'error': 'Project name is required'}), 400
    if not user:
        return jsonify({'error': 'User not found'}), 401
    if not user or user.role != 'admin':
        return jsonify({'error': 'Only admin can create projects'}), 403
    project = Project(name=name, description=description, admin_id=user.id)
    db.session.add(project)
    db.session.commit()
    # Add default board columns
    default_columns = ["To Do", "In Progress", "In Review", "Done"]
    for idx, col_name in enumerate(default_columns):
        column = BoardColumn(name=col_name, project_id=project.id, order=idx)
        db.session.add(column)
    db.session.commit()
    # Add creator as a project member with role 'admin'
    member = ProjectMember(project_id=project.id, user_id=user.id, role='admin')
    db.session.add(member)
    db.session.commit()
    return jsonify({'message': 'Project created', 'project': {'id': project.id, 'name': project.name, 'description': project.description, 'admin_id': project.admin_id}}), 201

def get_projects():
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    # Get projects where user is admin
    admined_projects = Project.query.filter_by(admin_id=user.id)
    # Get projects where user is a member
    member_project_ids = db.session.query(ProjectMember.project_id).filter_by(user_id=user.id)
    member_projects = Project.query.filter(Project.id.in_(member_project_ids))
    # Union of both
    projects = admined_projects.union(member_projects).all()
    result = [{'id': p.id, 'name': p.name, 'description': p.description, 'admin_id': p.admin_id} for p in projects]
    return jsonify({'projects': result})

@jwt_required
def get_dashboard_stats():
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401

    project_count = Project.query.filter_by(admin_id=user.id).count()
    task_count = Item.query.filter_by(reporter_id=user.id).count()
    team_count = Team.query.filter_by(admin_id=user.id).count() if hasattr(Team, 'admin_id') else 0

    return jsonify({
        'projectCount': project_count,
        'taskCount': task_count,
        'teamCount': team_count
    })

@jwt_required
def get_project_progress(project_id):
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    total = Item.query.filter_by(project_id=project_id).count()
    completed = Item.query.filter_by(project_id=project_id, status='done').count()
    in_progress = Item.query.filter_by(project_id=project_id, status='in_progress').count()
    todo = Item.query.filter_by(project_id=project_id, status='todo').count()
    return jsonify({
        'total': total,
        'completed': completed,
        'in_progress': in_progress,
        'todo': todo
    })

@require_project_role('manage_project')
def update_project(project_id):
    data = request.get_json()
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if 'name' in data:
        project.name = data['name']
    if 'description' in data:
        project.description = data['description']
    db.session.commit()
    return jsonify({'message': 'Project updated', 'project': {'id': project.id, 'name': project.name, 'description': project.description}})

@require_project_role('delete_project')
def delete_project(project_id):
    user = getattr(request, 'user', None)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Only admin can delete projects'}), 403
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted'})

@require_project_role('transfer_admin')
def transfer_admin(project_id):
    data = request.get_json()
    new_admin_id = data.get('new_admin_id')
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    new_admin = User.query.get(new_admin_id)
    if not new_admin:
        return jsonify({'error': 'New admin not found'}), 404
    project.admin_id = new_admin_id
    db.session.commit()
    return jsonify({'message': 'Adminship transferred', 'project': {'id': project.id, 'admin_id': project.admin_id}})

def get_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    # Owner team
    owner_team = None
    owner_team_members = []
    if project.owner_team_id:
        owner_team = Team.query.get(project.owner_team_id)
        if owner_team:
            owner_team_members = [
                {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
                for tm in TeamMember.query.filter_by(team_id=owner_team.id)
                for user in [User.query.get(tm.user_id)] if user
            ]
    # Viewer teams (all associated teams except owner)
    associated_team_ids = [pt.team_id for pt in ProjectTeam.query.filter_by(project_id=project.id)]
    viewer_teams = []
    for tid in associated_team_ids:
        if tid == project.owner_team_id:
            continue
        team = Team.query.get(tid)
        if team:
            members = [
                {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
                for tm in TeamMember.query.filter_by(team_id=team.id)
                for user in [User.query.get(tm.user_id)] if user
            ]
            viewer_teams.append({
                'id': team.id,
                'name': team.name,
                'description': team.description,
                'members': members
            })
    return jsonify({'project': {
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'admin_id': project.admin_id,
        'owner_team': {
            'id': owner_team.id if owner_team else None,
            'name': owner_team.name if owner_team else None,
            'description': owner_team.description if owner_team else None,
            'members': owner_team_members
        } if owner_team else None,
        'viewer_teams': viewer_teams
    }})
