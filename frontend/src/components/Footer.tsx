'use client';

import React from 'react';
import { API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
import { AlertCircle, Layers, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)] py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Scientific & Biological Grounding Notice */}
        <div className="mb-10 p-4 rounded-xl bg-[var(--paper-deep)] border border-[var(--line)] flex items-start space-x-3 text-[var(--ink-soft)] text-xs sm:text-sm leading-relaxed">
          <AlertCircle className="w-5 h-5 shrink-0 text-[var(--gold)] mt-0.5" />
          <div>
            <span className="font-semibold text-[var(--ink)]">Scientific Notice & Empirical Grounding: </span>
            This application predicts local one-dimensional protein secondary structure (8-state DSSP classes and 3-state reductions) using the champion trained neural network (Version 10 MultiScale CNN + BiGRU + Self-Attention). 1D secondary structure prediction identifies local hydrogen-bonding conformations (&alpha;-helices, &beta;-strands, turns, coils) and is distinct from complete atomic tertiary fold coordinate solvers.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          <div className="space-y-3">
            <h4 className="font-serif text-base font-semibold text-[var(--ink)] flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--lime)]" />
              <span>ProteinFold AI</span>
            </h4>
            <p className="text-[var(--ink-muted)] text-xs leading-relaxed">
              Production-grade secondary structure prediction platform based on the NPPE 2 research competition champion model.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[rgba(30,120,94,0.1)] text-[var(--forest)] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--forest)]" />
              <span>Score: 0.4910 (Harmonic F1)</span>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[var(--ink)] mb-3">Capabilities</h4>
            <ul className="space-y-2 text-xs text-[var(--ink-muted)]">
              <li>
                <Link href="/predict" className="hover:text-[var(--forest)] transition-colors">
                  Single-Sequence Inference
                </Link>
              </li>
              <li>
                <Link href="/viewer" className="hover:text-[var(--forest)] transition-colors">
                  3D Ribbon & 1D Alignment Viewer
                </Link>
              </li>
              <li>
                <Link href="/analysis" className="hover:text-[var(--forest)] transition-colors">
                  Consistency & Segment Analysis
                </Link>
              </li>
              <li>
                <Link href="/batch" className="hover:text-[var(--forest)] transition-colors">
                  High-Throughput FASTA Processing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[var(--ink)] mb-3">Model & Science</h4>
            <ul className="space-y-2 text-xs text-[var(--ink-muted)]">
              <li>
                <Link href="/models" className="hover:text-[var(--forest)] transition-colors">
                  Hybrid CNN + BiGRU + Attention
                </Link>
              </li>
              <li>
                <Link href="/benchmarks" className="hover:text-[var(--forest)] transition-colors">
                  Stratified Benchmarks & Metrics
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-[var(--forest)] transition-colors">
                  DSSP 8-State Definitions
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-[var(--forest)] transition-colors">
                  Dihedral Kinematics & Torsion
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-[var(--ink)] mb-3">API & Service</h4>
            <ul className="space-y-2 text-xs text-[var(--ink-muted)]">
              <li>
                <a
                  href={`${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}/docs`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--forest)] transition-colors inline-flex items-center gap-1"
                >
                  <span>FastAPI Swagger UI</span>
                  <ArrowUpRight size={11} />
                </a>
              </li>
              <li>
                <a
                  href={`${API_BASE_URL}/health`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--forest)] transition-colors"
                >
                  Live Health Check
                </a>
              </li>
              <li>
                <a
                  href={`${API_BASE_URL}/model/info`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--forest)] transition-colors"
                >
                  Model Architecture JSON
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--ink-muted)]">
          <p>ProteinFold &middot; Biomolecular Neural Inference Desk</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Built with scientific rigor and biological clarity.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
