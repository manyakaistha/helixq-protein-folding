'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart2,
  PieChart,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { analyzeStructure, StructuralAnalysis } from '@/lib/api';
import { EXAMPLE_PROTEINS, Q8_METADATA, Q3_METADATA } from '@/lib/constants';

function AnalysisContent() {
  const searchParams = useSearchParams();
  const querySeq = searchParams?.get('seq');
  const queryId = searchParams?.get('id');
  const queryQ8 = searchParams?.get('q8');
  const queryQ3 = searchParams?.get('q3');

  const [sequence, setSequence] = useState<string>(querySeq || EXAMPLE_PROTEINS[0].sequence);
  const [seqId, setSeqId] = useState<string>(queryId || EXAMPLE_PROTEINS[0].uniprotId);
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'helix' | 'strand' | 'coil'>('all');

  const [analysis, setAnalysis] = useState<StructuralAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (seqToAnalyze: string, idToAnalyze: string, q8?: string, q3?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeStructure(seqToAnalyze, idToAnalyze, q8 || undefined, q3 || undefined);
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze protein structure');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis(sequence, seqId, queryQ8 || undefined, queryQ3 || undefined);
  }, []);

  const handleRunNew = () => {
    runAnalysis(sequence, seqId);
  };

  const filteredSegments =
    analysis?.q3_segments.filter((seg) => {
      if (segmentFilter === 'all') return true;
      if (segmentFilter === 'helix') return seg.class === 'H';
      if (segmentFilter === 'strand') return seg.class === 'E';
      if (segmentFilter === 'coil') return seg.class === 'C';
      return true;
    }) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="eyebrow mb-1">
          <span className="eyebrow-line" />
          <span>STATISTICAL &amp; ARCHITECTURAL FORENSICS</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] font-normal tracking-tight">
          Structural Analysis &amp; Consistency Dashboard
        </h1>
        <p className="text-sm text-[var(--ink-muted)] max-w-3xl">
          Quantify secondary structure compositions, detect contiguous structural segments, and examine dual-head agreement between Q8 and Q3 prediction branches.
        </p>
      </div>

      {/* Sequence Selector Input Bar */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center space-x-3">
          <input
            type="text"
            value={seqId}
            onChange={(e) => setSeqId(e.target.value)}
            placeholder="Protein ID"
            className="w-36 px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-xs font-mono font-semibold text-[var(--ink)]"
          />
          <input
            type="text"
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            placeholder="Sequence..."
            className="flex-1 px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-xs font-mono truncate text-[var(--ink)]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunNew}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[var(--forest)] hover:bg-[#1a4a3c] disabled:opacity-50 text-[#f5f6ee] text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--lime)] ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Analyze</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-[var(--forest)] animate-spin" />
          <h4 className="font-serif text-base font-semibold text-[var(--ink)]">Calculating Structural Metrics...</h4>
          <p className="text-xs text-[var(--ink-muted)]">Segment detection, entropy profiling, and consistency analysis</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-8">
          {/* Key Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-1">
              <span className="text-xs text-[var(--ink-muted)] font-medium uppercase tracking-wider">Sequence Span</span>
              <div className="text-2xl font-serif text-[var(--forest)] font-normal">
                {analysis.sequence_length} <span className="text-xs font-sans text-[var(--ink-muted)]">residues</span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)]">Total polypeptide chain length</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-1">
              <span className="text-xs text-[var(--ink-muted)] font-medium uppercase tracking-wider">Longest Alpha-Helix</span>
              <div className="text-2xl font-serif text-[#1e785e] font-normal">
                {analysis.summary.longest_helix_length} <span className="text-xs font-sans text-[var(--ink-muted)]">residues</span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] truncate font-mono">
                {analysis.summary.longest_helix_subsequence || 'None'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-1">
              <span className="text-xs text-[var(--ink-muted)] font-medium uppercase tracking-wider">Longest Beta-Strand</span>
              <div className="text-2xl font-serif text-[#d97706] font-normal">
                {analysis.summary.longest_strand_length} <span className="text-xs font-sans text-[var(--ink-muted)]">residues</span>
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] truncate font-mono">
                {analysis.summary.longest_strand_subsequence || 'None'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-1">
              <span className="text-xs text-[var(--ink-muted)] font-medium uppercase tracking-wider">Dual-Head Consistency</span>
              <div className="text-2xl font-serif text-[var(--forest)] font-normal">
                {analysis.consistency.agreement_percentage}%
              </div>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {analysis.consistency.disagreements_count} head disagreements
              </p>
            </div>
          </div>

          {/* Composition Breakdown: Q3 and Q8 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Q3 Composition */}
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
              <div className="border-b border-[var(--line)] pb-3">
                <h3 className="font-serif font-bold text-base text-[var(--ink)] flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-[var(--forest)]" />
                  <span>Q3 Secondary Structure Composition</span>
                </h3>
              </div>
              <div className="space-y-3.5">
                {Object.entries(analysis.q3_composition).map(([state, data]) => {
                  const meta = Q3_METADATA[state] || Q3_METADATA['C'];
                  return (
                    <div key={state} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-medium">
                        <span className="flex items-center space-x-2">
                          <span
                            style={{ backgroundColor: meta.color }}
                            className="w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center font-mono"
                          >
                            {state}
                          </span>
                          <span className="text-[var(--ink)]">{meta.name}</span>
                        </span>
                        <span className="font-mono text-[var(--ink-muted)]">
                          {data.count} residues ({data.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--line)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${data.percentage}%`,
                            backgroundColor: meta.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Q8 Composition */}
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
              <div className="border-b border-[var(--line)] pb-3">
                <h3 className="font-serif font-bold text-base text-[var(--ink)] flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-[var(--forest)]" />
                  <span>Q8 DSSP 8-State Distribution</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(analysis.q8_composition).map(([state, data]) => {
                  const meta = Q8_METADATA[state] || Q8_METADATA['C'];
                  return (
                    <div
                      key={state}
                      className="p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-high)] flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          style={{ backgroundColor: meta.color }}
                          className="w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center font-mono"
                        >
                          {state}
                        </span>
                        <span className="font-medium text-[var(--ink)] truncate max-w-[85px]">
                          {meta.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[var(--forest)]">
                        {data.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contiguous Structural Segments */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[var(--ink)]">
                  Contiguous Structural Segments ({filteredSegments.length})
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  Continuous stretches of uniform secondary structure identified along the chain
                </p>
              </div>

              {/* Segment Type Filter */}
              <div className="inline-flex rounded-lg border border-[var(--line)] p-0.5 bg-[var(--paper)] text-xs">
                {(['all', 'helix', 'strand', 'coil'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSegmentFilter(filter)}
                    className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                      segmentFilter === filter
                        ? 'bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
                        : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--ink-muted)] font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Span</th>
                    <th className="py-2.5 px-3">Length</th>
                    <th className="py-2.5 px-3">Subsequence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredSegments.map((seg, idx) => {
                    const meta = Q3_METADATA[seg.class] || Q3_METADATA['C'];
                    return (
                      <tr key={idx} className="hover:bg-[var(--paper)] transition-colors">
                        <td className="py-2.5 px-3">
                          <span
                            style={{ backgroundColor: meta.bgColor, color: meta.color }}
                            className="px-2 py-0.5 rounded font-mono font-semibold text-[11px]"
                          >
                            {seg.class} &middot; {meta.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[var(--ink)]">
                          {seg.start + 1} &rarr; {seg.end + 1}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-[var(--ink)]">
                          {seg.length} residues
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--ink-soft)] tracking-wider">
                          {seg.subsequence}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Uncertainty & High Entropy Positions */}
          {analysis.uncertainty.high_uncertainty_positions.length > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-[var(--line)] pb-3">
                <AlertTriangle className="w-4 h-4 text-[var(--gold)]" />
                <h3 className="font-serif font-bold text-base text-[var(--ink)]">
                  High-Uncertainty Boundary Residues ({analysis.uncertainty.high_uncertainty_positions.length})
                </h3>
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                Positions where predictive Shannon entropy exceeds 1.2 bits, typically corresponding to flexible loop transitions or hinge regions:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {analysis.uncertainty.high_uncertainty_positions.map((pos) => (
                  <div
                    key={pos.position}
                    className="p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-high)] text-center text-xs"
                  >
                    <div className="font-bold text-[var(--ink)] font-mono text-sm">
                      {pos.amino_acid}
                      <span className="text-[var(--ink-muted)] text-xs font-normal">#{pos.position}</span>
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)] mt-1">
                      Entropy: <strong className="font-mono text-[var(--gold)]">{pos.entropy.toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[var(--ink-muted)]">
          Loading structural analysis dashboard...
        </div>
      }
    >
      <AnalysisContent />
    </Suspense>
  );
}
