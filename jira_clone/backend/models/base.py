# models/base.py
from models.db import db

class Base(db.Model):
    __abstract__ = True