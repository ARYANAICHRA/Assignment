from flask import Blueprint, request, jsonify
from controllers.project_controller import create_project, get_projects, get_dashboard_stats, update_project, delete_project, transfer_ownership, get_project_progress, get_all_projects
from controllers.project_controller import get_project
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from models.project_member import ProjectMember

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project_route():
    user_id = get_jwt_identity()
    from controllers.rbac import is_admin
    if not is_admin(user_id):
        return jsonify({'error': 'Forbidden: Admins only'}), 403
    return create_project()

@projects_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects_route():
    return get_projects()

@projects_bp.route('/projects/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_route(project_id):
    return get_project(project_id)

@projects_bp.route('/projects/<int:project_id>/progress', methods=['GET'])
@jwt_required()
def get_project_progress_route(project_id):
    return get_project_progress(project_id)

@projects_bp.route('/all-projects', methods=['GET'])
def get_all_projects_route():
    return get_all_projects()

@projects_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats_route():
    return get_dashboard_stats()

@projects_bp.route('/projects/<int:project_id>', methods=['PATCH'])
@jwt_required()
def update_project_route(project_id):
    return update_project(project_id)

@projects_bp.route('/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project_route(project_id):
    user_id = get_jwt_identity()
    from controllers.rbac import is_admin
    if not is_admin(user_id):
        return jsonify({'error': 'Forbidden: Admins only'}), 403
    return delete_project(project_id)

@projects_bp.route('/projects/<int:project_id>/transfer-ownership', methods=['POST'])
@jwt_required()
def transfer_ownership_route(project_id):
    return transfer_ownership(project_id)

@projects_bp.route('/projects/<int:project_id>/owner_team', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required()
def set_owner_team(project_id):
    user_id = get_jwt_identity()
    from controllers.rbac import is_admin
    if not is_admin(user_id):
        return jsonify({'error': 'Forbidden: Admins only'}), 403
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    team_id = data.get('team_id')
    from models.project import Project
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    project.owner_team_id = team_id
    from models.db import db
    db.session.commit()
    return jsonify({'message': 'Owner team set', 'owner_team_id': team_id}), 200

@projects_bp.route('/projects/<int:project_id>/my-role', methods=['GET'])
@jwt_required()
def get_my_project_permissions(project_id):
    user_id = get_jwt_identity()
    member = ProjectMember.query.filter_by(user_id=user_id, project_id=project_id).first()
    if not member or not member.role:
        return jsonify({'permissions': [], 'role': None}), 200
    perms = [p.action for p in member.role.permissions]
    return jsonify({'permissions': perms, 'role': member.role.name}), 200

@projects_bp.route('/projects/all', methods=['GET', 'OPTIONS'])
@cross_origin()
@jwt_required()
def get_projects_all_route():
    from controllers.rbac import is_admin
    user_id = get_jwt_identity()
    if request.method == 'OPTIONS':
        return '', 200
    if not is_admin(user_id):
        return jsonify({'error': 'Forbidden: Admins only'}), 403
    return get_all_projects()