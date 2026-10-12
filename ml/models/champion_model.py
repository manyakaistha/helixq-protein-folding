"""Champion Architecture (Version 10) for Protein Secondary Structure Prediction.

MultiScale 1D-CNN + 2-Layer BiGRU + 4-Head Self-Attention + Dual Classification Heads.
Preserves exact layer names, weight shapes, and computation graphs from the champion checkpoint.
"""

import os
from typing import Optional, Tuple, Dict, Any
import torch
import torch.nn as nn
from torch.utils.checkpoint import checkpoint

from ml.preprocessing.vocabulary import PAD_TOKEN, AA_CHARS, Q8_CHARS, Q3_CHARS


class MultiScaleCNN(nn.Module):
    """Parallel 1D convolutions with receptive fields 3, 5, and 7 residues."""

    def __init__(self, in_dim: int = 128, out_dim: int = 64, kernels: list = [3, 5, 7], dropout: float = 0.3):
        super().__init__()
        self.convs = nn.ModuleList([
            nn.Conv1d(in_dim, out_dim, k, padding=k // 2) for k in kernels
        ])
        self.proj = nn.Linear(out_dim * len(kernels), out_dim * 2)
        self.norm = nn.LayerNorm(out_dim * 2)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: [B, L, in_dim] -> transpose for Conv1d: [B, in_dim, L]
        x = x.transpose(1, 2)
        conv_outs = [torch.relu(conv(x)) for conv in self.convs]
        # Concatenate along channel dimension -> [B, out_dim * len(kernels), L]
        x = torch.cat(conv_outs, dim=1).transpose(1, 2)
        return self.dropout(self.norm(self.proj(x)))


class EfficientSelfAttention(nn.Module):
    """Multi-head self-attention block with residual connection and LayerNorm."""

    def __init__(self, dim: int = 768, num_heads: int = 4, dropout: float = 0.1):
        super().__init__()
        self.attn = nn.MultiheadAttention(dim, num_heads, dropout=dropout, batch_first=True)
        self.norm = nn.LayerNorm(dim)
        self.dropout = nn.Dropout(dropout)

    def forward(
        self,
        x: torch.Tensor,
        mask: Optional[torch.Tensor] = None,
        need_weights: bool = False
    ) -> Tuple[torch.Tensor, Optional[torch.Tensor]]:
        if need_weights:
            attn_out, weights = self.attn(
                x, x, x,
                key_padding_mask=mask,
                need_weights=True,
                average_attn_weights=False
            )
            return self.norm(x + self.dropout(attn_out)), weights
        else:
            attn_out, _ = self.attn(
                x, x, x,
                key_padding_mask=mask,
                need_weights=False
            )
            return self.norm(x + self.dropout(attn_out)), None


class MemoryEfficientBiGRU(nn.Module):
    """Champion Version 10 Architecture: MultiScale CNN + BiGRU + Self-Attention + Dual Heads."""

    def __init__(
        self,
        vocab_size: int = len(AA_CHARS),
        embed_dim: int = 128,
        cnn_channels: int = 64,
        hidden_dim: int = 384,
        num_layers: int = 2,
        num_heads: int = 4,
        num_q8: int = len(Q8_CHARS),
        num_q3: int = len(Q3_CHARS),
        dropout: float = 0.4,
        use_checkpointing: bool = False
    ):
        super().__init__()
        self.use_checkpointing = use_checkpointing

        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=PAD_TOKEN)
        self.cnn = MultiScaleCNN(embed_dim, cnn_channels, dropout=dropout)

        gru_input_dim = cnn_channels * 2  # 64 * 2 = 128
        self.gru = nn.GRU(
            gru_input_dim,
            hidden_dim,
            num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0
        )

        self.gru_norm = nn.LayerNorm(hidden_dim * 2)
        self.residual_proj = nn.Linear(gru_input_dim, hidden_dim * 2)
        self.attention = EfficientSelfAttention(hidden_dim * 2, num_heads, dropout=0.1)
        self.dropout = nn.Dropout(dropout)

        # Dual classification heads
        self.q8_head = nn.Sequential(
            nn.Linear(hidden_dim * 2, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, num_q8)
        )
        self.q3_head = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, num_q3)
        )

    def _gru_forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.gru(x)
        return out

    def forward(
        self,
        x: torch.Tensor,
        return_attention: bool = False
    ) -> Tuple[torch.Tensor, torch.Tensor, Optional[torch.Tensor]]:
        """Forward pass.
        
        Args:
            x: Input token IDs [Batch, Length]
            return_attention: If True, returns attention weights [Batch, Heads, Length, Length]
            
        Returns:
            q8_logits: [Batch, Length, 9]
            q3_logits: [Batch, Length, 4]
            attention_weights: Optional [Batch, Heads, Length, Length]
        """
        pad_mask = (x == PAD_TOKEN)
        embed = self.embedding(x)
        cnn_out = self.cnn(embed)

        if self.use_checkpointing and self.training:
            gru_out = checkpoint(self._gru_forward, cnn_out, use_reentrant=False)
        else:
            gru_out, _ = self.gru(cnn_out)

        # Residual connection from CNN output projected to recurrent dimension
        residual = self.residual_proj(cnn_out)
        gru_out = self.gru_norm(gru_out + residual)

        # Self-attention
        attn_weights = None
        if self.use_checkpointing and self.training:
            attn_out, _ = checkpoint(
                self.attention, gru_out, pad_mask, False, use_reentrant=False
            )
        else:
            attn_out, attn_weights = self.attention(
                gru_out, mask=pad_mask, need_weights=return_attention
            )

        out = self.dropout(attn_out)
        q8_logits = self.q8_head(out)
        q3_logits = self.q3_head(out)

        if return_attention:
            return q8_logits, q3_logits, attn_weights
        return q8_logits, q3_logits, None


