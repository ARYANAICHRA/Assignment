from flask import request, jsonify
from models.db import db
from models.project import Project
from models.user import User
from models.project_member import ProjectMember

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
    result = [{'id': p.id, 'name': p.name, 'description': p.description} for p in projects]
    return jsonify({'projects': result})
