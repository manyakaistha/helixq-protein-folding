#!/usr/bin/env python3
"""CLI script to cleanly evaluate champion model on the 10% validation holdout."""

import sys
import os
import argparse
import pandas as pd
import numpy as np
import torch
from torch.utils.data import DataLoader
from sklearn.model_selection import train_test_split

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.models.champion_model import load_champion_model, get_default_device
from ml.datasets.protein_dataset import ProteinDataset, protein_collate_fn
from ml.evaluation.metrics import evaluate_dataset


def main():
    parser = argparse.ArgumentParser(description="Reproduce validation score on holdout split")
    parser.add_argument("--data", default="train.csv", help="Path to raw training CSV")
    parser.add_argument("--checkpoint", default="best_model_bigru_v10.pth", help="Path to model checkpoint")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size for validation")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for train/val split")
    args = parser.parse_args()

    print(f"Loading dataset from: {args.data}")
    df = pd.read_csv(args.data)
    print(f"Total sequences in dataset: {len(df)}")

    # Isolate identical 10% validation split as used in training
    _, val_df = train_test_split(df, test_size=0.1, random_state=args.seed)
    print(f"Validation holdout set: {len(val_df)} proteins")

    device = get_default_device()
    print(f"Evaluating on device: {device}")

    model, meta = load_champion_model(checkpoint_path=args.checkpoint, device=device)

    val_dataset = ProteinDataset(val_df, mode="train")
    val_loader = DataLoader(
        val_dataset,
        batch_size=args.batch_size,
        shuffle=False,
        collate_fn=protein_collate_fn
    )

    print("\nRunning model evaluation...")
    eval_results = evaluate_dataset(model, val_loader, device)

    q8_f1 = eval_results["q8"]["macro_f1"]
    q3_f1 = eval_results["q3"]["macro_f1"]
    harmonic = eval_results["harmonic_score"]

    print("\n" + "=" * 55)
    print("REPRODUCED VALIDATION RESULTS (10% HOLDOUT)")
    print("=" * 55)
    print(f"Q8 Macro-F1:     {q8_f1:.4f}  (Checkpoint Target: {meta.get('metrics', {}).get('val_q8', 0.3523):.4f})")
    print(f"Q3 Macro-F1:     {q3_f1:.4f}  (Checkpoint Target: {meta.get('metrics', {}).get('val_q3', 0.7073):.4f})")
    print(f"Harmonic F1:     {harmonic:.4f}  (Checkpoint Target: {meta.get('metrics', {}).get('val_harm', 0.4703):.4f})")
    print("=" * 55)
    print("Historical Private Competition Test Score: 0.4910")
    print("=" * 55)

    print("\nPerformance by Sequence Length Bins:")
    for b_name, b_data in eval_results["length_stratification"].items():
        print(f"  Length {b_name:>7}: {b_data['residue_count']:>6} residues | Q8: {b_data['q8_macro_f1']:.4f} | Q3: {b_data['q3_macro_f1']:.4f} | Harm: {b_data['harmonic_f1']:.4f}")


if __name__ == "__main__":
    main()
