from flask import Flask
from flask_migrate import Migrate
from models.db import db
import models
from routes.auth import auth_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:postgres@localhost:5432/flask_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-very-secret-key'

# Register blueprints
app.register_blueprint(auth_bp)

db.init_app(app)
migrate = Migrate(app, db)

@app.route('/')
def index():
    return 'Jira Clone Backend is running!'

if __name__ == '__main__':
    app.run(debug=True)
