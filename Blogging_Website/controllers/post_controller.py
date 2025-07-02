from models.post import Post
from models.user import User
from models.like import Like
from models.comment import Comment
from extensions import db


def get_all_posts():
    from models.post import Post
    return Post.query.order_by(Post.date_posted.desc()).all()
