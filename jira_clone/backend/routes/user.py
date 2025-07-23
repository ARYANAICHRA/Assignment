from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint, jsonify
from models.user import User
from models.team_member import TeamMember
from models.role import Role
from controllers.rbac import is_admin
from models.project_member import ProjectMember, ProjectJoinRequest
from models.db import db

user_bp = Blueprint('user', __name__)

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    # Get teams
    from models.team_member import TeamMember
    from models.team import Team
    from models.role import Role
    team_memberships = TeamMember.query.filter_by(user_id=user_id).all()
    teams = []
    for tm in team_memberships:
        team = Team.query.get(tm.team_id)
        role = Role.query.get(tm.role_id) if tm.role_id else None
        if team:
            teams.append({
                'id': team.id,
                'name': team.name,
                'description': team.description,
                'manager_id': team.manager_id,
                'role': role.name if role else None
            })
    # Get projects
    from models.project_member import ProjectMember
    from models.project import Project
    project_memberships = ProjectMember.query.filter_by(user_id=user_id).all()
    projects = []
    for pm in project_memberships:
        project = Project.query.get(pm.project_id)
        role = Role.query.get(pm.role_id) if pm.role_id else None
        if project:
            projects.append({
                'id': project.id,
                'name': project.name,
                'description': project.description,
                'owner_team_id': project.owner_team_id,
                'role': role.name if role else None
            })
    return jsonify({'user': {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'teams': teams,
        'projects': projects
    }}), 200

@user_bp.route('/me/firm-permissions', methods=['GET'])
@jwt_required()
def get_my_firm_permissions():
    user_id = get_jwt_identity()
    # Find all firm-level roles for this user
    firm_roles = TeamMember.query.filter_by(user_id=user_id).join(Role).filter(Role.scope == 'firm').all()
    permissions = set()
    roles = []
    for membership in firm_roles:
        if membership.role:
            roles.append(membership.role.name)
            for perm in membership.role.permissions:
                permissions.add(perm.action)
    return jsonify({'permissions': list(permissions), 'roles': roles}), 200

@user_bp.route('/users/all', methods=['GET'])
@jwt_required()
def get_all_users():
    user_id = get_jwt_identity()
    if not is_admin(user_id):
        return jsonify({"error": "Forbidden: Admins only"}), 403
    users = User.query.all()
    result = [
        {
            'id': user.id,
            'username': user.username,
            'email': user.email
        } for user in users
    ]
    return jsonify({'users': result}), 200

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Forbidden: Admins only'}), 403
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    # Remove from TeamMember, ProjectMember, ProjectJoinRequest
    TeamMember.query.filter_by(user_id=user_id).delete()
    ProjectMember.query.filter_by(user_id=user_id).delete()
    ProjectJoinRequest.query.filter_by(user_id=user_id).delete()
    # Remove the user
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'}), 200
