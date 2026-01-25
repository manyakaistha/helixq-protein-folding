# Model Card: ProteinFold AI Champion (Version 10)

## Model Overview
- **Model Name:** Version 10: Hybrid MultiScale CNN + BiGRU + Self-Attention
- **Architecture Type:** Deep Hybrid Convolutional-Recurrent Self-Attention Network
- **Parameters:** 6,634,925
- **Task:** 1D Protein Secondary Structure Prediction (Q8 DSSP 8-state and Q3 3-state)
- **Primary Metric:** Harmonic Macro-F1 across Q8 and Q3 spaces

## Intended Use
- **Primary Use:** Predicting local secondary structure conformational states from primary amino acid sequences.
- **Applications:** Fold recognition, disordered region identification, structural motif detection, bioinformatic feature engineering.
- **Out of Scope:** Full 3D tertiary structure prediction, atomic coordinate generation, quaternary multi-chain complex docking.

## Training Data & Procedure
- **Dataset:** 7,268 protein sequences from DSSP-annotated PDB structures.
- **Split:** 90% train (6,541 sequences), 10% validation holdout (727 sequences, seed 42).
- **Optimization:** AdamW optimizer with CosineAnnealingWarmRestarts, Automatic Mixed Precision (AMP), gradient checkpointing.
- **Loss:** Multi-task cross-entropy with capped inverse class weights (3.0 max) to combat rare states ($\pi$-helix, $\beta$-bridge).

## Performance & Evaluation
- **Private Competition Test Score:** **0.4910** (Harmonic Macro-F1)
- **Validation Holdout (727 sequences):**
  - Q8 Macro-F1: **0.3523**
  - Q3 Macro-F1: **0.7073**
  - Harmonic F1: **0.4703**

## Limitations & Biases
- **Extreme Class Imbalance:** Rare states like $\pi$-helix ($I$) have limited representation in training data ($<0.1\%$).
- **Dual-Head Independence:** Q8 and Q3 heads are parameterized separately, producing rare disagreements (~3-5% of residues).
- **Biological Scope:** Does not infer complete 3D tertiary conformations.
