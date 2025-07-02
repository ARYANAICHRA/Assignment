from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from extensions import db  

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    date_posted = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Media fields
    image_filename = db.Column(db.String(255), nullable=True)
    video_filename = db.Column(db.String(255), nullable=True)
    
    # Relationships
    likes = db.relationship('Like', backref='post', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='post', lazy=True, cascade='all, delete-orphan')
    
    @property
    def like_count(self):
        return len(self.likes)  # type: ignore
    
    def is_liked_by(self, user_id):
        return any(like.user_id == user_id for like in self.likes)  # type: ignore