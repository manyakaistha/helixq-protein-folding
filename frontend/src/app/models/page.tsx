'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Layers, GitBranch, ShieldCheck, CheckCircle2, Info, ArrowDown, Sparkles } from 'lucide-react';
import { getModelInfo, ModelInfo } from '@/lib/api';

export default function ModelsPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [activeLayer, setActiveLayer] = useState<string>('cnn');

  useEffect(() => {
    getModelInfo().then(setModelInfo).catch(console.error);
  }, []);

  const architectureLayers = [
    {
      id: 'embed',
      name: 'Residue Token Embedding',
      type: 'Embedding Matrix',
      shape: '[B, L] -> [B, L, 128]',
      params: '2,944',
      details:
        'Maps 23 discrete amino acid tokens (PAD, UNK, *, and 20 canonical amino acids) into a continuous 128-dimensional dense vector space. Padding token 0 is permanently zeroed.'
    },
    {
      id: 'cnn',
      name: 'MultiScale 1D CNN',
      type: 'Parallel Filter Banks',
      shape: '[B, L, 128] -> [B, L, 128]',
      params: '123,520',
      details:
        'Three parallel 1D convolutional filter banks with kernel sizes k=3, k=5, and k=7 (64 channels each). Captures local n-gram oligopeptide motifs simultaneously across short, medium, and extended contexts. Concatenation (192-dim) is projected to 128-dim with LayerNorm and Dropout.'
    },
    {
      id: 'gru',
      name: '2-Layer Bidirectional GRU',
      type: 'Recurrent Encoder',
      shape: '[B, L, 128] -> [B, L, 768]',
      params: '4,256,256',
      details:
        'Two stacked bidirectional GRU layers with hidden dimension 384 per direction (768 combined output). Propagates long-range N-to-C and C-to-N sequential context. Features a linear residual shortcut connection projecting the 128-dim CNN output to 768-dim, summed with GRU outputs before LayerNorm.'
    },
    {
      id: 'attn',
      name: 'Multi-Head Self-Attention',
      type: 'Scaled Dot-Product Attention',
      shape: '[B, L, 768] -> [B, L, 768]',
      params: '2,362,368',
      details:
        '4 attention heads operating over the 768-dimensional sequence representation. Allows non-local residue pairs to interact directly regardless of linear distance along the backbone, critical for beta-sheet pairing. Combined via residual connection and LayerNorm.'
    },
    {
      id: 'heads',
      name: 'Dual Independent Prediction Heads',
      type: 'Specialized Linear Classifiers',
      shape: '[B, L, 768] -> [B, L, 9] & [B, L, 4]',
      params: '149,837',
      details:
        'Separate, specialized classification heads: Q8 Head (Linear 768->128, ReLU, Dropout 0.4, Linear 128->9) predicting the 8 DSSP states plus padding; Q3 Head (Linear 768->64, ReLU, Dropout 0.4, Linear 64->4) predicting Helix, Strand, Coil, plus padding.'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="eyebrow mb-1">
          <span className="eyebrow-line" />
          <span>NEURAL ARCHITECTURE EXPLORER</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] font-normal tracking-tight">
          Hybrid MultiScale CNN + BiGRU + Self-Attention
        </h1>
        <p className="text-sm text-[var(--ink-muted)] max-w-3xl">
          Layer-by-layer tensor flow, mathematical motivation, parameter distributions, and empirical engineering choices of the 6.63M-parameter champion model.
        </p>
      </div>

      {/* Model Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
          <span className="text-xs text-[var(--ink-muted)] font-medium">Total Parameters</span>
          <div className="text-xl sm:text-2xl font-serif text-[var(--forest)] font-normal mt-1">
            {modelInfo ? modelInfo.parameters.toLocaleString() : '6,634,925'}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">100% Trainable Weights</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
          <span className="text-xs text-[var(--ink-muted)] font-medium">Harmonic F1 Score</span>
          <div className="text-xl sm:text-2xl font-serif text-[#1e785e] font-normal mt-1">
            0.4910
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">Competition Private Test</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
          <span className="text-xs text-[var(--ink-muted)] font-medium">Recurrent Hidden Dim</span>
          <div className="text-xl sm:text-2xl font-serif text-[var(--ink)] font-normal mt-1">
            384 &times; 2
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">768-dim Bidirectional GRU</p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
          <span className="text-xs text-[var(--ink-muted)] font-medium">Attention Heads</span>
          <div className="text-xl sm:text-2xl font-serif text-[var(--ink)] font-normal mt-1">
            4 Heads
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">192 dims / head</p>
        </div>
      </div>

      {/* Interactive Layer Pipeline */}
      <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-8">
        <div className="border-b border-[var(--line)] pb-4">
          <h3 className="font-serif font-bold text-lg text-[var(--ink)] flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--lime)]" />
            <span>Interactive Neural Computation Flow</span>
          </h3>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Click any layer block to inspect its tensor transformations, mathematical motivation, and parameter count.
          </p>
        </div>

        <div className="space-y-4">
          {architectureLayers.map((layer, idx) => {
            const isSelected = activeLayer === layer.id;
            return (
              <React.Fragment key={layer.id}>
                <div
                  onClick={() => setActiveLayer(layer.id)}
                  className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'border-[var(--forest)] bg-[var(--paper-deep)] shadow-xs'
                      : 'border-[var(--line)] bg-[var(--surface-high)] hover:bg-[var(--paper)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-lg bg-[var(--paper-deep)] text-[var(--forest)] font-mono font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[var(--ink)]">{layer.name}</h4>
                        <span className="text-xs text-[var(--ink-muted)]">{layer.type}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-md bg-[var(--paper)] border border-[var(--line)] text-[var(--forest)] font-semibold">
                        {layer.shape}
                      </span>
                      <span className="text-[var(--ink-muted)]">{layer.params} params</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-[var(--line)] text-xs text-[var(--ink-soft)] leading-relaxed animate-fadeIn">
                      {layer.details}
                    </div>
                  )}
                </div>

                {idx < architectureLayers.length - 1 && (
                  <div className="flex justify-center -my-2">
                    <ArrowDown className="w-4 h-4 text-[var(--ink-faint)]" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Engineering Design Rationale */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-3">
          <h4 className="font-serif font-bold text-sm text-[var(--ink)] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#1e785e]" />
            <span>Why BiGRU Replaced BiLSTM (Version 8 &amp; 10)</span>
          </h4>
          <p className="text-[var(--ink-muted)] leading-relaxed">
            In competitive experimentation (v4 vs v8), BiLSTM suffered from memory footprint saturation due to separate cell and hidden states. The BiGRU architecture reduced gate parameters by 25%, drastically lowered peak VRAM, and enabled larger sequence batching with zero performance degradation.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-3">
          <h4 className="font-serif font-bold text-sm text-[var(--ink)] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#1e785e]" />
            <span>Why CRF Failed in Version 11</span>
          </h4>
          <p className="text-[var(--ink-muted)] leading-relaxed">
            Version 11 introduced a Linear-Chain Conditional Random Field (CRF) decoder to enforce valid secondary structure transition rules. However, backward partition function computation across long variable-length sequences caused gradient instability and out-of-memory errors, dropping performance to 0.4120. Standard Cross-Entropy with label smoothing proved strictly superior.
          </p>
        </div>
      </div>
    </div>
  );
}
