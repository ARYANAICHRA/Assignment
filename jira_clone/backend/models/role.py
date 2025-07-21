from .db import db

class Role(db.Model):
    __tablename__ = 'role'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=True)  # null for global roles
    permissions = db.relationship('Permission', backref='role', lazy=True)

    def __repr__(self):
        return f'<Role {self.name}>' 