"""Modular, memory-optimized training and validation pipeline."""

import os
import time
import json
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from sklearn.metrics import f1_score
import pandas as pd
import numpy as np

from ml.preprocessing.vocabulary import PAD_TOKEN, Q8_CHARS, Q3_CHARS
from ml.models.champion_model import MemoryEfficientBiGRU, get_default_device
from ml.datasets.protein_dataset import ProteinDataset, protein_collate_fn, LengthGroupedBatchSampler
from ml.evaluation.metrics import harmonic_mean


@dataclass
class TrainingConfig:
    seed: int = 42
    embed_dim: int = 128
    cnn_channels: int = 64
    hidden_dim: int = 384
    num_layers: int = 2
    num_heads: int = 4
    dropout: float = 0.4
    
    batch_size: int = 32
    grad_accum_steps: int = 2
    learning_rate: float = 5e-4
    weight_decay: float = 1e-4
    epochs: int = 60
    grad_clip: float = 0.5
    label_smoothing: float = 0.1
    max_class_weight: float = 3.0
    patience: int = 10
    
    use_amp: bool = True
    use_checkpointing: bool = True
    
    checkpoint_dir: str = "checkpoints"
    save_filename: str = "best_model_bigru_v10.pth"
    val_split: float = 0.1


def compute_capped_class_weights(
    labels_series: pd.Series,
    vocab: list,
    max_weight: float = 3.0
) -> torch.Tensor:
    """Compute inverse class frequency weights with capping, zeroing index 0 (PAD)."""
    counts = {c: 0 for c in vocab if c != '<PAD>'}
    for label_str in labels_series:
        if isinstance(label_str, str):
            for c in label_str:
                if c in counts:
                    counts[c] += 1

    total = sum(counts.values())
    weights = torch.ones(len(vocab))
    for c, cnt in counts.items():
        if cnt > 0:
            idx = vocab.index(c)
            weights[idx] = min(total / (len(counts) * cnt), max_weight)

    weights[0] = 0.0  # PAD token receives zero weight
    if len(weights) > 1 and weights[1:].max() > 0:
        weights = weights / weights[1:].max()  # Normalize by max biological class weight

    return weights


