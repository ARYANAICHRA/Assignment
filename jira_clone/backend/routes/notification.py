from flask import Blueprint
from controllers.notification_controller import get_notifications, mark_as_read
from flask_jwt_extended import jwt_required

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/notifications', methods=['GET'])
@jwt_required()
def notifications():
    return get_notifications()

@notification_bp.route('/notifications/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def read_notification(notif_id):
    return mark_as_read(notif_id) 