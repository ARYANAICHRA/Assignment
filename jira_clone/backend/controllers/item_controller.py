from flask import request, jsonify
from models.db import db
from models.item import Item
from models.project import Project
from models.user import User
from models.activity_log import ActivityLog
from datetime import datetime
from controllers.rbac import require_project_role
from controllers.jwt_utils import jwt_required

def log_activity(item_id, user_id, action, details=None):
    log = ActivityLog(item_id=item_id, user_id=user_id, action=action, details=details)
    db.session.add(log)
    db.session.commit()

@jwt_required
def get_recent_activity():
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    # Get recent activity logs for items the user is involved with (reporter or assignee)
    logs = ActivityLog.query.join(Item, ActivityLog.item_id == Item.id)
    logs = logs.filter((Item.reporter_id == user.id) | (Item.assignee_id == user.id))
    logs = logs.order_by(ActivityLog.created_at.desc()).limit(20).all()
    result = []
    for log in logs:
        result.append({
            'id': log.id,
            'item_id': log.item_id,
            'user_id': log.user_id,
            'action': log.action,
            'details': log.details,
            'created_at': log.created_at.isoformat()
        })
    return jsonify({'activity': result})

@require_project_role('create_task')
def create_item(project_id):
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    type = data.get('type', 'task')
    status = data.get('status', 'todo')
    column_id = data.get('column_id')
    reporter_id = getattr(request.user, 'id', None)
    assignee_id = data.get('assignee_id')
    due_date = data.get('due_date')
    priority = data.get('priority')
    parent_id = data.get('parent_id')
    if not title or not column_id:
        return jsonify({'error': 'Title and column_id required'}), 400
    item = Item(
        title=title,
        description=description,
        type=type,
        status=status,
        column_id=column_id,
        project_id=project_id,
        reporter_id=reporter_id,
        assignee_id=assignee_id,
        due_date=datetime.strptime(due_date, '%Y-%m-%d').date() if due_date else None,
        priority=priority,
        parent_id=parent_id
    )
    db.session.add(item)
    db.session.commit()
    log_activity(item.id, reporter_id, 'created', f'Task created: {title}')
    # Notify assignee if assigned
    if assignee_id:
        pass # Removed notification logic
    return jsonify({'message': 'Item created', 'item': {'id': item.id, 'title': item.title}}), 201

@require_project_role('view_tasks')
def get_items(project_id=None, **kwargs):
    item_type = request.args.get('type')
    query = Item.query.filter_by(project_id=project_id)
    if item_type:
        query = query.filter_by(type=item_type)
    items = query.all()
    result = [{
        'id': i.id,
        'title': i.title,
        'status': i.status,
        'assignee_id': i.assignee_id,
        'priority': i.priority,
        'due_date': i.due_date.isoformat() if i.due_date else None,
        'parent_id': i.parent_id,
        'type': i.type
    } for i in items]
    return jsonify({'items': result})

@require_project_role('view_tasks')
def get_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    return jsonify({'item': {
        'id': item.id,
        'title': item.title,
        'description': item.description,
        'status': item.status,
        'priority': item.priority,
        'due_date': item.due_date.isoformat() if item.due_date else None,
        'parent_id': item.parent_id,
        'assignee_id': item.assignee_id,
        'reporter_id': item.reporter_id,
        'type': item.type,
        'column_id': item.column_id
    }})

@require_project_role('edit_any_task')
def update_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    data = request.get_json()
    changes = []
    old_assignee = item.assignee_id
    for field in ['title', 'description', 'status', 'assignee_id', 'column_id', 'priority', 'parent_id', 'type']:
        if field in data:
            old = getattr(item, field)
            new = data[field]
            if old != new:
                changes.append(f'{field}: {old} -> {new}')
            setattr(item, field, new)
    if 'due_date' in data:
        old = item.due_date.isoformat() if item.due_date else None
        new = data['due_date']
        if old != new:
            changes.append(f'due_date: {old} -> {new}')
        item.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None
    db.session.commit()
    if changes:
        log_activity(item.id, getattr(request.user, 'id', None), 'updated', '; '.join(changes))
    # Notify new assignee if changed
    if 'assignee_id' in data and data['assignee_id'] and data['assignee_id'] != old_assignee:
        pass # Removed notification logic
    # Notify previous assignee if unassigned
    if 'assignee_id' in data and not data['assignee_id'] and old_assignee:
        pass # Removed notification logic
    return jsonify({'message': 'Item updated'})

