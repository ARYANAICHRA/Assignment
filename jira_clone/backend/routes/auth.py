from flask import Blueprint
from controllers.auth_controller import register_user, login_user
from controllers.jwt_utils import jwt_required
from flask_cors import cross_origin
from flask import jsonify, request

auth_bp = Blueprint('auth', __name__)

auth_bp.route('/register', methods=['POST'])(cross_origin()(register_user))
auth_bp.route('/login', methods=['POST'])(cross_origin()(login_user))


@auth_bp.route('/me', methods=['GET'])
@jwt_required
def me():
    print(f"/me endpoint hit. User: {getattr(request, 'user', None)}")
    user = request.user
    return jsonify({'id': user.id, 'username': user.username, 'email': user.email})
