"""Health, readiness, metrics, and model metadata endpoints."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from backend.app.services.prediction_service import prediction_service

router = APIRouter()


@router.get("/health", summary="Service Health Status")
async def health() -> Dict[str, Any]:
    """Check service operational health and model readiness."""
    return prediction_service.get_health_status()


@router.get("/ready", summary="Service Readiness Probe")
async def ready() -> Dict[str, Any]:
    """Kubernetes/Docker readiness probe confirming checkpoint loaded."""
    if not prediction_service.model_loaded:
        raise HTTPException(status_code=503, detail="Model checkpoint is not loaded")
    return {"status": "ready", "model_version": "v10_memory_optimized"}


@router.get("/model/info", summary="Model Metadata & Architecture Details")
async def model_info() -> Dict[str, Any]:
    """Detailed specification of the champion model architecture and hyperparameters."""
    return prediction_service.get_model_info()


@router.get("/metrics", summary="Model Validation & Benchmark Metrics")
async def benchmark_metrics() -> Dict[str, Any]:
    """Historical competition benchmark metrics and newly reproduced validation metrics."""
    return {
        "historical_competition": {
            "score": 0.4910,
            "metric": "Harmonic Mean of Macro-F1 (Q8 & Q3)",
            "split": "Competition Private Test Set (1,816 proteins)",
            "status": "Verified Champion"
        },
        "reproduced_validation": {
            "val_harmonic_score": 0.4703,
            "val_q8_macro_f1": 0.3523,
            "val_q3_macro_f1": 0.7073,
            "split": "10% Holdout Split (727 proteins)",
            "status": "100% Exact Checkpoint Match"
        },
        "model_progression": [
            {"version": "v1", "name": "Vanilla Bi-RNN", "score": 0.4600},
            {"version": "v4", "name": "Bi-LSTM (3-layer)", "score": 0.4570},
            {"version": "v8", "name": "Bi-GRU + Residuals", "score": 0.4850},
            {"version": "v10", "name": "MultiScale CNN + BiGRU + Attention (Champion)", "score": 0.4910},
            {"version": "v11", "name": "Bi-GRU + CRF (OOM/Unstable)", "score": 0.4120}
        ]
    }
