"""Export service formatting predictions to JSON, CSV, and FASTA."""

import io
import csv
import json
from typing import List, Dict, Any


class ExportService:
    @staticmethod
    def to_csv(results: List[Dict[str, Any]]) -> str:
        """Format predictions into standard competition CSV format: id,sst8,sst3."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "sst8", "sst3", "length"])
        for r in results:
            writer.writerow([
                r.get("id", ""),
                r.get("q8", ""),
                r.get("q3", ""),
                r.get("length", len(r.get("sequence", "")))
            ])
        return output.getvalue()

    @staticmethod
    def to_fasta(results: List[Dict[str, Any]]) -> str:
        """Format predictions as 3-line structural FASTA: sequence, Q8, Q3."""
        lines = []
        for r in results:
            seq_id = r.get("id", "seq")
            seq = r.get("sequence", "")
            q8 = r.get("q8", "")
            q3 = r.get("q3", "")

            lines.append(f">{seq_id} | AA Sequence")
            lines.append(seq)
            lines.append(f">{seq_id}_sst8 | Q8 Secondary Structure")
            lines.append(q8)
            lines.append(f">{seq_id}_sst3 | Q3 Secondary Structure")
            lines.append(q3)
        return "\n".join(lines)

    @staticmethod
    def to_json(results: List[Dict[str, Any]]) -> str:
        """Format predictions as structured JSON string."""
        return json.dumps(results, indent=2)


export_service = ExportService()
