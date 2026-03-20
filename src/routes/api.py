"""
API routes module for the Student Paper Reader application.

Defines Flask Blueprint with endpoints for serving the webcam
interface and processing captured frames via OCR. Saves each
capture to the snapshots/ folder.
"""

import json
import logging
import os

from flask import Blueprint, jsonify, render_template, request

from src.camera.capture import FrameDecoder
from src.config import Config
from src.ocr.code_extractor import CodeExtractor
from src.ocr.name_extractor import NameExtractor
from src.ocr.processor import OCRProcessor

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__)

# Singleton processing components (lazy-loaded)
_ocr_processor: OCRProcessor | None = None
_name_extractor: NameExtractor | None = None
_code_extractor: CodeExtractor | None = None


def _get_processor() -> OCRProcessor:
    """Get or create the OCR processor singleton.

    Returns:
        Initialized OCRProcessor instance.
    """
    global _ocr_processor
    if _ocr_processor is None:
        logger.info("Creating OCRProcessor instance (first request).")
        _ocr_processor = OCRProcessor()
    return _ocr_processor


def _get_name_extractor() -> NameExtractor:
    """Get or create the name extractor singleton.

    Returns:
        Initialized NameExtractor instance.
    """
    global _name_extractor
    if _name_extractor is None:
        _name_extractor = NameExtractor()
    return _name_extractor


def _get_code_extractor() -> CodeExtractor:
    """Get or create the code extractor singleton.

    Returns:
        Initialized CodeExtractor instance.
    """
    global _code_extractor
    if _code_extractor is None:
        _code_extractor = CodeExtractor()
    return _code_extractor


@api_bp.route("/")
def index():
    """Serve the main webcam interface page.

    Returns:
        Rendered HTML template for the webcam capture interface.
    """
    logger.info("Serving main page.")
    return render_template("index.html")


@api_bp.route("/api/process", methods=["POST"])
def process_frame():
    """Process a captured webcam frame and extract student data.

    Pipeline:
    1. Decode base64 image from the browser.
    2. Save the raw frame to snapshots/ folder.
    3. Run OCR with multiple preprocessing strategies.
    4. Extract name (label-based, then heuristic).
    5. Extract 6-digit code (direct, corrected, fragments).

    Expects JSON body: {"image": "<base64 string>"}

    Returns:
        JSON: {"name": str|null, "code": str|null, "blocks_found": int,
               "snapshot": str}
        HTTP 400 on missing/invalid data, HTTP 500 on processing error.
    """
    logger.info("Received frame processing request.")

    data = request.get_json()
    if not data or "image" not in data:
        logger.warning("Request missing 'image' field.")
        return jsonify({"error": "No image data provided"}), 400

    base64_image = data["image"]

    # Decode the frame
    frame = FrameDecoder.decode_base64_frame(base64_image)
    if frame is None:
        logger.error("Failed to decode the provided image.")
        return jsonify({"error": "Failed to decode image"}), 400

    try:
        # Save snapshot
        snapshot_path = FrameDecoder.save_snapshot(frame, Config.BASE_DIR)
        logger.info("Snapshot saved at: %s", snapshot_path)

        # Get processor and extractors
        processor = _get_processor()
        name_extractor = _get_name_extractor()
        code_extractor = _get_code_extractor()

        # --- Multi-strategy OCR pipeline ---
        # Try multiple preprocessing approaches and merge results
        all_text_blocks: list[dict] = []

        # Strategy 1: Original color image (EasyOCR handles colors well)
        logger.info("OCR strategy 1: original color image.")
        blocks_color = processor.extract_text(frame)
        all_text_blocks.extend(blocks_color)

        # Strategy 2: Ink-enhanced preprocessing (blue + black pen)
        logger.info("OCR strategy 2: ink-enhanced preprocessing.")
        ink_processed = FrameDecoder.preprocess_for_ink(frame)
        blocks_ink = processor.extract_text(ink_processed)
        all_text_blocks.extend(blocks_ink)

        # Strategy 3: High-contrast CLAHE (if still few results)
        if len(all_text_blocks) < 3:
            logger.info("OCR strategy 3: CLAHE contrast enhancement.")
            contrast_processed = FrameDecoder.preprocess_contrast(frame)
            blocks_contrast = processor.extract_text(contrast_processed)
            all_text_blocks.extend(blocks_contrast)

        # Deduplicate text blocks (same text from different strategies)
        unique_blocks = _deduplicate_blocks(all_text_blocks)

        logger.info(
            "Total unique text blocks after all strategies: %d",
            len(unique_blocks),
        )

        # Extract name and code
        student_name = name_extractor.extract(unique_blocks)
        student_code = code_extractor.extract(unique_blocks)

        logger.info(
            "Extraction complete — Name: '%s', Code: '%s'",
            student_name, student_code,
        )

        # Prepare raw blocks with bbox for live overlay
        raw_blocks = []
        for block in unique_blocks:
            raw_blocks.append({
                "text": block["text"],
                "confidence": round(block["confidence"], 2),
                "bbox": _serialize_bbox(block.get("bbox", [])),
            })

        return jsonify({
            "name": student_name,
            "code": student_code,
            "blocks_found": len(unique_blocks),
            "snapshot": snapshot_path,
            "raw_blocks": raw_blocks,
        })

    except Exception as e:
        logger.exception("Error during frame processing: %s", str(e))
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500


