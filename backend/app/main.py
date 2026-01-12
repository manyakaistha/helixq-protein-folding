"""Main FastAPI application entry point for ProteinFold AI."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.api.v1.router import api_router
from backend.app.services.prediction_service import prediction_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify model is ready at startup
    status = prediction_service.get_health_status()
    print(f"🚀 ProteinFold AI initialized successfully on device: {status['device']}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade Protein Secondary Structure Prediction API powered by "
        "the Champion Version 10 Hybrid MultiScale CNN + BiGRU + Self-Attention Architecture."
    ),
    lifespan=lifespan
)

# Enable CORS for frontend client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root Status")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
