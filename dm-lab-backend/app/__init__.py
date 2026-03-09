"""
Application factory for the DMlab backend.

The factory pattern allows the app to be configured differently based on the
environment (development, testing, production). It initialises the main
extensions (database, migrations, JWT, CORS) and registers the blueprints
defined in ``app/routes``.
"""

import os
from flask import Flask, jsonify
from .config import Config
from .extensions import db, migrate, jwt, cors


def create_app(config_class: type[Config] | None = None) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Load configuration: environment variables take precedence
    config_obj = config_class or Config()
    app.config.from_object(config_obj)

    # Initialise extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.services import services_bp
    from .routes.bookings import bookings_bp
    from .routes.reports import reports_bp
    from .routes.finance import finance_bp
    from .routes.locations import locations_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(services_bp, url_prefix="/api/v1/services")
    app.register_blueprint(bookings_bp, url_prefix="/api/v1")
    app.register_blueprint(reports_bp, url_prefix="/api/v1")
    app.register_blueprint(finance_bp, url_prefix="/api/v1/admin/finance")
    app.register_blueprint(locations_bp, url_prefix="/api/v1/locations")

    # Health check
    @app.route("/health")
    def health() -> dict:
        return {"status": "ok"}

    # Generic error handler
    @app.errorhandler(404)
    def not_found(e):  # type: ignore[no-untyped-def]
        return jsonify({"message": "Resource not found"}), 404

    return app