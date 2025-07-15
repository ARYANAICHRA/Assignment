from datetime import datetime
from .db import db

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # e.g., 'created', 'updated', 'commented', etc.
    details = db.Column(db.Text)  # Optional: JSON or text describing the change
    created_at = db.Column(db.DateTime, default=datetime.utcnow) 