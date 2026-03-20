"""
Configuration module for the Student Paper Reader application.

Provides centralized configuration for OCR settings, model training,
logging, and application parameters.
"""

import logging
import os


class Config:
    """Application configuration settings.

    Centralizes all configurable parameters including OCR language,
    confidence thresholds, student code length, model training
    hyperparameters, and server settings.

    Attributes:
        OCR_LANGUAGES: Languages for EasyOCR to recognize.
        OCR_CONFIDENCE_THRESHOLD: Minimum confidence score to accept OCR results.
        STUDENT_CODE_LENGTH: Expected number of digits in the student code.
        CUSTOM_MODEL_DIR: Directory containing the trained custom model.
        TRAINING_EPOCHS: Number of epochs for model training.
        TRAINING_BATCH_SIZE: Batch size for training.
        TRAINING_LR: Learning rate for training.
    """

    # OCR Settings
    OCR_LANGUAGES: list[str] = ["en", "pt"]
    OCR_CONFIDENCE_THRESHOLD: float = 0.15
    OCR_GPU: bool = False

    # Student Code Settings
    STUDENT_CODE_LENGTH: int = 6

    # Name Recognition Settings
    ALLOWED_NAME_CHARS: str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ "
    MIN_NAME_LENGTH: int = 2

    # Custom Model Settings
    CUSTOM_MODEL_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "custom_model",
    )
    MODEL_IMG_HEIGHT: int = 32
    MODEL_IMG_WIDTH: int = 256
    MODEL_HIDDEN_SIZE: int = 256

    # Training Hyperparameters
    TRAINING_EPOCHS: int = 100
    TRAINING_BATCH_SIZE: int = 16
    TRAINING_LR: float = 0.001
    SYNTHETIC_PER_LABEL: int = 50

    # Logging Settings
    LOG_LEVEL: int = logging.INFO
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    DEBUG: bool = True

    # Base directory
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    @classmethod
    def configure_logging(cls) -> None:
        """Configure the application-wide logging settings.

        Sets up the root logger with the configured format and level.
        """
        logging.basicConfig(
            level=cls.LOG_LEVEL,
            format=cls.LOG_FORMAT,
        )

    @classmethod
    def has_custom_model(cls) -> bool:
        """Check if a trained custom model exists.

        Returns:
            True if model.pth and charset.json exist in CUSTOM_MODEL_DIR.
        """
        model_path = os.path.join(cls.CUSTOM_MODEL_DIR, "model.pth")
        codec_path = os.path.join(cls.CUSTOM_MODEL_DIR, "charset.json")
        return os.path.exists(model_path) and os.path.exists(codec_path)
