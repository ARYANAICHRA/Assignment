from flask import request, jsonify
from models.db import db
from models.item import Item
from models.project import Project
from models.user import User

def create_item(project_id):
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    type = data.get('type', 'task')
    status = data.get('status', 'todo')
    column_id = data.get('column_id')
    reporter_id = getattr(request.user, 'id', None)
    assignee_id = data.get('assignee_id')
    if not title or not column_id:
        return jsonify({'error': 'Title and column_id required'}), 400
    item = Item(title=title, description=description, type=type, status=status, column_id=column_id, project_id=project_id, reporter_id=reporter_id, assignee_id=assignee_id)
    db.session.add(item)
    db.session.commit()
    return jsonify({'message': 'Item created', 'item': {'id': item.id, 'title': item.title}}), 201

def get_items(project_id):
    items = Item.query.filter_by(project_id=project_id).all()
    result = [{'id': i.id, 'title': i.title, 'status': i.status, 'assignee_id': i.assignee_id} for i in items]
    return jsonify({'items': result})

def get_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    return jsonify({'item': {'id': item.id, 'title': item.title, 'description': item.description, 'status': item.status}})

def update_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    data = request.get_json()
    for field in ['title', 'description', 'status', 'assignee_id', 'column_id']:
        if field in data:
            setattr(item, field, data[field])
    db.session.commit()
    return jsonify({'message': 'Item updated'})

def delete_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deleted'})
