from flask import request, jsonify
from models.db import db
from models.project_member import ProjectMember
from models.user import User
from models.project import Project
from controllers.rbac import require_project_role

@require_project_role('add_remove_members')
def add_member(project_id):
    data = request.get_json()
    email = data.get('email')
    role = data.get('role', 'member')
    if not email:
        return jsonify({'error': 'User email required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if not ProjectMember.query.filter_by(project_id=project_id, user_id=user.id).first():
        member = ProjectMember(project_id=project_id, user_id=user.id, role=role)
        db.session.add(member)
        db.session.commit()
        return jsonify({'message': 'Member added'}), 201
    return jsonify({'error': 'User already a member'}), 409

@require_project_role('add_remove_members')
def remove_member(project_id, user_id):
    member = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Member removed'})

@require_project_role('view_project_settings')
def list_members(project_id):
    members = ProjectMember.query.filter_by(project_id=project_id).all()
    result = []
    for m in members:
        user = User.query.get(m.user_id)
        result.append({
            'user_id': m.user_id,
            'username': user.username if user else None,
            'email': user.email if user else None,
            'role': m.role
        })
    return jsonify({'members': result})

@require_project_role('change_roles')
def change_role(project_id, user_id):
    data = request.get_json()
    role = data.get('role')
    member = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    member.role = role
    db.session.commit()
    return jsonify({'message': 'Role updated'})
