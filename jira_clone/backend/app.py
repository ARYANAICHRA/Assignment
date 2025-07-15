from flask import Flask
from flask_migrate import Migrate
from models.db import db
import models
from routes.auth import auth_bp
from routes.projects import projects_bp
from routes.project_member import project_member_bp
from routes.item import item_bp
from routes.board_column import column_bp
from routes.user import user_bp
from flask_cors import CORS
from flask import request
from flask_jwt_extended import JWTManager

app = Flask(__name__)
# Update CORS to allow all origins, headers, and methods for development
CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers="*", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:postgres@localhost:5432/flask_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-very-secret-key'
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(project_member_bp)
app.register_blueprint(item_bp)
app.register_blueprint(column_bp)
app.register_blueprint(user_bp)

db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
print('JWTManager initialized:', jwt)

@app.route('/')
def index():
    return 'Jira Clone Backend is running!'

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
