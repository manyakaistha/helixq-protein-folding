"""Inference endpoints for single and batch secondary structure prediction."""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any

from backend.app.schemas.protein import (
    PredictionRequest, PredictionResponse,
    BatchPredictionRequest, BatchPredictionResponse
)
from backend.app.services.prediction_service import prediction_service

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse, summary="Predict Secondary Structure (Single Sequence)")
async def predict_single(req: PredictionRequest):
    """Generate real Q8 and Q3 secondary structure predictions for an amino acid sequence."""
    try:
        result = prediction_service.predict_single(
            sequence=req.sequence,
            seq_id=req.id or "seq_1",
            return_probabilities=req.return_probabilities,
            return_attention=req.return_attention
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.post("/predict/batch", response_model=BatchPredictionResponse, summary="Batch Secondary Structure Prediction")
async def predict_batch(req: BatchPredictionRequest):
    """Predict secondary structure across multiple sequences with batch optimization."""
    try:
        res = prediction_service.predict_batch(
            sequences=req.sequences,
            return_probabilities=req.return_probabilities
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch inference failed: {str(e)}")
