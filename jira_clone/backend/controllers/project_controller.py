from flask import request, jsonify
from models.db import db
from models.project import Project
from models.user import User
from models.project_member import ProjectMember
from models.team import Team
from models.item import Item
from models.board_column import BoardColumn
from models.project_team import ProjectTeam
from models.team_member import TeamMember
from models.role import Role 
from controllers.jwt_utils import jwt_required
from controllers.rbac import require_project_permission


@jwt_required
def create_project():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    user = getattr(request, 'user', None)
    if not name:
        return jsonify({'error': 'Project name is required'}), 400
    if not user:
        return jsonify({'error': 'User not found'}), 401
    
    # --- FIX: Remove check for insecure global role ---
    # The line "if user.role != 'admin':" has been removed.
    # Any authenticated user can create a project and become its admin.
    
    project = Project(name=name, description=description, admin_id=user.id)
    db.session.add(project)
    db.session.commit()
    # Add default board columns
    default_columns = ["To Do", "In Progress", "In Review", "Done"]
    for idx, col_name in enumerate(default_columns):
        column = BoardColumn(name=col_name, project_id=project.id, order=idx)
        db.session.add(column)
    db.session.commit()
    
    # --- FIX: Use the permissions defined in generate_demo_data.py ---
    # Add default project roles and permissions
    from generate_demo_data import create_roles_and_permissions
    create_roles_and_permissions(project)
    
    # Assign creator as project admin using the correct role_id
    admin_role = Role.query.filter_by(name='admin', project_id=project.id).first()
    if admin_role: # Ensure the role was created
        member = ProjectMember(project_id=project.id, user_id=user.id, role_id=admin_role.id)
        db.session.add(member)
        db.session.commit()

    return jsonify({'message': 'Project created', 'project': {'id': project.id, 'name': project.name, 'description': project.description, 'admin_id': project.admin_id}}), 201

def get_projects():
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    # Get projects where user is a member, regardless of legacy admin_id
    member_project_ids = db.session.query(ProjectMember.project_id).filter_by(user_id=user.id)
    projects = Project.query.filter(Project.id.in_(member_project_ids)).all()
    result = [{'id': p.id, 'name': p.name, 'description': p.description, 'admin_id': p.admin_id} for p in projects]
    return jsonify({'projects': result})

@jwt_required
def get_all_projects():
    projects = Project.query.all()
    result = [{'id': p.id, 'name': p.name, 'description': p.description, 'admin_id': p.admin_id} for p in projects]
    return jsonify({'projects': result})

@jwt_required
def get_dashboard_stats():
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401

    # Logic is fine, just needed JWT protection at the route level.
    project_count = ProjectMember.query.filter_by(user_id=user.id).count()
    task_count = Item.query.filter((Item.reporter_id == user.id) | (Item.assignee_id == user.id)).count()
    team_count = TeamMember.query.filter_by(user_id=user.id).count()

    return jsonify({
        'projectCount': project_count,
        'taskCount': task_count,
        'teamCount': team_count
    })

# --- FIX: Add permission check ---
@require_project_permission('view_tasks')
def get_project_progress(project_id):
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    total = Item.query.filter_by(project_id=project_id).count()
    completed = Item.query.filter_by(project_id=project_id, status='done').count()
    # ... (rest of the function is unchanged)
    return jsonify({
        'total': total,
        'completed': completed,
        'in_progress': Item.query.filter_by(project_id=project_id, status='inprogress').count(),
        'todo': Item.query.filter_by(project_id=project_id, status='todo').count()
    })

@require_project_permission('manage_project')
def update_project(project_id):
    data = request.get_json()
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    if 'name' in data:
        project.name = data['name']
    if 'description' in data:
        project.description = data['description']
    db.session.commit()
    return jsonify({'message': 'Project updated', 'project': {'id': project.id, 'name': project.name, 'description': project.description}})

@require_project_permission('delete_project')
def delete_project(project_id):
    # --- FIX: Remove redundant and insecure global role check ---
    # The check for "user.role != 'admin'" is now gone.
    # The decorator handles the permission check exclusively.
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({'message': 'Project deleted'})

@require_project_permission('transfer_admin')
def transfer_admin(project_id):
    # This function is more complex to fix fully as it relies on the legacy `admin_id`.
    # For now, the decorator secures it. A full fix would involve changing project member roles.
    data = request.get_json()
    new_admin_id = data.get('new_admin_id')
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    new_admin = User.query.get(new_admin_id)
    if not new_admin:
        return jsonify({'error': 'New admin not found'}), 404
    project.admin_id = new_admin_id
    db.session.commit()
    return jsonify({'message': 'Adminship transferred', 'project': {'id': project.id, 'admin_id': project.admin_id}})

# --- FIX: Add permission check ---
@require_project_permission('view_project_settings')
def get_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    # ... (rest of the function is unchanged, it's now just protected)
    owner_team = None
    if project.owner_team_id:
        owner_team = Team.query.get(project.owner_team_id)
    return jsonify({'project': {
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'admin_id': project.admin_id,
        'owner_team': {
            'id': owner_team.id if owner_team else None,
            'name': owner_team.name if owner_team else None
        } if owner_team else None,
    }})