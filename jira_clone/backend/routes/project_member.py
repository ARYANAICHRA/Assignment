from flask import Blueprint
from controllers.project_member_controller import add_member, remove_member, list_members, change_role
from controllers.jwt_utils import jwt_required

project_member_bp = Blueprint('project_member', __name__)

project_member_bp.route('/projects/<int:project_id>/members', methods=['POST'])(jwt_required(add_member))
project_member_bp.route('/projects/<int:project_id>/members/<int:user_id>', methods=['DELETE'])(jwt_required(remove_member))
project_member_bp.route('/projects/<int:project_id>/members', methods=['GET'])(jwt_required(list_members))
project_member_bp.route('/projects/<int:project_id>/members/<int:user_id>', methods=['PATCH'])(jwt_required(change_role))
