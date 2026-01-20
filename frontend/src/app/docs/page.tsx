'use client';

import React from 'react';
import { FileText, AlertCircle, BookOpen, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Q8_METADATA } from '@/lib/constants';

export default function DocsPage() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Scientific & Engineering Documentation</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Theoretical Principles & Architecture Manual
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Biological DSSP taxonomy, mathematical formulations, engineering forensics, and operational boundaries.
        </p>
      </div>

      {/* Section 1: DSSP Secondary Structure Taxonomy */}
      <section className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <span>1. DSSP 8-State Classification & Q3 Reduction</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Standard secondary structure assignments defined by Kabsch and Sander (1983) based on electrostatic hydrogen-bonding patterns.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-2.5 px-3">Q8 Code</th>
                <th className="py-2.5 px-3">Biological State</th>
                <th className="py-2.5 px-3">Q3 Group</th>
                <th className="py-2.5 px-3">Physical & Chemical Characteristic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Object.entries(Q8_METADATA).map(([code, meta]) => {
                const q3Group = ['H', 'G', 'I'].includes(code)
                  ? 'H (Helix)'
                  : ['E', 'B'].includes(code)
                  ? 'E (Strand)'
                  : 'C (Coil)';
                return (
                  <tr key={code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono">
                      <span
                        style={{ backgroundColor: meta.color }}
                        className="w-5 h-5 rounded text-white font-bold flex items-center justify-center text-[10px]"
                      >
                        {code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{meta.name}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-purple-600 dark:text-purple-400">{q3Group}</td>
                    <td className="py-2.5 px-3 text-slate-500 leading-relaxed">{meta.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Mathematical Formulations */}
      <section className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            2. Mathematical Formulations & Objective Functions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Exact mathematical formulations implemented in the ProteinFold AI platform.
          </p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">Harmonic Mean Evaluation Metric</h4>
            <p>
              The primary competition evaluation score is the harmonic mean of the macro-averaged F1 scores across the 8 biological Q8 states and 3 Q3 states (ignoring the padding index):
            </p>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 font-mono text-center text-sm font-semibold text-purple-600">
              Score = 2 · (F1_Q8 · F1_Q3) / (F1_Q8 + F1_Q3)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">Predictive Entropy of Residue Classification</h4>
            <p>
              Positional uncertainty is quantified via the Shannon entropy of the model's normalized biological softmax probability distribution:
            </p>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 font-mono text-center text-sm font-semibold text-purple-600">
              H(pos) = - Σ [ p_k · ln(p_k + 1e-12) ]
            </div>
            <p className="text-[11px] text-slate-500">
              Residues with high entropy typically correspond to flexible loops, structural transition boundaries, or intrinsically disordered regions.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Engineering Forensics & Recurrent Dynamics */}
      <section className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            3. Recurrent Layer Dynamics & Forensic Findings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Key insights discovered during forensic reverse-engineering of the competition codebase.
          </p>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Our code audit uncovered that the competition training script in Version 10 did not apply PyTorch's <code className="font-mono text-purple-600">pack_padded_sequence</code> to the bidirectional GRU. Consequently:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-500">
            <li>
              <strong>Forward GRU:</strong> Processes tokens from left to right normally starting from residue 1.
            </li>
            <li>
              <strong>Reverse GRU:</strong> During fixed-batch padding up to maximum sequence length (e.g. 305), the reverse GRU travels across trailing zero padding tokens before encountering valid biological residues.
            </li>
            <li>
              <strong>Production Inference Fix:</strong> In our production inference engine, single-sequence prediction operates at exact sequence length <code className="font-mono text-purple-600">L</code> ($B=1$). This eliminates all reverse padding noise while preserving authentic forward pass dynamics.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 4: Biological Limitations & AlphaFold Distinction */}
      <section className="p-8 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold text-base">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span>4. Biological Scope & Grounded Disclosures</span>
        </div>

        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-3 leading-relaxed">
          <p>
            <strong>Secondary Structure vs Tertiary Conformation:</strong> Protein secondary structure refers to local, regular geometric arrangements of the polypeptide backbone stabilized by hydrogen bonds between amino and carboxyl groups. It classifies each residue into 1D structural states ($\alpha$-helix, $\beta$-strand, coil, turn, etc.).
          </p>
          <p>
            This system does <em>not</em> compute 3D atomic coordinates (e.g., PDB Cartesian coordinates $x, y, z$) or predict quaternary multi-chain complexes like AlphaFold 2/3. Scientific users should use these predictions for motif identification, secondary structure propensity profiling, fold recognition, and feature engineering.
          </p>
        </div>
      </section>
    </div>
  );
}
