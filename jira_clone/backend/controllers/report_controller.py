from flask import request, jsonify
from models.project import Project
from models.item import Item
from models.project_member import ProjectMember
from models.user import User
from controllers.rbac import require_project_permission 

@require_project_permission('view_tasks')
def get_project_report(project_id):

    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
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
    # Add tasks field for frontend
    tasks = [
        {
            'id': item.id,
            'title': item.title,
            'type': item.type,
            'status': item.status,
            'assignee_id': item.assignee_id,
            'reporter_id': item.reporter_id,
            'due_date': item.due_date.isoformat() if item.due_date else None
        }
        for item in items
    ]
    report = {
        'project': { 'id': project.id, 'name': project.name },
        'members': member_details,
        'stats': {
            'total': len(items),
            'done': status_counts.get('done', 0),
            'inprogress': status_counts.get('inprogress', 0),
            'inreview': status_counts.get('inreview', 0),
            'todo': status_counts.get('todo', 0),
        },
        'tasks': tasks
    }
    return jsonify({'report': report}), 200