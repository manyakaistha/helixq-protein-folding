'use client';

import React, { useState } from 'react';
import {
  Server,
  Upload,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  Play
} from 'lucide-react';
import { parseFasta, predictBatch, exportPredictions, FastaRecord, PredictionResult } from '@/lib/api';
import { EXAMPLE_PROTEINS } from '@/lib/constants';

export default function BatchPage() {
  const [fastaInput, setFastaInput] = useState<string>('');
  const [parsedRecords, setParsedRecords] = useState<FastaRecord[]>([]);
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadSampleBatch = () => {
    const lines: string[] = [];
    EXAMPLE_PROTEINS.forEach((p) => {
      lines.push(`>${p.uniprotId} ${p.name}`);
      lines.push(p.sequence);
    });
    const combined = lines.join('\n');
    setFastaInput(combined);
    handleParse(combined);
  };

  const handleParse = async (contentToParse?: string) => {
    const text = contentToParse || fastaInput;
    if (!text.trim()) {
      setError('Please provide FASTA text to parse.');
      return;
    }
    setError(null);
    try {
      const records = await parseFasta(text);
      setParsedRecords(records);
    } catch (err: any) {
      setError(err.message || 'Failed to parse FASTA content');
      setParsedRecords([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFastaInput(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleRunBatch = async () => {
    if (parsedRecords.length === 0) {
      setError('No parsed sequences available to run batch inference.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = parsedRecords.map((r) => ({
        id: r.id,
        sequence: r.sequence
      }));
      const res = await predictBatch(payload, false);
      setResults(res.results);
    } catch (err: any) {
      setError(err.message || 'Batch inference execution failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'csv' | 'fasta' | 'json') => {
    if (results.length === 0) return;
    try {
      const blob = await exportPredictions(format, results);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_predictions.${format === 'fasta' ? 'fasta' : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="eyebrow mb-1">
          <span className="eyebrow-line" />
          <span>HIGH-THROUGHPUT PROCESSING</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] font-normal tracking-tight">
          Batch Protein Secondary Structure Processing
        </h1>
        <p className="text-sm text-[var(--ink-muted)] max-w-3xl">
          Upload Multi-FASTA files containing multiple protein sequences and process them with length-aware batch collation and dual-head inference.
        </p>
      </div>

      {/* Input & Upload Area */}
      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div className="font-serif font-semibold text-sm text-[var(--ink)] flex items-center space-x-2">
            <FileText className="w-4 h-4 text-[var(--forest)]" />
            <span>Multi-FASTA Sequence Input</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={handleLoadSampleBatch}
              className="px-3 py-1 rounded-lg border border-[var(--line)] hover:bg-[var(--paper)] text-[var(--forest)] font-medium transition-colors"
            >
              Load Sample Proteins
            </button>
            <label className="cursor-pointer px-3 py-1 rounded-lg bg-[var(--paper-deep)] hover:bg-[var(--line-strong)] text-[var(--ink)] font-medium flex items-center space-x-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5 text-[var(--forest)]" />
              <span>Upload .fasta file</span>
              <input type="file" accept=".fasta,.fa,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <textarea
          rows={6}
          value={fastaInput}
          onChange={(e) => setFastaInput(e.target.value)}
          placeholder=">seq_1 Protein A&#10;MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHF...&#10;>seq_2 Protein B&#10;MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAG..."
          className="w-full p-4 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] font-mono text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-hidden focus:ring-2 focus:ring-[var(--forest)] transition-all resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--line)] text-xs">
          <div className="text-[var(--ink-muted)]">
            Parsed: <strong className="text-[var(--forest)] font-mono">{parsedRecords.length}</strong> sequences
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleParse()}
              className="px-4 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface-high)] text-[var(--ink)] font-semibold hover:bg-[var(--paper)] transition-colors"
            >
              Parse FASTA
            </button>
            <button
              onClick={handleRunBatch}
              disabled={loading || parsedRecords.length === 0}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-[var(--forest)] hover:bg-[#1a4a3c] disabled:opacity-50 text-[#f5f6ee] font-semibold shadow-xs transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--lime)]" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-[var(--lime)]" />
                  <span>Run Batch Inference</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* Batch Results Table */}
      {results.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[var(--ink)] flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#1e785e]" />
                <span>Batch Inference Completed ({results.length} Proteins)</span>
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">
                All sequences processed cleanly with genuine neural network forward pass.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[var(--ink-muted)] font-medium mr-1">Export:</span>
              <button
                onClick={() => handleDownload('csv')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--surface-high)] text-[var(--ink)] font-medium"
              >
                <Download className="w-3.5 h-3.5 text-[var(--forest)]" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleDownload('fasta')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--surface-high)] text-[var(--ink)] font-medium"
              >
                <Download className="w-3.5 h-3.5 text-[var(--forest)]" />
                <span>FASTA</span>
              </button>
              <button
                onClick={() => handleDownload('json')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--surface-high)] text-[var(--ink)] font-medium"
              >
                <Download className="w-3.5 h-3.5 text-[var(--forest)]" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--ink-muted)] font-sans font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Protein ID</th>
                  <th className="py-2.5 px-3">Length</th>
                  <th className="py-2.5 px-3">Q8 Preview (First 35 Residues)</th>
                  <th className="py-2.5 px-3">Q3 Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-[var(--paper)]">
                    <td className="py-2.5 px-3 font-bold text-[var(--ink)] font-sans">{r.id}</td>
                    <td className="py-2.5 px-3 text-[var(--ink-muted)]">{r.length}</td>
                    <td className="py-2.5 px-3 text-[#1e785e] font-semibold tracking-wider">
                      {r.q8.slice(0, 35)}
                      {r.q8.length > 35 && '...'}
                    </td>
                    <td className="py-2.5 px-3 text-[#d97706] font-semibold tracking-wider">
                      {r.q3.slice(0, 35)}
                      {r.q3.length > 35 && '...'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
