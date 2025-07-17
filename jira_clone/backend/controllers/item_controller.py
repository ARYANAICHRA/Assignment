import logging
from flask import request, jsonify
from models.db import db
from models.item import Item
from models.project import Project
from models.user import User
from models.activity_log import ActivityLog
from datetime import datetime
from controllers.rbac import require_project_role
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.comment import Comment
from sqlalchemy.orm import joinedload
from controllers.notification_controller import create_notification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_activity(item_id, user_id, action, details=None):
    if item_id is None:
        logger.warning("Tried to log activity with null item_id. Skipping log entry.")
        return
    log = ActivityLog(item_id=item_id, user_id=user_id, action=action, details=details)
    db.session.add(log)
    db.session.commit()

@jwt_required()
def get_recent_activity():
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'error': 'User not found'}), 401
    user = User.query.get(user_id)
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
    severity = data.get('severity')
    # --- Field validation ---
    allowed_status = {'todo', 'inprogress', 'done', 'inreview'}
    allowed_types = {'task', 'bug', 'epic', 'story'}
    allowed_priority = {'Low', 'Medium', 'High', 'Critical', None}
    if not title or not column_id:
        return jsonify({'error': 'Title and column_id required'}), 400
    if len(title) > 120:
        return jsonify({'error': 'Title too long (max 120 chars)'}), 400
    if status not in allowed_status:
        return jsonify({'error': f'Invalid status: {status}'}), 400
    if type not in allowed_types:
        return jsonify({'error': f'Invalid type: {type}'}), 400
    if priority not in allowed_priority:
        return jsonify({'error': f'Invalid priority: {priority}'}), 400
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
        parent_id=parent_id,
        severity=severity
    )
    db.session.add(item)
    db.session.commit()
    log_activity(item.id, reporter_id, 'created', f'Task created: {title}')
    # Notify assignee if assigned (task creation)
    if assignee_id:
        assignee = User.query.get(assignee_id)
        if assignee:
            create_notification(assignee_id, f"You have been assigned to task '{title}'")
    return jsonify({'message': 'Item created', 'item': {'id': item.id, 'title': item.title}}), 201

@require_project_role('view_tasks')
def get_items(project_id=None, **kwargs):
    item_type = request.args.get('type')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    query = Item.query.filter_by(project_id=project_id)
    if item_type:
        query = query.filter_by(type=item_type)
    total = query.count()
    items = query.offset(offset).limit(limit).all()
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
    return jsonify({'items': result, 'total': total, 'limit': limit, 'offset': offset})

@require_project_role('view_tasks')
def get_item(item_id):
    item = Item.query.options(
        joinedload(Item.comments),
        joinedload(Item.subtasks)
    ).get(item_id)
    if not item:
        return jsonify({'error': f'Item not found: {item_id}'}), 404
    # Fetch assignee and reporter names
    assignee = User.query.get(item.assignee_id) if item.assignee_id else None
    reporter = User.query.get(item.reporter_id) if item.reporter_id else None
    # Fetch comments
    comments = []
    for c in item.comments.all() if hasattr(item, 'comments') else []:
        author = User.query.get(c.user_id) if c.user_id else None
        comments.append({
            'id': c.id,
            'author_name': author.username if author else None,
            'content': c.content,
            'user_id': c.user_id,
            'created_at': c.created_at.isoformat() if hasattr(c, 'created_at') and c.created_at else None
        })
    # Fetch subtasks (children)
    subtasks = []
    if hasattr(item, 'subtasks'):
        for s in item.subtasks:
            subtasks.append({
                'id': s.id,
                'title': s.title,
                'status': s.status,
                'priority': s.priority,
                'due_date': s.due_date.isoformat() if s.due_date else None
            })
    # Fetch parent epic (if any)
    parent_epic = None
    if item.parent_id:
        parent = Item.query.get(item.parent_id)
        if parent:
            parent_epic = {
                'id': parent.id,
                'title': parent.title,
                'status': parent.status,
                'priority': parent.priority,
                'due_date': parent.due_date.isoformat() if parent.due_date else None
            }
    return jsonify({'item': {
        'id': item.id,
        'title': item.title,
        'description': item.description,
        'status': item.status,
        'priority': item.priority,
        'due_date': item.due_date.isoformat() if item.due_date else None,
        'parent_id': item.parent_id,
        'assignee_id': item.assignee_id,
        'assignee_name': assignee.username if assignee else None,
        'reporter_id': item.reporter_id,
        'reporter_name': reporter.username if reporter else None,
        'type': item.type,
        'column_id': item.column_id,
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'updated_at': item.updated_at.isoformat() if item.updated_at else None,
        'comments': comments,
        'subtasks': subtasks,
        'parent_epic': parent_epic
    }})

