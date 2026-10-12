"""Evaluation metrics and benchmark reporting for Protein Secondary Structure Prediction."""

from typing import List, Dict, Any, Tuple, Optional
import numpy as np

try:
    from sklearn.metrics import precision_recall_fscore_support, confusion_matrix, f1_score
except Exception:
    def precision_recall_fscore_support(y_true, y_pred, labels=None, average=None, zero_division=0):
        if labels is None:
            labels = np.unique(np.concatenate([y_true, y_pred]))
        prec, rec, f1, sup = [], [], [], []
        for c in labels:
            tp = int(np.sum((y_true == c) & (y_pred == c)))
            fp = int(np.sum((y_true != c) & (y_pred == c)))
            fn = int(np.sum((y_true == c) & (y_pred != c)))
            p = float(tp / (tp + fp)) if (tp + fp) > 0 else float(zero_division)
            r = float(tp / (tp + fn)) if (tp + fn) > 0 else float(zero_division)
            score = float(2 * p * r / (p + r)) if (p + r) > 0 else float(zero_division)
            prec.append(p)
            rec.append(r)
            f1.append(score)
            sup.append(tp + fn)
        return np.array(prec), np.array(rec), np.array(f1), np.array(sup)

    def confusion_matrix(y_true, y_pred, labels=None):
        if labels is None:
            labels = sorted(list(set(y_true) | set(y_pred)))
        n = len(labels)
        label_to_idx = {l: i for i, l in enumerate(labels)}
        cm = np.zeros((n, n), dtype=int)
        for t, p in zip(y_true, y_pred):
            if t in label_to_idx and p in label_to_idx:
                cm[label_to_idx[t], label_to_idx[p]] += 1
        return cm

    def f1_score(y_true, y_pred, labels=None, average="macro", zero_division=0):
        _, _, f1, _ = precision_recall_fscore_support(y_true, y_pred, labels=labels, zero_division=zero_division)
        if average == "macro":
            return float(np.mean(f1))
        return f1

from ml.preprocessing.vocabulary import PAD_TOKEN, Q8_CHARS, Q3_CHARS


def harmonic_mean(f1_q8: float, f1_q3: float) -> float:
    """Safely calculate harmonic mean of Q8 and Q3 macro-F1 scores."""
    denom = f1_q8 + f1_q3
    if denom <= 0.0:
        return 0.0
    return float(2.0 * (f1_q8 * f1_q3) / denom)


def evaluate_predictions(
    targets: np.ndarray,
    predictions: np.ndarray,
    class_labels: List[str],
    ignore_index: int = PAD_TOKEN
) -> Dict[str, Any]:
    """Compute per-class and macro-averaged metrics (Precision, Recall, F1, Support, Confusion Matrix).
    
    Excludes padding tokens (ignore_index).
    """
    mask = (targets != ignore_index)
    valid_targets = targets[mask]
    valid_preds = predictions[mask]

    if len(valid_targets) == 0:
        return {
            "macro_f1": 0.0,
            "classes": {},
            "confusion_matrix": [],
            "total_support": 0
        }

    # Biological classes are indices 1..len(class_labels)-1
    bio_indices = list(range(1, len(class_labels)))
    bio_labels = class_labels[1:]

    prec, rec, f1, sup = precision_recall_fscore_support(
        valid_targets,
        valid_preds,
        labels=bio_indices,
        average=None,
        zero_division=0
    )

    macro_f1 = float(np.mean(f1))

    per_class = {}
    for idx, name in enumerate(bio_labels):
        per_class[name] = {
            "precision": float(round(prec[idx], 4)),
            "recall": float(round(rec[idx], 4)),
            "f1_score": float(round(f1[idx], 4)),
            "support": int(sup[idx])
        }

    cm = confusion_matrix(valid_targets, valid_preds, labels=bio_indices)

    return {
        "macro_f1": float(round(macro_f1, 6)),
        "classes": per_class,
        "confusion_matrix": cm.tolist() if hasattr(cm, "tolist") else [list(row) for row in cm],
        "class_labels": bio_labels,
        "total_support": int(len(valid_targets))
    }
