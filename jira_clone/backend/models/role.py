from .db import db

role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permission.id'), primary_key=True)
)

class Role(db.Model):
    __tablename__ = 'role'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    scope = db.Column(db.String(20), nullable=False)  # 'firm', 'team', 'project'
    permissions = db.relationship('Permission', secondary=role_permissions, backref='roles')

    def __repr__(self):
        return f'<Role {self.name}>' 