def get_default_device() -> torch.device:
    """Select the best available compute device (CUDA, Apple MPS, or CPU)."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def load_champion_model(
    checkpoint_path: Optional[str] = None,
    device: Optional[torch.device] = None,
    use_checkpointing: bool = False
) -> Tuple[MemoryEfficientBiGRU, Dict[str, Any]]:
    """Instantiate and load the champion model weights from checkpoint.
    
    Searches standard checkpoint locations in models/ and checkpoints/ if checkpoint_path is None.
    """
    if device is None:
        device = get_default_device()

    candidate_paths = [
        checkpoint_path,
        os.path.join(os.path.dirname(__file__), "..", "..", "models", "best_model_bigru_v10.pth"),
        os.path.join(os.path.dirname(__file__), "..", "..", "checkpoints", "best_model_bigru_v10.pth"),
        os.path.join(os.path.dirname(__file__), "..", "..", "best_model_bigru_v10.pth"),
        "models/best_model_bigru_v10.pth",
        "checkpoints/best_model_bigru_v10.pth",
        "best_model_bigru_v10.pth"
    ]
    resolved_path = None
    for p in candidate_paths:
        if p and os.path.exists(p):
            resolved_path = os.path.abspath(p)
            break

    if not resolved_path:
        raise FileNotFoundError(
            f"Could not locate champion checkpoint best_model_bigru_v10.pth. Checked: {candidate_paths}"
        )

    model = MemoryEfficientBiGRU(use_checkpointing=use_checkpointing)
    try:
        checkpoint_data = torch.load(resolved_path, map_location=device, weights_only=False)
    except TypeError:
        checkpoint_data = torch.load(resolved_path, map_location=device)

    if isinstance(checkpoint_data, dict) and "model_state_dict" in checkpoint_data:
        model.load_state_dict(checkpoint_data["model_state_dict"])
        meta = {
            "epoch": checkpoint_data.get("epoch", 15),
            "best_score": checkpoint_data.get("best_score", 0.470258),
            "metrics": checkpoint_data.get("metrics", {}),
            "checkpoint_path": resolved_path,
            "device": str(device)
        }
    else:
        model.load_state_dict(checkpoint_data)
        meta = {
            "epoch": None,
            "best_score": None,
            "metrics": {},
            "checkpoint_path": resolved_path,
            "device": str(device)
        }

    model.to(device)
    model.eval()
    return model, meta
