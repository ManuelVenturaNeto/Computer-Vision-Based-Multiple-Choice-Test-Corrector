"""
Code Extractor module.

Extracts 6-digit student codes from OCR results, carefully
distinguishing them from question numbers (1-2 digit numbers).
Includes OCR character correction for commonly confused characters
(e.g., O→0, l→1, S→5).
"""

import logging
import re
from typing import Any

from src.config import Config

logger = logging.getLogger(__name__)


class CodeExtractor:
    """Extracts 6-digit student codes from OCR text results.

    Uses multiple strategies to find the student code:
    1. Direct regex matching for exactly 6 consecutive digits.
    2. OCR character correction (O→0, I→1, S→5, etc.) then re-match.
    3. Concatenation of nearby digit fragments that might have been
       split by OCR into separate blocks.

    Attributes:
        code_length: Expected number of digits in the student code.
        code_pattern: Compiled regex pattern for matching student codes.
        char_corrections: Mapping of commonly misread characters to digits.
    """

    # Characters OCR commonly confuses with digits
    CHAR_TO_DIGIT: dict[str, str] = {
        "O": "0",
        "o": "0",
        "Q": "0",
        "D": "0",
        "I": "1",
        "i": "1",
        "l": "1",
        "|": "1",
        "!": "1",
        "Z": "2",
        "z": "2",
        "E": "3",
        "S": "5",
        "s": "5",
        "G": "6",
        "b": "6",
        "T": "7",
        "B": "8",
        "g": "9",
        "q": "9",
    }

    def __init__(self) -> None:
        """Initialize the code extractor with configured parameters."""
        self.code_length: int = Config.STUDENT_CODE_LENGTH
        # Match exactly N consecutive digits, not part of a longer number
        self.code_pattern: re.Pattern = re.compile(
            rf"(?<!\d)\d{{{self.code_length}}}(?!\d)"
        )
        # Relaxed pattern: allow digit-like chars mixed in
        self.relaxed_digit: re.Pattern = re.compile(r"[\d]")
        logger.info(
            "CodeExtractor initialized (code_length=%d).", self.code_length
        )

    def extract(self, text_blocks: list[dict[str, Any]]) -> str | None:
        """Extract the student code from a list of OCR text blocks.

        Tries three strategies in order:
        1. Direct match of exactly 6 digits in cleaned text.
        2. OCR character correction then match.
        3. Concatenation of digit fragments from nearby blocks.

        Rejects numbers shorter than 6 digits (question numbers like
        1, 2, 10, 25) and numbers longer than 6 digits.

        Args:
            text_blocks: List of OCR result dicts with 'text',
                'confidence', and 'bbox' keys.

        Returns:
            The 6-digit student code string, or None if not found.
        """
        logger.info(
            "Searching for %d-digit student code in %d text blocks.",
            self.code_length,
            len(text_blocks),
        )

        # Strategy 1: Direct digit matching
        result = self._direct_match(text_blocks)
        if result:
            logger.info("Code found via direct match: '%s'", result)
            return result

        # Strategy 2: OCR character correction
        result = self._corrected_match(text_blocks)
        if result:
            logger.info("Code found via OCR correction: '%s'", result)
            return result

        # Strategy 3: Concatenate nearby digit fragments
        result = self._fragment_match(text_blocks)
        if result:
            logger.info("Code found via fragment concatenation: '%s'", result)
            return result

        logger.warning("No valid %d-digit student code found.", self.code_length)
        return None

    def _direct_match(
        self, text_blocks: list[dict[str, Any]]
    ) -> str | None:
        """Find the code by direct regex matching on cleaned text.

        Args:
            text_blocks: OCR result blocks.

        Returns:
            Matched 6-digit code or None.
        """
        candidates: list[tuple[str, float]] = []

        for block in text_blocks:
            text = block["text"].strip()
            # Remove spaces, dots, dashes, commas within the text
            cleaned = re.sub(r"[\s.,\-:;/\\]", "", text)

            matches = self.code_pattern.findall(cleaned)
            for match in matches:
                candidates.append((match, block["confidence"]))
                logger.debug(
                    "Direct match: '%s' from '%s' (conf: %.2f)",
                    match, text, block["confidence"],
                )

        if candidates:
            best, conf = max(candidates, key=lambda c: c[1])
            return best
        return None

    def _corrected_match(
        self, text_blocks: list[dict[str, Any]]
    ) -> str | None:
        """Find the code by applying OCR character corrections.

        Replaces commonly misread characters (O→0, l→1, S→5, etc.)
        and then tries to match 6 consecutive digits.

        Args:
            text_blocks: OCR result blocks.

        Returns:
            Corrected 6-digit code or None.
        """
        candidates: list[tuple[str, float]] = []

        for block in text_blocks:
            text = block["text"].strip()
            # Remove spaces, dots, dashes
            cleaned = re.sub(r"[\s.,\-:;/\\]", "", text)

            # Skip text that is too short or too long to contain
            # exactly 6 digit-like characters
            if len(cleaned) < self.code_length:
                continue

            # Apply character corrections
            corrected = self._apply_corrections(cleaned)

            matches = self.code_pattern.findall(corrected)
            for match in matches:
                candidates.append((match, block["confidence"]))
                logger.debug(
                    "Corrected match: '%s' from '%s' -> '%s' (conf: %.2f)",
                    match, text, corrected, block["confidence"],
                )

        if candidates:
            best, conf = max(candidates, key=lambda c: c[1])
            return best
        return None

    def _fragment_match(
        self, text_blocks: list[dict[str, Any]]
    ) -> str | None:
        """Find the code by concatenating digit fragments from nearby blocks.

        Some OCR engines split a 6-digit number into multiple text blocks
        (e.g., '123' + '456'). This method tries to combine adjacent
        blocks that contain mostly digits.

        Args:
            text_blocks: OCR result blocks.

        Returns:
            Combined 6-digit code or None.
        """
        # Collect blocks that are mostly numeric
        digit_blocks: list[dict[str, Any]] = []

        for block in text_blocks:
            text = block["text"].strip()
            cleaned = re.sub(r"[\s.,\-:;/\\]", "", text)
            if not cleaned:
                continue

            # Count digit-like characters
            digit_count = sum(1 for c in cleaned if c.isdigit())
            ratio = digit_count / len(cleaned)

            # Consider blocks that are >50% digits and 1-5 digits long
            if ratio > 0.5 and 1 <= digit_count <= 5:
                # Extract just the digits
                digits_only = re.sub(r"\D", "", cleaned)
                if digits_only and len(digits_only) <= 5:
                    digit_blocks.append({
                        "digits": digits_only,
                        "bbox": block["bbox"],
                        "confidence": block["confidence"],
                    })

        # Try combining pairs of blocks (sorted by position)
        digit_blocks.sort(key=lambda b: (self._bbox_center_y(b["bbox"]),
                                          self._bbox_left_x(b["bbox"])))

        for i in range(len(digit_blocks)):
            for j in range(i + 1, len(digit_blocks)):
                combined = digit_blocks[i]["digits"] + digit_blocks[j]["digits"]
                if len(combined) == self.code_length and combined.isdigit():
                    avg_conf = (
                        digit_blocks[i]["confidence"]
                        + digit_blocks[j]["confidence"]
                    ) / 2
                    logger.debug(
                        "Fragment combination: '%s' + '%s' = '%s' (conf: %.2f)",
                        digit_blocks[i]["digits"],
                        digit_blocks[j]["digits"],
                        combined,
                        avg_conf,
                    )
                    return combined

        return None

    def _apply_corrections(self, text: str) -> str:
        """Apply OCR character corrections to a text string.

        Replaces characters commonly misread by OCR with their
        digit equivalents — but only when surrounded by digits or
        digit-like characters.

        Args:
            text: Cleaned OCR text.

        Returns:
            Text with character corrections applied.
        """
        result = list(text)
        for i, char in enumerate(result):
            if char.isdigit():
                continue
            if char in self.CHAR_TO_DIGIT:
                # Only correct if adjacent characters are digits or correctable
                has_digit_neighbor = False
                if i > 0 and (result[i - 1].isdigit() or result[i - 1] in self.CHAR_TO_DIGIT):
                    has_digit_neighbor = True
                if i < len(result) - 1 and (result[i + 1].isdigit() or result[i + 1] in self.CHAR_TO_DIGIT):
                    has_digit_neighbor = True
                if has_digit_neighbor:
                    result[i] = self.CHAR_TO_DIGIT[char]

        return "".join(result)

    @staticmethod
    def _bbox_center_y(bbox) -> float:
        """Get vertical center of a bounding box.

        Args:
            bbox: EasyOCR bounding box.

        Returns:
            Y-coordinate of center.
        """
        return sum(p[1] for p in bbox) / len(bbox)

    @staticmethod
    def _bbox_left_x(bbox) -> float:
        """Get leftmost X of a bounding box.

        Args:
            bbox: EasyOCR bounding box.

        Returns:
            Minimum X-coordinate.
        """
        return min(p[0] for p in bbox)
