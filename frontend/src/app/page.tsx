'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Box,
  BarChart2,
  Server,
  Cpu,
  FileText,
  Sparkles,
  Layers,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { EXAMPLE_PROTEINS } from '@/lib/constants';
import { MolecularField } from '@/components/MolecularField';

const workflows = [
  {
    href: '/predict',
    icon: Activity,
    title: 'From Sequence to Structure',
    description:
      'Paste any FASTA or raw amino acid sequence. Execute dual-head neural inference for 8-state DSSP and canonical 3-state assignments.',
    action: 'Open prediction workspace'
  },
  {
    href: '/viewer',
    icon: Box,
    title: 'Interactive 3D Structure Viewer',
    description:
      'Inspect 3D cartoon ribbons, Ramachandran backbone trajectories, and synchronized 1D residue alignments with confidence tracking.',
    action: 'Launch 3D explorer'
  },
  {
    href: '/analysis',
    icon: BarChart2,
    title: 'Dual-Head Structural Analysis',
    description:
      'Examine amino acid composition, secondary structure segment length distributions, and Q8 vs Q3 cross-entropy agreement.',
    action: 'Review structural forensics'
  },
  {
    href: '/batch',
    icon: Server,
    title: 'High-Throughput Batch Library',
    description:
      'Upload multi-FASTA files for queued parallel evaluation. Export standardized CSV, FASTA annotation, or structured JSON bundles.',
    action: 'Process multi-FASTA batch'
  },
  {
    href: '/models',
    icon: Cpu,
    title: 'Champion Neural Architecture',
    description:
      'Walk through the 6.63M-parameter Version 10 Hybrid: MultiScale 1D Convolutions, 2-layer BiGRU, and Scaled Dot-Product Self-Attention.',
    action: 'Inspect model anatomy'
  },
  {
    href: '/benchmarks',
    icon: ShieldCheck,
    title: 'Empirical Benchmarks & Metrics',
    description:
      'Explore private test leaderboard performance (Harmonic F1 0.4910), length-stratified validation, and confusion matrices.',
    action: 'Examine leaderboard'
  }
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Editorial Hero Section */}
      <section className="home-intro">
        <div className="hero-copy">
          <div className="eyebrow mb-3">
            <span className="eyebrow-line" />
            <span>BIOMOLECULAR NEURAL INFERENCE DESK</span>
          </div>

          <h1 className="home-heading">
            Every sequence<br />
            has a <em>structure.</em>
          </h1>

          <p className="mt-4">
            Transform linear primary amino acid sequences into interpretable local secondary structure conformations. Powered by Champion Version 10 MultiScale CNN + BiGRU + Self-Attention with simultaneous 8-state DSSP and 3-state canonical prediction heads.
          </p>

          <div className="capabilities-strip">
            <span>
              <span className="cap-pip bg-[#1e785e]" /> &alpha;-Helix (H/G/I)
            </span>
            <span>
              <span className="cap-pip bg-[#d97706]" /> &beta;-Strand (E/B)
            </span>
            <span>
              <span className="cap-pip bg-[#7c3aed]" /> Turn (T/S)
            </span>
            <span>
              <span className="cap-pip bg-[#64748b]" /> Coil (C)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link href="/predict" className="primary-action">
              <span>Launch Prediction</span>
              <ArrowRight size={15} />
            </Link>
            <Link href="/viewer" className="secondary-action">
              <Box size={15} className="text-[var(--forest)]" />
              <span>Explore 3D Structure</span>
            </Link>
          </div>
        </div>

        {/* Generative Micro-Interaction Canvas */}
        <div className="w-full">
          <MolecularField />
        </div>
      </section>

      {/* 4-Stat Strip */}
      <div className="stats-strip">
        <div>
          <strong>6.63M</strong>
          <span>Champion V10 Parameters</span>
        </div>
        <div>
          <strong>8 &middot; 3</strong>
          <span>Dual Prediction Heads (Q8 &amp; Q3)</span>
        </div>
        <div>
          <strong>0.4910</strong>
          <span>Competition Harmonic F1 Score</span>
        </div>
        <div>
          <strong>&le; 2,500</strong>
          <span>Residues Max Sequence Window</span>
        </div>
      </div>

      {/* Research Desk Workflows Grid */}
      <section>
        <div className="section-heading">
          <div>
            <div className="eyebrow mb-1">
              <span className="eyebrow-line" />
              <span>RESEARCH WORKBENCH</span>
            </div>
            <h2>A Sequence of Discoveries</h2>
          </div>
          <span className="font-mono text-xs text-[var(--ink-muted)]">01 &mdash; 06</span>
        </div>

        <div className="workflow-grid">
          {workflows.map(({ href, icon: Icon, title, description, action }, i) => (
            <Link href={href} key={href} className="workflow-card">
              <div className="flex justify-between items-center text-[var(--forest)]">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(30,120,94,0.08)]">
                  <Icon size={18} />
                </span>
                <span className="font-mono text-xs text-[var(--ink-muted)]">0{i + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <div className="card-foot">
                <span>{action}</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Curated Reference Proteins */}
      <section>
        <div className="section-heading">
          <div>
            <div className="eyebrow mb-1">
              <span className="eyebrow-line" />
              <span>VALIDATED REFERENCE FOLDS</span>
            </div>
            <h2>Canonical Proteins Ready to Explore</h2>
          </div>
          <Link
            href="/viewer"
            className="text-xs font-semibold text-[var(--forest)] hover:underline inline-flex items-center gap-1"
          >
            <span>View all in 3D</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="reference-grid">
          {EXAMPLE_PROTEINS.slice(0, 3).map((p) => (
            <article className="reference-card" key={p.uniprotId}>
              <div className="flex justify-between font-mono text-[10px] text-[var(--ink-muted)]">
                <span className="px-2 py-0.5 rounded bg-[var(--paper-deep)] text-[var(--ink-soft)] font-semibold">
                  {p.uniprotId} &middot; {p.pdbId || 'PDB'}
                </span>
                <span>{p.sequence.length} residues</span>
              </div>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--line)]">
                <Link
                  href={`/predict?example=${p.uniprotId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--forest)] hover:text-[#1e5242]"
                >
                  <span>Predict Structure</span>
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href={`/viewer?example=${p.uniprotId}`}
                  className="inline-flex items-center gap-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  <Box size={13} />
                  <span>3D View</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
