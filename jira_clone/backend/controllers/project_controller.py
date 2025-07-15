from flask import request, jsonify
from models.db import db
from models.project import Project
from models.user import User
from models.project_member import ProjectMember
from models.team import Team
from models.item import Item
from controllers.jwt_utils import jwt_required
from controllers.rbac import require_project_role

def create_project():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    user = getattr(request, 'user', None)
    if not name:
        return jsonify({'error': 'Project name is required'}), 400
    if not user:
        return jsonify({'error': 'User not found'}), 401
    project = Project(name=name, description=description, owner_id=user.id)
    db.session.add(project)
    db.session.commit()
    return jsonify({'message': 'Project created', 'project': {'id': project.id, 'name': project.name, 'description': project.description, 'owner_id': project.owner_id}}), 201

def get_projects():
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    # Get projects where user is owner
    owned_projects = Project.query.filter_by(owner_id=user.id)
    # Get projects where user is a member
    member_project_ids = db.session.query(ProjectMember.project_id).filter_by(user_id=user.id)
    member_projects = Project.query.filter(Project.id.in_(member_project_ids))
    # Union of both
    projects = owned_projects.union(member_projects).all()
    result = [{'id': p.id, 'name': p.name, 'description': p.description, 'owner_id': p.owner_id} for p in projects]
    return jsonify({'projects': result})

@jwt_required
def get_dashboard_stats():
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401

    project_count = Project.query.filter_by(owner_id=user.id).count()
    task_count = Item.query.filter_by(reporter_id=user.id).count()
    team_count = Team.query.filter_by(owner_id=user.id).count() if hasattr(Team, 'owner_id') else 0

    return jsonify({
        'projectCount': project_count,
        'taskCount': task_count,
        'teamCount': team_count
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
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted'})

@require_project_role('transfer_ownership')
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
    return jsonify({'message': 'Ownership transferred', 'project': {'id': project.id, 'owner_id': project.owner_id}})
