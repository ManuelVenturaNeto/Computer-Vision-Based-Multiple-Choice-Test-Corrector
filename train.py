"""
Train — Entry point for training the custom OCR model.

Usage:
    python train.py

Requires:
    - `dataset/annotations.json` with image-to-label mappings
    - Snapshot images in `snapshots/` directory
"""

import logging
import os
import sys

# Project root directory
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT_DIR)

from src.config import Config
from src.training.trainer import ModelTrainer


def main() -> None:
    """Run the training pipeline.

    Validates that annotations and snapshots exist, then trains
    the CRNN model and saves it to the custom_model/ directory.
    """
    Config.configure_logging()
    logger = logging.getLogger(__name__)

    logger.info("=" * 60)
    logger.info("  Student Paper Reader — Model Training")
    logger.info("=" * 60)

    # Paths
    annotations_path = os.path.join(ROOT_DIR, "dataset", "annotations.json")
    snapshots_dir = os.path.join(ROOT_DIR, "snapshots")
    model_dir = os.path.join(ROOT_DIR, "custom_model")

    # Validate files exist
    if not os.path.exists(annotations_path):
        logger.error(
            "Annotations file not found: %s\n"
            "Create dataset/annotations.json with image-to-label mappings.",
            annotations_path,
        )
        sys.exit(1)

    if not os.path.exists(snapshots_dir):
        logger.error(
            "Snapshots directory not found: %s\n"
            "Capture some images first using the web interface.",
            snapshots_dir,
        )
        sys.exit(1)

    snapshot_files = [
        f for f in os.listdir(snapshots_dir)
        if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ]
    logger.info("Found %d snapshot images in %s.", len(snapshot_files), snapshots_dir)

    if not snapshot_files:
        logger.error("No snapshot images found. Capture some first.")
        sys.exit(1)

    # Create and run trainer
    trainer = ModelTrainer(
        annotations_path=annotations_path,
        snapshots_dir=snapshots_dir,
        model_dir=model_dir,
        epochs=Config.TRAINING_EPOCHS,
        batch_size=Config.TRAINING_BATCH_SIZE,
        learning_rate=Config.TRAINING_LR,
        img_height=Config.MODEL_IMG_HEIGHT,
        img_width=Config.MODEL_IMG_WIDTH,
        hidden_size=Config.MODEL_HIDDEN_SIZE,
        synthetic_per_label=Config.SYNTHETIC_PER_LABEL,
    )

    # Verify codec works
    trainer.evaluate_sample("Manuel Ventura de Oliveira Neto")
    trainer.evaluate_sample("712232")

    # Train!
    trainer.train()

    # Verify output
    model_path = os.path.join(model_dir, "model.pth")
    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        logger.info("Training complete! Model saved: %s (%.1f MB)", model_path, size_mb)
        logger.info("The server will automatically use this model on next startup.")
    else:
        logger.error("Training failed — no model file produced.")
        sys.exit(1)


if __name__ == "__main__":
    main()
