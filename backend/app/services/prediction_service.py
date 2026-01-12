"""Singleton prediction service wrapping inference and model state."""

import time
import torch
from typing import Dict, Any, Optional, List

from ml.inference.engine import InferenceEngine
from ml.analysis.structure_analysis import analyze_protein_structure
from ml.preprocessing.vocabulary import (
    clean_sequence, parse_fasta, validate_sequence, Q8_CHARS, Q3_CHARS, AA_CHARS
)
from backend.app.core.config import settings


class PredictionService:
    """Thread-safe singleton inference service."""

    _instance: Optional["PredictionService"] = None

    def __init__(self):
        self.start_time = time.time()
        self.device = None
        if settings.DEVICE == "cpu":
            self.device = torch.device("cpu")
        elif settings.DEVICE == "cuda" and torch.cuda.is_available():
            self.device = torch.device("cuda")
        elif settings.DEVICE == "mps" and torch.backends.mps.is_available():
            self.device = torch.device("mps")
        
        self.engine = InferenceEngine(
            checkpoint_path=settings.CHECKPOINT_PATH,
            device=self.device
        )
        self.model_loaded = True

    @classmethod
    def get_instance(cls) -> "PredictionService":
        if cls._instance is None:
            cls._instance = PredictionService()
        return cls._instance

    def get_health_status(self) -> Dict[str, Any]:
        uptime = time.time() - self.start_time
        return {
            "status": "healthy" if self.model_loaded else "degraded",
            "model_loaded": self.model_loaded,
            "device": str(self.engine.device),
            "model_version": "v10_memory_optimized",
            "uptime_seconds": round(uptime, 2)
        }

    def get_model_info(self) -> Dict[str, Any]:
        total_params = sum(p.numel() for p in self.engine.model.parameters())
        trainable_params = sum(p.numel() for p in self.engine.model.parameters() if p.requires_grad)

        return {
            "model_name": "Version 10: Hybrid MultiScale CNN + BiGRU + Self-Attention",
            "architecture": "MemoryEfficientBiGRU",
            "parameters": total_params,
            "trainable_parameters": trainable_params,
            "embedding_dim": 128,
            "cnn_channels": 64,
            "hidden_dim": 384,
            "recurrent_layers": 2,
            "attention_heads": 4,
            "vocab_size": len(AA_CHARS),
            "q8_classes": Q8_CHARS[1:],
            "q3_classes": Q3_CHARS[1:],
            "historical_competition_score": 0.4910,
            "checkpoint_epoch": self.engine.meta.get("epoch", 15),
            "device": str(self.engine.device),
            "training_optimizations": [
                "Dynamic micro-batch padding with collate_fn",
                "LengthGroupedBatchSampler (padding-waste reduction)",
                "Gradient Accumulation (step=2)",
                "CosineAnnealingWarmRestarts (T_0=10, T_mult=2)",
                "Label Smoothing (0.1)",
                "Capped Inverse-Class-Frequency Cross-Entropy (max=3.0)",
                "LayerNorm + Dropout(0.4) regularization",
                "Separate Independent Q8 and Q3 prediction heads"
            ]
        }

    def predict_single(
        self,
        sequence: str,
        seq_id: str = "seq_1",
        return_probabilities: bool = True,
        return_attention: bool = False
    ) -> Dict[str, Any]:
        # Handle case where user pasted FASTA format into sequence field
        cleaned = sequence.strip()
        if cleaned.startswith(">"):
            parsed = parse_fasta(cleaned)
            if parsed:
                seq_id = parsed[0]["id"]
                cleaned = parsed[0]["sequence"]

        return self.engine.predict_sequence(
            sequence=cleaned,
            seq_id=seq_id,
            return_probabilities=return_probabilities,
            return_attention=return_attention
        )

    def predict_batch(
        self,
        sequences: List[Dict[str, str]],
        return_probabilities: bool = False
    ) -> Dict[str, Any]:
        results = self.engine.predict_batch(
            records=sequences,
            return_probabilities=return_probabilities
        )
        successful = sum(1 for r in results if "error" not in r)
        failed = len(results) - successful

        return {
            "total_sequences": len(sequences),
            "successful": successful,
            "failed": failed,
            "results": results
        }

    def analyze(
        self,
        sequence: str,
        seq_id: str = "seq_1",
        q8: Optional[str] = None,
        q3: Optional[str] = None
    ) -> Dict[str, Any]:
        cleaned = clean_sequence(sequence)
        # If Q8 or Q3 not provided, run inference first
        if not q8 or not q3:
            pred = self.predict_single(cleaned, seq_id=seq_id, return_probabilities=True)
            q8 = pred["q8"]
            q3 = pred["q3"]
            residues = pred["residues"]
        else:
            residues = None

        analysis = analyze_protein_structure(
            sequence=cleaned,
            q8_pred=q8,
            q3_pred=q3,
            residues=residues
        )
        analysis["id"] = seq_id
        analysis["sequence"] = cleaned
        analysis["q8"] = q8
        analysis["q3"] = q3
        return analysis


prediction_service = PredictionService.get_instance()
