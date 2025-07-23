from flask import Blueprint, jsonify, request
from controllers.auth_controller import register_user, login_user
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from flask_cors import cross_origin

auth_bp = Blueprint('auth', __name__)

auth_bp.route('/register', methods=['POST'])(cross_origin()(register_user))
auth_bp.route('/login', methods=['POST'])(cross_origin()(login_user))

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'id': user.id, 'username': user.username, 'email': user.email}), 200
