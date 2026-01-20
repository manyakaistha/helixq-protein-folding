/**
 * API client communicating with ProteinFold AI FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ResiduePrediction {
  position: number;
  amino_acid: string;
  q8_state: string;
  q3_state: string;
  q8_probability: number;
  q3_probability: number;
  entropy: number;
  q8_probabilities?: Record<string, number>;
  q3_probabilities?: Record<string, number>;
}

export interface PredictionResult {
  id: string;
  sequence: string;
  length: number;
  q8: string;
  q3: string;
  residues: ResiduePrediction[];
  attention?: {
    num_heads: number;
    sequence_length: number;
    average: number[][];
    heads: number[][][];
  } | null;
  warnings: string[];
  model_version: string;
  device: string;
}

export interface Segment {
  start: number;
  end: number;
  class: string;
  length: number;
  subsequence: string;
}

export interface Disagreement {
  position: number;
  amino_acid: string;
  predicted_q8: string;
  projected_q3: string;
  predicted_q3: string;
}

export interface StructuralAnalysis {
  id: string;
  sequence: string;
  sequence_length: number;
  q8: string;
  q3: string;
  q3_composition: Record<string, { count: number; percentage: number }>;
  q8_composition: Record<string, { count: number; percentage: number }>;
  amino_acid_composition: Record<string, { count: number; percentage: number }>;
  q3_segments: Segment[];
  q8_segments: Segment[];
  summary: {
    longest_helix_length: number;
    longest_helix_subsequence: string;
    longest_strand_length: number;
    longest_strand_subsequence: string;
    total_q3_segments: number;
    total_q8_segments: number;
    mean_q8_model_probability: number;
    mean_q3_model_probability: number;
    mean_predictive_entropy: number;
  };
  uncertainty: {
    mean_entropy: number;
    high_uncertainty_positions: Array<{
      position: number;
      amino_acid: string;
      q8_state: string;
      entropy: number;
      q8_probability: number;
    }>;
  };
  consistency: {
    agreement_percentage: number;
    disagreements_count: number;
    disagreements: Disagreement[];
  };
}

export interface FastaRecord {
  id: string;
  header: string;
  sequence: string;
  length: number;
  is_valid: boolean;
  warnings: string[];
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  device: string;
  model_version: string;
  uptime_seconds: number;
}

export interface ModelInfo {
  model_name: string;
  architecture: string;
  parameters: number;
  trainable_parameters: number;
  embedding_dim: number;
  cnn_channels: number;
  hidden_dim: number;
  recurrent_layers: number;
  attention_heads: number;
  vocab_size: number;
  q8_classes: string[];
  q3_classes: string[];
  historical_competition_score: number;
  checkpoint_epoch: number;
  device: string;
  training_optimizations: string[];
}

export async function checkHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
  return res.json();
}

export async function getModelInfo(): Promise<ModelInfo> {
  const res = await fetch(`${API_BASE_URL}/model/info`);
  if (!res.ok) throw new Error(`Failed to fetch model info: ${res.statusText}`);
  return res.json();
}

export async function predictSequence(
  sequence: string,
  id: string = 'seq_1',
  returnProbabilities: boolean = true,
  returnAttention: boolean = false
): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sequence,
      id,
      return_probabilities: returnProbabilities,
      return_attention: returnAttention
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Failed to predict structure');
  }
  return res.json();
}

export async function predictBatch(
  sequences: Array<{ id: string; sequence: string }>,
  returnProbabilities: boolean = false
): Promise<{
  total_sequences: number;
  successful: number;
  failed: number;
  results: PredictionResult[];
}> {
  const res = await fetch(`${API_BASE_URL}/predict/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sequences,
      return_probabilities: returnProbabilities
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Batch prediction request failed');
  }
  return res.json();
}

export async function analyzeStructure(
  sequence: string,
  id: string = 'seq_1',
  q8?: string,
  q3?: string
): Promise<StructuralAnalysis> {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sequence, id, q8, q3 })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Structural analysis failed');
  }
  return res.json();
}

export async function parseFasta(content: string): Promise<FastaRecord[]> {
  const res = await fetch(`${API_BASE_URL}/parse/fasta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'FASTA parsing failed');
  }
  return res.json();
}

export async function exportPredictions(
  format: 'csv' | 'fasta' | 'json',
  results: any[]
): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, results })
  });
  if (!res.ok) {
    throw new Error(`Export failed with status ${res.status}`);
  }
  return res.blob();
}
