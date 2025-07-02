from extensions import db
from datetime import datetime

class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure a user can only like a post once
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='_user_post_like_uc'),) 