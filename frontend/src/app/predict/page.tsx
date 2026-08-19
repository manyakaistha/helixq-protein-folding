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
  FileText,
  Box,
  Layers,
  ArrowRight,
  ClipboardCopy
} from 'lucide-react';
import { predictSequence, PredictionResult, ResiduePrediction, exportPredictions } from '@/lib/api';
import { EXAMPLE_PROTEINS, ExampleProtein } from '@/lib/constants';
import { StructureViewer } from '@/components/StructureViewer';
import { ProteinStructure3D } from '@/components/ProteinStructure3D';

function PredictContent() {
  const searchParams = useSearchParams();
  const exampleId = searchParams?.get('example');
  const querySeq = searchParams?.get('seq');
  const queryId = searchParams?.get('id');

  const [sequenceInput, setSequenceInput] = useState<string>('');
  const [seqId, setSeqId] = useState<string>('protein_1');
  const [returnProbabilities, setReturnProbabilities] = useState<boolean>(true);
  const [returnAttention, setReturnAttention] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Synchronized active residue across 3D and 1D
  const [selectedResidue, setSelectedResidue] = useState<ResiduePrediction | null>(null);

  // Load example or query params
  useEffect(() => {
    if (querySeq) {
      setSequenceInput(querySeq);
      setSeqId(queryId || 'protein_custom');
    } else if (exampleId) {
      const found = EXAMPLE_PROTEINS.find((p) => p.uniprotId === exampleId);
      if (found) {
        setSequenceInput(found.sequence);
        setSeqId(found.uniprotId);
      }
    } else {
      setSequenceInput(EXAMPLE_PROTEINS[0].sequence);
      setSeqId(EXAMPLE_PROTEINS[0].uniprotId);
    }
  }, [exampleId, querySeq, queryId]);

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
      if (res.residues.length > 0) {
        setSelectedResidue(res.residues[0]);
      }
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
        <div className="eyebrow mb-1">
          <span className="eyebrow-line" />
          <span>PRODUCTION NEURAL PREDICTOR</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] font-normal tracking-tight">
          Secondary Structure Prediction Workspace
        </h1>
        <p className="text-sm text-[var(--ink-muted)] max-w-3xl">
          Submit any single amino acid sequence or FASTA entry to compute synchronized 8-state DSSP and 3-state canonical secondary conformations in real time.
        </p>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sequence Input Card */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
            <label
              htmlFor="seq-input"
              className="font-serif font-semibold text-sm text-[var(--ink)] flex items-center space-x-2"
            >
              <FileText className="w-4 h-4 text-[var(--forest)]" />
              <span>Protein Sequence or FASTA</span>
            </label>
            <div className="flex items-center space-x-3 text-xs text-[var(--ink-muted)]">
              <span>
                Length: <strong className="text-[var(--forest)] font-mono">{rawLength}</strong> residues
              </span>
              <input
                type="text"
                placeholder="Protein ID"
                value={seqId}
                onChange={(e) => setSeqId(e.target.value)}
                className="w-28 px-2 py-1 text-xs rounded-md border border-[var(--line)] bg-[var(--paper)] font-mono text-[var(--ink)]"
              />
            </div>
          </div>

          <textarea
            id="seq-input"
            rows={5}
            value={sequenceInput}
            onChange={(e) => setSequenceInput(e.target.value)}
            placeholder="Paste raw amino acid sequence (e.g., MVLSPADKTN...) or FASTA format (>P69905...)"
            className="w-full p-4 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] font-mono text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-hidden focus:ring-2 focus:ring-[var(--forest)] transition-all resize-y"
          />

          {/* Model Options & Predict Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--line)] text-xs">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={returnProbabilities}
                  onChange={(e) => setReturnProbabilities(e.target.checked)}
                  className="rounded border-[var(--line)] text-[var(--forest)] focus:ring-[var(--forest)] w-4 h-4"
                />
                <span className="text-[var(--ink-soft)]">Full DSSP softmax probabilities</span>
              </label>

              <label
                className="flex items-center space-x-2 cursor-pointer select-none"
                title="Extract real multihead attention matrix (for sequences <= 500 residues)"
              >
                <input
                  type="checkbox"
                  checked={returnAttention}
                  disabled={rawLength > 500}
                  onChange={(e) => setReturnAttention(e.target.checked)}
                  className="rounded border-[var(--line)] text-[var(--forest)] focus:ring-[var(--forest)] w-4 h-4 disabled:opacity-50"
                />
                <span className="text-[var(--ink-soft)]">
                  Self-Attention matrix {rawLength > 500 && '(&le; 500 res)'}
                </span>
              </label>
            </div>

            <button
              onClick={handlePredict}
              disabled={loading || rawLength === 0}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[var(--forest)] hover:bg-[#1a4a3c] disabled:opacity-50 text-[#f5f6ee] font-semibold shadow-md transition-all duration-150 hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--lime)]" />
                  <span>Computing Forward Pass...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[var(--lime)]" />
                  <span>Execute Prediction</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reference Proteins Quick Loader */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <div className="border-b border-[var(--line)] pb-3">
            <h3 className="font-serif font-semibold text-sm text-[var(--ink)] flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[var(--lime)]" />
              <span>Reference Standard Folds</span>
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Click to load validated biological proteins:
            </p>
          </div>

          <div className="space-y-2">
            {EXAMPLE_PROTEINS.map((prot) => (
              <button
                key={prot.uniprotId}
                onClick={() => handleSelectExample(prot)}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                  seqId === prot.uniprotId
                    ? 'border-[var(--forest)] bg-[var(--paper-deep)] text-[var(--ink)] shadow-xs'
                    : 'border-[var(--line)] bg-[var(--surface-high)] hover:bg-[var(--paper)] text-[var(--ink-soft)]'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-[var(--ink)]">{prot.name}</span>
                  <span className="font-mono text-[10px] text-[var(--forest)]">{prot.uniprotId}</span>
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] mt-1 line-clamp-1">
                  {prot.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <strong className="font-semibold">Prediction Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Prediction Results Display */}
      {prediction && (
        <div className="space-y-8 pt-4">
          {/* Header Summary & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(30,120,94,0.12)] flex items-center justify-center text-[var(--forest)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[var(--ink)]">
                  Neural Prediction Output Ready
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  Protein: <span className="font-mono font-medium text-[var(--ink)]">{prediction.id}</span> &middot; Model: {prediction.model_version} &middot; Device: {prediction.device} &middot; {prediction.length} Residues
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/analysis?seq=${encodeURIComponent(prediction.sequence)}&id=${encodeURIComponent(prediction.id)}&q8=${encodeURIComponent(prediction.q8)}&q3=${encodeURIComponent(prediction.q3)}`}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[rgba(30,120,94,0.1)] hover:bg-[rgba(30,120,94,0.18)] text-[var(--forest)] text-xs font-semibold transition-colors"
              >
                <BarChart2 className="w-4 h-4" />
                <span>Structural Forensics</span>
              </Link>

              <button
                onClick={() => handleDownload('csv')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--surface-high)] text-[var(--ink)] text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[var(--forest)]" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => handleDownload('fasta')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--surface-high)] text-[var(--ink)] text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[var(--forest)]" />
                <span>FASTA</span>
              </button>

              <button
                onClick={() => handleDownload('json')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--surface-high)] text-[var(--ink)] text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[var(--forest)]" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* 3D Protein Structure Viewer */}
          <ProteinStructure3D
            prediction={prediction}
            selectedResiduePosition={selectedResidue?.position}
            onSelectResidue={setSelectedResidue}
            height={460}
          />

          {/* 1D Alignment Viewer & Inspection Panel */}
          <StructureViewer
            prediction={prediction}
            selectedResiduePosition={selectedResidue?.position}
            onSelectResidue={setSelectedResidue}
          />
        </div>
      )}
    </div>
  );
}

export default function PredictPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[var(--ink-muted)]">
          Loading prediction workspace...
        </div>
      }
    >
      <PredictContent />
    </Suspense>
  );
}
