# ProteinFold AI — Competition Submissions

This directory preserves the official competition submission CSV files generated during evaluation on the test set (`sep-25-dl-gen-ai-nppe-2/test.csv`).

---

## Submissions Log

| Submission File | Model Origin | Columns | Private Test Score | Notes |
|:---|:---|:---:|:---:|:---|
| **`submission_bigru_v10.csv`** | Notebook 10 (`best_model_bigru_v10.pth`) | `ID`, `Q8`, `Q3` | **0.4910** | 🏆 **Champion submission**. MultiScale CNN + BiGRU + Attention. |
| `submission_bigru_v8_5.csv` | Notebook 08 (`best_model_bigru_v8_5.pth`) | `ID`, `Q8`, `Q3` | 0.4875 | Regularized Bi-GRU with label smoothing. |
| `submission_bigru_v8.csv` | Notebook 08 (`best_model_bigru_v8.pth`) | `ID`, `Q8`, `Q3` | 0.4862 | Bi-GRU with LayerNorm residual connections. |
| `submission_bigru.csv` | Notebook 07 (`best_model_bigru.pth`) | `ID`, `Q8`, `Q3` | 0.4798 | Initial Bi-GRU model submission. |

---

## Verifying Bit-for-Bit Reproduction

The production inference pipeline (`scripts/run_inference.py`) produces outputs identical bit-for-bit to `submission_bigru_v10.csv` when evaluated on the competition test split.
