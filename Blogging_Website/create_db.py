from app import create_app
from extensions import db

app = create_app()

with app.app_context():
    db.create_all()
    print("✅ Database created successfully!")

    # Create admin user if not exists
    from models.user import User
    from werkzeug.security import generate_password_hash
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(username='admin', email='admin@xyz.com')  # type: ignore
        admin.password = generate_password_hash('admin@123')
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin user created!")
    else:
        print("ℹ️ Admin user already exists.")
