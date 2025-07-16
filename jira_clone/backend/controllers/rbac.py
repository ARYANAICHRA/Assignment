from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.project_member import ProjectMember

# Central RBAC rules
ROLE_PERMISSIONS = {
    "view_tasks": ["admin", "manager", "member", "visitor"],
    "create_task": ["admin", "manager", "member"],
    "edit_any_task": ["admin", "manager"],
    "edit_own_task": ["admin", "manager", "member"],
    "delete_any_task": ["admin", "manager"],
    "delete_own_task": ["admin", "manager", "member"],
    "manage_project": ["admin", "manager"],
    "add_remove_members": ["admin", "manager"],
    "change_roles": ["admin", "manager"],
    "view_project_settings": ["admin", "manager", "member", "visitor"],
    "delete_project": ["admin"],
    "transfer_admin": ["admin"],
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
            item_id = kwargs.get('item_id') or (getattr(request, 'view_args', {}) or {}).get('item_id')
            if not project_id and item_id:
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
            # Main permission check
            if has_permission(member.role, action):
                request.project_role = member.role
                request.project_member = member
                return f(*args, **kwargs)
            # 'Own' permission check
            if allow_own:
                own_action = allow_own if isinstance(allow_own, str) else action.replace('any', 'own')
                print(f"[RBAC DEBUG] Checking own permission: member.role={member.role}, own_action={own_action}, allowed_roles={ROLE_PERMISSIONS.get(own_action, [])}")
                if has_permission(member.role, own_action):
                    # Check if user is reporter or assignee for the item
                    if item_id:
                        from models.item import Item
                        item = Item.query.get(item_id)
                        if item and int(user_id) in [item.reporter_id, item.assignee_id]:
                            request.project_role = member.role
                            request.project_member = member
                            return f(*args, **kwargs)
                        else:
                            print(f"[RBAC DEBUG] user_id: {user_id}, item.reporter_id: {getattr(item, 'reporter_id', None)}, item.assignee_id: {getattr(item, 'assignee_id', None)}")
                            return jsonify({"error": f"Forbidden: You are not the reporter or assignee of this item."}), 403
                print(f"[RBAC] Role '{member.role}' cannot perform '{action}' or '{own_action}' on this item")
                return jsonify({"error": f"Forbidden: Role '{member.role}' cannot perform '{action}' or '{own_action}' on this item."}), 403
            print(f"[RBAC] Role '{member.role}' cannot perform '{action}'")
            return jsonify({"error": f"Forbidden: Role '{member.role}' cannot perform '{action}."}), 403
        return wrapper
    return decorator 