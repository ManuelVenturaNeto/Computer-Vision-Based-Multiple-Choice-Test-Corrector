"""
OCR Processor module.

Orchestrates the OCR pipeline using EasyOCR for text detection
and optionally a custom CRNN model for text recognition when
a trained model is available.
"""

import json
import logging
import os
from typing import Any

import cv2
import easyocr
import numpy as np
import torch

from src.config import Config

logger = logging.getLogger(__name__)


class OCRProcessor:
    """Main OCR processing engine.

    Uses EasyOCR for text detection (finding bounding boxes) and
    either EasyOCR's built-in recognition or a custom fine-tuned
    CRNN model for reading the text content.

    When a custom model exists in `custom_model/`, it is loaded
    automatically and used for recognition, improving accuracy
    on the specific paper format.

    Attributes:
        reader: EasyOCR Reader instance for detection.
        confidence_threshold: Minimum confidence to accept a result.
        custom_model: Custom CRNN model (or None if not available).
        custom_codec: Character codec for the custom model.
        use_custom_model: Whether a custom model is loaded.
    """

    def __init__(self) -> None:
        """Initialize the OCR processor.

        Loads EasyOCR for text detection. If a trained custom model
        exists in the configured directory, loads it for recognition.
        """
        logger.info(
            "Initializing EasyOCR with languages: %s", Config.OCR_LANGUAGES
        )
        self.reader: easyocr.Reader = easyocr.Reader(
            Config.OCR_LANGUAGES, gpu=Config.OCR_GPU
        )
        self.confidence_threshold: float = Config.OCR_CONFIDENCE_THRESHOLD
        self.custom_model = None
        self.custom_codec = None
        self.use_custom_model: bool = False
        self._img_height: int = Config.MODEL_IMG_HEIGHT
        self._img_width: int = Config.MODEL_IMG_WIDTH

        # Try to load custom model
        self._load_custom_model()

        logger.info("EasyOCR reader initialized successfully.")

    def _load_custom_model(self) -> None:
        """Attempt to load a trained custom CRNN model.

        Checks if model.pth, charset.json, and config.json exist
        in the custom model directory. If so, loads the model and
        codec for use during recognition.
        """
        if not Config.has_custom_model():
            logger.info("No custom model found. Using EasyOCR only.")
            return

        try:
            from src.training.model import CharsetCodec, CRNNModel

            model_dir = Config.CUSTOM_MODEL_DIR
            codec_path = os.path.join(model_dir, "charset.json")
            model_path = os.path.join(model_dir, "model.pth")
            config_path = os.path.join(model_dir, "config.json")

            # Load codec
            self.custom_codec = CharsetCodec.load(codec_path)

            # Load model config
            model_config = {}
            if os.path.exists(config_path):
                with open(config_path, "r") as f:
                    model_config = json.load(f)

            num_classes = model_config.get("num_classes", self.custom_codec.num_classes)
            hidden_size = model_config.get("hidden_size", Config.MODEL_HIDDEN_SIZE)
            img_height = model_config.get("img_height", Config.MODEL_IMG_HEIGHT)
            img_width = model_config.get("img_width", Config.MODEL_IMG_WIDTH)

            self._img_height = img_height
            self._img_width = img_width

            # Load model
            self.custom_model = CRNNModel(
                num_classes=num_classes,
                img_height=img_height,
                hidden_size=hidden_size,
            )
            self.custom_model.load_model(model_path)
            self.custom_model.eval()

            self.use_custom_model = True
            logger.info(
                "Custom CRNN model loaded from %s (classes=%d).",
                model_dir, num_classes,
            )

        except Exception as e:
            logger.warning("Failed to load custom model: %s", str(e))
            self.use_custom_model = False

    def extract_text(
        self, image: np.ndarray
    ) -> list[dict[str, Any]]:
        """Run OCR on an image and return all detected text blocks.

        If a custom model is available, uses EasyOCR for detection
        (bounding boxes) and the custom CRNN for recognition.
        Otherwise, uses EasyOCR for both.

        Args:
            image: Image as numpy array (grayscale or BGR).

        Returns:
            List of dicts with 'bbox', 'text', and 'confidence' keys.
        """
        logger.info("Running OCR text extraction on image.")

        if self.use_custom_model:
            return self._extract_with_custom_model(image)
        else:
            return self._extract_with_easyocr(image)

    def _extract_with_easyocr(
        self, image: np.ndarray
    ) -> list[dict[str, Any]]:
        """Extract text using EasyOCR for both detection and recognition.

        Args:
            image: Image as numpy array.

        Returns:
            List of text block dicts.
        """
        try:
            results = self.reader.readtext(image)
        except Exception as e:
            logger.error("EasyOCR failed: %s", str(e))
            return []

        text_blocks: list[dict[str, Any]] = []
        for bbox, text, confidence in results:
            if confidence >= self.confidence_threshold:
                text_blocks.append({
                    "bbox": bbox,
                    "text": text.strip(),
                    "confidence": float(confidence),
                })
                logger.debug("Detected: '%s' (conf: %.2f)", text, confidence)

        logger.info("EasyOCR extracted %d text blocks.", len(text_blocks))
        return text_blocks

    def _extract_with_custom_model(
        self, image: np.ndarray
    ) -> list[dict[str, Any]]:
        """Extract text using EasyOCR detection + custom CRNN recognition.

        Uses EasyOCR to find text bounding boxes, crops each region,
        then runs the custom CRNN model on each crop for recognition.

        Args:
            image: Image as numpy array.

        Returns:
            List of text block dicts with custom model predictions.
        """
        # Step 1: Detect text regions with EasyOCR
        try:
            results = self.reader.readtext(image)
        except Exception as e:
            logger.error("EasyOCR detection failed: %s", str(e))
            return []

        if not results:
            logger.info("No text regions detected.")
            return []

        text_blocks: list[dict[str, Any]] = []

        for bbox, easyocr_text, easyocr_conf in results:
            if easyocr_conf < self.confidence_threshold * 0.5:
                continue

            # Crop the region
            cropped = self._crop_and_prepare(image, bbox)
            if cropped is None:
                # Fallback: use EasyOCR's recognition
                if easyocr_conf >= self.confidence_threshold:
                    text_blocks.append({
                        "bbox": bbox,
                        "text": easyocr_text.strip(),
                        "confidence": float(easyocr_conf),
                    })
                continue

            # Step 2: Recognize with custom model
            custom_text = self._recognize_crop(cropped)

            if custom_text and len(custom_text.strip()) > 0:
                text_blocks.append({
                    "bbox": bbox,
                    "text": custom_text.strip(),
                    "confidence": max(float(easyocr_conf), 0.5),
                })
                logger.debug(
                    "Custom model: '%s' (EasyOCR had: '%s')",
                    custom_text, easyocr_text,
                )
            elif easyocr_conf >= self.confidence_threshold:
                # Fallback to EasyOCR result
                text_blocks.append({
                    "bbox": bbox,
                    "text": easyocr_text.strip(),
                    "confidence": float(easyocr_conf),
                })

        logger.info(
            "Custom pipeline extracted %d text blocks.", len(text_blocks)
        )
        return text_blocks

    def _crop_and_prepare(
        self, image: np.ndarray, bbox
    ) -> torch.Tensor | None:
        """Crop a bounding box region and prepare for the CRNN model.

        Args:
            image: Source image.
            bbox: EasyOCR bounding box.

        Returns:
            Tensor of shape (1, 1, height, width) or None.
        """
        try:
            pts = np.array(bbox, dtype=np.int32)
            x_min = max(0, pts[:, 0].min())
            x_max = pts[:, 0].max()
            y_min = max(0, pts[:, 1].min())
            y_max = pts[:, 1].max()

            if x_max - x_min < 5 or y_max - y_min < 5:
                return None

            # Handle both BGR and grayscale images
            if len(image.shape) == 3:
                cropped = image[y_min:y_max, x_min:x_max]
                gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
            else:
                gray = image[y_min:y_max, x_min:x_max]

            # Resize to model input dimensions
            h, w = gray.shape
            ratio = self._img_height / h
            new_w = min(int(w * ratio), self._img_width)
            if new_w < 1:
                return None

            resized = cv2.resize(gray, (new_w, self._img_height))

            # Pad to target width
            padded = np.full(
                (self._img_height, self._img_width), 255, dtype=np.uint8
            )
            padded[:, :new_w] = resized

            # Convert to tensor: (1, 1, H, W) normalized to [0,1]
            tensor = torch.FloatTensor(padded).unsqueeze(0).unsqueeze(0) / 255.0
            return tensor

        except Exception as e:
            logger.debug("Failed to crop region: %s", str(e))
            return None

    def _recognize_crop(self, crop_tensor: torch.Tensor) -> str | None:
        """Run the custom CRNN model on a cropped text region.

        Args:
            crop_tensor: Tensor of shape (1, 1, height, width).

        Returns:
            Recognized text string, or None on failure.
        """
        try:
            preds = self.custom_model.predict(crop_tensor)
            indices = preds[0].tolist()
            text = self.custom_codec.decode(indices)
            return text
        except Exception as e:
            logger.debug("Custom model recognition failed: %s", str(e))
            return None
