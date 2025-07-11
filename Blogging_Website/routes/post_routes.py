from flask import Blueprint, render_template, request, redirect, url_for,  session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User
from extensions import db
from controllers.post_controller import get_all_posts
from sqlalchemy.exc import IntegrityError
import re
from flask_mailman import EmailMessage
import random
import string
import os
from werkzeug.utils import secure_filename

post_bp = Blueprint('post_bp', __name__)

from flask import session

# Helper functions for validation
def is_valid_email(email):
    """Check if email format is valid"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def is_strong_password(password):
    """Check if password meets strength requirements"""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):  # uppercase
        return False
    if not re.search(r'[a-z]', password):  # lowercase
        return False
    if not re.search(r'\d', password):  # digit
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):  # special char
        return False
    return True

def send_welcome_email(username, email):
    """Send welcome email to new user using Flask-Mailman"""
    try:
        from app import mail
        
        # Email body
        body = f"""
        Hi {username},
        
         Welcome to our Blogging Platform!
        
        Thank you for registering with us. You can now:
        • Create and share your blog posts
        • Like and comment on other posts
        • Connect with other bloggers
        
        Get started by logging in and creating your first post!
        
        Best regards,
        The Blog Team
        """
        
        # Create and send email
        email_message = EmailMessage(
            subject=f"👋 Welcome to the Blog, {username}!",
            body=body,
            to=[email]
        )
        
        email_message.send()
        return True
        
    except Exception as e:
        print(f" Email sending failed: {e}")
        return False

# session check 
@post_bp.route('/test-session')
def test_session():
    session['test'] = 'hello'
    return "Session value set!"

# home of website
@post_bp.route('/')
def home():
    username = session.get('username')
    return render_template("home.html", username=username)

# registering new user
@post_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Validate required fields
        if not username or not email or not password:
            flash(" All fields are required.", "error")
            return redirect(url_for('post_bp.register'))
        
        #  Email format check
        if not is_valid_email(email):
            flash(" Invalid email format. Please enter a valid email.", "error")
            return redirect(url_for('post_bp.register'))

        #  Password strength check
        if not is_strong_password(password):
            flash(" Password must have at least 8 characters, including uppercase, lowercase, number, and special character.", "error")
            return redirect(url_for('post_bp.register'))

        #  Check if user exists
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            flash(" Username or email already exists.", "error")
            return redirect(url_for('post_bp.register'))

        #  Save user
        new_user = User(username=username, email=email)  # type: ignore
        new_user.set_password(password)

        try:
            db.session.add(new_user)
            db.session.commit()

            #  Send welcome email
            email_sent = send_welcome_email(username, email)
            
            if email_sent:
                flash(" Registered successfully! A welcome email has been sent.", "success")
            else:
                flash(" Registered successfully, but welcome email could not be sent.", "warning")

            return redirect(url_for('post_bp.login'))

        except IntegrityError:
            db.session.rollback()
            flash("Something went wrong. Try again.", "error")
            return redirect(url_for('post_bp.register'))

    return render_template("register.html")

# login the user 
@post_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        # Validate required fields
        if not email or not password:
            flash("Email and password are required.", "error")
            return render_template("login.html")

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['username'] = user.username
            # Set admin session flag
            session['is_admin'] = (user.username == 'admin')
            # If user is required to change password, redirect
            if session.get('force_password_change') == user.id:
                return redirect(url_for('post_bp.change_password'))
            return redirect(url_for('post_bp.show_posts'))
        else:
            flash(" Invalid email or password.", "error")
            return render_template("login.html")

    return render_template("login.html")

# dashboard 
@post_bp.route('/dashboard')
@post_bp.route('/dashboard/<int:page>')
def dashboard(page=1):
    if 'user_id' not in session:
        return redirect(url_for('post_bp.login'))

    user_id = session['user_id']
    from models.post import Post
    
    # Pagination settings
    per_page = 5  # Number of posts per page
    
    # Get paginated posts
    pagination = Post.query.filter_by(user_id=user_id).order_by(Post.date_posted.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    user_posts = pagination.items
    
    return render_template('dashboard.html', 
                         posts=user_posts, 
                         username=session.get('username'),
                         pagination=pagination)

UPLOAD_FOLDER = 'static/uploads'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'ogg'}

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions



@post_bp.route('/create-post', methods=['GET', 'POST'])
def create_post():
    if 'user_id' not in session:
        return redirect(url_for('post_bp.login'))

    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        user_id = session['user_id']

        image_file = request.files.get('image')
        video_file = request.files.get('video')
        image_filename = None
        video_filename = None

        # Handle image upload
        if image_file and image_file.filename and allowed_file(image_file.filename, ALLOWED_IMAGE_EXTENSIONS):
            image_filename = secure_filename(image_file.filename)
            image_path = os.path.join(UPLOAD_FOLDER, image_filename)
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            image_file.save(image_path)

        # Handle video upload
        if video_file and video_file.filename and allowed_file(video_file.filename, ALLOWED_VIDEO_EXTENSIONS):
            video_filename = secure_filename(video_file.filename)
            video_path = os.path.join(UPLOAD_FOLDER, video_filename)
            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
            video_file.save(video_path)

        # Validate required fields
        if not title or not content:
            flash(" Title and content are required.", "error")
            return render_template("create_post.html")

        from models.post import Post
        new_post = Post()  # type: ignore
        new_post.title = title
        new_post.content = content
        new_post.user_id = user_id
        new_post.image_filename = image_filename
        new_post.video_filename = video_filename
        db.session.add(new_post)
        db.session.commit()

        flash(" Post created successfully!", "success")
        return redirect(url_for('post_bp.show_posts'))

    return render_template("create_post.html")

# show post of user
@post_bp.route('/posts/')
@post_bp.route('/posts/<int:page>')
def show_posts(page=1):
    # Pagination settings
    per_page = 8  # Number of posts per page
    
    # Get all posts for pagination
    from models.post import Post
    pagination = Post.query.order_by(Post.date_posted.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    posts = pagination.items
    username = session.get('username')
    print('DEBUG: session =', dict(session))  # Debug print
    print('DEBUG: username =', username)      # Debug print
    
    # Get unique authors for filter dropdown (from all posts, not just current page)
    all_posts = Post.query.all()
    authors_list = []
    for post in all_posts:
        if post.author.username not in authors_list:
            authors_list.append(post.author.username)
    
    return render_template("posts.html", 
                         posts=posts, 
                         username=username, 
                         authors_list=authors_list,
                         pagination=pagination)

# edit user post 
@post_bp.route('/edit-post/<int:post_id>', methods=['GET', 'POST'])
def edit_post(post_id):
    from models.post import Post

    post = Post.query.get_or_404(post_id)

    if session.get('user_id') != post.user_id:
        return " You can only edit your own posts."

    if request.method == 'POST':
        post.title = request.form.get('title')
        post.content = request.form.get('content')
        db.session.commit()
        return redirect(url_for('post_bp.show_posts'))

    return render_template('edit_post.html', post=post)

# delete the post 
@post_bp.route('/delete-post/<int:post_id>')
def delete_post(post_id):
    from models.post import Post

    post = Post.query.get_or_404(post_id)

    if session.get('user_id') != post.user_id:
        return "You can only delete your own posts."

    db.session.delete(post)
    db.session.commit()

    return redirect(url_for('post_bp.show_posts'))

# logout the user 
@post_bp.route('/logout')
def logout():
    session.clear()  # Remove all session data
    return redirect(url_for('post_bp.login'))

# Like a post
@post_bp.route('/like/<int:post_id>', methods=['POST'])
def like_post(post_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Please login first'}), 401
    
    from models.post import Post
    from models.like import Like
    
    user_id = session['user_id']
    post = Post.query.get_or_404(post_id)
    
    # Check if user already liked the post
    existing_like = Like.query.filter_by(user_id=user_id, post_id=post_id).first()
    
    if existing_like:
        # Unlike the post
        db.session.delete(existing_like)
        action = 'unliked'
    else:
        # Like the post
        new_like = Like(user_id=user_id, post_id=post_id)  # type: ignore
        db.session.add(new_like)
        action = 'liked'
    
    db.session.commit()
    
    return jsonify({
        'action': action,
        'like_count': post.like_count,
        'is_liked': post.is_liked_by(user_id)
    })

# Add comment to a post
@post_bp.route('/comment/<int:post_id>', methods=['POST'])
def add_comment(post_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Please login first'}), 401
    
    from models.post import Post
    from models.comment import Comment
    
    content = request.form.get('content')
    if not content or not content.strip():
        return jsonify({'error': 'Comment cannot be empty'}), 400
    
    user_id = session['user_id']
    post = Post.query.get_or_404(post_id)
    
    new_comment = Comment()
    new_comment.content = content.strip()
    new_comment.user_id = user_id
    new_comment.post_id = post_id
    
    db.session.add(new_comment)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'comment': {
            'id': new_comment.id,
            'content': new_comment.content,
            'username': new_comment.user.username,
            'created_at': new_comment.created_at.strftime('%Y-%m-%d %H:%M')
        }
    })

# Get comments for a post
@post_bp.route('/comments/<int:post_id>')
def get_comments(post_id):
    from models.post import Post
    from models.comment import Comment
    
    post = Post.query.get_or_404(post_id)
    comments = Comment.query.filter_by(post_id=post_id).order_by(Comment.created_at.desc()).all()
    
    comments_data = []
    for comment in comments:
        comments_data.append({
            'id': comment.id,
            'content': comment.content,
            'username': comment.user.username,
            'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M')
        })
    
    return jsonify(comments_data)

# Admin dashboard
@post_bp.route('/admin-dashboard')
def admin_dashboard():
    if not session.get('is_admin'):
        return redirect(url_for('post_bp.login'))
    # Placeholder: show all users and posts
    from models.user import User
    from models.post import Post
    users = User.query.all()
    posts = Post.query.order_by(Post.date_posted.desc()).all()
    return render_template('admin_dashboard.html', users=users, posts=posts, username=session.get('username'))

# Admin: Delete a user and all their posts
@post_bp.route('/admin/delete-user/<int:user_id>', methods=['POST'])
def admin_delete_user(user_id):
    if not session.get('is_admin'):
        return redirect(url_for('post_bp.login'))
    from models.user import User
    from models.post import Post
    user = User.query.get_or_404(user_id)
    if user.username == 'admin':
        flash('Cannot delete the admin user.', 'error')
        return redirect(url_for('post_bp.admin_dashboard'))
    # Delete all posts by user (cascades to likes/comments if set up)
    posts = Post.query.filter_by(user_id=user.id).all()
    for post in posts:
        db.session.delete(post)
    db.session.delete(user)
    db.session.commit()
    flash('User and all their posts deleted.', 'success')
    return redirect(url_for('post_bp.admin_dashboard'))

# Admin: Delete a post
@post_bp.route('/admin/delete-post/<int:post_id>', methods=['POST'])
def admin_delete_post(post_id):
    if not session.get('is_admin'):
        return redirect(url_for('post_bp.login'))
    from models.post import Post
    post = Post.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    flash('Post deleted.', 'success')
    return redirect(url_for('post_bp.admin_dashboard'))

@post_bp.route('/reset-password', methods=['POST'])
def reset_password():
    email = request.form.get('reset_email')
    if not email:
        flash('Please enter your email address.', 'error')
        return redirect(url_for('post_bp.login'))
    from models.user import User
    user = User.query.filter_by(email=email).first()
    if not user:
        flash('No user found with that email address.', 'error')
        return redirect(url_for('post_bp.login'))
    # Generate a new random password
    new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    from werkzeug.security import generate_password_hash
    user.password = generate_password_hash(new_password)
    db.session.commit()
    # Send the new password via email
    try:
        email_message = EmailMessage(
            subject='Your Password Has Been Reset',
            body=f'Hello {user.username},\n\nYour new password is: {new_password}\n\nPlease log in and change it as soon as possible.',
            to=[user.email]
        )
        email_message.send()
        # Set session variable to force password change
        session['force_password_change'] = user.id
        flash('A new password has been sent to your email address. Please log in and change it.', 'success')
    except Exception as e:
        flash('Failed to send reset email. Please try again later.', 'error')
    return redirect(url_for('post_bp.login'))

@post_bp.route('/change-password', methods=['GET', 'POST'])
def change_password():
    if 'user_id' not in session:
        return redirect(url_for('post_bp.login'))

    from models.user import User
    user = User.query.get(session['user_id'])
    if not user:
        flash('User not found. Please log in again.', 'error')
        session.clear()
        return redirect(url_for('post_bp.login'))

    if request.method == 'POST':
        new_password = request.form.get('new_password')
        confirm_password = request.form.get('confirm_password')

        if not new_password or not confirm_password:
            flash('Please fill out all fields.', 'error')
            return render_template('change_password.html')

        if new_password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('change_password.html')

        # Optionally: add password strength check here

        from werkzeug.security import generate_password_hash
        user.password = generate_password_hash(new_password)
        db.session.commit()

        # Remove force_password_change flag if present
        if session.get('force_password_change'):
            session.pop('force_password_change')

        flash('Password changed successfully. Please log in again.', 'success')
        session.clear()
        return redirect(url_for('post_bp.login'))

    return render_template('change_password.html')
