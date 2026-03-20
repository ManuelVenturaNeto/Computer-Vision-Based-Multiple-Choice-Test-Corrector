"""
Flask application factory module.

Creates and configures the Flask application instance with
logging, blueprints, and template/static paths.
"""

import logging
import os

from flask import Flask

from src.config import Config

logger = logging.getLogger(__name__)


def create_app() -> Flask:
    """Create and configure the Flask application.

    Sets up logging, registers the API blueprint, and configures
    the template and static file directories.

    Returns:
        Configured Flask application instance.
    """
    Config.configure_logging()
    logger.info("Creating Flask application.")

    # Set template and static directories relative to src/
    src_dir = os.path.dirname(os.path.abspath(__file__))
    template_dir = os.path.join(src_dir, "templates")
    static_dir = os.path.join(src_dir, "static")

    app = Flask(
        __name__,
        template_folder=template_dir,
        static_folder=static_dir,
    )

    # Register blueprints
    from src.routes.api import api_bp

    app.register_blueprint(api_bp)

    logger.info("Flask application created successfully.")
    return app