@require_project_role('edit_any_task', allow_own='edit_own_task')
def update_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'error': f'Item not found: {item_id}'}), 404
    data = request.get_json()
    changes = []
    # --- Field validation ---
    allowed_status = {'todo', 'inprogress', 'done', 'inreview'}
    allowed_types = {'task', 'bug', 'epic', 'story'}
    allowed_priority = {'Low', 'Medium', 'High', 'Critical', None}
    for field in ['title', 'description', 'status', 'assignee_id', 'column_id', 'priority', 'parent_id', 'type', 'severity']:
        if field in data:
            if field == 'title' and len(data['title']) > 120:
                return jsonify({'error': 'Title too long (max 120 chars)'}), 400
            if field == 'status' and data['status'] not in allowed_status:
                return jsonify({'error': f'Invalid status: {data["status"]}'}), 400
            if field == 'type' and data['type'] not in allowed_types:
                return jsonify({'error': f'Invalid type: {data["type"]}'}), 400
            if field == 'priority' and data['priority'] not in allowed_priority:
                return jsonify({'error': f'Invalid priority: {data["priority"]}'}), 400
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
    # Notify new assignee if changed (task update)
    old_assignee = item.assignee_id
    for field in ['title', 'description', 'status', 'assignee_id', 'column_id', 'priority', 'parent_id', 'type', 'severity']:
        if field in data:
            if field == 'assignee_id' and data['assignee_id'] != old_assignee:
                new_assignee = data['assignee_id']
                if new_assignee:
                    assignee_user = User.query.get(new_assignee)
                    if assignee_user:
                        create_notification(new_assignee, f"You have been assigned to task '{item.title}'")
    return jsonify({'message': 'Item updated'})

@require_project_role('delete_any_task', allow_own='delete_own_task')
def delete_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'error': f'Item not found: {item_id}'}), 404
    # Log the deletion before deleting the item and its logs
    log_activity(item_id, getattr(request.user, 'id', None), 'deleted', 'Task deleted')
    for log in item.activity_logs.all():
        db.session.delete(log)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deleted'})

# --- Subtask Endpoints ---
@require_project_role('view_tasks')
def get_subtasks(item_id):
    parent = Item.query.get(item_id)
    if not parent:
        return jsonify({'error': 'Parent task not found'}), 404
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    subtasks_query = parent.subtasks.offset(offset).limit(limit)
    result = [{
        'id': s.id,
        'title': s.title,
        'status': s.status,
        'priority': s.priority,
        'due_date': s.due_date.isoformat() if s.due_date else None
    } for s in subtasks_query]
    total = parent.subtasks.count()
    return jsonify({'subtasks': result, 'total': total, 'limit': limit, 'offset': offset})

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
    # Notify assignee if assigned (subtask creation)
    if data.get('assignee_id'):
        assignee = User.query.get(data.get('assignee_id'))
        if assignee:
            create_notification(data.get('assignee_id'), f"You have been assigned to subtask '{title}'")
    return jsonify({'message': 'Subtask created', 'subtask': {'id': subtask.id, 'title': subtask.title}}), 201

@require_project_role('edit_any_task')
def update_subtask(subtask_id):
    subtask = Item.query.get(subtask_id)
    if not subtask or not subtask.parent_id:
        return jsonify({'error': 'Subtask not found'}), 404
    data = request.get_json()
    changes = []
    old_assignee = subtask.assignee_id
    for field in ['title', 'description', 'status', 'assignee_id', 'priority', 'type']:
        if field in data:
            old = getattr(subtask, field)
            new = data[field]
            if old != new:
                changes.append(f'{field}: {old} -> {new}')
            setattr(subtask, field, new)
            if field == 'assignee_id' and new != old_assignee:
                if new:
                    assignee_user = User.query.get(new)
                    if assignee_user:
                        create_notification(new, f"You have been assigned to subtask '{subtask.title}'")
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

@jwt_required()
def get_my_tasks():
    print('[get_my_tasks] Called')
    user_id = get_jwt_identity()
    print(f'[get_my_tasks] user_id: {user_id}')
    if not user_id:
        print('[get_my_tasks] No user_id found')
        return jsonify({'error': 'User not found'}), 401
    try:
        tasks = Item.query.filter(
            (Item.assignee_id == user_id) | (Item.reporter_id == user_id)
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
        print(f'[get_my_tasks] Returning {len(result)} tasks')
        return jsonify({'tasks': result})
    except Exception as e:
        print(f'[get_my_tasks] Exception: {e}')
        return jsonify({'error': 'Internal server error'}), 500

@jwt_required
def add_comment(item_id):
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    data = request.get_json()
    content = data.get('content')
    if not content:
        return jsonify({'error': 'Content required'}), 400
    comment = Comment(item_id=item_id, user_id=user.id, content=content)
    db.session.add(comment)
    db.session.commit()
    # Notify assignee and reporter when a comment is added
    item = Item.query.get(item_id)
    if item:
        notified_users = set()
        if item.assignee_id and item.assignee_id != user.id:
            create_notification(item.assignee_id, f"New comment on task '{item.title}'")
            notified_users.add(item.assignee_id)
        if item.reporter_id and item.reporter_id != user.id and item.reporter_id not in notified_users:
            create_notification(item.reporter_id, f"New comment on task '{item.title}'")
    return jsonify({'message': 'Comment added', 'comment': {'id': comment.id, 'content': comment.content, 'user_id': comment.user_id, 'author_name': user.username, 'created_at': comment.created_at.isoformat()}}), 201

@jwt_required
def edit_comment(comment_id):
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({'error': 'User not found'}), 401
    comment = Comment.query.get(comment_id)
    if not comment:
        return jsonify({'error': 'Comment not found'}), 404
    if comment.user_id != user.id:
        return jsonify({'error': 'You can only edit your own comments'}), 403
    data = request.get_json()
    content = data.get('content')
    if not content:
        return jsonify({'error': 'Content required'}), 400
    comment.content = content
    db.session.commit()
    return jsonify({'message': 'Comment updated', 'comment': {'id': comment.id, 'content': comment.content, 'user_id': comment.user_id, 'created_at': comment.created_at}})
