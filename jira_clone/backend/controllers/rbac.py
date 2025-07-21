from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.project_member import ProjectMember
from models.role import Role
from models.permission import Permission
from models.item import Item

def user_has_permission(user_id, project_id, action):
    member = ProjectMember.query.filter_by(user_id=user_id, project_id=project_id).first()
    if not member or not member.role:
        return False
    return any(p.action == action for p in member.role.permissions)

def require_project_permission(action, allow_own=None):
    def decorator(f):
        @jwt_required()
        @wraps(f)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            if not user_id:
                return jsonify({"error": "Unauthorized: No user ID found."}), 401
            project_id = kwargs.get('project_id') or (getattr(request, 'view_args', {}) or {}).get('project_id')
            item_id = kwargs.get('item_id') or (getattr(request, 'view_args', {}) or {}).get('item_id')
            if not project_id and item_id:
                item = Item.query.get(item_id)
                if item:
                    project_id = item.project_id
            if not project_id:
                return jsonify({"error": "Project ID not found in request."}), 400
            # Check main permission
            if user_has_permission(user_id, project_id, action):
                return f(*args, **kwargs)
            # Check 'own' permission if allowed
            if allow_own:
                own_action = allow_own if isinstance(allow_own, str) else action.replace('any', 'own')
                if user_has_permission(user_id, project_id, own_action):
                    # Check if user is the owner (reporter or assignee) of the item
                    if item_id:
                        item = Item.query.get(item_id)
                        if item and int(user_id) in [item.reporter_id, item.assignee_id]:
                            return f(*args, **kwargs)
                        else:
                            return jsonify({"error": "Forbidden: You are not the reporter or assignee of this item."}), 403
            return jsonify({"error": f"Forbidden: You lack '{action}' permission."}), 403
        return wrapper
    return decorator 