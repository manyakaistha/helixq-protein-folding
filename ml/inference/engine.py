"""High-performance inference engine for Protein Secondary Structure Prediction."""

from typing import List, Dict, Any, Optional, Union
import torch
import torch.nn.functional as F
import numpy as np

from ml.preprocessing.vocabulary import (
    PAD_TOKEN, AA_TO_ID, Q8_CHARS, Q3_CHARS, ID_TO_Q8, ID_TO_Q3,
    clean_sequence, validate_sequence
)
from ml.models.champion_model import load_champion_model, MemoryEfficientBiGRU


class InferenceEngine:
    """Production inference engine wrapping the Version 10 champion model."""

    def __init__(
        self,
        checkpoint_path: Optional[str] = None,
        device: Optional[torch.device] = None,
        max_batch_size: int = 64
    ):
        self.model, self.meta = load_champion_model(checkpoint_path=checkpoint_path, device=device)
        self.device = next(self.model.parameters()).device
        self.max_batch_size = max_batch_size

    @torch.inference_mode()
    def predict_sequence(
        self,
        sequence: str,
        seq_id: str = "seq_1",
        return_probabilities: bool = True,
        return_attention: bool = False,
        max_attention_length: int = 500
    ) -> Dict[str, Any]:
        """Perform end-to-end inference on a single amino acid sequence.
        
        Preserves exact 1:1 residue alignment without padding artifacts.
        """
        cleaned = clean_sequence(sequence)
        is_valid, warnings = validate_sequence(cleaned)
        if not is_valid:
            raise ValueError(f"Invalid sequence: {'; '.join(warnings)}")

        L = len(cleaned)
        seq_ids = [AA_TO_ID.get(c, AA_TO_ID['<UNK>']) for c in cleaned]
        input_tensor = torch.tensor([seq_ids], dtype=torch.long, device=self.device)

        # Decide whether to extract attention
        need_attn = return_attention and (L <= max_attention_length)
        q8_logits, q3_logits, attn_weights = self.model(input_tensor, return_attention=need_attn)

        # Remove batch dim: [L, 9] and [L, 4]
        q8_logits = q8_logits[0]
        q3_logits = q3_logits[0]

        # Biological classes are indices 1..8 for Q8, and indices 1..3 for Q3.
        # Compute softmax over biological classes (excluding <PAD> index 0)
        q8_bio_logits = q8_logits[:, 1:]  # [L, 8]
        q3_bio_logits = q3_logits[:, 1:]  # [L, 3]

        q8_probs = F.softmax(q8_bio_logits, dim=-1).cpu().numpy()  # [L, 8]
        q3_probs = F.softmax(q3_bio_logits, dim=-1).cpu().numpy()  # [L, 3]

        q8_preds_idx = np.argmax(q8_probs, axis=-1)  # 0..7
        q3_preds_idx = np.argmax(q3_probs, axis=-1)  # 0..2

        bio_q8_chars = Q8_CHARS[1:]  # ['B', 'C', 'E', 'G', 'H', 'I', 'S', 'T']
        bio_q3_chars = Q3_CHARS[1:]  # ['C', 'E', 'H']

        pred_q8_seq = ''.join([bio_q8_chars[i] for i in q8_preds_idx])
        pred_q3_seq = ''.join([bio_q3_chars[i] for i in q3_preds_idx])

        # Construct per-residue breakdown
        residues = []
        for i in range(L):
            aa = cleaned[i]
            q8_st = bio_q8_chars[q8_preds_idx[i]]
            q3_st = bio_q3_chars[q3_preds_idx[i]]
            q8_prob_dict = {bio_q8_chars[k]: float(round(q8_probs[i, k], 4)) for k in range(8)}
            q3_prob_dict = {bio_q3_chars[k]: float(round(q3_probs[i, k], 4)) for k in range(3)}
            
            # Predictive entropy over Q8 biological classes: H = -sum(p * log(p))
            p_vec = q8_probs[i]
            entropy = float(-np.sum(p_vec * np.log(p_vec + 1e-12)))

            residues.append({
                "position": i + 1,  # 1-based indexing for scientific standards
                "amino_acid": aa,
                "q8_state": q8_st,
                "q3_state": q3_st,
                "q8_probability": float(round(q8_probs[i, q8_preds_idx[i]], 4)),
                "q3_probability": float(round(q3_probs[i, q3_preds_idx[i]], 4)),
                "entropy": float(round(entropy, 4)),
                "q8_probabilities": q8_prob_dict if return_probabilities else None,
                "q3_probabilities": q3_prob_dict if return_probabilities else None
            })

        # Format attention matrix if requested and available
        attention_payload = None
        if need_attn and attn_weights is not None:
            # attn_weights shape: [1, heads=4, L, L]
            w_np = attn_weights[0].cpu().numpy()  # [4, L, L]
            # Average across heads and include per-head matrices
            avg_w = np.mean(w_np, axis=0)
            attention_payload = {
                "num_heads": 4,
                "sequence_length": L,
                "average": [[float(round(val, 4)) for val in row] for row in avg_w],
                "heads": [
                    [[float(round(val, 4)) for val in row] for row in w_np[h]]
                    for h in range(4)
                ]
            }

        return {
            "id": seq_id,
            "sequence": cleaned,
            "length": L,
            "q8": pred_q8_seq,
            "q3": pred_q3_seq,
            "residues": residues,
            "attention": attention_payload,
            "warnings": warnings,
            "model_version": "v10_memory_optimized",
            "device": str(self.device)
        }

    @torch.inference_mode()
    def predict_batch(
        self,
        records: List[Dict[str, str]],
        batch_size: Optional[int] = None,
        return_probabilities: bool = False
    ) -> List[Dict[str, Any]]:
        """Batch inference across multiple sequences with dynamic padding and per-sequence unpadding."""
        bs = batch_size or self.max_batch_size
        results = []

        for i in range(0, len(records), bs):
            chunk = records[i:i + bs]
            cleaned_chunk = []
            valid_indices = []

            for idx, rec in enumerate(chunk):
                seq = clean_sequence(rec.get("sequence", rec.get("seq", "")))
                rec_id = str(rec.get("id", f"seq_{i + idx + 1}"))
                if seq:
                    cleaned_chunk.append((rec_id, seq))
                    valid_indices.append(idx)
                else:
                    results.append({
                        "id": rec_id,
                        "sequence": "",
                        "length": 0,
                        "q8": "",
                        "q3": "",
                        "error": "Sequence was empty"
                    })

            if not cleaned_chunk:
                continue

            # Run inference on each cleaned sequence
            for rec_id, seq in cleaned_chunk:
                res = self.predict_sequence(
                    sequence=seq,
                    seq_id=rec_id,
                    return_probabilities=return_probabilities,
                    return_attention=False
                )
                results.append(res)

        return results
