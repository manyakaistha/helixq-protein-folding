'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Layers,
  Download,
  Sparkles,
  RefreshCw,
  BarChart2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { predictSequence, PredictionResult, ResiduePrediction } from '@/lib/api';
import { EXAMPLE_PROTEINS, ExampleProtein } from '@/lib/constants';
import { StructureViewer } from '@/components/StructureViewer';
import { ProteinStructure3D } from '@/components/ProteinStructure3D';

function ViewerContent() {
  const searchParams = useSearchParams();
  const exampleParam = searchParams?.get('example');

  const [selectedProtein, setSelectedProtein] = useState<ExampleProtein>(() => {
    if (exampleParam) {
      const found = EXAMPLE_PROTEINS.find(
        (p) => p.uniprotId === exampleParam || p.pdbId === exampleParam
      );
      if (found) return found;
    }
    return EXAMPLE_PROTEINS[0];
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [selectedResidue, setSelectedResidue] = useState<ResiduePrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exampleParam) {
      const found = EXAMPLE_PROTEINS.find(
        (p) => p.uniprotId === exampleParam || p.pdbId === exampleParam
      );
      if (found) setSelectedProtein(found);
    }
  }, [exampleParam]);

  const fetchPrediction = async (seq: string, id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictSequence(seq, id, true, false);
      setPrediction(res);
      if (res.residues.length > 0) {
        setSelectedResidue(res.residues[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to compute structure prediction');
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
          <div className="eyebrow mb-1">
            <span className="eyebrow-line" />
            <span>3D SPATIAL &amp; 1D SEQUENCE HARMONY</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[var(--forest)] font-normal tracking-tight">
            Interactive Protein Structure Explorer
          </h1>
          <p className="text-sm text-[var(--ink-muted)] mt-1 max-w-2xl">
            Examine 3D cartoon ribbons, Ramachandran dihedral torsion angles, and synchronized residue-level predictions for validated biological folds.
          </p>
        </div>

        {/* Protein Quick Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="protein-select" className="text-xs font-medium text-[var(--ink-muted)]">
            Reference Fold:
          </label>
          <select
            id="protein-select"
            value={selectedProtein.uniprotId}
            onChange={(e) => {
              const p = EXAMPLE_PROTEINS.find((item) => item.uniprotId === e.target.value);
              if (p) setSelectedProtein(p);
            }}
            className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink)] focus:outline-hidden shadow-xs"
          >
            {EXAMPLE_PROTEINS.map((p) => (
              <option key={p.uniprotId} value={p.uniprotId}>
                {p.name} ({p.pdbId || p.uniprotId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reference Folds Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {EXAMPLE_PROTEINS.map((prot) => {
          const isSelected = prot.uniprotId === selectedProtein.uniprotId;
          return (
            <button
              key={prot.uniprotId}
              onClick={() => setSelectedProtein(prot)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isSelected
                  ? 'border-[var(--forest)] bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] hover:bg-[var(--surface-high)]'
              }`}
            >
              <span>{prot.name}</span>
              <span className="ml-1.5 opacity-70 font-mono text-[10px]">
                {prot.pdbId || prot.uniprotId}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-14 text-center rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-[var(--forest)] animate-spin" />
          <h4 className="font-serif text-base font-semibold text-[var(--ink)]">
            Evaluating Neural Conformations...
          </h4>
          <p className="text-xs text-[var(--ink-muted)]">
            Executing Champion Version 10 forward inference pass
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          Failed to load prediction: {error}
        </div>
      )}

      {/* Output Content */}
      {prediction && !loading && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-lg text-[var(--ink)]">
                  {selectedProtein.name}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[rgba(30,120,94,0.1)] text-[var(--forest)] font-semibold">
                  {selectedProtein.pdbId ? `PDB: ${selectedProtein.pdbId}` : selectedProtein.uniprotId}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  ({selectedProtein.organism}) &middot; {prediction.length} residues
                </span>
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1.5 max-w-3xl leading-relaxed">
                {selectedProtein.description}
              </p>
            </div>

            <Link
              href={`/analysis?seq=${encodeURIComponent(prediction.sequence)}&id=${encodeURIComponent(prediction.id)}&q8=${encodeURIComponent(prediction.q8)}&q3=${encodeURIComponent(prediction.q3)}`}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[var(--forest)] hover:bg-[#1b4b3d] text-[#f5f6ee] text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Full Analytics</span>
            </Link>
          </div>

          {/* 3D Structure Viewer */}
          <ProteinStructure3D
            prediction={prediction}
            selectedResiduePosition={selectedResidue?.position}
            onSelectResidue={setSelectedResidue}
            height={480}
          />

          {/* 1D Residue Alignment Viewer */}
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

export default function ViewerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[var(--ink-muted)]">
          Loading structure explorer...
        </div>
      }
    >
      <ViewerContent />
    </Suspense>
  );
}
