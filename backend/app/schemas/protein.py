"""Pydantic data validation schemas for ProteinFold AI API."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    sequence: str = Field(..., description="Raw or FASTA amino acid sequence")
    id: Optional[str] = Field("seq_1", description="Identifier for this sequence")
    return_probabilities: bool = Field(True, description="Whether to include full class probability distribution")
    return_attention: bool = Field(False, description="Whether to extract self-attention weights")


class ResiduePrediction(BaseModel):
    position: int
    amino_acid: str
    q8_state: str
    q3_state: str
    q8_probability: float
    q3_probability: float
    entropy: float
    q8_probabilities: Optional[Dict[str, float]] = None
    q3_probabilities: Optional[Dict[str, float]] = None


class PredictionResponse(BaseModel):
    id: str
    sequence: str
    length: int
    q8: str
    q3: str
    residues: List[ResiduePrediction]
    attention: Optional[Dict[str, Any]] = None
    warnings: List[str] = []
    model_version: str = "v10_memory_optimized"
    device: str


class BatchPredictionRequest(BaseModel):
    sequences: List[Dict[str, str]] = Field(..., description="List of sequence objects with 'sequence' and optional 'id'")
    return_probabilities: bool = Field(False, description="Whether to include residue-level probabilities for each sequence")


class BatchPredictionResponse(BaseModel):
    total_sequences: int
    successful: int
    failed: int
    results: List[Dict[str, Any]]


class AnalyzeRequest(BaseModel):
    sequence: str
    id: Optional[str] = "seq_1"
    q8: Optional[str] = None
    q3: Optional[str] = None


class FastaParseRequest(BaseModel):
    content: str


class FastaRecord(BaseModel):
    id: str
    header: str
    sequence: str
    length: int
    is_valid: bool
    warnings: List[str] = []


class ExportRequest(BaseModel):
    format: str = Field(..., description="Export format: 'json', 'csv', or 'fasta'")
    results: List[Dict[str, Any]] = Field(..., description="Prediction results list to format")


class ModelInfoResponse(BaseModel):
    model_name: str
    architecture: str
    parameters: int
    embedding_dim: int
    cnn_channels: int
    hidden_dim: int
    recurrent_layers: int
    attention_heads: int
    vocab_size: int
    q8_classes: List[str]
    q3_classes: List[str]
    historical_competition_score: float
    checkpoint_epoch: int
    device: str
    training_optimizations: List[str]
