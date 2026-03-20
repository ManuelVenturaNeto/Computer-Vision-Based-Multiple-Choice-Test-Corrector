"""
CRNN model for text recognition.

Defines the Convolutional Recurrent Neural Network architecture
used for recognizing handwritten text from cropped image regions.
Also provides a CharsetCodec for encoding/decoding characters.
"""

import json
import logging
import os
from typing import Optional

import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


class CharsetCodec:
    """Encodes and decodes characters to/from integer indices.

    Maps each character in the supported alphabet to a unique
    integer index for CTC-based training and decoding.

    Attributes:
        chars: String of all supported characters.
        char_to_idx: Dict mapping character to index.
        idx_to_char: Dict mapping index to character.
        num_classes: Total classes including CTC blank.
    """

    # Full charset: letters, accented chars, digits, space, punctuation
    DEFAULT_CHARS: str = (
        "abcdefghijklmnopqrstuvwxyz"
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝàáâãäåæçèéêëìíîïðñòóôõöùúûüý"
        "0123456789 .-:/"
    )

    def __init__(self, chars: Optional[str] = None) -> None:
        """Initialize the codec with a character set.

        Index 0 is reserved for the CTC blank token.

        Args:
            chars: String of characters to support.
        """
        self.chars: str = chars or self.DEFAULT_CHARS
        self.char_to_idx: dict[str, int] = {
            c: i + 1 for i, c in enumerate(self.chars)
        }
        self.idx_to_char: dict[int, str] = {
            i + 1: c for i, c in enumerate(self.chars)
        }
        self.num_classes: int = len(self.chars) + 1  # +1 for blank
        logger.info(
            "CharsetCodec: %d chars, %d classes.",
            len(self.chars), self.num_classes,
        )

    def encode(self, text: str) -> list[int]:
        """Encode text to indices. Skips unknown chars."""
        return [self.char_to_idx[c] for c in text if c in self.char_to_idx]

    def decode(self, indices: list[int]) -> str:
        """CTC-decode: remove blanks and collapse repeats."""
        result = []
        prev_idx = -1
        for idx in indices:
            if idx == 0:
                prev_idx = idx
                continue
            if idx == prev_idx:
                continue
            if idx in self.idx_to_char:
                result.append(self.idx_to_char[idx])
            prev_idx = idx
        return "".join(result)

    def save(self, filepath: str) -> None:
        """Save charset to JSON."""
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump({"chars": self.chars}, f, ensure_ascii=False, indent=2)
        logger.info("Charset saved to: %s", filepath)

    @classmethod
    def load(cls, filepath: str) -> "CharsetCodec":
        """Load charset from JSON."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        logger.info("Charset loaded from: %s", filepath)
        return cls(chars=data["chars"])


class CRNNModel(nn.Module):
    """Convolutional Recurrent Neural Network for text recognition.

    Architecture:
    1. CNN feature extractor (6 conv blocks with BatchNorm + ReLU + Pool)
    2. Bidirectional LSTM for sequence modeling
    3. Fully connected layer mapping to character classes

    The model takes a grayscale image of fixed height (32px) and
    variable width, and outputs a sequence of character probabilities.

    Attributes:
        cnn: Convolutional feature extractor.
        rnn: Bidirectional LSTM layers.
        fc: Final fully connected classifier.
        num_classes: Number of output classes (charset + CTC blank).
    """

    def __init__(
        self,
        num_classes: int,
        img_height: int = 32,
        hidden_size: int = 256,
        num_lstm_layers: int = 2,
    ) -> None:
        """Initialize the CRNN model.

        Args:
            num_classes: Number of character classes (including CTC blank).
            img_height: Input image height (default 32).
            hidden_size: LSTM hidden state size.
            num_lstm_layers: Number of stacked LSTM layers.
        """
        super().__init__()
        self.img_height = img_height
        self.num_classes = num_classes

        # --- CNN Feature Extractor ---
        self.cnn = nn.Sequential(
            # Block 1: 1 -> 64 channels
            nn.Conv2d(1, 64, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 2: 64 -> 128 channels
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # Block 3: 128 -> 256 channels
            nn.Conv2d(128, 256, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),

            # Block 4: 256 -> 256 channels
            nn.Conv2d(256, 256, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=(2, 1), stride=(2, 1)),

            # Block 5: 256 -> 512 channels
            nn.Conv2d(256, 512, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),

            # Block 6: 512 -> 512 channels
            nn.Conv2d(512, 512, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=(2, 1), stride=(2, 1)),
        )

        # Calculate CNN output height
        # Input h=32 -> /2=16 -> /2=8 -> /(2,1)=4 -> /(2,1)=2
        cnn_output_height = img_height // 16  # = 2
        rnn_input_size = 512 * cnn_output_height  # 512 * 2 = 1024

        # --- RNN Sequence Modeler ---
        self.rnn = nn.LSTM(
            input_size=rnn_input_size,
            hidden_size=hidden_size,
            num_layers=num_lstm_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.3 if num_lstm_layers > 1 else 0,
        )

        # --- Classifier ---
        self.fc = nn.Linear(hidden_size * 2, num_classes)  # *2 for bidirectional

        logger.info(
            "CRNNModel initialized: %d classes, hidden=%d, lstm_layers=%d.",
            num_classes, hidden_size, num_lstm_layers,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass through the CRNN.

        Args:
            x: Input tensor of shape (batch, 1, height, width).

        Returns:
            Output tensor of shape (seq_len, batch, num_classes)
            with log-probabilities for CTC loss.
        """
        # CNN: (B, 1, H, W) -> (B, 512, H', W')
        conv = self.cnn(x)

        # Reshape for RNN: (B, C, H', W') -> (B, W', C*H')
        batch, channels, height, width = conv.size()
        conv = conv.permute(0, 3, 1, 2)  # (B, W', C, H')
        conv = conv.contiguous().view(batch, width, channels * height)

        # RNN: (B, W', features) -> (B, W', hidden*2)
        rnn_out, _ = self.rnn(conv)

        # Classifier: (B, W', hidden*2) -> (B, W', num_classes)
        output = self.fc(rnn_out)

        # Permute for CTC: (B, W', C) -> (W', B, C)
        output = output.permute(1, 0, 2)

        # Log softmax for CTC loss
        output = torch.nn.functional.log_softmax(output, dim=2)

        return output

    def predict(self, x: torch.Tensor) -> torch.Tensor:
        """Run inference and return predicted class indices.

        Args:
            x: Input tensor of shape (batch, 1, height, width).

        Returns:
            Tensor of predicted indices, shape (batch, seq_len).
        """
        self.eval()
        with torch.no_grad():
            output = self.forward(x)  # (seq_len, batch, classes)
            output = output.permute(1, 0, 2)  # (batch, seq_len, classes)
            _, preds = output.max(2)  # (batch, seq_len)
        return preds

    def save_model(self, filepath: str) -> None:
        """Save model weights."""
        torch.save(self.state_dict(), filepath)
        logger.info("Model saved to: %s", filepath)

    def load_model(self, filepath: str, device: str = "cpu") -> None:
        """Load model weights."""
        self.load_state_dict(
            torch.load(filepath, map_location=device, weights_only=True)
        )
        logger.info("Model loaded from: %s", filepath)
