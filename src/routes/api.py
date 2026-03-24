"""Routes for the camera page and photo reading API."""

import logging

from flask import Blueprint, jsonify, render_template, request

from src.camera.capture import FrameDecoder
from src.config import Config
from src.llm import (
    MissingAPIKeyError,
    ModelExtractor,
    ModelExtractorError,
)

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__)

_model_extractor: ModelExtractor | None = None


def _get_model_extractor() -> ModelExtractor:
    """Get or create the shared model extractor."""
    global _model_extractor
    if _model_extractor is None:
        _model_extractor = ModelExtractor()
    return _model_extractor


@api_bp.route("/")
def index():
    """Serve the capture interface."""
    logger.info("Serving main page.")
    return render_template("index.html", ui_config=Config.ui_config())


@api_bp.route("/api/process", methods=["POST"])
def process_frame():
    """Capture a frame and extract the fields near NOME and Matricula."""
    payload = request.get_json(silent=True) or {}
    image_data = payload.get("image")

    if not image_data:
        return jsonify({"error": "No image data provided."}), 400

    frame = FrameDecoder.decode_base64_frame(image_data)
    if frame is None:
        return jsonify({"error": "Failed to decode image."}), 400

    try:
        snapshot_path = FrameDecoder.save_snapshot(frame, Config.BASE_DIR)
        result = _get_model_extractor().extract_with_fallback(image_data_url=image_data)
    except MissingAPIKeyError as exc:
        return jsonify({"error": str(exc)}), 503
    except ModelExtractorError as exc:
        logger.error("Photo reading failed: %s", exc)
        return jsonify({"error": str(exc)}), 502
    except Exception as exc:
        logger.exception("Unexpected processing error: %s", exc)
        return jsonify({"error": "Unexpected processing failure."}), 500

    return jsonify(
        {
            "name": result.name,
            "code": result.code,
            "snapshot": snapshot_path,
        }
    )

