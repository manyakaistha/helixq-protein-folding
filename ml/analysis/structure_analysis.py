"""Scientific structural analysis tools for secondary structure predictions."""

from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
import numpy as np

from ml.preprocessing.vocabulary import Q8_TO_Q3_MAPPING, Q8_DESCRIPTIONS, Q3_DESCRIPTIONS


def compute_composition(sequence_str: str, alphabet: List[str]) -> Dict[str, Any]:
    """Compute count and percentage distribution of characters across given alphabet."""
    L = len(sequence_str)
    if L == 0:
        return {k: {"count": 0, "percentage": 0.0} for k in alphabet}
    
    counts = Counter(sequence_str)
    composition = {}
    for char in alphabet:
        cnt = counts.get(char, 0)
        pct = float(round((cnt / L) * 100.0, 2))
        composition[char] = {
            "count": cnt,
            "percentage": pct
        }
    return composition


def detect_contiguous_segments(labels: str, sequence: str) -> List[Dict[str, Any]]:
    """Identify contiguous segments of uniform secondary structure.
    
    Positions are 1-based indices inclusive.
    """
    if not labels or len(labels) != len(sequence):
        return []

    segments = []
    current_label = labels[0]
    start_idx = 0

    for i in range(1, len(labels)):
        if labels[i] != current_label:
            seg_len = i - start_idx
            segments.append({
                "start": start_idx + 1,
                "end": i,
                "class": current_label,
                "length": seg_len,
                "subsequence": sequence[start_idx:i]
            })
            current_label = labels[i]
            start_idx = i

    # Append trailing segment
    seg_len = len(labels) - start_idx
    segments.append({
        "start": start_idx + 1,
        "end": len(labels),
        "class": current_label,
        "length": seg_len,
        "subsequence": sequence[start_idx:len(labels)]
    })

    return segments


def analyze_q8_q3_consistency(
    q8_pred: str,
    q3_pred: str,
    sequence: str
) -> Dict[str, Any]:
    """Compare independently predicted Q3 states against standard DSSP reduction of Q8 predictions.
    
    Identifies positions where independent prediction heads disagree.
    """
    assert len(q8_pred) == len(q3_pred) == len(sequence), "Sequence and prediction lengths must align"
    L = len(q8_pred)
    if L == 0:
        return {"agreement_percentage": 100.0, "disagreements_count": 0, "disagreements": []}

    disagreements = []
    agreements_count = 0

    for i in range(L):
        q8_ch = q8_pred[i]
        q3_ch = q3_pred[i]
        projected_q3 = Q8_TO_Q3_MAPPING.get(q8_ch, 'C')

        if projected_q3 == q3_ch:
            agreements_count += 1
        else:
            disagreements.append({
                "position": i + 1,
                "amino_acid": sequence[i],
                "predicted_q8": q8_ch,
                "projected_q3": projected_q3,
                "predicted_q3": q3_ch
            })

    agreement_pct = float(round((agreements_count / L) * 100.0, 2))

    return {
        "agreement_percentage": agreement_pct,
        "disagreements_count": len(disagreements),
        "disagreements": disagreements
    }


def analyze_protein_structure(
    sequence: str,
    q8_pred: str,
    q3_pred: str,
    residues: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """Comprehensive scientific structural analysis of predicted secondary structure."""
    L = len(sequence)

    # 1. Secondary Structure Composition
    q3_classes = ['H', 'E', 'C']
    q8_classes = ['B', 'C', 'E', 'G', 'H', 'I', 'S', 'T']
    aa_alphabet = sorted(list("ACDEFGHIKLMNPQRSTVWY"))

    q3_composition = compute_composition(q3_pred, q3_classes)
    q8_composition = compute_composition(q8_pred, q8_classes)
    aa_composition = compute_composition(sequence, aa_alphabet)

    # 2. Contiguous Segments
    q3_segments = detect_contiguous_segments(q3_pred, sequence)
    q8_segments = detect_contiguous_segments(q8_pred, sequence)

    # Longest structural segments
    longest_helix_len = 0
    longest_helix_subseq = ""
    longest_strand_len = 0
    longest_strand_subseq = ""

    for seg in q3_segments:
        if seg["class"] == "H" and seg["length"] > longest_helix_len:
            longest_helix_len = seg["length"]
            longest_helix_subseq = seg["subsequence"]
        elif seg["class"] == "E" and seg["length"] > longest_strand_len:
            longest_strand_len = seg["length"]
            longest_strand_subseq = seg["subsequence"]

    # 3. Positional Uncertainty & Model Probabilities
    mean_q8_prob = 0.0
    mean_q3_prob = 0.0
    mean_entropy = 0.0
    high_uncertainty_positions = []

    if residues:
        q8_probs = [r["q8_probability"] for r in residues if "q8_probability" in r]
        q3_probs = [r["q3_probability"] for r in residues if "q3_probability" in r]
        entropies = [r["entropy"] for r in residues if "entropy" in r]

        if q8_probs:
            mean_q8_prob = float(round(float(np.mean(q8_probs)), 4))
        if q3_probs:
            mean_q3_prob = float(round(float(np.mean(q3_probs)), 4))
        if entropies:
            mean_entropy = float(round(float(np.mean(entropies)), 4))
            threshold = np.percentile(entropies, 85) if len(entropies) > 5 else 1.0
            high_uncertainty_positions = [
                {
                    "position": r["position"],
                    "amino_acid": r["amino_acid"],
                    "q8_state": r["q8_state"],
                    "entropy": r["entropy"],
                    "q8_probability": r["q8_probability"]
                }
                for r in residues if r.get("entropy", 0.0) >= threshold
            ]

    # 4. Consistency Analysis
    consistency = analyze_q8_q3_consistency(q8_pred, q3_pred, sequence)

    return {
        "sequence_length": L,
        "q3_composition": q3_composition,
        "q8_composition": q8_composition,
        "amino_acid_composition": aa_composition,
        "q3_segments": q3_segments,
        "q8_segments": q8_segments,
        "summary": {
            "longest_helix_length": longest_helix_len,
            "longest_helix_subsequence": longest_helix_subseq,
            "longest_strand_length": longest_strand_len,
            "longest_strand_subsequence": longest_strand_subseq,
            "total_q3_segments": len(q3_segments),
            "total_q8_segments": len(q8_segments),
            "mean_q8_model_probability": mean_q8_prob,
            "mean_q3_model_probability": mean_q3_prob,
            "mean_predictive_entropy": mean_entropy
        },
        "uncertainty": {
            "mean_entropy": mean_entropy,
            "high_uncertainty_positions": high_uncertainty_positions
        },
        "consistency": consistency
    }
