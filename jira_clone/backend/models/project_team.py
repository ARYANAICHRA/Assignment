from .db import db

class ProjectTeam(db.Model):
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), primary_key=True)
