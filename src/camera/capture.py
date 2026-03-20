"""
Frame decoder module for webcam capture processing.

Handles decoding base64-encoded image frames from the browser
and preprocessing them for OCR analysis. Includes ink-color-aware
preprocessing optimized for blue and black pen handwriting.
"""

import base64
import logging
import os
from datetime import datetime

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class FrameDecoder:
    """Decodes and preprocesses webcam frames for OCR processing.

    Converts base64-encoded image data from the browser into
    OpenCV-compatible images. Provides multiple preprocessing
    pipelines optimized for handwritten text in blue or black ink.
    """

    @staticmethod
    def decode_base64_frame(base64_string: str) -> np.ndarray | None:
        """Decode a base64-encoded image string into an OpenCV image.

        Args:
            base64_string: Base64-encoded image data, optionally with
                a data URI prefix (e.g., 'data:image/png;base64,...').

        Returns:
            OpenCV image as numpy array (BGR format), or None if decoding fails.
        """
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

        except Exception as e:
            logger.error("Error decoding base64 frame: %s", str(e))
            return None

    @staticmethod
    def preprocess_for_ink(frame: np.ndarray) -> np.ndarray:
        """Preprocess an image to enhance blue and black pen ink.

        Converts to HSV to isolate blue ink, combines with grayscale
        for black ink, then applies contrast enhancement and
        thresholding for optimal OCR input.

        Args:
            frame: OpenCV image in BGR format.

        Returns:
            Preprocessed binary image optimized for ink detection.
        """
        logger.debug("Preprocessing for blue/black ink detection.")

        # --- Enhance blue ink ---
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Blue ink range in HSV (covers light blue to dark blue pens)
        lower_blue = np.array([90, 40, 40])
        upper_blue = np.array([130, 255, 255])
        blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)

        # --- Enhance black ink ---
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        # Black ink: low intensity
        _, black_mask = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)

        # --- Combine blue and black ink masks ---
        ink_mask = cv2.bitwise_or(blue_mask, black_mask)

        # Clean up the mask
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        ink_mask = cv2.morphologyEx(ink_mask, cv2.MORPH_CLOSE, kernel)
        ink_mask = cv2.morphologyEx(ink_mask, cv2.MORPH_OPEN, kernel)

        # Invert: black text on white background (standard for OCR)
        result = cv2.bitwise_not(ink_mask)

        logger.debug("Ink preprocessing completed.")
        return result

    @staticmethod
    def preprocess_for_ocr(frame: np.ndarray) -> np.ndarray:
        """Preprocess with adaptive thresholding for general OCR.

        Args:
            frame: OpenCV image in BGR format.

        Returns:
            Preprocessed grayscale image.
        """
        logger.debug("Starting adaptive threshold preprocessing.")
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        processed = cv2.adaptiveThreshold(
            denoised, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=11, C=2,
        )
        return processed

    @staticmethod
    def preprocess_light(frame: np.ndarray) -> np.ndarray:
        """Light preprocessing — keeps more detail for EasyOCR.

        Args:
            frame: OpenCV image in BGR format.

        Returns:
            Lightly preprocessed grayscale image.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=6)
        logger.debug("Light preprocessing completed.")
        return denoised

    @staticmethod
    def preprocess_contrast(frame: np.ndarray) -> np.ndarray:
        """High-contrast preprocessing using CLAHE.

        Applies Contrast Limited Adaptive Histogram Equalization
        to enhance text written in faded or light ink.

        Args:
            frame: OpenCV image in BGR format.

        Returns:
            Contrast-enhanced grayscale image.
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        denoised = cv2.fastNlMeansDenoising(enhanced, h=8)
        logger.debug("CLAHE contrast preprocessing completed.")
        return denoised

    @staticmethod
    def save_snapshot(frame: np.ndarray, base_dir: str) -> str:
        """Save a captured frame to the snapshots folder.

        Creates the snapshots directory if it doesn't exist. Files
        are named with a timestamp for easy identification.

        Args:
            frame: OpenCV image to save.
            base_dir: Project base directory path.

        Returns:
            The absolute path of the saved snapshot file.
        """
        snapshots_dir = os.path.join(base_dir, "snapshots")
        os.makedirs(snapshots_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"capture_{timestamp}.png"
        filepath = os.path.join(snapshots_dir, filename)

        cv2.imwrite(filepath, frame)
        logger.info("Snapshot saved: %s", filepath)
        return filepath
