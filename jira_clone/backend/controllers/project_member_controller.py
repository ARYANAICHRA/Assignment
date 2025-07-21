from flask import request, jsonify
from models.db import db
from models.project_member import ProjectMember
from models.user import User
from models.project import Project
from models.role import Role
from controllers.rbac import require_project_permission
from models.project_member import ProjectJoinRequest
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import jwt_required
from controllers.notification_controller import create_notification

@require_project_permission('add_remove_members')
def add_member(project_id):
    data = request.get_json()
    email = data.get('email')
    role_name = data.get('role', 'member')
    if not email:
        return jsonify({'error': 'User email required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if ProjectMember.query.filter_by(project_id=project_id, user_id=user.id).first():
        return jsonify({'error': 'User already a member'}), 409
    # Check for existing pending invitation
    if ProjectJoinRequest.query.filter_by(project_id=project_id, user_id=user.id, type='invite', status='pending').first():
        return jsonify({'error': 'Invitation already pending'}), 409
    # Find role
    role = Role.query.filter_by(name=role_name, project_id=project_id).first()
    if not role:
        return jsonify({'error': f'Role {role_name} not found for this project'}), 400
    invite = ProjectJoinRequest(
        project_id=project_id,
        user_id=user.id,
        type='invite',
        status='pending'
    )
    db.session.add(invite)
    db.session.commit()
    # Notify invited user
    create_notification(user.id, f"You have been invited to join project {project_id}.")
    return jsonify({'message': 'Invitation sent'})

@require_project_permission('add_remove_members')
def remove_member(project_id, user_id):
    member = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    db.session.delete(member)
    db.session.commit()
    return jsonify({'message': 'Member removed'})

@require_project_permission('add_remove_members')
def update_member_role(project_id, user_id):
    data = request.get_json()
    new_role_name = data.get('role')
    if not new_role_name:
        return jsonify({'error': 'Role name required'}), 400
    member = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    role = Role.query.filter_by(name=new_role_name, project_id=project_id).first()
    if not role:
        return jsonify({'error': f'Role {new_role_name} not found for this project'}), 400
    member.role_id = role.id
    db.session.commit()
    return jsonify({'message': 'Role updated'})

@require_project_permission('view_project_settings')
def list_members(project_id):
    members = ProjectMember.query.filter_by(project_id=project_id).all()
    result = []
    for m in members:
        user = User.query.get(m.user_id)
        result.append({
            'user_id': m.user_id,
            'username': user.username if user else None,
            'email': user.email if user else None,
            'role': m.role.name if m.role else None,
            'user_role': user.role if user else None
        })
    return jsonify({'members': result})

def request_to_join_project(project_id, user_id):
    # Check if already a member
    if ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first():
        return jsonify({'error': 'Already a member'}), 400
    # Check for existing pending request
    if ProjectJoinRequest.query.filter_by(project_id=project_id, user_id=user_id, type='request', status='pending').first():
        return jsonify({'error': 'Join request already pending'}), 400
    join_request = ProjectJoinRequest(
        project_id=project_id,
        user_id=user_id,
        type='request',
        status='pending'
    )
    db.session.add(join_request)
    db.session.commit()
    # Notify all managers/admins
    managers = ProjectMember.query.filter(
        ProjectMember.project_id == project_id,
        ProjectMember.role.has(Role.name.in_(['admin', 'manager']))
    ).all()
    for m in managers:
        create_notification(m.user_id, f"New join request for project {project_id}.")
    return jsonify({'message': 'Join request submitted'})

@require_project_permission('add_remove_members')
def list_join_requests(project_id):
    requests = ProjectJoinRequest.query.filter_by(project_id=project_id, type='request', status='pending').all()
    result = []
    for req in requests:
        user = User.query.get(req.user_id)
        result.append({
            'id': req.id,
            'user_id': req.user_id,
            'username': user.username if user else None,
            'email': user.email if user else None,
            'created_at': req.created_at.isoformat(),
            'status': req.status
        })
    return jsonify({'requests': result})

@require_project_permission('add_remove_members')
def accept_join_request(project_id, request_id):
    req = ProjectJoinRequest.query.filter_by(id=request_id, project_id=project_id, type='request', status='pending').first()
    if not req:
        return jsonify({'error': 'Request not found'}), 404
    # Add user to project as member (or default role)
    if ProjectMember.query.filter_by(project_id=project_id, user_id=req.user_id).first():
        req.status = 'accepted'
        db.session.commit()
        return jsonify({'message': 'User already a member, request marked accepted'})
    # Find default role
    role = Role.query.filter_by(name='member', project_id=project_id).first()
    if not role:
        return jsonify({'error': 'Default role not found'}), 400
    member = ProjectMember(project_id=project_id, user_id=req.user_id, role_id=role.id)
    db.session.add(member)
    req.status = 'accepted'
    db.session.commit()
    # Notify user
    create_notification(req.user_id, f"Your join request for project {project_id} was accepted.")
    return jsonify({'message': 'Request accepted, user added'})

@require_project_permission('add_remove_members')
def reject_join_request(project_id, request_id):
    req = ProjectJoinRequest.query.filter_by(id=request_id, project_id=project_id, type='request', status='pending').first()
    if not req:
        return jsonify({'error': 'Request not found'}), 404
    req.status = 'rejected'
    db.session.commit()
    # Notify user
    create_notification(req.user_id, f"Your join request for project {project_id} was rejected.")
    return jsonify({'message': 'Request rejected'})

def list_my_invitations(user_id):
    invites = ProjectJoinRequest.query.filter_by(user_id=user_id, type='invite', status='pending').all()
    result = []
    for inv in invites:
        result.append({
            'id': inv.id,
            'project_id': inv.project_id,
            'created_at': inv.created_at.isoformat(),
            'status': inv.status
        })
    return jsonify({'invitations': result})

def accept_invitation(project_id, invite_id, user_id):
    inv = ProjectJoinRequest.query.filter_by(id=invite_id, project_id=project_id, user_id=user_id, type='invite', status='pending').first()
    if not inv:
        return jsonify({'error': 'Invitation not found'}), 404
    # Add user to project as member (or default role)
    if ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first():
        inv.status = 'accepted'
        db.session.commit()
        return jsonify({'message': 'Already a member, invitation marked accepted'})
    role = Role.query.filter_by(name='member', project_id=project_id).first()
    if not role:
        return jsonify({'error': 'Default role not found'}), 400
    member = ProjectMember(project_id=project_id, user_id=user_id, role_id=role.id)
    db.session.add(member)
    inv.status = 'accepted'
    db.session.commit()
    # Notify all managers/admins
    managers = ProjectMember.query.filter(
        ProjectMember.project_id == project_id,
        ProjectMember.role.has(Role.name.in_(['admin', 'manager']))
    ).all()
    for m in managers:
        create_notification(m.user_id, f"User {user_id} accepted invitation to project {project_id}.")
    return jsonify({'message': 'Invitation accepted, user added'})

def reject_invitation(project_id, invite_id, user_id):
    inv = ProjectJoinRequest.query.filter_by(id=invite_id, project_id=project_id, user_id=user_id, type='invite', status='pending').first()
    if not inv:
        return jsonify({'error': 'Invitation not found'}), 404
    inv.status = 'rejected'
    db.session.commit()
    # Notify all managers/admins
    managers = ProjectMember.query.filter(
        ProjectMember.project_id == project_id,
        ProjectMember.role.has(Role.name.in_(['admin', 'manager']))
    ).all()
    for m in managers:
        create_notification(m.user_id, f"User {user_id} rejected invitation to project {project_id}.")
    return jsonify({'message': 'Invitation rejected'})
