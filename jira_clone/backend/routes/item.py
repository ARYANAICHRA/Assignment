from flask import Blueprint
from controllers.item_controller import create_item, get_items, get_item, update_item, delete_item
from controllers.jwt_utils import jwt_required

item_bp = Blueprint('item', __name__)

item_bp.route('/projects/<int:project_id>/items', methods=['POST'])(jwt_required(create_item))
item_bp.route('/projects/<int:project_id>/items', methods=['GET'])(jwt_required(get_items))
item_bp.route('/items/<int:item_id>', methods=['GET'])(jwt_required(get_item))
item_bp.route('/items/<int:item_id>', methods=['PATCH'])(jwt_required(update_item))
item_bp.route('/items/<int:item_id>', methods=['DELETE'])(jwt_required(delete_item))
