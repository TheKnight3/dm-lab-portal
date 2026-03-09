"""
Extension initialisation module.

All third party extensions are created here to avoid circular imports. They are
initialised within the application factory in ``app/__init__.py``.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS


# SQLAlchemy instance
db = SQLAlchemy()

# Alembic migrations
migrate = Migrate()

# JWT manager
jwt = JWTManager()

# CORS extension (enabled on /api/* routes)
cors = CORS()