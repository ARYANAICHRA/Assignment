from flask import Blueprint, request, jsonify
from controllers.project_controller import create_project, get_projects
from controllers.jwt_utils import jwt_required

projects_bp = Blueprint('projects', __name__)

projects_bp.route('/projects', methods=['POST'])(jwt_required(create_project))
projects_bp.route('/projects', methods=['GET'])(jwt_required(get_projects))
