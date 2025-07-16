from flask import Blueprint, request, jsonify
from controllers.project_controller import create_project, get_projects, get_dashboard_stats, update_project, delete_project, transfer_ownership, get_project_progress
from controllers.project_controller import get_project
from controllers.jwt_utils import jwt_required

projects_bp = Blueprint('projects', __name__)

projects_bp.route('/projects', methods=['POST'])(jwt_required(create_project))
projects_bp.route('/projects', methods=['GET'])(jwt_required(get_projects))
projects_bp.route('/projects/<int:project_id>', methods=['GET'])(jwt_required(get_project))
projects_bp.route('/dashboard/stats', methods=['GET'])(get_dashboard_stats)
projects_bp.route('/projects/<int:project_id>', methods=['PATCH'])(update_project)
projects_bp.route('/projects/<int:project_id>', methods=['DELETE'])(delete_project)
projects_bp.route('/projects/<int:project_id>/transfer-ownership', methods=['POST'])(transfer_ownership)
projects_bp.route('/projects/<int:project_id>/progress', methods=['GET'])(jwt_required(get_project_progress))
