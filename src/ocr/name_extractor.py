"""
Name Extractor module.

Extracts student names from OCR results using two strategies:
1. Label-based: finds labels like "Nome", "NOME:", "Name" and extracts
   the text adjacent to or after them.
2. Heuristic-based: when no label is found, scores all text blocks
   to find what looks most like a person's name.
"""

import logging
import re
from typing import Any

from src.config import Config

logger = logging.getLogger(__name__)


class NameExtractor:
    """Extracts student names from OCR text results.

    Uses label detection (e.g. "Nome:", "NOME", "Name") to find text
    that follows a name label. Falls back to heuristic scoring when
    no label is found — selects the text block most similar to a
    person's name based on length, alphabetic content, and confidence.

    Attributes:
        min_length: Minimum character length for a valid name.
        name_pattern: Compiled regex for valid name characters.
        label_patterns: List of compiled regex patterns that match
            name labels on a form.
    """

    # Labels that indicate a name field on a paper form
    LABEL_KEYWORDS: list[str] = [
        r"nome\s*:?",
        r"name\s*:?",
        r"aluno\s*:?",
        r"estudante\s*:?",
        r"student\s*:?",
        r"candidato\s*:?",
    ]

    def __init__(self) -> None:
        """Initialize the name extractor with label patterns and config."""
        self.min_length: int = Config.MIN_NAME_LENGTH
        self.name_pattern: re.Pattern = re.compile(r"^[A-Za-zÀ-ÿ\s]+$")

        # Build label detection patterns (case insensitive)
        self.label_patterns: list[re.Pattern] = [
            re.compile(rf"(?i)^{kw}$") for kw in self.LABEL_KEYWORDS
        ]
        # Pattern to find a name embedded after a label in the same text block
        # e.g. "Nome: João Silva" or "NOME  Maria"
        self.inline_label_pattern: re.Pattern = re.compile(
            r"(?i)(?:nome|name|aluno|estudante|student|candidato)\s*:?\s+(.+)",
        )

        logger.info(
            "NameExtractor initialized (min_length=%d, %d label patterns).",
            self.min_length,
            len(self.label_patterns),
        )

    def extract(self, text_blocks: list[dict[str, Any]]) -> str | None:
        """Extract the student name from OCR text blocks.

        First tries label-based extraction (looking for 'Nome:', 'Name',
        etc.). If that fails, falls back to heuristic scoring of all
        text blocks to find the most name-like text.

        Args:
            text_blocks: List of OCR result dicts with 'text', 'confidence',
                and 'bbox' keys.

        Returns:
            Extracted student name string, or None if not found.
        """
        logger.info(
            "Searching for student name in %d text blocks.", len(text_blocks)
        )

        # Strategy 1: Try label-based extraction
        name = self._extract_by_label(text_blocks)
        if name:
            logger.info("Name found via label: '%s'", name)
            return name

        # Strategy 2: Heuristic-based extraction
        name = self._extract_by_heuristic(text_blocks)
        if name:
            logger.info("Name found via heuristic: '%s'", name)
            return name

        logger.warning("No valid name candidates found.")
        return None

    def _extract_by_label(
        self, text_blocks: list[dict[str, Any]]
    ) -> str | None:
        """Find a name by looking for label keywords in the text.

        Checks each block for inline labels (e.g. "Nome: João") and
        also looks for separate label blocks and takes the closest
        adjacent text block as the name.

        Args:
            text_blocks: OCR result blocks.

        Returns:
            Extracted name or None.
        """
        # Check for inline labels (label + name in same text block)
        for block in text_blocks:
            text = block["text"].strip()
            match = self.inline_label_pattern.match(text)
            if match:
                candidate = match.group(1).strip()
                candidate = self._clean_name(candidate)
                if candidate and len(candidate) >= self.min_length:
                    logger.debug(
                        "Inline label match: '%s' -> '%s'", text, candidate
                    )
                    return candidate

        # Check for standalone label blocks and find adjacent text
        label_indices: list[int] = []
        for i, block in enumerate(text_blocks):
            text = block["text"].strip()
            for pattern in self.label_patterns:
                if pattern.match(text):
                    label_indices.append(i)
                    logger.debug("Found standalone label at index %d: '%s'", i, text)
                    break

        # For each label block, find the closest text block that looks like a name
        for label_idx in label_indices:
            label_bbox = text_blocks[label_idx]["bbox"]
            label_center_y = self._bbox_center_y(label_bbox)
            label_right_x = self._bbox_right_x(label_bbox)

            best_candidate = None
            best_distance = float("inf")

            for j, block in enumerate(text_blocks):
                if j == label_idx:
                    continue
                text = block["text"].strip()
                cleaned = self._clean_name(text)
                if not cleaned or len(cleaned) < self.min_length:
                    continue
                if not self.name_pattern.match(cleaned):
                    continue

                # Calculate spatial distance (prefer text to the right or below the label)
                block_center_y = self._bbox_center_y(block["bbox"])
                block_left_x = self._bbox_left_x(block["bbox"])
                distance = abs(block_center_y - label_center_y) + abs(
                    block_left_x - label_right_x
                )

                if distance < best_distance:
                    best_distance = distance
                    best_candidate = cleaned

            if best_candidate:
                return best_candidate

        return None

    def _extract_by_heuristic(
        self, text_blocks: list[dict[str, Any]]
    ) -> str | None:
        """Find the most name-like text block using heuristic scoring.

        Scores each text block based on:
        - Alphabetic content (letters and spaces only)
        - Length (names are typically 5-40 characters)
        - Number of words (names usually have 2-5 words)
        - OCR confidence

        Args:
            text_blocks: OCR result blocks.

        Returns:
            Best name candidate or None.
        """
        candidates: list[tuple[str, float]] = []

        for block in text_blocks:
            text = block["text"].strip()
            cleaned = self._clean_name(text)
            if not cleaned or len(cleaned) < self.min_length:
                continue

            # Must be purely alphabetic
            if not self.name_pattern.match(cleaned):
                continue

            # Skip very short single-char words (OCR noise)
            words = cleaned.split()
            meaningful_words = [w for w in words if len(w) > 1]
            if not meaningful_words:
                continue

            # Score the candidate
            score = self._name_score(cleaned, block["confidence"])
            candidates.append((cleaned, score))
            logger.debug("Name candidate: '%s' (score: %.2f)", cleaned, score)

        if not candidates:
            return None

        best_name, best_score = max(candidates, key=lambda c: c[1])
        logger.debug("Best heuristic name: '%s' (score: %.2f)", best_name, best_score)
        return best_name

    @staticmethod
    def _name_score(text: str, confidence: float) -> float:
        """Calculate a heuristic score for how name-like a text string is.

        Args:
            text: The candidate text.
            confidence: OCR confidence score.

        Returns:
            Float score — higher means more name-like.
        """
        score = 0.0
        words = text.split()

        # Prefer 2-5 word names (first + last, or first + middle + last)
        if 2 <= len(words) <= 5:
            score += 3.0
        elif len(words) == 1 and len(text) >= 3:
            score += 1.0

        # Prefer names in typical length range (5 to 40 chars)
        if 5 <= len(text) <= 40:
            score += 2.0
        elif len(text) > 40:
            score -= 1.0  # Too long, probably a sentence

        # Bonus for capitalized words (names are often capitalized)
        capitalized = sum(1 for w in words if w[0].isupper())
        score += capitalized * 0.5

        # Factor in text length (longer = more likely a full name)
        score += min(len(text) / 10.0, 3.0)

        # Factor in OCR confidence
        score += confidence * 2.0

        return score

    @staticmethod
    def _clean_name(text: str) -> str:
        """Clean a text string for name matching.

        Removes leading/trailing punctuation and extra whitespace.

        Args:
            text: Raw OCR text.

        Returns:
            Cleaned text string.
        """
        # Remove common punctuation at boundaries
        text = re.sub(r"^[\s:;\-_.,]+|[\s:;\-_.,]+$", "", text)
        # Collapse multiple spaces
        text = re.sub(r"\s+", " ", text).strip()
        return text

    @staticmethod
    def _bbox_center_y(bbox) -> float:
        """Get the vertical center of a bounding box.

        Args:
            bbox: EasyOCR bounding box [[x1,y1],[x2,y2],[x3,y3],[x4,y4]].

        Returns:
            Y-coordinate of the center.
        """
        return sum(point[1] for point in bbox) / len(bbox)

    @staticmethod
    def _bbox_right_x(bbox) -> float:
        """Get the rightmost X coordinate of a bounding box.

        Args:
            bbox: EasyOCR bounding box.

        Returns:
            Maximum X-coordinate.
        """
        return max(point[0] for point in bbox)

    @staticmethod
    def _bbox_left_x(bbox) -> float:
        """Get the leftmost X coordinate of a bounding box.

        Args:
            bbox: EasyOCR bounding box.

        Returns:
            Minimum X-coordinate.
        """
        return min(point[0] for point in bbox)
