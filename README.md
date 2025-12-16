# NPPE 2: Protein Secondary Structure Prediction (PSSP)

## 1. Problem Statement

This project tackles **Protein Secondary Structure Prediction (PSSP)**, a fundamental sequence-to-sequence per-residue classification problem in computational biology.

Given a primary amino acid sequence $S = (s_1, s_2, \dots, s_L)$ where each residue $s_i \in \mathcal{V}_{AA}$ (vocabulary of 20 standard amino acids plus special tokens), the model must predict two simultaneous structural labels for every position $i \in \{1, \dots, L\}$:

1. **8-State Secondary Structure (Q8 / `sst8`)**:
   - Classes (8 states + `<PAD>`):
     - $\alpha$-Helix (`H`), $3_{10}$-Helix (`G`), $\pi$-Helix (`I`)
     - $\beta$-Strand (`E`), $\beta$-Bridge (`B`)
     - Turn (`T`), Bend (`S`), Coil/Loop (`C`)
   - Evaluated by: Per-residue **Macro-Averaged F1 Score** ($F1_{Q8}$)

2. **3-State Secondary Structure (Q3 / `sst3`)**:
   - Classes (3 states + `<PAD>`):
     - Helix (`H`): Merges `H`, `G`, `I`
     - Strand (`E`): Merges `E`, `B`
     - Coil (`C`): Merges `T`, `S`, `C`
   - Evaluated by: Per-residue **Macro-Averaged F1 Score** ($F1_{Q3}$)

### Evaluation Metric
The global objective is the **Harmonic Mean** of the per-residue Macro-F1 scores across Q8 and Q3 (excluding `<PAD>` tokens):
$$\text{Score} = \frac{2 \cdot F1_{Q8} \cdot F1_{Q3}}{F1_{Q8} + F1_{Q3}}$$

---

## 2. Dataset Overview

- **Source Directory**: `sep-25-dl-gen-ai-nppe-2/`
- **Training Set**: 7,262 sequences (`train.csv`), lengths varying up to hundreds of residues.
- **Validation Split**: 10% stratified holdout (6,535 train / 727 validation).
- **Test Set**: 1,816 sequences (`test.csv`).
- **Submission Format**: `id,sst8,sst3,Usage`

---

## 3. Architecture Evolution & Experiment Matrix (14 Versions)

| Version | Architecture | Test F1 Score | Key Findings & Diagnosis |
|---|---|---|---|
| **v1** | **Vanilla Bi-RNN** | **0.460** | **Strong baseline**. Few parameters avoided overfitting on small 7K dataset. |
| v2-v3 | Bi-RNN variants | 0.445 - 0.452 | Hyperparameter adjustments didn't improve upon v1. |
| **v4** | **Bi-LSTM** | **0.457** | Lost to v1. Complex gating overfitted on limited sample count. |
| v5 | CNN-BiLSTM-CRF | Failed | Severe training instability and gradient explosions. |
| v6 | Stacked Bi-LSTM | ~0.450 | Overparameterized, heavy overfitting. |
| v7 | Bi-GRU | 0.482 | First major leap. GRU's simpler gating outperformed LSTM. |
| **v8 / v8.5** | **Bi-GRU Improved** | **0.478 - 0.485** | 3-layer Bi-GRU (512 hidden), dropout 0.4, weight decay 5e-5, early stopping. Beat v1 convincingly. |
| v9 | Bi-GRU Advanced | ~0.470 | Learning rate tuning didn't generalize. |
| **v10** | **Memory-Optimized Hybrid (Champion)** | **0.491** | **MultiScale CNN (3,5,7) + 2-layer Bi-GRU + 4-Head Attention + AMP + Checkpointing**. |
| v11-v12 | Bi-GRU + Linear CRF | 0.450 - 0.460 | CRF Viterbi decoding added computational burden and rigid transition biases. |
| v13 | Enhanced Bi-GRU | 0.482 | Solid performance but lacked v10's multi-scale receptive field. |
| v14 | ResNet 1D + Bi-GRU | ~0.475 | Explored 1D residual blocks with GRU. |

---

## 4. The Champion Architecture: Version 10

```
Input Sequence [B, L]
       │
       ▼
Amino Acid Embedding (dim=128)
       │
       ▼
MultiScale 1D-CNN (Kernels: 3, 5, 7 | Channels: 64 each -> 192 -> 128)
  └── Captures local motifs: α-helices & β-turns are 3 to 7 residues long
       │
       ├───────────────────────────────────────────────┐ (Residual Projection)
       ▼                                               │
Bidirectional GRU (2 Layers, 384 Hidden, Dropout 0.4) │
  └── Models sequential dependencies (10-50 residues) │
       │                                               │
       ▼                                               │
LayerNorm(GRU_Out + Residual) ◄────────────────────────┘
       │
       ▼
Efficient Multi-Head Self-Attention (4 Heads, Dim 768)
  └── Bridges long-range tertiary contacts & folding interactions (50+ residues)
       │
       ├──────────────────────────────┐
       ▼                              ▼
Q8 Classification Head        Q3 Classification Head
(Linear 768->128 -> ReLU      (Linear 768->64 -> ReLU
 -> Dropout -> Linear -> 9)    -> Dropout -> Linear -> 4)
```

### Memory Engineering Highlights:
- **AMP (Automatic Mixed Precision FP16)**: 50% VRAM reduction.
- **Gradient Checkpointing**: Stored forward activations discarded and recomputed during backward pass for both GRU and Attention.
- **Gradient Accumulation**: Batch size 32 with 2 accumulation steps (effective batch size 64).
- **VRAM Footprint**: Slashed from **>13 GB (v8)** to **~2.2 GB (v10)**.

### Optimization & Loss Strategy:
- **Label Smoothing (0.1)** to prevent overconfident per-residue predictions.
- **Capped Class Weighting**: Inverse class frequency capped at $3.0$ max weight, preventing rare classes like $\pi$-Helix (`I`) from destabilizing gradients.
- **CosineAnnealingWarmRestarts** ($T_0=10, T_{\text{mult}}=2$) allowing the optimizer to escape sharp local minima.

---

## 5. Directory Map

```
nppe2/
├── sep-25-dl-gen-ai-nppe-2/           # Raw protein dataset
│   ├── train.csv                     # (id, seq, sst8, sst3) - 7,262 rows
│   ├── test.csv                      # (id, seq) - 1,816 rows
│   └── sample_submission.csv         # Submission template
├── experiment_writeup.md             # Complete post-mortem experiment log
├── best_model_bigru_v10.pth          # Best checkpoint (Version 10 Champion, 0.491 F1)
├── best_model_bigru_v8.pth           # Version 8 checkpoint
├── submission_bigru_v10.csv          # Best submission file (v10)
├── submission_bigru_v8.csv           # Baseline v8 submission file
├── version1_vn_birnn_1.ipynb         # v1: Vanilla Bi-RNN
├── version4_bi_lstm.ipynb            # v4: Bi-LSTM
├── version7_bi_gru.ipynb             # v7: Initial Bi-GRU
├── version8_bi_gru_improved.ipynb    # v8: Improved Bi-GRU (F1 0.485)
├── version10_memory_optimized.ipynb  # v10: Champion MultiScale CNN + Bi-GRU + Attention
├── version11_crf.ipynb               # v11: Bi-GRU with CRF head
├── version13_enhanced.ipynb          # v13: Enhanced Bi-GRU
└── version14_resnet_bigru.ipynb      # v14: 1D ResNet + Bi-GRU
```
