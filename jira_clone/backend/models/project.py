from datetime import datetime
from .db import db
from .board_column import BoardColumn
from .item import Item
from .project_member import ProjectMember

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    board_columns = db.relationship('BoardColumn', backref='project', cascade='all, delete-orphan', lazy='dynamic')
    items = db.relationship('Item', backref='project', cascade='all, delete-orphan', lazy='dynamic')
    members = db.relationship('ProjectMember', backref='project', cascade='all, delete-orphan', lazy='dynamic')
    owner_team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=True)
