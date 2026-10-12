# ProteinFold AI — Research & Experiment Notebooks

This directory contains the complete chronological sequence of experimental notebooks developing, benchmarking, and optimizing neural architectures for Protein Secondary Structure Prediction (Q8 and Q3 classification).

---

## Chronological Experiment Index

| # | Notebook | Architecture / Focus | Validation Harmonic F1 | Historical Notes |
|:---:|:---|:---|:---:|:---|
| **01** | [`01_baseline_vanilla_birnn.ipynb`](01_baseline_vanilla_birnn.ipynb) | Vanilla Bi-RNN (`nn.RNN`) Baseline | ~0.440 | Initial Seq2Seq prototype with cross-entropy loss |
| **02** | [`02_optimized_vanilla_birnn.ipynb`](02_optimized_vanilla_birnn.ipynb) | Optimized Bi-RNN | ~0.458 | Learning rate schedule and weight decay tuning |
| **03** | [`03_stabilized_vanilla_birnn.ipynb`](03_stabilized_vanilla_birnn.ipynb) | Stabilized Bi-RNN | 0.4612 | Strict gradient clipping (`max_norm=1.0`) & validation split |
| **04** | [`04_bidirectional_lstm.ipynb`](04_bidirectional_lstm.ipynb) | Bidirectional LSTM (`nn.LSTM`) | 0.4628 | Solves vanishing gradient across long polypeptide chains |
| **05** | [`05_cnn_bilstm_attention_crf.ipynb`](05_cnn_bilstm_attention_crf.ipynb) | CNN + BiLSTM + Attention + CRF | 0.4605 | Explores sequence-level Viterbi decoding |
| **06** | [`06_stacked_bilstm_regularized.ipynb`](06_stacked_bilstm_regularized.ipynb) | 2-Layer Stacked Bi-LSTM | 0.4641 | Spatial dropout and residual projection connections |
| **07** | [`07_bidirectional_gru.ipynb`](07_bidirectional_gru.ipynb) | Bidirectional GRU Transition | 0.4658 | Faster convergence and reduced memory footprint |
| **08** | [`08_improved_bigru_residual.ipynb`](08_improved_bigru_residual.ipynb) | Improved Bi-GRU + Residual | 0.4684 | LayerNorm, residual highways, and gradient accumulation |
| **09** | [`09_advanced_bigru_cnn_attention.ipynb`](09_advanced_bigru_cnn_attention.ipynb) | Advanced Bi-GRU + CNN + Attention | 0.4691 | MultiScale local motif extraction with self-attention |
| **10** | **[`10_champion_multiscale_cnn_bigru_attention.ipynb`](10_champion_multiscale_cnn_bigru_attention.ipynb)** | **MultiScale CNN (k=3,5,7) + BiGRU + Attention** | **0.4703** *(Test: **0.4910**)* | 🏆 **CHAMPION MODEL** — Mixed precision AMP, length-stratified batching, weights checkpointed to `models/best_model_bigru_v10.pth` |
| **11** | [`11_bigru_crf_decoder.ipynb`](11_bigru_crf_decoder.ipynb) | Post-Comp: Bi-GRU + Linear-Chain CRF | 0.4619 | Explores transition constraint matrix on top of champion |
| **12** | [`12_refined_bigru_crf.ipynb`](12_refined_bigru_crf.ipynb) | Post-Comp: Refined CRF Regularization | 0.4635 | Class-weighted negative log-likelihood formulation |
| **13** | [`13_enhanced_bigru_v10_plus.ipynb`](13_enhanced_bigru_v10_plus.ipynb) | Post-Comp: Enhanced Attention Pooling | 0.4695 | Restored v10 backbone with expanded hidden dimension |
| **14** | [`14_dilated_resnet_bigru.ipynb`](14_dilated_resnet_bigru.ipynb) | Post-Comp: Dilated ResNet + Bi-GRU | 0.4662 | Multi-layer dilated 1D residual convolutions |

---

## The Champion Architecture (Notebook 10)

The model defined and trained in `10_champion_multiscale_cnn_bigru_attention.ipynb` was selected as the production model due to its state-of-the-art validation score and clean deployment footprint:

```
Amino Acid Residues [B, L]
       │
   Embedding (vocab=23, dim=128)
       │
  ┌────┴──────────────────────────┐
  │ MultiScale 1D CNN             │
  │  ├─ Conv1d (k=3, ch=64)       │
  │  ├─ Conv1d (k=5, ch=64)       │
  │  └─ Conv1d (k=7, ch=64)       │
  │ Concat [B, 192, L] -> Conv 1x1│
  └────┬──────────────────────────┘
       │  (Residual Connection)
  ┌────┴──────────────────────────┐
  │ 2-Layer Bidirectional GRU     │
  │  (hidden=384, total=768)      │
  └────┬──────────────────────────┘
       │  (Residual Connection + LayerNorm)
  ┌────┴──────────────────────────┐
  │ 4-Head Self-Attention         │
  │  (embed_dim=768, heads=4)     │
  └────┬──────────────────────────┘
       │  (Residual Connection + LayerNorm)
  ┌────┴─────────────────┐
  ▼                      ▼
Q8 Head                Q3 Head
Linear(768->128->9)    Linear(768->64->4)
```

The resulting checkpoint is serialized at [`models/best_model_bigru_v10.pth`](../models/best_model_bigru_v10.pth).
