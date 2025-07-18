from flask import Blueprint, make_response
from controllers.item_controller import create_item, get_items, get_item, update_item, delete_item, get_subtasks, create_subtask, update_subtask, delete_subtask, get_activity_logs, get_recent_activity, get_my_tasks, add_comment, edit_comment
from controllers.jwt_utils import jwt_required

item_bp = Blueprint('item', __name__)

print(f"[ROUTE REGISTRATION] Registering get_items: {get_items}")

@item_bp.route('/projects/<int:project_id>/items', methods=['POST'])
@jwt_required
def create_item_route(project_id):
    return create_item(project_id)

@item_bp.route('/projects/<int:project_id>/items', methods=['GET'])
@jwt_required
def get_items_route(project_id):
    return get_items(project_id)

@item_bp.route('/<int:item_id>', methods=['GET'])
@jwt_required
def get_item_route(item_id):
    return get_item(item_id)

@item_bp.route('/<int:item_id>', methods=['PATCH'])
@jwt_required
def update_item_route(item_id):
    return update_item(item_id)

@item_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required
def delete_item_route(item_id):
    return delete_item(item_id)

# Add explicit OPTIONS handler for all item routes
@item_bp.route('/<int:item_id>', methods=['OPTIONS'])
def options_item(item_id):
    response = make_response('', 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization,Content-Type'
    return response

# Subtask endpoints
@item_bp.route('/<int:item_id>/subtasks', methods=['GET'])
@jwt_required
def get_subtasks_route(item_id):
    return get_subtasks(item_id)

@item_bp.route('/<int:item_id>/subtasks', methods=['POST'])
@jwt_required
def create_subtask_route(item_id):
    return create_subtask(item_id)

@item_bp.route('/subtasks/<int:subtask_id>', methods=['PATCH'])
@jwt_required
def update_subtask_route(subtask_id):
    return update_subtask(subtask_id)

@item_bp.route('/subtasks/<int:subtask_id>', methods=['DELETE'])
@jwt_required
def delete_subtask_route(subtask_id):
    return delete_subtask(subtask_id)

@item_bp.route('/<int:item_id>/activity', methods=['GET'])
@jwt_required
def get_activity_logs_route(item_id):
    return get_activity_logs(item_id)

@item_bp.route('/activity', methods=['GET'])
@jwt_required
def get_recent_activity_route():
    return get_recent_activity()

@item_bp.route('/my-tasks', methods=['GET'])
@jwt_required
def get_my_tasks_route():
    return get_my_tasks()

@item_bp.route('/<int:item_id>/comments', methods=['POST'])
@jwt_required
def add_comment_route(item_id):
    return add_comment(item_id)

@item_bp.route('/comments/<int:comment_id>', methods=['PATCH'])
@jwt_required
def edit_comment_route(comment_id):
    return edit_comment(comment_id)
