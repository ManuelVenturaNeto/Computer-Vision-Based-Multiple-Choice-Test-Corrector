"""Helpers for browser camera frames."""

import base64
import logging
import os
from datetime import datetime

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class FrameDecoder:
    """Decode and persist captured frames."""

    @staticmethod
    def decode_base64_frame(base64_string: str) -> np.ndarray | None:
        """Decode a base64-encoded image string into an OpenCV image."""
        try:
            if "," in base64_string:
                base64_string = base64_string.split(",", 1)[1]

            image_bytes = base64.b64decode(base64_string)
            np_array = np.frombuffer(image_bytes, dtype=np.uint8)
            frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

            if frame is None:
                logger.error("Failed to decode image from base64 data.")
                return None

            logger.info("Decoded frame with shape: %s", frame.shape)
            return frame
        except Exception as exc:
            logger.error("Error decoding base64 frame: %s", exc)
            return None

    @staticmethod
    def save_snapshot(frame: np.ndarray, base_dir: str) -> str:
        """Save a captured frame to the snapshots folder."""
        snapshots_dir = os.path.join(base_dir, "snapshots")
        os.makedirs(snapshots_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        filename = f"capture_{timestamp}.png"
        filepath = os.path.join(snapshots_dir, filename)

        cv2.imwrite(filepath, frame)
        logger.info("Snapshot saved: %s", filepath)
        return filepath
