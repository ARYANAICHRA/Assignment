from flask import request, jsonify
from models.notification import Notification
from models.db import db
from flask_jwt_extended import get_jwt_identity
import logging

def get_notifications():
    user_id = get_jwt_identity()
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify([{
        'id': n.id,
        'user_id': n.user_id,
        'message': n.message,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifs]), 200

def mark_as_read(notif_id):
    user_id = get_jwt_identity()
    notif = Notification.query.get(notif_id)
    logging.warning(f"[mark_as_read] user_id={user_id}, notif_id={notif_id}, notif={notif}")
    if notif and notif.user_id == int(user_id):
        notif.is_read = True
        db.session.commit()
        logging.warning(f"[mark_as_read] Notification {notif_id} marked as read for user {user_id}")
        return jsonify({'success': True}), 200
    logging.warning(f"[mark_as_read] Notification {notif_id} not found or does not belong to user {user_id}")
    return jsonify({'error': 'Not found'}), 404

def create_notification(user_id, message):
    notif = Notification(user_id=user_id, message=message)
    db.session.add(notif)
    db.session.commit()
    return notif 