class Trainer:
    """Production Trainer encapsulating all memory optimizations and reproducible validation."""

    def __init__(
        self,
        config: TrainingConfig,
        model: Optional[MemoryEfficientBiGRU] = None,
        device: Optional[torch.device] = None
    ):
        self.config = config
        self.device = device or get_default_device()
        self._set_seed(self.config.seed)

        self.model = model or MemoryEfficientBiGRU(
            embed_dim=self.config.embed_dim,
            cnn_channels=self.config.cnn_channels,
            hidden_dim=self.config.hidden_dim,
            num_layers=self.config.num_layers,
            num_heads=self.config.num_heads,
            dropout=self.config.dropout,
            use_checkpointing=self.config.use_checkpointing
        )
        self.model.to(self.device)

        # Device-specific AMP configuration
        self.device_type = self.device.type
        self.amp_enabled = self.config.use_amp and (self.device_type in ["cuda", "mps"])
        self.scaler = torch.amp.GradScaler(device=self.device_type) if self.amp_enabled and self.device_type == "cuda" else None

        self.optimizer = optim.AdamW(
            self.model.parameters(),
            lr=self.config.learning_rate,
            weight_decay=self.config.weight_decay
        )
        self.scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
            self.optimizer, T_0=10, T_mult=2, eta_min=1e-6
        )

        self.history: Dict[str, list] = {
            "epoch": [],
            "train_loss": [],
            "train_q8_f1": [],
            "train_q3_f1": [],
            "train_harm_f1": [],
            "val_loss": [],
            "val_q8_f1": [],
            "val_q3_f1": [],
            "val_harm_f1": []
        }
        self.best_score = 0.0
        self.best_epoch = 0

    def _set_seed(self, seed: int):
        torch.manual_seed(seed)
        np.random.seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    def prepare_data(
        self,
        train_df: pd.DataFrame,
        val_df: pd.DataFrame
    ) -> Tuple[DataLoader, DataLoader, nn.Module, nn.Module]:
        """Prepare datasets, data loaders, and capped loss functions."""
        train_ds = ProteinDataset(train_df, mode="train")
        val_ds = ProteinDataset(val_df, mode="train")

        train_sampler = LengthGroupedBatchSampler(
            train_ds, batch_size=self.config.batch_size, shuffle=True, seed=self.config.seed
        )
        train_loader = DataLoader(
            train_ds,
            batch_sampler=train_sampler,
            collate_fn=protein_collate_fn
        )
        val_loader = DataLoader(
            val_ds,
            batch_size=self.config.batch_size,
            shuffle=False,
            collate_fn=protein_collate_fn
        )

        q8_w = compute_capped_class_weights(train_df["sst8"], Q8_CHARS, self.config.max_class_weight).to(self.device)
        q3_w = compute_capped_class_weights(train_df["sst3"], Q3_CHARS, self.config.max_class_weight).to(self.device)

        crit_q8 = nn.CrossEntropyLoss(
            weight=q8_w, ignore_index=PAD_TOKEN, label_smoothing=self.config.label_smoothing
        )
        crit_q3 = nn.CrossEntropyLoss(
            weight=q3_w, ignore_index=PAD_TOKEN, label_smoothing=self.config.label_smoothing
        )

        return train_loader, val_loader, crit_q8, crit_q3

    def train_epoch(
        self,
        loader: DataLoader,
        criterion_q8: nn.Module,
        criterion_q3: nn.Module,
        epoch: int
    ) -> Tuple[float, float, float, float]:
        """Train a single epoch using gradient accumulation and optional mixed precision."""
        self.model.train()
        total_loss, total_q8_f1, total_q3_f1, steps = 0.0, 0.0, 0.0, 0
        self.optimizer.zero_grad()

        for step, batch in enumerate(loader):
            seq = batch["seq"].to(self.device, non_blocking=True)
            q8_tgt = batch["q8"].to(self.device, non_blocking=True)
            q3_tgt = batch["q3"].to(self.device, non_blocking=True)

            # Mixed precision context where enabled
            if self.amp_enabled and self.device_type == "cuda":
                with torch.amp.autocast(device_type="cuda"):
                    q8_logits, q3_logits, _ = self.model(seq)
                    loss_q8 = criterion_q8(q8_logits.view(-1, len(Q8_CHARS)), q8_tgt.view(-1))
                    loss_q3 = criterion_q3(q3_logits.view(-1, len(Q3_CHARS)), q3_tgt.view(-1))
                    loss = loss_q8 + loss_q3
                self.scaler.scale(loss / self.config.grad_accum_steps).backward()
            else:
                q8_logits, q3_logits, _ = self.model(seq)
                loss_q8 = criterion_q8(q8_logits.view(-1, len(Q8_CHARS)), q8_tgt.view(-1))
                loss_q3 = criterion_q3(q3_logits.view(-1, len(Q3_CHARS)), q3_tgt.view(-1))
                loss = loss_q8 + loss_q3
                (loss / self.config.grad_accum_steps).backward()

            if (step + 1) % self.config.grad_accum_steps == 0 or (step + 1) == len(loader):
                if self.scaler:
                    self.scaler.unscale_(self.optimizer)
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.config.grad_clip)
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                else:
                    torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.config.grad_clip)
                    self.optimizer.step()

                self.optimizer.zero_grad()
                self.scheduler.step(epoch + step / len(loader))

            total_loss += loss.item()
            
            # Step metric tracking (in float32)
            with torch.no_grad():
                mask_q8 = (q8_tgt != PAD_TOKEN)
                q8_preds = q8_logits.argmax(-1)[mask_q8].cpu().numpy()
                q8_targets = q8_tgt[mask_q8].cpu().numpy()
                q8_f1 = float(f1_score(q8_targets, q8_preds, average="macro", zero_division=0))

                mask_q3 = (q3_tgt != PAD_TOKEN)
                q3_preds = q3_logits.argmax(-1)[mask_q3].cpu().numpy()
                q3_targets = q3_tgt[mask_q3].cpu().numpy()
                q3_f1 = float(f1_score(q3_targets, q3_preds, average="macro", zero_division=0))

                total_q8_f1 += q8_f1
                total_q3_f1 += q3_f1
                steps += 1

        avg_loss = total_loss / steps if steps else 0.0
        avg_q8 = total_q8_f1 / steps if steps else 0.0
        avg_q3 = total_q3_f1 / steps if steps else 0.0
        avg_harm = harmonic_mean(avg_q8, avg_q3)
        return avg_loss, avg_q8, avg_q3, avg_harm

    @torch.no_grad()
    def validate(
        self,
        loader: DataLoader,
        criterion_q8: nn.Module,
        criterion_q3: nn.Module
    ) -> Tuple[float, float, float, float]:
        """Evaluate validation set cleanly across full unpadded residue positions."""
        self.model.eval()
        total_loss, steps = 0.0, 0
        all_q8_preds, all_q8_targets = [], []
        all_q3_preds, all_q3_targets = [], []

        for batch in loader:
            seq = batch["seq"].to(self.device, non_blocking=True)
            q8_tgt = batch["q8"].to(self.device, non_blocking=True)
            q3_tgt = batch["q3"].to(self.device, non_blocking=True)

            q8_logits, q3_logits, _ = self.model(seq)
            loss_q8 = criterion_q8(q8_logits.view(-1, len(Q8_CHARS)), q8_tgt.view(-1))
            loss_q3 = criterion_q3(q3_logits.view(-1, len(Q3_CHARS)), q3_tgt.view(-1))
            total_loss += (loss_q8 + loss_q3).item()
            steps += 1

            mask = (q8_tgt != PAD_TOKEN)
            all_q8_preds.extend(q8_logits.argmax(-1)[mask].cpu().numpy())
            all_q8_targets.extend(q8_tgt[mask].cpu().numpy())
            all_q3_preds.extend(q3_logits.argmax(-1)[mask].cpu().numpy())
            all_q3_targets.extend(q3_tgt[mask].cpu().numpy())

        f1_q8 = float(f1_score(all_q8_targets, all_q8_preds, average="macro", zero_division=0))
        f1_q3 = float(f1_score(all_q3_targets, all_q3_preds, average="macro", zero_division=0))
        val_harm = harmonic_mean(f1_q8, f1_q3)
        val_loss = total_loss / steps if steps else 0.0

        return val_loss, f1_q8, f1_q3, val_harm

    def save_checkpoint(self, epoch: int, val_score: float, val_metrics: Dict[str, float], path: str):
        """Save standard checkpoint containing model, optimizer, scheduler, and metrics."""
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        payload = {
            "epoch": epoch,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "best_score": val_score,
            "metrics": val_metrics,
            "config": asdict(self.config)
        }
        torch.save(payload, path)
