# ProteinFold AI: Production Protein Secondary Structure Prediction

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.18-000000?logo=next.js)](https://nextjs.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?logo=pytorch)](https://pytorch.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Production-grade, scientifically grounded protein secondary structure prediction platform** powered by the **Version 10 Champion Hybrid MultiScale CNN + BiGRU + Self-Attention** model.
>
> 🏆 **Verified Benchmark:** Private Competition Test Harmonic F1: **0.4910** | Reproduced 10% Holdout Validation: **0.4703** ($val\_q8=0.3523, val\_q3=0.7073$)

---

## 1. Scientific & Engineering Highlights

- **100% Genuine Neural Inference**: Executes the exact trained competition champion weights (`models/best_model_bigru_v10.pth`). Never fabricates or hallucinates structural labels.
- **Dual-Head Architecture**: Predicts both fine-grained Kabsch-Sander 8-state (Q8) and canonical 3-state (Q3) secondary structure classes simultaneously.
- **Forensic Recurrent Sequence Dynamics**: Eliminates trailing padding noise in single-sequence queries by processing exact length $L$ directly without artificial batch padding.
- **Interactive 3-Row Secondary Structure Viewer**: Synchronized, residue-aligned visualizer rendering Amino Acid, Q8, and Q3 with hover tooltips, class probability breakdowns, and predictive entropy ($H = -\sum p \log p$).
- **High-Throughput Batch Processing**: Process multi-FASTA files with length-stratified batch collation and export to competition CSV, Multi-FASTA, or JSON.
- **Biological Scope Grounding**: Clear scientific disclosures distinguishing 1D secondary structure assignments from 3D atomic coordinates (AlphaFold).

---

## 2. Champion Model Architecture (Version 10)

```
Residue Tokens [B, L]
       │
       ▼
Residue Embedding (vocab=23, dim=128, padding_idx=0)
       │
       ├──────────────────────────────────────┐ [B, L, 128]
       ▼                                      │
MultiScale 1D CNN                             │
 ├─ Conv1d(128, 64, kernel=3, pad=1)          │
 ├─ Conv1d(128, 64, kernel=5, pad=2)          │
 └─ Conv1d(128, 64, kernel=7, pad=3)          │
       │                                      │
 Concatenate [B, 192, L]                      │
       │                                      │
 Conv1d(192, 128, kernel=1)                   │
 LayerNorm + ReLU + Dropout(0.3)              │
       │                                      │
 Residual Addition [B, L, 128] <──────────────┘
       │
       ├──────────────────────────────────────┐ (Linear 128 -> 768 projection)
       ▼                                      │
2-Layer Bidirectional GRU                     │
 (input=128, hidden=384, layers=2, bi=True)   │
       │ [B, L, 768]                          │
 Residual Addition [B, L, 768] <──────────────┘
 LayerNorm(768) + Dropout(0.3)
       │
       ├──────────────────────────────────────┐ (Identity shortcut)
       ▼                                      │
Multi-Head Self-Attention                     │
 (embed_dim=768, num_heads=4, dropout=0.1)    │
       │ [B, L, 768]                          │
 Residual Addition [B, L, 768] <──────────────┘
 LayerNorm(768) + Dropout(0.2)
       │
       ├──────────────────────────────┐
       ▼                              ▼
    Q8 Head                        Q3 Head
 Linear(768, 128)               Linear(768, 64)
 ReLU + Dropout(0.4)            ReLU + Dropout(0.4)
 Linear(128, 9)                 Linear(64, 4)
       │                              │
 [B, L, 9] (Q8 logits)          [B, L, 4] (Q3 logits)
```

### Parameter Accounting (Total: 6,634,925)
- **Token Embedding**: 2,944
- **MultiScale CNN (k=3, 5, 7)**: 123,520
- **2-Layer Bidirectional GRU (384 hidden)**: 4,256,256
- **Multi-Head Self-Attention (4 heads)**: 2,362,368
- **Classification Heads (Q8 & Q3)**: 149,837

---

## 3. Platform Architecture & Directory Structure

```
nppe2/
├── backend/                  # FastAPI Production REST Service
│   ├── app/
│   │   ├── api/v1/           # Modular endpoints (/predict, /analyze, /export, etc.)
│   │   ├── core/             # Application config and settings
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # Singleton inference and export services
│   │   └── main.py           # FastAPI app entry point
│   └── tests/                # API integration test suite
├── frontend/                 # Next.js 14 App Router UI
│   ├── src/app/
│   │   ├── page.tsx          # Overview & Hero Dashboard
│   │   ├── predict/          # Single-Sequence Prediction Workspace
│   │   ├── viewer/           # Dedicated Residue-Aligned Structure Viewer
│   │   ├── analysis/         # Structural Analysis & Dual-Head Consistency
│   │   ├── models/           # Architectural Anatomy & Parameter Explorer
│   │   ├── benchmarks/       # Empirical Leaderboard & Stratified Metrics
│   │   ├── batch/            # High-Throughput Multi-FASTA Batch Processing
│   │   └── docs/             # DSSP Principles & Operational Boundaries
│   └── src/components/       # Reusable UI (StructureViewer, Navbar, Footer)
├── ml/                       # Modular Machine Learning Package
│   ├── analysis/             # Segments, compositions, and consistency analysis
│   ├── datasets/             # ProteinDataset and length-grouped collator
│   ├── evaluation/           # Macro-F1, confusion matrices, length stratification
│   ├── inference/            # Production InferenceEngine
│   ├── models/               # Champion model architecture & weights loader
│   ├── preprocessing/        # Vocabularies, sanitizers, and FASTA parser
│   └── training/             # Production trainer with AMP and cosine scheduling
├── models/                   # Serialized PyTorch Checkpoints (Git LFS)
│   ├── README.md             # Weights registry & architectural specs
│   ├── best_model_bigru_v10.pth  # 🏆 Champion Model Weights (75.7 MB)
│   ├── best_model_bigru_v8.pth   # Improved Bi-GRU checkpoint (130.9 MB)
│   ├── best_model_bigru_v8_5.pth # Bi-GRU v8.5 with Label Smoothing (130.9 MB)
│   ├── best_model_bigru.pth      # Early Bi-GRU baseline checkpoint (130.9 MB)
│   └── best_model_v13.pth        # Enhanced Bi-GRU v13 checkpoint (35.4 MB)
├── notebooks/                # Chronological Research & Benchmarks (01 to 14)
│   ├── README.md             # Complete experiment catalog & validation results
│   ├── 01_baseline_vanilla_birnn.ipynb
│   ├── 02_optimized_vanilla_birnn.ipynb
│   ├── 03_stabilized_vanilla_birnn.ipynb
│   ├── 04_bidirectional_lstm.ipynb
│   ├── 05_cnn_bilstm_attention_crf.ipynb
│   ├── 06_stacked_bilstm_regularized.ipynb
│   ├── 07_bidirectional_gru.ipynb
│   ├── 08_improved_bigru_residual.ipynb
│   ├── 09_advanced_bigru_cnn_attention.ipynb
│   ├── 10_champion_multiscale_cnn_bigru_attention.ipynb  # 🏆 Champion Model
│   ├── 11_bigru_crf_decoder.ipynb
│   ├── 12_refined_bigru_crf.ipynb
│   ├── 13_enhanced_bigru_v10_plus.ipynb
│   └── 14_dilated_resnet_bigru.ipynb
├── submissions/              # Official Competition Submissions
│   ├── README.md             # Submissions log & verification notes
│   ├── submission_bigru_v10.csv   # 🏆 Champion submission (0.4910)
│   ├── submission_bigru_v8_5.csv
│   ├── submission_bigru_v8.csv
│   └── submission_bigru.csv
├── docs/                     # Scientific & Technical Documentation
│   ├── writeups/             # Research writeups and experiment reports
│   ├── repository_audit.md   # Forensic reverse-engineering report
│   ├── model_architecture.md # Mathematical architecture specification
│   ├── secondary_structure.md# DSSP 8-state definitions & Q3 reductions
│   ├── inference.md          # Production inference dynamics & entropy math
│   ├── api_reference.md      # OpenAPI REST API documentation
│   ├── deployment.md         # Docker & production operations runbook
│   └── model_card.md         # Comprehensive ML model card
├── scripts/                  # Production CLI Tools & Evaluation Scripts
│   ├── evaluate_holdout.py   # CLI to reproduce 0.4703 holdout validation
│   ├── run_inference.py      # CLI for single/batch prediction to CSV/JSON/FASTA
│   └── research/             # Experiment conversion & utility scripts
├── docker/                   # Dockerfiles for backend and frontend
├── docker-compose.yml        # Multi-container orchestration
├── Makefile                  # Developer workflow automation
└── run_all.sh                # Automated daemon launcher script
```

---

## 4. Quick Start

### Option A: Docker Compose (Recommended)

```bash
# Build and launch backend and frontend containers
docker-compose up --build -d

# Verify containers are running
docker-compose ps
```

- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Option B: Local Development

```bash
# 1. Install Python dependencies in editable mode
pip install -e .

# 2. Start the FastAPI backend
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. In another terminal, start the Next.js frontend
cd frontend
npm install
npm run dev
```

---

## 5. Verification & Testing

### Run Complete Test Suite
```bash
pytest -v
```
All unit and integration tests execute in < 3 seconds across preprocessing, model loading, entropy computation, API schemas, and endpoints.

### Reproduce Holdout Validation Score (0.4703)
```bash
python scripts/evaluate_holdout.py --checkpoint models/best_model_bigru_v10.pth
```
Output:
```
REPRODUCED VALIDATION RESULTS (10% HOLDOUT, 727 SEQUENCES)
Q8 Macro-F1:     0.3523  (Target: 0.3523)
Q3 Macro-F1:     0.7073  (Target: 0.7073)
Harmonic F1:     0.4703  (Target: 0.4703)
Historical Private Competition Test Score: 0.4910
```

### CLI Inference on Custom FASTA
```bash
python scripts/run_inference.py --input example.fasta --output predictions.csv
```

---

## 6. Scientific Disclosures

1. **DSSP 8-State Taxonomy**: Q8 annotations classify residues into $\alpha$-helix (`H`), $3_{10}$-helix (`G`), $\pi$-helix (`I`), $\beta$-sheet strand (`E`), $\beta$-bridge (`B`), turn (`T`), bend (`S`), and coil (`C`).
2. **Q3 Reductions**: Standard biological groupings merge $\{H, G, I\} \to H$, $\{E, B\} \to E$, and $\{C, T, S\} \to C$.
3. **Dual-Head Independence**: The champion model uses independent heads for Q8 and Q3. Discrepancies between projected Q8 and predicted Q3 are preserved and explicitly visualized.
4. **AlphaFold Non-Equivalence**: Secondary structure prediction produces 1D geometric backbone state assignments, **not** 3D Cartesian coordinates or tertiary fold structures.

---

## 7. License

This project is licensed under the MIT License.
