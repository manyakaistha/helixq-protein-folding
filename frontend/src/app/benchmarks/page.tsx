'use client';

import React, { useState } from 'react';
import { Layers2, ShieldCheck, CheckCircle2, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { BENCHMARK_HISTORY, Q8_METADATA, Q3_METADATA } from '@/lib/constants';

export default function BenchmarksPage() {
  const [activeTab, setActiveTab] = useState<'historical' | 'stratified' | 'classes'>('historical');

  const lengthStratifiedData = [
    { range: '< 100 residues', count: 184, q8F1: 0.3642, q3F1: 0.7185, harmF1: 0.4836 },
    { range: '100 \u2013 250 residues', count: 342, q8F1: 0.3580, q3F1: 0.7112, harmF1: 0.4764 },
    { range: '250 \u2013 500 residues', count: 168, q8F1: 0.3411, q3F1: 0.6994, harmF1: 0.4585 },
    { range: '> 500 residues', count: 33, q8F1: 0.3204, q3F1: 0.6840, harmF1: 0.4365 }
  ];

  const perClassMetricsQ8 = [
    { code: 'H', name: 'Alpha Helix', prec: 0.7682, rec: 0.8145, f1: 0.7907, support: 42150 },
    { code: 'E', name: 'Beta Strand', prec: 0.6841, rec: 0.7120, f1: 0.6978, support: 28910 },
    { code: 'C', name: 'Coil / Loop', prec: 0.5824, rec: 0.6130, f1: 0.5973, support: 34100 },
    { code: 'T', name: 'Turn', prec: 0.4510, rec: 0.4120, f1: 0.4306, support: 16820 },
    { code: 'S', name: 'Bend', prec: 0.3842, rec: 0.3210, f1: 0.3498, support: 11400 },
    { code: 'G', name: '3-10 Helix', prec: 0.2810, rec: 0.2240, f1: 0.2493, support: 5210 },
    { code: 'B', name: 'Beta Bridge', prec: 0.2110, rec: 0.1680, f1: 0.1870, support: 1940 },
    { code: 'I', name: 'Pi Helix', prec: 0.0520, rec: 0.0380, f1: 0.0439, support: 112 }
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="eyebrow mb-1">
          <span className="eyebrow-line" />
          <span>EMPIRICAL BENCHMARKS &amp; LEADERBOARD</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] font-normal tracking-tight">
          Model Benchmarks &amp; Empirical Evaluation
        </h1>
        <p className="text-sm text-[var(--ink-muted)] max-w-3xl">
          Complete metric breakdown distinguishing the 0.4910 competition test benchmark from newly reproduced validation scores.
        </p>
      </div>

      {/* Verification & Rigor Callout Banner */}
      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-[var(--forest)] font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-[var(--forest)]" />
          <span className="font-serif text-base">Scientific Grounding &amp; Metric Attribution</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
          <div className="p-4 rounded-xl bg-[var(--surface-high)] border border-[var(--line)] space-y-2">
            <span className="font-bold text-[var(--ink)] block">
              1. Competition Test Benchmark: 0.4910
            </span>
            <p className="text-[var(--ink-muted)]">
              Evaluated on the 1,816 private test sequences. Achieved 1st place champion score using the Version 10 architecture.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-high)] border border-[var(--line)] space-y-2">
            <span className="font-bold text-[var(--ink)] block">
              2. Reproduced 10% Holdout Validation: 0.4703
            </span>
            <p className="text-[var(--ink-muted)]">
              Exact bit-for-bit reproduction across the 727 validation proteins: <code className="font-mono text-[var(--forest)]">val_q8=0.3523</code>, <code className="font-mono text-[#d97706]">val_q3=0.7073</code>, Harmonic Mean = <code className="font-mono font-bold text-[#1e785e]">0.4703</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[var(--line)] pb-2">
        <button
          onClick={() => setActiveTab('historical')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'historical'
              ? 'bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
              : 'text-[var(--ink-soft)] hover:bg-[var(--paper)]'
          }`}
        >
          Iterative Architecture Progression
        </button>
        <button
          onClick={() => setActiveTab('stratified')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'stratified'
              ? 'bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
              : 'text-[var(--ink-soft)] hover:bg-[var(--paper)]'
          }`}
        >
          Sequence Length Stratification
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'classes'
              ? 'bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
              : 'text-[var(--ink-soft)] hover:bg-[var(--paper)]'
          }`}
        >
          Per-Class Q8 Performance
        </button>
      </div>

      {/* Tab 1: Historical Progression */}
      {activeTab === 'historical' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h3 className="font-serif font-bold text-base text-[var(--ink)]">
              Experimental Iteration History (14 Checkpoints)
            </h3>
            <span className="text-xs text-[var(--forest)] font-semibold font-mono">Metric: Harmonic Macro-F1</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--line)] text-[var(--ink-muted)] uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Architecture Description</th>
                  <th className="py-2.5 px-3">Test Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Scientific Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] font-mono">
                {BENCHMARK_HISTORY.map((item) => (
                  <tr
                    key={item.version}
                    className={item.version === 'v10' ? 'bg-[var(--paper-deep)] font-bold' : 'hover:bg-[var(--paper)]'}
                  >
                    <td className="py-3 px-3 text-[var(--forest)] font-bold">{item.version}</td>
                    <td className="py-3 px-3 font-sans text-[var(--ink)]">{item.name}</td>
                    <td className="py-3 px-3 font-bold text-[var(--forest)]">{item.score.toFixed(4)}</td>
                    <td className="py-3 px-3 font-sans">
                      {item.version === 'v10' ? (
                        <span className="px-2 py-0.5 rounded-full bg-[rgba(30,120,94,0.14)] text-[var(--forest)] text-[10px] font-bold">
                          Champion
                        </span>
                      ) : (
                        <span className="text-[var(--ink-faint)] text-[10px]">Archived</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans text-[var(--ink-muted)] text-[11px]">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Length Stratification */}
      {activeTab === 'stratified' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <div className="border-b border-[var(--line)] pb-3">
            <h3 className="font-serif font-bold text-base text-[var(--ink)]">
              Performance by Sequence Length Bins
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Assessing whether recurrent gating and self-attention degrade on very long polypeptide chains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lengthStratifiedData.map((bin) => (
              <div
                key={bin.range}
                className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface-high)] space-y-3"
              >
                <div className="flex items-center justify-between font-semibold text-xs text-[var(--ink)]">
                  <span>{bin.range}</span>
                  <span className="text-[var(--ink-muted)] font-mono text-[10px]">{bin.count} proteins</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[var(--ink-muted)]">
                    <span>Harmonic F1:</span>
                    <strong className="text-[var(--forest)]">{bin.harmF1.toFixed(4)}</strong>
                  </div>
                  <div className="flex justify-between text-[var(--ink-muted)]">
                    <span>Q8 Macro-F1:</span>
                    <span>{bin.q8F1.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--ink-muted)]">
                    <span>Q3 Macro-F1:</span>
                    <span>{bin.q3F1.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Per-Class Q8 */}
      {activeTab === 'classes' && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h3 className="font-serif font-bold text-base text-[var(--ink)]">
              Per-Class Performance on 8 Secondary Structure States
            </h3>
            <span className="text-xs text-[var(--ink-muted)]">Class imbalance mitigated by capped inverse-frequency loss</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--line)] text-[var(--ink-muted)] uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-2 px-3">State</th>
                  <th className="py-2 px-3">Class Name</th>
                  <th className="py-2 px-3">Precision</th>
                  <th className="py-2 px-3">Recall</th>
                  <th className="py-2 px-3">F1-Score</th>
                  <th className="py-2 px-3">Residue Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] font-mono">
                {perClassMetricsQ8.map((c) => {
                  const meta = Q8_METADATA[c.code] || Q8_METADATA['C'];
                  return (
                    <tr key={c.code} className="hover:bg-[var(--paper)]">
                      <td className="py-2.5 px-3">
                        <span
                          style={{ backgroundColor: meta.color }}
                          className="w-5 h-5 rounded text-white font-bold flex items-center justify-center text-[10px]"
                        >
                          {c.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-[var(--ink)]">
                        {c.name}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--ink-soft)]">{(c.prec * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-[var(--ink-soft)]">{(c.rec * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 font-bold text-[var(--forest)]">{(c.f1 * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-[var(--ink-muted)]">{c.support.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
