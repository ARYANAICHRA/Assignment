from flask import Blueprint, request, jsonify
from controllers.project_controller import create_project, get_projects, get_dashboard_stats, update_project, delete_project, transfer_admin, get_project_progress, get_all_projects
from controllers.project_controller import get_project
from controllers.jwt_utils import jwt_required
from flask_cors import cross_origin

projects_bp = Blueprint('projects', __name__)

projects_bp.route('/projects', methods=['POST'])(jwt_required(create_project))
projects_bp.route('/projects', methods=['GET'])(jwt_required(get_projects))
projects_bp.route('/projects/<int:project_id>', methods=['GET'])(jwt_required(get_project))
projects_bp.route('/projects/<int:project_id>/progress', methods=['GET'])(jwt_required(get_project_progress))
projects_bp.route('/all-projects', methods=['GET'])(get_all_projects)

projects_bp.route('/dashboard/stats', methods=['GET'])(jwt_required(get_dashboard_stats))
projects_bp.route('/projects/<int:project_id>', methods=['PATCH'])(jwt_required(update_project))
projects_bp.route('/projects/<int:project_id>', methods=['DELETE'])(jwt_required(delete_project))
projects_bp.route('/projects/<int:project_id>/transfer-admin', methods=['POST'])(jwt_required(transfer_admin))


@projects_bp.route('/projects/<int:project_id>/owner_team', methods=['POST', 'OPTIONS'])
@cross_origin()
@jwt_required
def set_owner_team(project_id):
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
    return jsonify({'message': 'Owner team set', 'owner_team_id': team_id})