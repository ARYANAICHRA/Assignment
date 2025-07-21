from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.db import db
from models.user import User
from controllers.jwt_utils import generate_jwt

def register_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')


    role = 'visitor' #

    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'error': 'User already exists'}), 409
    
    password_hash = generate_password_hash(password)
    user = User(username=username, email=email, password_hash=password_hash, role=role) 
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully'}), 201

def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
        
    token = generate_jwt(user)
    

    return jsonify({
        'message': 'Login successful', 
        'token': token, 
        'user': {
            'id': user.id, 
            'username': user.username, 
            'email': user.email
        }
    }), 200