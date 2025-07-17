from flask import Blueprint
from controllers.notification_controller import get_notifications, mark_as_read

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/notifications', methods=['GET'])
def notifications():
    return get_notifications()

@notification_bp.route('/notifications/<int:notif_id>/read', methods=['POST'])
def read_notification(notif_id):
    return mark_as_read(notif_id) 