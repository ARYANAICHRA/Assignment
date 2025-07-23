from flask import Blueprint
from controllers.board_column_controller import get_columns, create_column, update_column, delete_column
from flask_jwt_extended import jwt_required

column_bp = Blueprint('column', __name__)

@column_bp.route('/projects/<int:project_id>/columns', methods=['GET'])
@jwt_required()
def get_columns_route(project_id):
    return get_columns(project_id)

@column_bp.route('/projects/<int:project_id>/columns', methods=['POST'])
@jwt_required()
def create_column_route(project_id):
    return create_column(project_id)

@column_bp.route('/columns/<int:column_id>', methods=['PATCH'])
@jwt_required()
def update_column_route(column_id):
    return update_column(column_id)

@column_bp.route('/columns/<int:column_id>', methods=['DELETE'])
@jwt_required()
def delete_column_route(column_id):
    return delete_column(column_id)
