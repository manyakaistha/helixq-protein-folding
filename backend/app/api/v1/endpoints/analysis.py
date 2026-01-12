"""Scientific analysis and FASTA sequence parsing endpoints."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from backend.app.schemas.protein import AnalyzeRequest, FastaParseRequest, FastaRecord
from backend.app.services.prediction_service import prediction_service
from ml.preprocessing.vocabulary import parse_fasta, validate_sequence

router = APIRouter()


@router.post("/analyze", summary="Perform Deep Structural Analysis")
async def analyze_sequence(req: AnalyzeRequest) -> Dict[str, Any]:
    """Compute secondary structure composition, contiguous segments, consistency, and uncertainty."""
    try:
        return prediction_service.analyze(
            sequence=req.sequence,
            seq_id=req.id or "seq_1",
            q8=req.q8,
            q3=req.q3
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Structural analysis failed: {str(e)}")


@router.post("/parse/fasta", response_model=List[FastaRecord], summary="Parse and Validate FASTA Text")
async def parse_fasta_endpoint(req: FastaParseRequest):
    """Parse single or multi-sequence FASTA text, extracting headers, sequences, and reporting non-standard residues."""
    raw_records = parse_fasta(req.content)
    if not raw_records:
        raise HTTPException(status_code=422, detail="No valid FASTA records found in input.")

    validated = []
    for rec in raw_records:
        is_val, warnings = validate_sequence(rec["sequence"])
        validated.append({
            "id": rec["id"],
            "header": rec["header"],
            "sequence": rec["sequence"],
            "length": len(rec["sequence"]),
            "is_valid": is_val and len(rec["sequence"]) > 0,
            "warnings": warnings
        })
    return validated
