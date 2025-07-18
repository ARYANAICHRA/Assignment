from flask import request, jsonify
from models.project import Project
from models.item import Item
from models.project_member import ProjectMember
from models.user import User

def get_project_report(project_id):
    # Fetch project
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    # Fetch tasks
    items = Item.query.filter_by(project_id=project_id).all()
    # Fetch members
    members = ProjectMember.query.filter_by(project_id=project_id).all()
    member_details = []
    for m in members:
        user = User.query.get(m.user_id)
        if user:
            member_details.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': m.role
            })
    # Task stats
    status_counts = {}
    for item in items:
        status_counts[item.status] = status_counts.get(item.status, 0) + 1
    total_tasks = len(items)
    completed = status_counts.get('done', 0)
    inprogress = status_counts.get('inprogress', 0)
    inreview = status_counts.get('inreview', 0)
    todo = status_counts.get('todo', 0)
    # Compose report
    report = {
        'project': {
            'id': project.id,
            'name': project.name,
            'description': getattr(project, 'description', ''),
        },
        'members': member_details,
        'tasks': [{
            'id': item.id,
            'title': item.title,
            'status': item.status,
            'assignee_id': item.assignee_id,
            'reporter_id': item.reporter_id,
            'due_date': str(item.due_date) if item.due_date else None,
            'type': item.type
        } for item in items],
        'stats': {
            'total': total_tasks,
            'done': completed,
            'inprogress': inprogress,
            'inreview': inreview,
            'todo': todo
        }
    }
    return jsonify({'report': report}) 