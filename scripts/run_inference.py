#!/usr/bin/env python3
"""CLI script for batch secondary structure inference on FASTA or CSV files."""

import sys
import os
import argparse
import json
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.inference.engine import InferenceEngine
from ml.preprocessing.vocabulary import parse_fasta


def main():
    parser = argparse.ArgumentParser(description="Run secondary structure inference from CLI")
    parser.add_argument("--input", required=True, help="Input FASTA or CSV file, or raw amino acid sequence")
    parser.add_argument("--output", default="predictions.csv", help="Output file path (.csv, .fasta, or .json)")
    parser.add_argument("--checkpoint", default="best_model_bigru_v10.pth", help="Model checkpoint path")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size for batch inference")
    parser.add_argument("--id", default="protein_1", help="Protein ID for raw sequence input")
    args = parser.parse_args()

    engine = InferenceEngine(checkpoint_path=args.checkpoint)
    print(f"Inference engine initialized on {engine.device}")

    # Determine input type
    sequences = []
    if os.path.isfile(args.input):
        ext = os.path.splitext(args.input)[1].lower()
        if ext in [".fasta", ".fa"]:
            with open(args.input, "r") as f:
                records = parse_fasta(f.read())
            sequences = [(r["id"], r["sequence"]) for r in records]
        elif ext == ".csv":
            df = pd.read_csv(args.input)
            id_col = "id" if "id" in df.columns else df.columns[0]
            seq_col = "input" if "input" in df.columns else ("sequence" if "sequence" in df.columns else df.columns[1])
            sequences = [(str(row[id_col]), str(row[seq_col])) for _, row in df.iterrows()]
        else:
            with open(args.input, "r") as f:
                content = f.read().strip()
                if content.startswith(">"):
                    records = parse_fasta(content)
                    sequences = [(r["id"], r["sequence"]) for r in records]
                else:
                    sequences = [(args.id, content)]
    else:
        # Direct raw string sequence
        sequences = [(args.id, args.input)]

    print(f"Processing {len(sequences)} sequence(s)...")

    results = []
    for seq_id, seq in sequences:
        pred = engine.predict_sequence(seq, seq_id=seq_id, return_probabilities=False)
        results.append(pred)

    out_ext = os.path.splitext(args.output)[1].lower()
    if out_ext == ".json":
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2)
    elif out_ext in [".fasta", ".fa"]:
        with open(args.output, "w") as f:
            for r in results:
                f.write(f">{r['id']}_Q8 length={r['length']}\n{r['q8']}\n")
                f.write(f">{r['id']}_Q3 length={r['length']}\n{r['q3']}\n")
    else:
        # Default CSV (competition format)
        out_df = pd.DataFrame([
            {"id": r["id"], "sst8": r["q8"], "sst3": r["q3"]}
            for r in results
        ])
        out_df.to_csv(args.output, index=False)

    print(f"Inference complete! Results saved to {args.output}")


if __name__ == "__main__":
    main()
