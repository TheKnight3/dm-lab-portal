"""
Configuration classes for the Flask application.

The base ``Config`` reads values from environment variables with sensible
defaults to ease local development. Additional classes could be added for
testing or production environments.
"""

import os
from datetime import timedelta


class Config:
    """Base configuration loaded by default."""

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "sqlite:///dmlab.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    # Swagger/OpenAPI settings (used by documentation generator if needed)
    OPENAPI_TITLE = "DMlab API"
    OPENAPI_VERSION = "1.0.0"
    OPENAPI_URL_PREFIX = "/docs"
    OPENAPI_SWAGGER_UI_PATH = "/"
    OPENAPI_SWAGGER_UI_VERSION = "4.10.3"

    # Other settings
    PROPAGATE_EXCEPTIONS = True


class TestConfig(Config):
    """Configuration used during testing."""

    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    TESTING = True


class ProductionConfig(Config):
    """Production configuration with sensible defaults."""

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/dmlab"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)