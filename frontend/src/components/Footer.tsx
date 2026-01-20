'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Layers, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Scientific & Biological Disclaimer Banner */}
        <div className="mb-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start space-x-3 text-amber-800 dark:text-amber-300 text-xs sm:text-sm leading-relaxed">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold">Scientific Notice & Grounding: </span>
            This application predicts local one-dimensional protein secondary structure (Q8 DSSP states and Q3 reductions) using the champion
            trained neural network (Version 10). Secondary structure prediction is <strong>not</strong> equivalent to complete three-dimensional
            protein folding (such as AlphaFold atomic coordinates). Never fabricate or infer 3D conformations directly from 1D secondary structure labels.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>ProteinFold AI</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Production-grade secondary structure prediction platform based on the NPPE 2 research competition champion model.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Score: 0.4910 (Harmonic F1)</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Capabilities</h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li><Link href="/predict" className="hover:text-purple-600">Real-Time Q8 & Q3 Inference</Link></li>
              <li><Link href="/viewer" className="hover:text-purple-600">3-Row Synchronized Viewer</Link></li>
              <li><Link href="/analysis" className="hover:text-purple-600">Consistency & Segment Analysis</Link></li>
              <li><Link href="/batch" className="hover:text-purple-600">High-Throughput FASTA Processing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Model & Science</h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li><Link href="/models" className="hover:text-purple-600">CNN + BiGRU + Attention</Link></li>
              <li><Link href="/benchmarks" className="hover:text-purple-600">Stratified Benchmarks</Link></li>
              <li><Link href="/docs" className="hover:text-purple-600">DSSP 8-State Definitions</Link></li>
              <li><Link href="/docs" className="hover:text-purple-600">Recurrent Dynamics Forensics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">API & Source</h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-purple-600">FastAPI Swagger UI</a></li>
              <li><a href="http://localhost:8000/api/v1/health" target="_blank" rel="noreferrer" className="hover:text-purple-600">Health Endpoint</a></li>
              <li><a href="http://localhost:8000/api/v1/model/info" target="_blank" rel="noreferrer" className="hover:text-purple-600">Model Metadata JSON</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© 2025–2026 ProteinFold AI Research Team. Strictly verified real predictions.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Built with scientific rigor</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
