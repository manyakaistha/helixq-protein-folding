"""Application configuration settings for ProteinFold AI backend."""

import os
from typing import List
from dataclasses import dataclass, field


@dataclass
class Settings:
    PROJECT_NAME: str = "ProteinFold AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Model settings
    CHECKPOINT_PATH: str = os.getenv("CHECKPOINT_PATH", "best_model_bigru_v10.pth")
    DEVICE: str = os.getenv("DEVICE", "auto")
    MAX_SEQUENCE_LENGTH: int = 2500
    MAX_BATCH_SIZE: int = 128
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = field(default_factory=lambda: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ])


settings = Settings()
