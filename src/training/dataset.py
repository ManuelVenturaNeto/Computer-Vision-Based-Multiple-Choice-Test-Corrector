"""
OCR Training Dataset module.

Provides PyTorch Dataset classes for loading annotated images,
cropping text regions, and generating synthetic training data
for fine-tuning the CRNN text recognition model.
"""

import json
import logging
import os
import random
from typing import Any, Optional

import cv2
import numpy as np
import torch
from torch.utils.data import Dataset

from src.training.model import CharsetCodec

logger = logging.getLogger(__name__)


class OCRDataset(Dataset):
    """PyTorch Dataset for OCR training data.

    Loads annotated snapshot images, detects text regions using
    EasyOCR, and crops them into individual training samples.
    Also generates synthetic text images to augment the dataset.

    Attributes:
        samples: List of (image, label) tuples.
        codec: Character-to-index codec.
        img_height: Target image height for model input.
        img_width: Target image width for model input.
    """

    def __init__(
        self,
        annotations_path: str,
        snapshots_dir: str,
        codec: CharsetCodec,
        img_height: int = 32,
        img_width: int = 256,
        augment: bool = True,
        synthetic_per_label: int = 50,
    ) -> None:
        """Initialize the dataset from annotations and snapshot images.

        Args:
            annotations_path: Path to `annotations.json`.
            snapshots_dir: Path to directory containing snapshot images.
            codec: CharsetCodec for encoding labels.
            img_height: Target height for cropped text images.
            img_width: Target width for cropped text images.
            augment: Whether to apply data augmentation.
            synthetic_per_label: Number of synthetic images per label.
        """
        self.codec = codec
        self.img_height = img_height
        self.img_width = img_width
        self.augment = augment
        self.samples: list[tuple[np.ndarray, str]] = []

        # Load annotations
        with open(annotations_path, "r", encoding="utf-8") as f:
            annotations: dict[str, dict[str, str]] = json.load(f)

        logger.info("Loaded %d annotations from %s.", len(annotations), annotations_path)

        # Collect all unique labels
        all_labels: set[str] = set()
        for entry in annotations.values():
            if entry.get("name"):
                all_labels.add(entry["name"])
            if entry.get("code"):
                all_labels.add(entry["code"])

        # Load and crop real images
        self._load_real_samples(annotations, snapshots_dir)

        # Generate synthetic data
        if synthetic_per_label > 0:
            for label in all_labels:
                self._generate_synthetic(label, synthetic_per_label)

        logger.info(
            "Dataset ready: %d total samples (%d real + synthetic).",
            len(self.samples), len(self.samples),
        )

    def _load_real_samples(
        self,
        annotations: dict[str, dict[str, str]],
        snapshots_dir: str,
    ) -> None:
        """Load real cropped text regions from annotated snapshots.

        Uses EasyOCR for text detection (bounding boxes only), then
        crops each detected region and assigns the closest matching
        annotation label.

        Args:
            annotations: Dict mapping filenames to {name, code}.
            snapshots_dir: Directory containing snapshot images.
        """
        try:
            import easyocr
            detector = easyocr.Reader(["en", "pt"], gpu=False)
        except Exception as e:
            logger.warning("Could not init EasyOCR for detection: %s", e)
            return

        for filename, labels in annotations.items():
            filepath = os.path.join(snapshots_dir, filename)
            if not os.path.exists(filepath):
                logger.warning("Snapshot not found: %s", filepath)
                continue

            image = cv2.imread(filepath)
            if image is None:
                logger.warning("Failed to read image: %s", filepath)
                continue

            # Detect text regions
            results = detector.readtext(image)
            name_label = labels.get("name", "")
            code_label = labels.get("code", "")

            for bbox, text, confidence in results:
                # Crop the region
                cropped = self._crop_bbox(image, bbox)
                if cropped is None:
                    continue

                # Assign label: if the detected text looks numeric, assign code
                # Otherwise assign name
                cleaned = text.strip().replace(" ", "")
                if cleaned.isdigit() and len(cleaned) >= 4 and code_label:
                    self.samples.append((cropped, code_label))
                    logger.debug("Real sample (code): '%s' from %s", code_label, filename)
                elif any(c.isalpha() for c in text) and len(text) >= 3 and name_label:
                    self.samples.append((cropped, name_label))
                    logger.debug("Real sample (name): '%s' from %s", name_label, filename)

            logger.info("Loaded %d regions from %s.", len(results), filename)

    def _generate_synthetic(self, label: str, count: int) -> None:
        """Generate synthetic text images for a given label.

        Creates images with the label text rendered in various fonts,
        sizes, and styles to augment the training set.

        Args:
            label: Text label to render.
            count: Number of synthetic images to generate.
        """
        for i in range(count):
            img = self._render_text_image(label)
            if self.augment:
                img = self._augment_image(img)
            self.samples.append((img, label))

        logger.debug("Generated %d synthetic samples for '%s'.", count, label)

    def _render_text_image(self, text: str) -> np.ndarray:
        """Render text onto a synthetic image.

        Creates a white background image with the text drawn in
        dark ink, simulating handwritten text on paper.

        Args:
            text: Text to render.

        Returns:
            Grayscale image as numpy array.
        """
        # Random parameters for variation
        font_scale = random.uniform(0.6, 1.2)
        thickness = random.choice([1, 2])
        font = random.choice([
            cv2.FONT_HERSHEY_SIMPLEX,
            cv2.FONT_HERSHEY_DUPLEX,
            cv2.FONT_HERSHEY_COMPLEX,
            cv2.FONT_HERSHEY_TRIPLEX,
            cv2.FONT_HERSHEY_SCRIPT_SIMPLEX,
            cv2.FONT_HERSHEY_SCRIPT_COMPLEX,
        ])

        # Measure text size
        (text_w, text_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)

        # Create image with padding
        pad = 10
        img_w = text_w + pad * 2
        img_h = text_h + baseline + pad * 2

        # White background with slight variation
        bg_val = random.randint(220, 255)
        img = np.full((img_h, img_w), bg_val, dtype=np.uint8)

        # Text color: dark (simulating ink)
        text_val = random.randint(0, 60)

        # Draw text
        x = pad + random.randint(-3, 3)
        y = img_h - pad - baseline + random.randint(-2, 2)
        cv2.putText(img, text, (x, y), font, font_scale, text_val, thickness)

        return img

    def _augment_image(self, img: np.ndarray) -> np.ndarray:
        """Apply random augmentations to a training image.

        Augmentations include: rotation, blur, noise, brightness
        shift, and slight perspective warp.

        Args:
            img: Grayscale image to augment.

        Returns:
            Augmented image.
        """
        h, w = img.shape[:2]

        # Random rotation (-5 to +5 degrees)
        if random.random() > 0.5:
            angle = random.uniform(-5, 5)
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            img = cv2.warpAffine(img, M, (w, h), borderValue=255)

        # Random gaussian blur
        if random.random() > 0.5:
            ksize = random.choice([3, 5])
            img = cv2.GaussianBlur(img, (ksize, ksize), 0)

        # Random noise
        if random.random() > 0.5:
            noise = np.random.normal(0, random.uniform(5, 15), img.shape).astype(np.int16)
            img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

        # Random brightness shift
        if random.random() > 0.5:
            shift = random.randint(-30, 30)
            img = np.clip(img.astype(np.int16) + shift, 0, 255).astype(np.uint8)

        return img

    @staticmethod
    def _crop_bbox(image: np.ndarray, bbox) -> Optional[np.ndarray]:
        """Crop a bounding box region from an image.

        Args:
            image: Source image (BGR).
            bbox: EasyOCR bounding box [[x1,y1],[x2,y2],[x3,y3],[x4,y4]].

        Returns:
            Cropped and grayscale image, or None if too small.
        """
        try:
            pts = np.array(bbox, dtype=np.int32)
            x_min = max(0, pts[:, 0].min())
            x_max = pts[:, 0].max()
            y_min = max(0, pts[:, 1].min())
            y_max = pts[:, 1].max()

            if x_max - x_min < 5 or y_max - y_min < 5:
                return None

            cropped = image[y_min:y_max, x_min:x_max]
            gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
            return gray
        except Exception:
            return None

    def _prepare_image(self, img: np.ndarray) -> torch.Tensor:
        """Resize and normalize an image for model input.

        Args:
            img: Grayscale image as numpy array.

        Returns:
            Normalized tensor of shape (1, img_height, img_width).
        """
        # Ensure grayscale
        if len(img.shape) == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Resize maintaining aspect ratio, pad to target width
        h, w = img.shape
        ratio = self.img_height / h
        new_w = min(int(w * ratio), self.img_width)
        resized = cv2.resize(img, (new_w, self.img_height))

        # Pad to target width
        padded = np.full(
            (self.img_height, self.img_width), 255, dtype=np.uint8
        )
        padded[:, :new_w] = resized

        # Normalize to [0, 1]
        tensor = torch.FloatTensor(padded).unsqueeze(0) / 255.0
        return tensor

    def __len__(self) -> int:
        """Return the number of samples in the dataset."""
        return len(self.samples)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor, int]:
        """Get a training sample by index.

        Args:
            idx: Sample index.

        Returns:
            Tuple of (image_tensor, label_tensor, label_length).
        """
        img, label = self.samples[idx]
        img_tensor = self._prepare_image(img)
        encoded_label = self.codec.encode(label)
        label_tensor = torch.IntTensor(encoded_label)
        return img_tensor, label_tensor, len(encoded_label)


def collate_fn(
    batch: list[tuple[torch.Tensor, torch.Tensor, int]],
) -> tuple[torch.Tensor, torch.Tensor, torch.IntTensor, torch.IntTensor]:
    """Custom collate function for CTC-based training.

    Pads labels to the same length within a batch and returns
    the lengths for CTC loss computation.

    Args:
        batch: List of (image, label, label_length) tuples.

    Returns:
        Tuple of (images, labels, input_lengths, label_lengths).
    """
    images, labels, label_lengths = zip(*batch)

    images = torch.stack(images, dim=0)

    # Pad labels to max length in batch
    max_len = max(label_lengths)
    padded_labels = torch.zeros(len(labels), max_len, dtype=torch.int32)
    for i, label in enumerate(labels):
        padded_labels[i, : len(label)] = label

    # Concatenate labels for CTC loss (flat format)
    concat_labels = torch.cat([l for l in labels])

    # Input lengths: sequence length from model output (width / reduction factor)
    # The CNN reduces width by factor of 1 (only height is reduced)
    label_lengths_tensor = torch.IntTensor(list(label_lengths))

    return images, concat_labels, label_lengths_tensor
