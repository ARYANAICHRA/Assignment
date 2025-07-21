from flask import request, jsonify
from models.project import Project
from models.item import Item
from models.project_member import ProjectMember
from models.user import User
from controllers.rbac import require_project_permission # Import the decorator

# --- FIX: Add authorization to ensure user is a project member ---
@require_project_permission('view_tasks')
def get_project_report(project_id):
    # The decorator handles all permission checks.
    # The rest of the function logic is unchanged.
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    # ... (rest of the function is unchanged)
    items = Item.query.filter_by(project_id=project_id).all()
    members = ProjectMember.query.filter_by(project_id=project_id).all()
    member_details = []
    for m in members:
        user = User.query.get(m.user_id)
        if user:
            member_details.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': m.role.name if m.role else None
            })
    status_counts = {}
    for item in items:
        status_counts[item.status] = status_counts.get(item.status, 0) + 1
    report = {
        'project': { 'id': project.id, 'name': project.name },
        'members': member_details,
        'stats': {
            'total': len(items),
            'done': status_counts.get('done', 0),
        }
    }
    return jsonify({'report': report})