from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.project_member import ProjectMember
from models.team_member import TeamMember
from models.role import Role
from models.permission import Permission
from models.item import Item
from models.user import User
from models.team import Team
from models.project import Project

def is_admin(user_id):
    user = User.query.get(user_id)
    admin_role = Role.query.filter_by(name='Firm Admin', scope='firm').first()
    # Check if user is the only admin (by email or username)
    return user and user.email == 'admin@example.com'


def has_permission(user_id, action, team_id=None, project_id=None):
    # 0. Admin override: admin user has all permissions
    if is_admin(user_id):
        return True

    # 1. Check firm-level roles (if any)
    firm_roles = Role.query.filter_by(scope='firm').all()
    firm_role_ids = [r.id for r in firm_roles]
    firm_memberships = TeamMember.query.filter_by(user_id=user_id).filter(TeamMember.role_id.in_(firm_role_ids)).all()
    for membership in firm_memberships:
        if any(p.action == action for p in membership.role.permissions):
            return True

    # 2. Check team-level roles
    if team_id:
        team_member = TeamMember.query.filter_by(user_id=user_id, team_id=team_id).first()
        if team_member and team_member.role and any(p.action == action for p in team_member.role.permissions):
            return True

    # 3. Check project-level roles
    if project_id:
        project_member = ProjectMember.query.filter_by(user_id=user_id, project_id=project_id).first()
        if project_member and project_member.role and any(p.action == action for p in project_member.role.permissions):
            return True

        return False


def require_permission(action, team_lookup=None, project_lookup=None):
    """
    Decorator for checking permissions at any scope.
    team_lookup: function to extract team_id from args/kwargs
    project_lookup: function to extract project_id from args/kwargs
    """
    def decorator(f):
        @jwt_required()
        @wraps(f)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            if not user_id:
                return jsonify({"error": "Unauthorized: No user ID found."}), 401
            team_id = team_lookup(*args, **kwargs) if team_lookup else None
            project_id = project_lookup(*args, **kwargs) if project_lookup else None
            if not has_permission(user_id, action, team_id=team_id, project_id=project_id):
                return jsonify({"error": f"Forbidden: You lack '{action}' permission."}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator

# For backward compatibility, you can keep the old require_project_permission, but update it to use has_permission

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
            if has_permission(user_id, action, project_id=project_id):
                return f(*args, **kwargs)
            # Check 'own' permission if allowed
            if allow_own:
                own_action = allow_own if isinstance(allow_own, str) else action.replace('any', 'own')
                if has_permission(user_id, own_action, project_id=project_id):
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