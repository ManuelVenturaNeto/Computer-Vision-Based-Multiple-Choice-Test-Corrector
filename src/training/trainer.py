"""
Model Trainer module.

Orchestrates the training loop for the CRNN text recognition model,
including data loading, optimization, loss computation, and model
checkpointing.
"""

import logging
import os
import time
from typing import Optional

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from src.training.dataset import OCRDataset, collate_fn
from src.training.model import CharsetCodec, CRNNModel

logger = logging.getLogger(__name__)


class ModelTrainer:
    """Trains and evaluates the CRNN text recognition model.

    Manages the full training lifecycle: dataset loading, model
    initialization, training loop with CTC loss, validation,
    and saving the best model checkpoint.

    Attributes:
        codec: Character codec for encoding/decoding.
        model: CRNN model instance.
        device: Torch device (cpu or cuda).
        model_dir: Directory to save the trained model.
    """

    def __init__(
        self,
        annotations_path: str,
        snapshots_dir: str,
        model_dir: str,
        epochs: int = 100,
        batch_size: int = 16,
        learning_rate: float = 0.001,
        img_height: int = 32,
        img_width: int = 256,
        hidden_size: int = 256,
        synthetic_per_label: int = 50,
    ) -> None:
        """Initialize the trainer with training configuration.

        Args:
            annotations_path: Path to annotations.json file.
            snapshots_dir: Path to directory with snapshot images.
            model_dir: Directory to save trained model and codec.
            epochs: Number of training epochs.
            batch_size: Training batch size.
            learning_rate: Adam optimizer learning rate.
            img_height: Input image height for the model.
            img_width: Input image width for the model.
            hidden_size: LSTM hidden state size.
            synthetic_per_label: Number of synthetic images per label.
        """
        self.annotations_path = annotations_path
        self.snapshots_dir = snapshots_dir
        self.model_dir = model_dir
        self.epochs = epochs
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.img_height = img_height
        self.img_width = img_width
        self.hidden_size = hidden_size
        self.synthetic_per_label = synthetic_per_label

        # Device selection
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info("Training device: %s", self.device)

        # Initialize codec
        self.codec = CharsetCodec()

        # Initialize model
        self.model = CRNNModel(
            num_classes=self.codec.num_classes,
            img_height=self.img_height,
            hidden_size=self.hidden_size,
        ).to(self.device)

        logger.info(
            "ModelTrainer initialized: epochs=%d, batch=%d, lr=%.4f.",
            epochs, batch_size, learning_rate,
        )

    def train(self) -> None:
        """Run the full training loop.

        Loads the dataset, trains the model for the configured number
        of epochs, logs progress, and saves the best model.
        """
        logger.info("=== Starting Training ===")
        start_time = time.time()

        # Create output directory
        os.makedirs(self.model_dir, exist_ok=True)

        # Load dataset
        logger.info("Loading training dataset...")
        dataset = OCRDataset(
            annotations_path=self.annotations_path,
            snapshots_dir=self.snapshots_dir,
            codec=self.codec,
            img_height=self.img_height,
            img_width=self.img_width,
            augment=True,
            synthetic_per_label=self.synthetic_per_label,
        )

        if len(dataset) == 0:
            logger.error("Dataset is empty. Cannot train.")
            return

        logger.info("Dataset size: %d samples.", len(dataset))

        # Create data loader
        dataloader = DataLoader(
            dataset,
            batch_size=self.batch_size,
            shuffle=True,
            collate_fn=collate_fn,
            num_workers=0,
            drop_last=False,
        )

        # Loss and optimizer
        criterion = nn.CTCLoss(blank=0, zero_infinity=True)
        optimizer = torch.optim.Adam(
            self.model.parameters(),
            lr=self.learning_rate,
        )
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode="min", patience=10, factor=0.5,
        )

        # Training loop
        best_loss = float("inf")
        self.model.train()

        for epoch in range(1, self.epochs + 1):
            epoch_loss = 0.0
            num_batches = 0

            for batch_idx, (images, labels, label_lengths) in enumerate(dataloader):
                images = images.to(self.device)
                labels = labels.to(self.device)
                label_lengths = label_lengths.to(self.device)

                # Forward pass
                outputs = self.model(images)  # (seq_len, batch, classes)
                seq_len = outputs.size(0)
                batch_size_actual = images.size(0)

                # Input lengths (all the same = sequence length from CNN)
                input_lengths = torch.full(
                    (batch_size_actual,), seq_len, dtype=torch.int32,
                    device=self.device,
                )

                # Compute CTC loss
                loss = criterion(outputs, labels, input_lengths, label_lengths)

                # Skip if loss is NaN or Inf
                if torch.isnan(loss) or torch.isinf(loss):
                    logger.warning(
                        "Epoch %d, batch %d: NaN/Inf loss, skipping.",
                        epoch, batch_idx,
                    )
                    continue

                # Backward pass
                optimizer.zero_grad()
                loss.backward()

                # Gradient clipping to prevent explosions
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=5.0)

                optimizer.step()

                epoch_loss += loss.item()
                num_batches += 1

            # Epoch summary
            if num_batches > 0:
                avg_loss = epoch_loss / num_batches
                scheduler.step(avg_loss)

                if epoch % 10 == 0 or epoch == 1:
                    current_lr = optimizer.param_groups[0]["lr"]
                    logger.info(
                        "Epoch %d/%d — Loss: %.4f — LR: %.6f",
                        epoch, self.epochs, avg_loss, current_lr,
                    )

                # Save best model
                if avg_loss < best_loss:
                    best_loss = avg_loss
                    self._save_checkpoint(epoch, avg_loss)
            else:
                logger.warning("Epoch %d: no valid batches.", epoch)

        # Final save
        elapsed = time.time() - start_time
        logger.info(
            "=== Training Complete === Best loss: %.4f — Time: %.1fs",
            best_loss, elapsed,
        )
        self._save_final()

    def _save_checkpoint(self, epoch: int, loss: float) -> None:
        """Save a model checkpoint with the best loss.

        Args:
            epoch: Current training epoch.
            loss: Current loss value.
        """
        model_path = os.path.join(self.model_dir, "model.pth")
        self.model.save_model(model_path)
        logger.debug(
            "Checkpoint saved at epoch %d (loss: %.4f).", epoch, loss,
        )

    def _save_final(self) -> None:
        """Save the final model and codec files."""
        model_path = os.path.join(self.model_dir, "model.pth")
        codec_path = os.path.join(self.model_dir, "charset.json")
        config_path = os.path.join(self.model_dir, "config.json")

        # Save model
        self.model.save_model(model_path)

        # Save codec
        self.codec.save(codec_path)

        # Save model config
        import json
        config = {
            "num_classes": self.codec.num_classes,
            "img_height": self.img_height,
            "img_width": self.img_width,
            "hidden_size": self.hidden_size,
        }
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)

        logger.info(
            "Final model saved to %s (model.pth + charset.json + config.json).",
            self.model_dir,
        )

    def evaluate_sample(self, text: str) -> str:
        """Run a single text through encode to verify codec coverage.

        Note: Uses direct index→char mapping (not CTC decode) to verify
        that all characters in the text are in the charset. CTC decode
        would collapse repeated consecutive characters by design.

        Args:
            text: Input text to test.

        Returns:
            Reconstructed text from encoded indices.
        """
        encoded = self.codec.encode(text)
        # Direct decode (no CTC collapsing) to verify charset coverage
        decoded = "".join(
            self.codec.idx_to_char.get(idx, "?") for idx in encoded
        )
        logger.info("Codec test: '%s' -> %s -> '%s'", text, encoded, decoded)
        return decoded
