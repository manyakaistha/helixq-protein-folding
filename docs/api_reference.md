# REST API Reference & OpenAPI Specification

The backend service is built with FastAPI and runs on port `8000`. Full interactive OpenAPI Swagger documentation is available at `http://localhost:8000/docs`.

---

## 1. Health & System Status

### `GET /api/v1/health`
Returns the status of the inference engine, active device, and model checkpoint.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "mps:0",
  "checkpoint": "best_model_bigru_v10.pth"
}
```

---

## 2. Model Metadata & Parameters

### `GET /api/v1/model/info`
Returns architectural metadata, layer parameters, and vocabularies.

**Response (200 OK):**
```json
{
  "version": "v10",
  "name": "Hybrid MultiScale CNN + BiGRU + Self-Attention",
  "parameters": 6634925,
  "device": "mps:0",
  "vocab_sizes": {
    "amino_acids": 23,
    "q8_states": 9,
    "q3_states": 4
  },
  "metrics": {
    "val_q8": 0.3523,
    "val_q3": 0.7073,
    "val_harm": 0.4703,
    "historical_competition_score": 0.4910
  }
}
```

---

## 3. Sequence Prediction

### `POST /api/v1/predict`
Executes real neural inference for a single protein sequence or FASTA block.

**Request Body:**
```json
{
  "sequence": "VLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR",
  "id": "1A3N_A",
  "return_probabilities": true,
  "return_attention": false
}
```

**Response (200 OK):**
```json
{
  "id": "1A3N_A",
  "length": 141,
  "sequence": "VLSPADKT...",
  "q8": "CCHHHHHHHHHHHHHHHHHHHHTTSHHHHHHHHHHHH...",
  "q3": "CCHHHHHHHHHHHHHHHHHHHHCCHHHHHHHHHHHHH...",
  "model_version": "v10",
  "device": "mps:0",
  "residues": [
    {
      "position": 1,
      "amino_acid": "V",
      "q8_state": "C",
      "q3_state": "C",
      "q8_probability": 0.8412,
      "q3_probability": 0.9120,
      "entropy": 0.512,
      "q8_probabilities": { "H": 0.05, "E": 0.02, "C": 0.84, ... },
      "q3_probabilities": { "H": 0.06, "E": 0.03, "C": 0.91 }
    }
  ]
}
```

---

## 4. Batch Prediction

### `POST /api/v1/predict/batch`
Batch inference for multiple sequences.

**Request Body:**
```json
{
  "proteins": [
    { "id": "prot_1", "sequence": "MVLSPADKTN..." },
    { "id": "prot_2", "sequence": "MQIFVKTLTG..." }
  ],
  "batch_size": 32,
  "return_probabilities": false
}
```

---

## 5. Structural Analysis

### `POST /api/v1/analyze`
Generates secondary structure composition, segments, and dual-head consistency.

**Request Body:**
```json
{
  "sequence": "MVLSPADKTN...",
  "id": "prot_1"
}
```

**Response (200 OK):**
```json
{
  "id": "prot_1",
  "sequence_length": 141,
  "q8_composition": { "H": { "count": 78, "percentage": 55.3 }, ... },
  "q3_composition": { "H": { "count": 82, "percentage": 58.2 }, ... },
  "q3_segments": [
    { "class": "H", "start": 5, "end": 22, "length": 18, "subsequence": "KTNVKAAWGKVGAHAGEY" }
  ],
  "consistency": {
    "agreement_percentage": 96.5,
    "disagreements_count": 5,
    "disagreements": [...]
  }
}
```

---

## 6. Export Predictions

### `POST /api/v1/export`
Exports predictions into competition CSV, Multi-FASTA, or JSON.

**Parameters:**
- `format`: `csv` | `fasta` | `json`
