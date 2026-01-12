"""API Router aggregation for v1 endpoints."""

from fastapi import APIRouter
from backend.app.api.v1.endpoints import health, prediction, analysis, export

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health & Metadata"])
api_router.include_router(prediction.router, tags=["Prediction"])
api_router.include_router(analysis.router, tags=["Structural Analysis"])
api_router.include_router(export.router, tags=["Export"])
