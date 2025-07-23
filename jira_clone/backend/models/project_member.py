from .db import db
from .role import Role
from datetime import datetime
from models.team_member import TeamMember

class ProjectMember(db.Model):
    __tablename__ = 'project_member'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=False)
    role = db.relationship('Role', backref='project_members')

# Helper function to add a team as visitors to a project
def add_team_as_project_visitors(project_id, team_id):
    visitor_role = Role.query.filter_by(name='Project Visitor', scope='project').first()
    if not visitor_role:
        raise Exception('Project Visitor role not found')
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    added = 0
    for tm in team_members:
        if not ProjectMember.query.filter_by(project_id=project_id, user_id=tm.user_id).first():
            pm = ProjectMember(project_id=project_id, user_id=tm.user_id, role_id=visitor_role.id)
            db.session.add(pm)
            added += 1
    db.session.commit()
    return added

# Helper function to remove all visitor members from a project

def remove_all_project_visitors(project_id):
    visitor_role = Role.query.filter_by(name='Project Visitor', scope='project').first()
    if not visitor_role:
        raise Exception('Project Visitor role not found')
    visitors = ProjectMember.query.filter_by(project_id=project_id, role_id=visitor_role.id).all()
    count = 0
    for v in visitors:
        db.session.delete(v)
        count += 1
    db.session.commit()
    return count

class ProjectJoinRequest(db.Model):
    __tablename__ = 'project_join_request'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False) 
    status = db.Column(db.String(20), nullable=False, default='pending')  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
