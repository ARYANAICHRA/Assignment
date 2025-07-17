from flask import request, jsonify
from models.notification import Notification
from models.db import db
from controllers.jwt_utils import jwt_required

@jwt_required
def get_notifications():
    user_id = request.user.id
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([{
        'id': n.id,
        'message': n.message,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifs])

@jwt_required
def mark_as_read(notif_id):
    notif = Notification.query.get(notif_id)
    if notif and notif.user_id == request.user.id:
        notif.is_read = True
        db.session.commit()
        return jsonify({'success': True})
    return jsonify({'error': 'Not found'}), 404

def create_notification(user_id, message):
    notif = Notification(user_id=user_id, message=message)
    db.session.add(notif)
    db.session.commit()
    return notif 