@api_bp.route("/api/detect-live", methods=["POST"])
def detect_live():
    """Lightweight live detection for real-time overlay.

    Uses only the original image (no multi-strategy) for speed.
    Returns raw bounding boxes and text for drawing on canvas.

    Expects JSON body: {"image": "<base64 string>"}

    Returns:
        JSON: {"blocks": [{"text", "confidence", "bbox"}], "name", "code"}
    """
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "No image data"}), 400

    frame = FrameDecoder.decode_base64_frame(data["image"])
    if frame is None:
        return jsonify({"error": "Failed to decode image"}), 400

    try:
        processor = _get_processor()
        name_extractor = _get_name_extractor()
        code_extractor = _get_code_extractor()

        # Single pass only (fast for live detection)
        text_blocks = processor.extract_text(frame)

        # Extract name and code
        student_name = name_extractor.extract(text_blocks)
        student_code = code_extractor.extract(text_blocks)

        # Build response blocks with bbox
        blocks = []
        for block in text_blocks:
            blocks.append({
                "text": block["text"],
                "confidence": round(block["confidence"], 2),
                "bbox": _serialize_bbox(block.get("bbox", [])),
            })

        return jsonify({
            "blocks": blocks,
            "name": student_name,
            "code": student_code,
        })

    except Exception as e:
        logger.error("Live detection error: %s", str(e))
        return jsonify({"blocks": [], "name": None, "code": None})


def _serialize_bbox(bbox) -> list:
    """Convert bounding box points to plain Python lists for JSON.

    EasyOCR can return numpy arrays, which are not JSON-serializable.

    Args:
        bbox: List of [x, y] points (possibly numpy).

    Returns:
        List of [float, float] points.
    """
    try:
        return [[float(p[0]), float(p[1])] for p in bbox]
    except (TypeError, IndexError):
        return []


def _deduplicate_blocks(blocks: list[dict]) -> list[dict]:
    """Remove duplicate text blocks from multiple OCR passes.

    Keeps the version with the highest confidence when the same
    text appears from different preprocessing strategies.

    Args:
        blocks: List of OCR result dictionaries.

    Returns:
        Deduplicated list of text blocks.
    """
    seen: dict[str, dict] = {}
    for block in blocks:
        text = block["text"].strip().lower()
        if text not in seen or block["confidence"] > seen[text]["confidence"]:
            seen[text] = block
    return list(seen.values())


@api_bp.route("/api/save-annotation", methods=["POST"])
def save_annotation():
    """Save a confirmed or corrected annotation to annotations.json.

    Expects JSON body: {"snapshot": "<path>", "name": "<str>", "code": "<str>"}

    Upserts the annotation into dataset/annotations.json using the
    snapshot filename as the key.

    Returns:
        JSON: {"status": "saved", "filename": str} on success.
        HTTP 400 on missing data.
    """
    data = request.get_json()
    if not data or "snapshot" not in data:
        return jsonify({"error": "Missing snapshot path"}), 400

    snapshot_path = data["snapshot"]
    name = data.get("name", "")
    code = data.get("code", "")

    # Extract just the filename from the full path
    filename = os.path.basename(snapshot_path)

    # Path to annotations file
    annotations_path = os.path.join(Config.BASE_DIR, "dataset", "annotations.json")

    # Ensure dataset directory exists
    os.makedirs(os.path.dirname(annotations_path), exist_ok=True)

    # Load existing annotations or start empty
    annotations = {}
    if os.path.exists(annotations_path):
        try:
            with open(annotations_path, "r", encoding="utf-8") as f:
                annotations = json.load(f)
        except (json.JSONDecodeError, IOError):
            logger.warning("Could not read existing annotations, starting fresh.")

    # Upsert the annotation
    annotations[filename] = {
        "name": name,
        "code": code,
    }

    # Write back
    with open(annotations_path, "w", encoding="utf-8") as f:
        json.dump(annotations, f, ensure_ascii=False, indent=4)

    logger.info(
        "Annotation saved: %s -> name='%s', code='%s'",
        filename, name, code,
    )

    return jsonify({"status": "saved", "filename": filename})