@require_project_role('delete_any_task')
def delete_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    db.session.delete(item)
    db.session.commit()
    log_activity(item_id, getattr(request.user, 'id', None), 'deleted', 'Task deleted')
    # Notify assignee if task deleted
    if item.assignee_id:
        pass # Removed notification logic
    return jsonify({'message': 'Item deleted'})

# --- Subtask Endpoints ---
@require_project_role('view_tasks')
def get_subtasks(item_id):
    parent = Item.query.get(item_id)
    if not parent:
        return jsonify({'error': 'Parent task not found'}), 404
    subtasks = parent.subtasks.all()
    result = [{
        'id': s.id,
        'title': s.title,
        'status': s.status,
        'priority': s.priority,
        'due_date': s.due_date.isoformat() if s.due_date else None
    } for s in subtasks]
    return jsonify({'subtasks': result})

@require_project_role('create_task')
def create_subtask(item_id):
    parent = Item.query.get(item_id)
    if not parent:
        return jsonify({'error': 'Parent task not found'}), 404
    data = request.get_json()
    title = data.get('title')
    if not title:
        return jsonify({'error': 'Subtask title required'}), 400
    subtask = Item(
        title=title,
        description=data.get('description'),
        type=data.get('type', 'task'),
        status=data.get('status', 'todo'),
        column_id=parent.column_id,
        project_id=parent.project_id,
        reporter_id=getattr(request.user, 'id', None),
        assignee_id=data.get('assignee_id'),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
        priority=data.get('priority'),
        parent_id=parent.id
    )
    db.session.add(subtask)
    db.session.commit()
    log_activity(subtask.id, getattr(request.user, 'id', None), 'created', f'Subtask created: {title}')
    return jsonify({'message': 'Subtask created', 'subtask': {'id': subtask.id, 'title': subtask.title}}), 201

@require_project_role('edit_any_task')
def update_subtask(subtask_id):
    subtask = Item.query.get(subtask_id)
    if not subtask or not subtask.parent_id:
        return jsonify({'error': 'Subtask not found'}), 404
    data = request.get_json()
    changes = []
    for field in ['title', 'description', 'status', 'assignee_id', 'priority', 'type']:
        if field in data:
            old = getattr(subtask, field)
            new = data[field]
            if old != new:
                changes.append(f'{field}: {old} -> {new}')
            setattr(subtask, field, new)
    if 'due_date' in data:
        old = subtask.due_date.isoformat() if subtask.due_date else None
        new = data['due_date']
        if old != new:
            changes.append(f'due_date: {old} -> {new}')
        subtask.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None
    db.session.commit()
    if changes:
        log_activity(subtask.id, getattr(request.user, 'id', None), 'updated', '; '.join(changes))
    return jsonify({'message': 'Subtask updated'})

@require_project_role('delete_any_task')
def delete_subtask(subtask_id):
    subtask = Item.query.get(subtask_id)
    if not subtask or not subtask.parent_id:
        return jsonify({'error': 'Subtask not found'}), 404
    db.session.delete(subtask)
    db.session.commit()
    log_activity(subtask_id, getattr(request.user, 'id', None), 'deleted', 'Subtask deleted')
    return jsonify({'message': 'Subtask deleted'})

# --- Activity Log Endpoint ---
@require_project_role('view_tasks')
def get_activity_logs(item_id):
    logs = ActivityLog.query.filter_by(item_id=item_id).order_by(ActivityLog.created_at.asc()).all()
    result = [{
        'id': log.id,
        'user_id': log.user_id,
        'action': log.action,
        'details': log.details,
        'created_at': log.created_at.isoformat()
    } for log in logs]
    return jsonify({'activity_logs': result})

@jwt_required
def get_my_tasks():
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    tasks = Item.query.filter(
        (Item.assignee_id == user.id) | (Item.reporter_id == user.id)
    ).order_by(Item.created_at.desc()).all()
    result = []
    for task in tasks:
        result.append({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'type': task.type,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'project_id': task.project_id,
            'assignee_id': task.assignee_id,
            'reporter_id': task.reporter_id,
            'created_at': task.created_at.isoformat(),
            'updated_at': task.updated_at.isoformat() if task.updated_at else None,
        })
    return jsonify({'tasks': result})
