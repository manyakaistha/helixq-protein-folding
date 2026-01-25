# Production Inference Pipeline & Diagnostics

## Overview

The `InferenceEngine` in `ml/inference/engine.py` provides deterministic, high-performance execution of the Champion Model (`best_model_bigru_v10.pth`) across Apple Silicon (MPS), NVIDIA GPUs (CUDA), and multi-core CPU environments.

---

## 1. Recurrent Layer Dynamics & Unpadded Single-Sequence Inference

### The Forensics Audit Discovery
During forensic inspection of the original competition repository (`docs/repository_audit.md`), we analyzed the bidirectional GRU implementation:
1. The original notebook batched sequences with right-padding up to the longest sequence in the batch (e.g. length 305).
2. The PyTorch call did **not** use `pack_padded_sequence` before passing to `nn.GRU`.
3. Consequently, for the reverse GRU direction (traveling from right to left), trailing `<PAD>` tokens were processed first before encountering the true C-terminus of shorter sequences.

### The Production Engine Solution
When predicting for a single user query ($B=1$), our production `InferenceEngine`:
- Runs inference directly on the exact sequence length $L$ without any artificial padding tokens.
- This guarantees mathematically pristine forward and backward GRU hidden states.
- When performing batch inference, sequences are dynamically collated and sorted by length to minimize padding overhead.

---

## 2. Token Normalization & Padding Exclusion

The output logits of the champion model have shapes:
- **Q8 Head**: `[B, L, 9]`
- **Q3 Head**: `[B, L, 4]`

In both heads, index 0 is assigned to the `<PAD>` token used during training.

At inference time, `<PAD>` is excluded from biological predictions:
$$\text{biological\_logits} = \text{logits}[:, :, 1:]$$
$$\text{probs} = \text{Softmax}(\text{biological\_logits}, \text{dim}=-1)$$

- Q8 biological space has 8 classes: $\{ \text{B}, \text{C}, \text{E}, \text{G}, \text{H}, \text{I}, \text{S}, \text{T} \}$
- Q3 biological space has 3 classes: $\{ \text{C}, \text{E}, \text{H} \}$

---

## 3. Predictive Entropy Calculation

To assess model confidence per residue, the engine computes the Shannon entropy over the biological probability distribution:

$$H(i) = -\sum_{k=1}^{K} p_{i, k} \ln(p_{i, k} + \epsilon)$$

where $\epsilon = 10^{-12}$.
- $H \approx 0$: High confidence (dominant single structural state).
- $H \approx \ln(8) \approx 2.08$ nats: Maximal ambiguity across Q8 states.
- High entropy positions are flagged in the UI as potential conformational transition boundaries or intrinsically disordered regions.

---

## 4. Self-Attention Weight Extraction

For sequences with length $L \le 500$, the engine can extract the genuine multi-head self-attention tensor directly from the model:
$$\text{Attention Tensor Shape}: (4, L, L)$$
- Extracted via PyTorch's native `need_weights=True, average_attn_weights=False` on `model.attn.attn`.
- Reveals non-local residue-residue interactions across the 4 attention heads.
