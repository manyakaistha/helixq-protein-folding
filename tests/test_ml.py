"""Comprehensive automated test suite for ML components."""

import pytest
import torch
import numpy as np

from ml.preprocessing.vocabulary import (
    PAD_TOKEN, AA_CHARS, Q8_CHARS, Q3_CHARS, AA_TO_ID,
    clean_sequence, validate_sequence, tokenize_sequence, parse_fasta,
    Q8_TO_Q3_MAPPING
)
from ml.models.champion_model import MemoryEfficientBiGRU
from ml.inference.engine import InferenceEngine
from ml.analysis.structure_analysis import (
    compute_composition, detect_contiguous_segments,
    analyze_q8_q3_consistency, analyze_protein_structure
)
from ml.evaluation.metrics import harmonic_mean, evaluate_predictions


def test_vocabulary_and_cleaning():
    assert len(AA_CHARS) == 23
    assert len(Q8_CHARS) == 9
    assert len(Q3_CHARS) == 4
    assert PAD_TOKEN == 0

    seq = "  mvl spa\n dkt\r\n"
    cleaned = clean_sequence(seq)
    assert cleaned == "MVLSPADKT"

    is_valid, warnings = validate_sequence("ACDEFGHIKLMNPQRSTVWY")
    assert is_valid is True
    assert len(warnings) == 0

    # Non-standard residue test
    is_valid, warnings = validate_sequence("ACDEX")
    assert is_valid is True
    assert len(warnings) == 1
    assert "X" in warnings[0]

    tokens = tokenize_sequence("ACX")
    assert tokens[0] == AA_TO_ID["A"]
    assert tokens[1] == AA_TO_ID["C"]
    assert tokens[2] == AA_TO_ID["<UNK>"]


def test_fasta_parser():
    fasta = """>seq1 First protein
ACDEFGHIKL
>seq2 Second protein with description
MNPQRSTVWY
"""
    records = parse_fasta(fasta)
    assert len(records) == 2
    assert records[0]["id"] == "seq1"
    assert records[0]["sequence"] == "ACDEFGHIKL"
    assert records[1]["id"] == "seq2"
    assert records[1]["sequence"] == "MNPQRSTVWY"


def test_model_forward_shapes():
    model = MemoryEfficientBiGRU()
    dummy_input = torch.randint(1, 22, (2, 50))  # Batch 2, Length 50
    q8_logits, q3_logits, attn = model(dummy_input, return_attention=False)
    assert q8_logits.shape == (2, 50, 9)
    assert q3_logits.shape == (2, 50, 4)
    assert attn is None

    # Test attention weights return
    _, _, attn_w = model(dummy_input, return_attention=True)
    assert attn_w.shape == (2, 4, 50, 50)


def test_inference_engine_probabilities():
    test_seq = "MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHF"
    engine = InferenceEngine()
    res = engine.predict_sequence(test_seq)
    assert len(res["q8"]) == len(test_seq)
    assert len(res["q3"]) == len(test_seq)
    assert len(res["residues"]) == len(test_seq)

    for r in res["residues"]:
        # Verify probabilities over 8 biological states sum to ~1.0
        q8_probs = list(r["q8_probabilities"].values())
        assert abs(sum(q8_probs) - 1.0) < 1e-2

        # Verify probabilities over 3 biological states sum to ~1.0
        q3_probs = list(r["q3_probabilities"].values())
        assert abs(sum(q3_probs) - 1.0) < 1e-2

        # Verify predictive entropy is non-negative
        assert r["entropy"] >= 0.0


def test_contiguous_segments():
    labels = "HHHHEEECCCC"
    seq = "AAAAAAAAAAA"
    segs = detect_contiguous_segments(labels, seq)
    assert len(segs) == 3
    assert segs[0]["class"] == "H"
    assert segs[0]["start"] == 1
    assert segs[0]["end"] == 4
    assert segs[0]["length"] == 4

    assert segs[1]["class"] == "E"
    assert segs[1]["start"] == 5
    assert segs[1]["end"] == 7
    assert segs[1]["length"] == 3

    assert segs[2]["class"] == "C"
    assert segs[2]["start"] == 8
    assert segs[2]["end"] == 11
    assert segs[2]["length"] == 4


def test_consistency_analysis():
    # In standard mapping: H->H, E->E, C->C
    q8 = "HEC"
    q3 = "HEC"
    seq = "AAA"
    cons = analyze_q8_q3_consistency(q8, q3, seq)
    assert cons["agreement_percentage"] == 100.0
    assert cons["disagreements_count"] == 0

    # Introduce disagreement: Q8 is E (strand), but Q3 is predicted as H (helix)
    q8_dis = "HEC"
    q3_dis = "HHC"
    cons_dis = analyze_q8_q3_consistency(q8_dis, q3_dis, seq)
    assert cons_dis["disagreements_count"] == 1
    assert cons_dis["disagreements"][0]["position"] == 2
    assert cons_dis["disagreements"][0]["predicted_q8"] == "E"
    assert cons_dis["disagreements"][0]["predicted_q3"] == "H"


def test_harmonic_mean_safety():
    assert harmonic_mean(0.0, 0.0) == 0.0
    assert harmonic_mean(0.5, 0.5) == 0.5
    h = harmonic_mean(0.3523, 0.7073)
    assert round(h, 4) == 0.4703
