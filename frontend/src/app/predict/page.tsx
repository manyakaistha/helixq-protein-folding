'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  Sparkles,
  RefreshCw,
  Download,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { predictSequence, PredictionResult, exportPredictions } from '@/lib/api';
import { EXAMPLE_PROTEINS, ExampleProtein } from '@/lib/constants';
import { StructureViewer } from '@/components/StructureViewer';

function PredictContent() {
  const searchParams = useSearchParams();
  const exampleId = searchParams?.get('example');

  const [sequenceInput, setSequenceInput] = useState<string>('');
  const [seqId, setSeqId] = useState<string>('protein_1');
  const [returnProbabilities, setReturnProbabilities] = useState<boolean>(true);
  const [returnAttention, setReturnAttention] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Load example if passed in query param
  useEffect(() => {
    if (exampleId) {
      const found = EXAMPLE_PROTEINS.find((p) => p.uniprotId === exampleId);
      if (found) {
        setSequenceInput(found.sequence);
        setSeqId(found.uniprotId);
      }
    } else {
      setSequenceInput(EXAMPLE_PROTEINS[0].sequence);
      setSeqId(EXAMPLE_PROTEINS[0].uniprotId);
    }
  }, [exampleId]);

  const handleSelectExample = (prot: ExampleProtein) => {
    setSequenceInput(prot.sequence);
    setSeqId(prot.uniprotId);
    setError(null);
  };

  const handlePredict = async () => {
    if (!sequenceInput.trim()) {
      setError('Please provide an amino acid sequence or FASTA text.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await predictSequence(
        sequenceInput,
        seqId || 'protein_1',
        returnProbabilities,
        returnAttention
      );
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate secondary structure prediction');
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'csv' | 'fasta' | 'json') => {
    if (!prediction) return;
    try {
      const blob = await exportPredictions(format, [prediction]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prediction.id}_predictions.${format === 'fasta' ? 'fasta' : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const rawLength = sequenceInput.replace(/\s+/g, '').replace(/^>.*$/gm, '').length;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>Champion Neural Model v10</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Protein Secondary Structure Prediction Workspace
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Input an amino acid sequence to generate real Q8 (8-state) and Q3 (3-state) secondary structure predictions.
        </p>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sequence Input Card */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <label htmlFor="seq-input" className="font-semibold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Protein Sequence or FASTA</span>
            </label>
            <div className="flex items-center space-x-3 text-xs text-slate-500">
              <span>Length: <strong className="text-purple-600 font-mono">{rawLength}</strong> residues</span>
              <input
                type="text"
                placeholder="Protein ID"
                value={seqId}
                onChange={(e) => setSeqId(e.target.value)}
                className="w-28 px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <textarea
            id="seq-input"
            rows={6}
            value={sequenceInput}
            onChange={(e) => setSequenceInput(e.target.value)}
            placeholder="Paste raw amino acid sequence (e.g., MVLSPADKTN...) or FASTA format (>P69905...)"
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all resize-y"
          />

          {/* Model Options */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={returnProbabilities}
                  onChange={(e) => setReturnProbabilities(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="text-slate-600 dark:text-slate-300">Compute full class probabilities</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer select-none" title="Extract real multihead attention matrix (for sequences <= 500 residues)">
                <input
                  type="checkbox"
                  checked={returnAttention}
                  disabled={rawLength > 500}
                  onChange={(e) => setReturnAttention(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 disabled:opacity-50"
                />
                <span className="text-slate-600 dark:text-slate-300">
                  Self-Attention weights {rawLength > 500 && '(Seq > 500)'}
                </span>
              </label>
            </div>

            <button
              onClick={handlePredict}
              disabled={loading || rawLength === 0}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold shadow-md shadow-purple-600/20 transition-all duration-150 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Inference...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Secondary Structure</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Example Proteins Selector */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Load Reference Protein</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select standard biological benchmark proteins:
          </p>

          <div className="space-y-2">
            {EXAMPLE_PROTEINS.map((prot) => (
              <button
                key={prot.uniprotId}
                onClick={() => handleSelectExample(prot)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                  seqId === prot.uniprotId
                    ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{prot.name}</span>
                  <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400">{prot.uniprotId}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {prot.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start space-x-3 text-rose-800 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <strong className="font-semibold">Prediction Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Prediction Output Results */}
      {prediction && (
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Prediction Generated Successfully
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Model: {prediction.model_version} • Device: {prediction.device} • Length: {prediction.length} residues
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/analysis?seq=${encodeURIComponent(prediction.sequence)}&id=${encodeURIComponent(prediction.id)}&q8=${encodeURIComponent(prediction.q8)}&q3=${encodeURIComponent(prediction.q3)}`}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors"
              >
                <BarChart2 className="w-4 h-4 text-indigo-600" />
                <span>Deep Analysis</span>
              </Link>

              <button
                onClick={() => handleDownload('csv')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleDownload('fasta')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>FASTA</span>
              </button>
              <button
                onClick={() => handleDownload('json')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Interactive 3-Row Structure Viewer */}
          <StructureViewer prediction={prediction} />
        </div>
      )}
    </div>
  );
}

export default function PredictPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading prediction workspace...</div>}>
      <PredictContent />
    </Suspense>
  );
}
