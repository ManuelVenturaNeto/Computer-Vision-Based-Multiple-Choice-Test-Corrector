"""Flask application factory for the student capture project."""

import logging
import os

from flask import Flask

from src.config import Config

logger = logging.getLogger(__name__)


def create_app() -> Flask:
    """Create and configure the Flask application."""
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

    from src.routes.api import api_bp

    app.register_blueprint(api_bp)

    logger.info("Flask application created successfully.")
    return app
