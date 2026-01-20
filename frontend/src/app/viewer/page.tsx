'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Download, Sparkles, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';
import { predictSequence, PredictionResult } from '@/lib/api';
import { EXAMPLE_PROTEINS } from '@/lib/constants';
import { StructureViewer } from '@/components/StructureViewer';

export default function ViewerPage() {
  const [selectedProtein, setSelectedProtein] = useState(EXAMPLE_PROTEINS[0]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = async (seq: string, id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictSequence(seq, id, true, false);
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load structure');
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction(selectedProtein.sequence, selectedProtein.uniprotId);
  }, [selectedProtein]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Secondary Structure Viewer</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Residue-Aligned Secondary Structure Viewer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Synchronized 3-row visualization: Amino Acid, Predicted Q8, and Predicted Q3 states with click-to-inspect probability details.
          </p>
        </div>

        {/* Protein Quick Switcher */}
        <div className="flex items-center space-x-2">
          <label htmlFor="protein-select" className="text-xs font-medium text-slate-500">Protein:</label>
          <select
            id="protein-select"
            value={selectedProtein.uniprotId}
            onChange={(e) => {
              const p = EXAMPLE_PROTEINS.find((item) => item.uniprotId === e.target.value);
              if (p) setSelectedProtein(p);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-xs"
          >
            {EXAMPLE_PROTEINS.map((p) => (
              <option key={p.uniprotId} value={p.uniprotId}>
                {p.name} ({p.uniprotId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-purple-600 animate-spin" />
          <h4 className="font-semibold text-slate-900 dark:text-white">Generating Real Model Inference...</h4>
          <p className="text-xs text-slate-500">Running forward pass on champion neural network</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-300 text-sm">
          Failed to load prediction: {error}
        </div>
      )}

      {prediction && !loading && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 dark:text-white">{selectedProtein.name}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-semibold">
                  {selectedProtein.uniprotId}
                </span>
                <span className="text-xs text-slate-400">({selectedProtein.organism})</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {selectedProtein.description}
              </p>
            </div>

            <Link
              href={`/analysis?seq=${encodeURIComponent(prediction.sequence)}&id=${encodeURIComponent(prediction.id)}&q8=${encodeURIComponent(prediction.q8)}&q3=${encodeURIComponent(prediction.q3)}`}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Analyze in Dashboard</span>
            </Link>
          </div>

          {/* Interactive Viewer Component */}
          <StructureViewer prediction={prediction} />
        </div>
      )}
    </div>
  );
}
