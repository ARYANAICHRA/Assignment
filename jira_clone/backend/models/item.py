from datetime import datetime
from .db import db

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(30), nullable=False)
    column_id = db.Column(db.Integer, db.ForeignKey('board_column.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    reporter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assignee_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    due_date = db.Column(db.Date)
    priority = db.Column(db.String(10))
    severity = db.Column(db.String(10))
    steps_to_reproduce = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    start_date = db.Column(db.DateTime)
