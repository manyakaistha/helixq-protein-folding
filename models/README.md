# ProteinFold AI — Model Checkpoints

This directory houses the trained PyTorch checkpoint weights for the sequence-to-structure models developed during research and competition benchmarks.

All large `.pth` checkpoint binaries are tracked via **Git LFS** (`.gitattributes`).

---

## Checkpoint Registry

| Checkpoint File | Size | Architecture | Validation Harmonic F1 | Description |
|:---|:---:|:---|:---:|:---|
| **`best_model_bigru_v10.pth`** | **75.7 MB** | **MultiScale CNN (k=3,5,7) + 2x BiGRU (384) + 4-Head Attention** | **0.4703** *(Test: **0.4910**)* | 🏆 **Production Champion Model**. Dual Q8/Q3 heads, LayerNorm, Cosine Annealing, AMP mixed precision. |
| `best_model_bigru_v8.pth` | 130.9 MB | 2-Layer Bi-GRU with LayerNorm & Residuals | 0.4684 | Benchmark Bi-GRU variant with FP32 weights and gradient accumulation. |
| `best_model_bigru_v8_5.pth` | 130.9 MB | Bi-GRU v8.5 with Label Smoothing (0.1) | 0.4679 | Exploration of soft target regularized loss landscapes. |
| `best_model_bigru.pth` | 130.9 MB | Standard 2-Layer Bi-GRU Baseline | 0.4658 | First successful GRU convergence outperforming Bi-LSTM. |
| `best_model_v13.pth` | 35.4 MB | Bi-GRU v13 with Compressed Projection | 0.4695 | Post-competition parameter compression experiment. |

---

## Loading the Champion Model in Python

```python
import torch
from ml.models.champion_model import load_champion_model

# Automatically discovers models/best_model_bigru_v10.pth
model, meta = load_champion_model(checkpoint_path="models/best_model_bigru_v10.pth")
model.eval()

print(f"Loaded epoch {meta['epoch']} with validation score {meta['best_score']:.4f}")
```

---

## Checkpoint Inspection

To inspect the metadata stored inside any checkpoint:

```python
import torch

ckpt = torch.load("models/best_model_bigru_v10.pth", map_location="cpu", weights_only=False)
print("Keys:", ckpt.keys())
print("Epoch:", ckpt.get("epoch"))
print("Best Score:", ckpt.get("best_score"))
print("Metrics:", ckpt.get("metrics"))
```
