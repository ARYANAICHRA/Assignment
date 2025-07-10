from .db import db

class ProjectMember(db.Model):
    __tablename__ = 'project_member'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), primary_key=True)
    role = db.Column(db.String(20), nullable=False)
