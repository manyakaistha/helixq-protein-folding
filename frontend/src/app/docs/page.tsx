'use client';

import React from 'react';
import { FileText, AlertCircle, BookOpen, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Q8_METADATA } from '@/lib/constants';

export default function DocsPage() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="eyebrow mb-1">
          <span className="eyebrow-line" />
          <span>FIELD GUIDE &amp; SCIENTIFIC MANUAL</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] font-normal tracking-tight">
          Theoretical Principles &amp; Architecture Manual
        </h1>
        <p className="text-sm text-[var(--ink-muted)] max-w-3xl">
          Biological DSSP taxonomy, mathematical formulations, engineering forensics, and operational boundaries.
        </p>
      </div>

      {/* Section 1: DSSP Secondary Structure Taxonomy */}
      <section className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-6">
        <div className="border-b border-[var(--line)] pb-4">
          <h2 className="font-serif text-xl font-bold text-[var(--ink)] flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--lime)]" />
            <span>1. DSSP 8-State Classification &amp; Q3 Reduction</span>
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Standard secondary structure assignments defined by Kabsch and Sander (1983) based on electrostatic hydrogen-bonding patterns.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-muted)] uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Q8 Code</th>
                <th className="py-2.5 px-3">Biological State</th>
                <th className="py-2.5 px-3">Q3 Group</th>
                <th className="py-2.5 px-3">Physical &amp; Chemical Characteristic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {Object.entries(Q8_METADATA).map(([code, meta]) => {
                const q3Group = ['H', 'G', 'I'].includes(code)
                  ? 'H (Helix)'
                  : ['E', 'B'].includes(code)
                  ? 'E (Strand)'
                  : 'C (Coil)';
                return (
                  <tr key={code} className="hover:bg-[var(--paper)]">
                    <td className="py-2.5 px-3 font-mono">
                      <span
                        style={{ backgroundColor: meta.color }}
                        className="w-5 h-5 rounded text-white font-bold flex items-center justify-center text-[10px]"
                      >
                        {code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[var(--ink)]">{meta.name}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[var(--forest)]">{q3Group}</td>
                    <td className="py-2.5 px-3 text-[var(--ink-muted)] leading-relaxed">{meta.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Mathematical Formulations */}
      <section className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-6">
        <div className="border-b border-[var(--line)] pb-4">
          <h2 className="font-serif text-xl font-bold text-[var(--ink)]">
            2. Mathematical Formulations &amp; Objective Functions
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Exact mathematical formulations implemented in the ProteinFold AI platform.
          </p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-[var(--ink-soft)]">
          <div className="p-4 rounded-xl bg-[var(--surface-high)] border border-[var(--line)] space-y-2">
            <h4 className="font-serif font-bold text-sm text-[var(--ink)]">Harmonic Mean Evaluation Metric</h4>
            <p>
              The primary competition evaluation score is the harmonic mean of the macro-averaged F1 scores across the 8 biological Q8 states and 3 Q3 states (ignoring the padding index):
            </p>
            <div className="p-3 rounded-lg bg-[var(--paper-deep)] font-mono text-center text-sm font-semibold text-[var(--forest)]">
              Score = 2 &times; (F1_Q8 &times; F1_Q3) / (F1_Q8 + F1_Q3)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-high)] border border-[var(--line)] space-y-2">
            <h4 className="font-serif font-bold text-sm text-[var(--ink)]">Predictive Entropy of Residue Classification</h4>
            <p>
              Positional uncertainty is quantified via the Shannon entropy of the model's normalized biological softmax probability distribution:
            </p>
            <div className="p-3 rounded-lg bg-[var(--paper-deep)] font-mono text-center text-sm font-semibold text-[var(--forest)]">
              H(pos) = &minus; &Sigma; [ p_k &middot; ln(p_k + 1e-12) ]
            </div>
            <p className="text-[11px] text-[var(--ink-muted)]">
              Residues with high entropy typically correspond to flexible loops, structural transition boundaries, or intrinsically disordered regions.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Engineering Forensics & Recurrent Dynamics */}
      <section className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
        <div className="border-b border-[var(--line)] pb-4">
          <h2 className="font-serif text-xl font-bold text-[var(--ink)]">
            3. Recurrent Layer Dynamics &amp; Forensic Findings
          </h2>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Key insights discovered during forensic reverse-engineering of the competition codebase.
          </p>
        </div>

        <div className="space-y-3 text-xs text-[var(--ink-soft)] leading-relaxed">
          <p>
            Our code audit uncovered that the competition training script in Version 10 did not apply PyTorch's <code className="font-mono text-[var(--forest)]">pack_padded_sequence</code> to the bidirectional GRU. Consequently:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-[var(--ink-muted)]">
            <li>
              <strong>Forward GRU:</strong> Processes tokens from left to right normally starting from residue 1.
            </li>
            <li>
              <strong>Reverse GRU:</strong> During fixed-batch padding up to maximum sequence length (e.g. 305), the reverse GRU travels across trailing zero padding tokens before encountering valid biological residues.
            </li>
            <li>
              <strong>Production Inference Fix:</strong> In our production inference engine, single-sequence prediction operates at exact sequence length <code className="font-mono text-[var(--forest)]">L</code> ($B=1$). This eliminates all reverse padding noise while preserving authentic forward pass dynamics.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 4: Biological Limitations & AlphaFold Distinction */}
      <section className="p-8 rounded-3xl bg-[var(--paper-deep)] border border-[var(--line)] shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-[var(--forest)] font-bold text-base">
          <AlertCircle className="w-5 h-5 text-[var(--gold)]" />
          <span className="font-serif">4. Biological Scope &amp; Grounded Disclosures</span>
        </div>

        <div className="text-xs text-[var(--ink-soft)] space-y-3 leading-relaxed">
          <p>
            <strong>Secondary Structure vs Tertiary Conformation:</strong> Protein secondary structure refers to local, regular geometric arrangements of the polypeptide backbone stabilized by hydrogen bonds between amino and carboxyl groups. It classifies each residue into 1D structural states (&alpha;-helix, &beta;-strand, coil, turn, etc.).
          </p>
          <p>
            This system does <em>not</em> compute 3D atomic coordinates from heavy-atom solvers or predict quaternary multi-chain complexes like AlphaFold 2/3. Scientific users should use these predictions for motif identification, secondary structure propensity profiling, fold recognition, and feature engineering.
          </p>
        </div>
      </section>
    </div>
  );
}
