import jwt
from datetime import datetime, timedelta
from flask import request, jsonify, current_app
from functools import wraps
from models.user import User

def generate_jwt(user):
    payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token

def decode_jwt(token):
    print(f"Decoding JWT: {token}")
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        print(f"Decoded payload: {payload}")
        return payload
    except jwt.ExpiredSignatureError:
        print("JWT expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid JWT: {e}")
        return None

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        print(f"Authorization header: {auth_header}")
        if not auth_header or not auth_header.startswith('Bearer '):
            print("Missing or invalid token header")
            return jsonify({'error': 'Missing or invalid token'}), 401
        token = auth_header.split(' ')[1]
        payload = decode_jwt(token)
        if not payload:
            print("Invalid or expired token after decode")
            return jsonify({'error': 'Invalid or expired token'}), 401
        user = User.query.get(payload['user_id'])
        print(f"User from token: {user}")
        if not user:
            print("User not found in DB")
            return jsonify({'error': 'User not found'}), 404
        request.user = user
        return f(*args, **kwargs)
    return decorated
