'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Dna,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart2,
  Server,
  Layers,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { checkHealth, HealthStatus } from '@/lib/api';
import { EXAMPLE_PROTEINS, BENCHMARK_HISTORY } from '@/lib/constants';

export default function HomePage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    checkHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 text-center lg:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Verified Competition Champion • Score: 0.4910</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Production Protein{' '}
              <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                Secondary Structure
              </span>{' '}
              Prediction
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Transforming raw amino acid sequences into verified 8-state (Q8) and 3-state (Q3) secondary structure annotations
              using a deep neural hybrid of MultiScale 1D Convolutions, Bidirectional GRU, and Self-Attention.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/predict"
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all duration-200 hover:scale-[1.02]"
              >
                <Activity className="w-4 h-4" />
                <span>Launch Prediction Workspace</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                href="/benchmarks"
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm shadow-xs transition-all duration-200"
              >
                <BarChart2 className="w-4 h-4 text-purple-600" />
                <span>Explore Benchmarks</span>
              </Link>
            </div>

            {/* Backend Verification Pill */}
            <div className="pt-2 flex items-center justify-center lg:justify-start space-x-2 text-xs text-slate-500 dark:text-slate-400">
              {health?.status === 'healthy' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    Model loaded in memory on <strong>{health.device}</strong> (PyTorch v10 Champion Checkpoint)
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Connecting to local inference engine at http://localhost:8000...</span>
                </>
              )}
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-500/10 via-slate-100/50 to-white dark:from-purple-950/20 dark:via-slate-900/60 dark:to-slate-900 border border-purple-200/50 dark:border-purple-800/40 shadow-xl backdrop-blur-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Champion Architecture</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-mono font-bold">
                  v10
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <span className="text-slate-500">MultiScale CNN (k=3, 5, 7)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Local Motif Receptive Field</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <span className="text-slate-500">2-Layer Bidirectional GRU</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">384 Hidden Dim (768 out)</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <span className="text-slate-500">Multi-Head Self-Attention</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">4 Heads + Residual Skip</span>
                </div>
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <span className="text-slate-500">Dual Independent Heads</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Q8 (9 logits) + Q3 (4 logits)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                Total Parameters: <strong className="text-purple-600 dark:text-purple-400">6,634,925</strong> • Trained with AMP & CosineAnnealing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature & Workflow Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Comprehensive Platform Modules
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            From single-sequence diagnostic inference to high-throughput batch processing and architectural forensics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          <Link
            href="/predict"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                Prediction Workspace
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Enter raw sequence or FASTA format. Select pre-loaded model proteins and generate 100% genuine Q8 and Q3 predictions.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400">
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/viewer"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                Secondary Structure Viewer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                3-row synchronized visual alignment (Residue, Q8, Q3). Interactive residue inspection, probability distributions, and SVG export.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-sky-600 dark:text-sky-400">
              <span>Inspect Alignment</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/analysis"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Structural Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Contiguous segment detection, Q8-to-Q3 consistency matrix, predictive entropy profiling, and longest helix/strand metrics.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <span>View Analysis</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/models"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Model Explorer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Detailed architecture specifications, parameter breakdown by module, and design rationale behind the 14 competition iterations.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span>Explore Architecture</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/batch"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Batch Processing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload Multi-FASTA files with dozens of proteins. Stream predictions and export in competition CSV, FASTA, or JSON format.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Run Batch Job</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/docs"
            className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                Scientific Documentation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                DSSP definitions, evaluation formulas, the recurrent dynamics padding audit findings, and biological boundary disclosures.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-violet-600 dark:text-violet-400">
              <span>Read Documentation</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Example Proteins Section */}
      <section className="p-8 rounded-3xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Pre-Loaded Benchmark Reference Proteins
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click any canonical protein to load its sequence into the prediction workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EXAMPLE_PROTEINS.slice(0, 3).map((prot) => (
            <div
              key={prot.uniprotId}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                    {prot.uniprotId}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {prot.sequence.length} residues
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{prot.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {prot.description}
                </p>
              </div>

              <Link
                href={`/predict?example=${encodeURIComponent(prot.uniprotId)}`}
                className="inline-flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors"
              >
                <span>Predict Structure</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
