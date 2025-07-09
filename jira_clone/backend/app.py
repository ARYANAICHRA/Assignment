from flask import Flask
from flask_migrate import Migrate
from models.db import db
import models

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:postgres@localhost:5432/flask_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)

@app.route('/')
def index():
    return 'Jira Clone Backend is running!'

if __name__ == '__main__':
    app.run(debug=True)
