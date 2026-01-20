'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart2,
  PieChart,
  RefreshCw,
  CheckCircle2
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

  // Filter segments
  const filteredSegments = analysis?.q3_segments.filter((seg) => {
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
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Scientific Structure Analytics</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Structural Analysis & Consistency Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quantify secondary structure compositions, detect contiguous structural segments, and examine dual-head consistency.
        </p>
      </div>

      {/* Sequence Selector Input Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center space-x-3">
          <input
            type="text"
            value={seqId}
            onChange={(e) => setSeqId(e.target.value)}
            placeholder="Protein ID"
            className="w-36 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold"
          />
          <input
            type="text"
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            placeholder="Sequence..."
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono truncate"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunNew}
            disabled={loading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Analyze</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-purple-600 animate-spin" />
          <h4 className="font-semibold text-slate-900 dark:text-white">Calculating Structural Metrics...</h4>
          <p className="text-xs text-slate-500">Segment detection, entropy profiling, and consistency analysis</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-8">
          {/* Key Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sequence Length</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {analysis.sequence_length} <span className="text-xs font-normal text-slate-400">residues</span>
              </div>
              <p className="text-[11px] text-slate-500">Total polypeptide chain span</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Longest Alpha-Helix</span>
              <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                {analysis.summary.longest_helix_length} <span className="text-xs font-normal text-slate-400">residues</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono">
                {analysis.summary.longest_helix_subsequence || 'None'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Longest Beta-Strand</span>
              <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
                {analysis.summary.longest_strand_length} <span className="text-xs font-normal text-slate-400">residues</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono">
                {analysis.summary.longest_strand_subsequence || 'None'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Q8/Q3 Consistency</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {analysis.consistency.agreement_percentage}%
              </div>
              <p className="text-[11px] text-slate-500">
                {analysis.consistency.disagreements_count} head disagreements
              </p>
            </div>
          </div>

          {/* Composition Breakdown: Q3 and Q8 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Q3 Composition */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-purple-600" />
                <span>Q3 Secondary Structure Composition</span>
              </h3>
              <div className="space-y-3">
                {Object.entries(analysis.q3_composition).map(([state, data]) => {
                  const meta = Q3_METADATA[state] || Q3_METADATA['C'];
                  return (
                    <div key={state} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center space-x-2">
                          <span
                            style={{ backgroundColor: meta.color }}
                            className="w-3.5 h-3.5 rounded text-white text-[10px] flex items-center justify-center"
                          >
                            {state}
                          </span>
                          <span>{meta.name}</span>
                        </span>
                        <span className="font-mono text-slate-500">
                          {data.count} residues ({data.percentage}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-sky-600" />
                <span>Q8 DSSP 8-State Distribution</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(analysis.q8_composition).map(([state, data]) => {
                  const meta = Q8_METADATA[state] || Q8_METADATA['C'];
                  return (
                    <div
                      key={state}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          style={{ backgroundColor: meta.color }}
                          className="w-4 h-4 rounded text-white text-[10px] font-bold flex items-center justify-center"
                        >
                          {state}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[80px]">
                          {meta.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {data.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contiguous Structural Segments */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Contiguous Structural Segments ({filteredSegments.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Continuous stretches of uniform secondary structure identified in sequence
                </p>
              </div>

              {/* Segment Type Filter */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
                {(['all', 'helix', 'strand', 'coil'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSegmentFilter(filter)}
                    className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                      segmentFilter === filter
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300'
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
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Span</th>
                    <th className="py-2.5 px-3">Length</th>
                    <th className="py-2.5 px-3">Amino Acid Subsequence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {filteredSegments.map((seg, idx) => {
                    const meta = Q3_METADATA[seg.class] || Q3_METADATA['C'];
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-sans">
                          <span
                            style={{ backgroundColor: meta.color }}
                            className="inline-flex items-center px-2 py-0.5 rounded text-white font-bold text-[10px]"
                          >
                            {seg.class} - {meta.name}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                          {seg.start} – {seg.end}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          {seg.length}
                        </td>
                        <td className="py-2 px-3 text-purple-600 dark:text-purple-400 tracking-wider">
                          {seg.subsequence}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Consistency & Disagreement Matrix */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Dual-Head Q8 vs Q3 Consistency Audit</span>
              </h3>
              <p className="text-xs text-slate-500">
                Evaluating structural agreement between independently trained Q8 and Q3 prediction heads.
              </p>
            </div>

            {analysis.consistency.disagreements_count === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs">
                Perfect 100% agreement: Every independently predicted Q8 state maps faithfully to its predicted Q3 counterpart.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Detected <strong>{analysis.consistency.disagreements_count}</strong> positions where Q8 projected state contradicts Q3 head:
                </div>
                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Position</th>
                        <th className="py-2 px-3">Residue</th>
                        <th className="py-2 px-3">Predicted Q8</th>
                        <th className="py-2 px-3">Projected Q3</th>
                        <th className="py-2 px-3">Predicted Q3</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {analysis.consistency.disagreements.map((dis, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-1.5 px-3">{dis.position}</td>
                          <td className="py-1.5 px-3 font-bold text-purple-600">{dis.amino_acid}</td>
                          <td className="py-1.5 px-3">{dis.predicted_q8}</td>
                          <td className="py-1.5 px-3 text-amber-600">{dis.projected_q3}</td>
                          <td className="py-1.5 px-3 text-rose-600 font-bold">{dis.predicted_q3}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading analysis workspace...</div>}>
      <AnalysisContent />
    </Suspense>
  );
}
