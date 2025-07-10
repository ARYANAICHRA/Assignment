from flask import Blueprint, jsonify
from models.user import User
from controllers.jwt_utils import jwt_required

user_bp = Blueprint('user', __name__)

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': {'id': user.id, 'username': user.username, 'email': user.email}})
