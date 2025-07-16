from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.project_member import ProjectMember

# Central RBAC rules
ROLE_PERMISSIONS = {
    "view_tasks": ["admin", "manager", "member", "viewer"],
    "create_task": ["admin", "manager", "member"],
    "edit_any_task": ["admin", "manager"],
    "edit_own_task": ["admin", "manager", "member"],
    "delete_any_task": ["admin", "manager"],
    "delete_own_task": ["admin", "manager", "member"],
    "manage_project": ["admin", "manager"],
    "add_remove_members": ["admin", "manager"],
    "change_roles": ["admin", "manager"],
    "view_project_settings": ["admin", "manager", "member", "viewer"],
    "delete_project": ["admin"],
    "transfer_ownership": ["admin"],
}

def has_permission(role, action):
    allowed_roles = ROLE_PERMISSIONS.get(action, [])
    return role in allowed_roles

def require_project_role(action, allow_own=False):
    def decorator(f):
        @jwt_required()
        @wraps(f)
        def wrapper(*args, **kwargs):
            print(f"[RBAC] kwargs: {kwargs}")
            print(f"[RBAC] request.view_args: {getattr(request, 'view_args', None)}")
            user_id = get_jwt_identity()
            if not user_id:
                print("[RBAC] No user_id found in JWT")
                return jsonify({"error": "Unauthorized: No user ID found."}), 401
            from models.user import User
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404
            request.user = user
            # Try to resolve project_id
            project_id = kwargs.get('project_id') or (getattr(request, 'view_args', {}) or {}).get('project_id')
            if not project_id:
                # Try to resolve from item_id if present
                item_id = kwargs.get('item_id') or (getattr(request, 'view_args', {}) or {}).get('item_id')
                if item_id:
                    from models.item import Item
                    item = Item.query.get(item_id)
                    if item:
                        project_id = item.project_id
            print(f"[RBAC] project_id resolved: {project_id}")
            if not project_id:
                print("[RBAC] Project ID not found in request")
                return jsonify({"error": "Project ID not found in request."}), 400
            from models.project_member import ProjectMember
            member = ProjectMember.query.filter_by(user_id=user_id, project_id=project_id).first()
            if not member:
                print(f"[RBAC] User {user_id} is not a member of project {project_id}")
                return jsonify({"error": "Forbidden: Not a project member."}), 403
            if not has_permission(member.role, action):
                print(f"[RBAC] Role '{member.role}' cannot perform '{action}'")
                return jsonify({"error": f"Forbidden: Role '{member.role}' cannot perform '{action}."}), 403
            request.project_role = member.role
            request.project_member = member
            return f(*args, **kwargs)
        return wrapper
    return decorator 