from flask import Blueprint
from controllers.item_controller import create_item, get_items, get_item, update_item, delete_item, get_subtasks, create_subtask, update_subtask, delete_subtask, get_activity_logs, get_recent_activity, get_my_tasks, add_comment, edit_comment
# from controllers.jwt_utils import jwt_required  # Remove this import

item_bp = Blueprint('item', __name__)

print(f"[ROUTE REGISTRATION] Registering get_items: {get_items}")
item_bp.route('/projects/<int:project_id>/items', methods=['POST'])(create_item)
item_bp.route('/projects/<int:project_id>/items', methods=['GET'])(get_items)
item_bp.route('/items/<int:item_id>', methods=['GET'])(get_item)
item_bp.route('/items/<int:item_id>', methods=['PATCH'])(update_item)
item_bp.route('/items/<int:item_id>', methods=['DELETE'])(delete_item)

# Subtask endpoints
item_bp.route('/items/<int:item_id>/subtasks', methods=['GET'])(get_subtasks)
item_bp.route('/items/<int:item_id>/subtasks', methods=['POST'])(create_subtask)
item_bp.route('/subtasks/<int:subtask_id>', methods=['PATCH'])(update_subtask)
item_bp.route('/subtasks/<int:subtask_id>', methods=['DELETE'])(delete_subtask)

item_bp.route('/items/<int:item_id>/activity', methods=['GET'])(get_activity_logs)
item_bp.route('/activity', methods=['GET'])(get_recent_activity)
item_bp.route('/my-tasks', methods=['GET'])(get_my_tasks)
item_bp.route('/items/<int:item_id>/comments', methods=['POST'])(add_comment)
item_bp.route('/comments/<int:comment_id>', methods=['PATCH'])(edit_comment)
