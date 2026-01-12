"""Prediction export endpoint supporting CSV, FASTA, and JSON downloads."""

from fastapi import APIRouter, HTTPException, Response
from backend.app.schemas.protein import ExportRequest
from backend.app.services.export_service import export_service

router = APIRouter()


@router.post("/export", summary="Export Prediction Results")
async def export_results(req: ExportRequest):
    """Serialize prediction results into downloadable CSV, FASTA, or JSON text streams."""
    fmt = req.format.lower().strip()
    if fmt == "csv":
        data = export_service.to_csv(req.results)
        return Response(content=data, media_type="text/csv", headers={
            "Content-Disposition": "attachment; filename=proteinfold_predictions.csv"
        })
    elif fmt in ["fasta", "fa"]:
        data = export_service.to_fasta(req.results)
        return Response(content=data, media_type="text/plain", headers={
            "Content-Disposition": "attachment; filename=proteinfold_predictions.fasta"
        })
    elif fmt == "json":
        data = export_service.to_json(req.results)
        return Response(content=data, media_type="application/json", headers={
            "Content-Disposition": "attachment; filename=proteinfold_predictions.json"
        })
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{req.format}'. Supported: csv, fasta, json")
