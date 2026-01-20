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
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <Server className="w-3.5 h-3.5" />
          <span>High-Throughput Inference Service</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Batch Protein Secondary Structure Processing
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload Multi-FASTA files containing dozens of protein sequences and process them with length-aware batch collation.
        </p>
      </div>

      {/* Input & Upload Area */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Multi-FASTA Sequence Input</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={handleLoadSampleBatch}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-purple-600 dark:text-purple-400 font-medium transition-colors"
            >
              Load Sample Proteins
            </button>
            <label className="cursor-pointer px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center space-x-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
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
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="text-slate-500">
            Parsed: <strong className="text-slate-800 dark:text-slate-200 font-mono">{parsedRecords.length}</strong> sequences
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleParse()}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Parse FASTA
            </button>
            <button
              onClick={handleRunBatch}
              disabled={loading || parsedRecords.length === 0}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold shadow-md shadow-purple-600/20 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Batch Inference</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Batch Results Table */}
      {results.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Batch Inference Completed ({results.length} Proteins)</span>
              </h3>
              <p className="text-xs text-slate-500">
                All sequences processed cleanly with genuine neural network forward pass.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400 font-medium mr-1">Export:</span>
              <button
                onClick={() => handleDownload('csv')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-medium"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleDownload('fasta')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-medium"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>FASTA</span>
              </button>
              <button
                onClick={() => handleDownload('json')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-medium"
              >
                <Download className="w-3.5 h-3.5 text-purple-600" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-sans font-semibold uppercase">
                  <th className="py-2.5 px-3">Protein ID</th>
                  <th className="py-2.5 px-3">Length</th>
                  <th className="py-2.5 px-3">Q8 Preview (First 35 Residues)</th>
                  <th className="py-2.5 px-3">Q3 Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white font-sans">{r.id}</td>
                    <td className="py-2.5 px-3 text-slate-500">{r.length}</td>
                    <td className="py-2.5 px-3 text-purple-600 font-semibold tracking-wider">
                      {r.q8.slice(0, 35)}{r.q8.length > 35 && '...'}
                    </td>
                    <td className="py-2.5 px-3 text-sky-600 font-semibold tracking-wider">
                      {r.q3.slice(0, 35)}{r.q3.length > 35 && '...'}
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
