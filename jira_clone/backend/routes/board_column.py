from flask import Blueprint
from controllers.board_column_controller import get_columns, create_column, update_column, delete_column
from controllers.jwt_utils import jwt_required

column_bp = Blueprint('column', __name__)

column_bp.route('/projects/<int:project_id>/columns', methods=['GET'])(jwt_required(get_columns))
column_bp.route('/projects/<int:project_id>/columns', methods=['POST'])(jwt_required(create_column))
column_bp.route('/columns/<int:column_id>', methods=['PATCH'])(jwt_required(update_column))
column_bp.route('/columns/<int:column_id>', methods=['DELETE'])(jwt_required(delete_column))
