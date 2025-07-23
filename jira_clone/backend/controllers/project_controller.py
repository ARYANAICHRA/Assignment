from flask import request, jsonify
from models.db import db
from models.project import Project
from models.user import User
from models.project_member import ProjectMember
from models.team import Team
from models.item import Item
from models.board_column import BoardColumn
from models.team_member import TeamMember
from models.role import Role 
from controllers.rbac import require_project_permission, require_permission
from flask_jwt_extended import get_jwt_identity, jwt_required


@require_permission('create_project', team_lookup=lambda *a, **k: request.get_json().get('owner_team_id'))
def create_project():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    owner_team_id = data.get('owner_team_id')
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not name:
        return jsonify({'error': 'Project name is required'}), 400
    if not user:
        return jsonify({'error': 'User not found'}), 401
    if not owner_team_id:
        return jsonify({'error': 'Owner team ID is required'}), 400
    # Ensure the team exists
    team = Team.query.get(owner_team_id)
    if not team:
        return jsonify({'error': 'Owner team not found'}), 404
    project = Project(name=name, description=description, owner_id=team.manager_id, owner_team_id=owner_team_id)
    db.session.add(project)
    db.session.commit()
    # add default columns
    default_columns = ["To Do", "In Progress", "In Review", "Done"]
    for idx, col_name in enumerate(default_columns):
        column = BoardColumn(name=col_name, project_id=project.id, order=idx)
        db.session.add(column)
    db.session.commit()

    # Assign project roles to team members
    owner_role = Role.query.filter_by(name='Project Owner', scope='project').first()
    contributor_role = Role.query.filter_by(name='Project Contributor', scope='project').first()
    team_members = TeamMember.query.filter_by(team_id=owner_team_id).all()
    for tm in team_members:
        if tm.user_id == team.manager_id:
            # Team manager becomes Project Owner
            if owner_role:
                pm = ProjectMember(project_id=project.id, user_id=tm.user_id, role_id=owner_role.id)
                db.session.add(pm)
        else:
            # Other members become Project Contributor
            if contributor_role:
                pm = ProjectMember(project_id=project.id, user_id=tm.user_id, role_id=contributor_role.id)
                db.session.add(pm)
    db.session.commit()

    return jsonify({'message': 'Project created', 'project_id': project.id}), 201

def get_projects():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    # Get all ProjectMember entries for this user (including visitors)
    memberships = ProjectMember.query.filter_by(user_id=user.id).all()
    project_ids = [m.project_id for m in memberships]
    projects = Project.query.filter(Project.id.in_(project_ids)).all()
    # For each project, get the user's role
    result = []
    for p in projects:
        pm = next((m for m in memberships if m.project_id == p.id), None)
        role_name = pm.role.name if pm and pm.role else None
        result.append({'id': p.id, 'name': p.name, 'description': p.description, 'owner_id': p.owner_id, 'role': role_name})
    return jsonify({'projects': result}), 200

def get_all_projects():
    projects = Project.query.all()
    result = [{'id': p.id, 'name': p.name, 'description': p.description, 'owner_id': p.owner_id, 'owner_team_id': p.owner_team_id} for p in projects]
    return jsonify({'projects': result}), 200

@jwt_required()
def get_dashboard_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 401

    project_count = ProjectMember.query.filter_by(user_id=user.id).count()
    task_count = Item.query.filter((Item.reporter_id == user.id) | (Item.assignee_id == user.id)).count()
    team_count = TeamMember.query.filter_by(user_id=user.id).count()

    return jsonify({
        'projectCount': project_count,
        'taskCount': task_count,
        'teamCount': team_count
    }), 200

@require_project_permission('view_tasks')
def get_project_progress(project_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    total = Item.query.filter_by(project_id=project_id).count()
    completed = Item.query.filter_by(project_id=project_id, status='done').count()
    return jsonify({
        'total': total,
        'completed': completed,
        'in_progress': Item.query.filter_by(project_id=project_id, status='inprogress').count(),
        'todo': Item.query.filter_by(project_id=project_id, status='todo').count()
    }), 200

@require_project_permission('manage_project')
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
    return jsonify({'message': 'Project updated', 'project': {'id': project.id, 'name': project.name, 'description': project.description}}), 200

@require_project_permission('delete_project')
def delete_project(project_id):

    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted'}), 200

@require_project_permission('transfer_ownership')
def transfer_ownership(project_id):
    data = request.get_json()
    new_owner_id = data.get('new_owner_id')
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    new_owner = User.query.get(new_owner_id)
    if not new_owner:
        return jsonify({'error': 'New owner not found'}), 404
    project.owner_id = new_owner_id
    db.session.commit()
    return jsonify({'message': 'Ownership transferred', 'project': {'id': project.id, 'owner_id': project.owner_id}}), 200

@require_project_permission('view_project_settings')
def get_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    owner_team = None
    if project.owner_team_id:
        owner_team = Team.query.get(project.owner_team_id)
    return jsonify({'project': {
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'owner_id': project.owner_id,
        'owner_team': {
            'id': owner_team.id if owner_team else None,
            'name': owner_team.name if owner_team else None
        } if owner_team else None,
    }}), 200