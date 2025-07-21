from flask import request, jsonify
from models.db import db
from models.board_column import BoardColumn
from controllers.rbac import require_project_permission

@require_project_permission('view_tasks')
def get_columns(project_id):
    columns = BoardColumn.query.filter_by(project_id=project_id).order_by(BoardColumn.order.asc()).all()
    result = [{'id': c.id, 'name': c.name, 'order': c.order} for c in columns]
    return jsonify({'columns': result})

@require_project_permission('manage_project')
def create_column(project_id):
    data = request.get_json()
    name = data.get('name')
    order = data.get('order', 0)
    if not name:
        return jsonify({'error': 'Column name required'}), 400
    column = BoardColumn(name=name, order=order, project_id=project_id)
    db.session.add(column)
    db.session.commit()
    return jsonify({'message': 'Column created', 'column': {'id': column.id, 'name': column.name}}), 201

@require_project_permission('manage_project')
def update_column(column_id):
    column = BoardColumn.query.get(column_id)
    if not column:
        return jsonify({'error': 'Column not found'}), 404
    data = request.get_json()
    if 'name' in data:
        column.name = data['name']
    if 'order' in data:
        column.order = data['order']
    db.session.commit()
    return jsonify({'message': 'Column updated'})

@require_project_permission('manage_project')
def delete_column(column_id):
    column = BoardColumn.query.get(column_id)
    if not column:
        return jsonify({'error': 'Column not found'}), 404
    db.session.delete(column)
    db.session.commit()
    return jsonify({'message': 'Column deleted'})