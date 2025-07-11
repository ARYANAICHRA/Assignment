import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from extensions import db
import os
from dotenv import load_dotenv
from datetime import datetime
from flask_mailman import Mail
from sqlalchemy import event
from sqlalchemy.engine import Engine

load_dotenv()

mail = Mail()

# Set up logging before app creation
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s',
    handlers=[
        logging.FileHandler('app.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# Enable SQLite foreign key support
def _fk_pragma_on_connect(dbapi_con, con_record):
    dbapi_con.execute('PRAGMA foreign_keys=ON')

# Listen for new connections to enable foreign keys
@event.listens_for(Engine, 'connect')
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute('PRAGMA foreign_keys=ON')
    cursor.close()

def create_app():
    app = Flask(__name__)

    @app.context_processor
    def inject_now():
        return {'now': datetime.now()}
    # session span
    app.config['PERMANENT_SESSION_LIFETIME'] = 3600 # in seconds

    # Configuration settings
    app.secret_key = os.getenv("SECRET_KEY")
    # blog.db will be created
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///../instance/blog.db'
    
    # Email configuration
    app.config.update(
        MAIL_SERVER='smtp.gmail.com',
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
        MAIL_DEFAULT_SENDER=os.getenv("MAIL_USERNAME")
    )
    db.init_app(app)
    mail.init_app(app)

    # Import models so they get registered
    from models import user, post, like, comment

    # Import and register Blueprints
    from routes.post_routes import post_bp
    app.register_blueprint(post_bp)
    # print(app.secret_key)

    return app

