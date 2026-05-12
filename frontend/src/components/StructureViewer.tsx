'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SecondarySchematic } from './SecondarySchematic';
import { Q8_METADATA, Q3_METADATA, AMINO_ACIDS } from '@/lib/constants';
import { ResiduePrediction, PredictionResult } from '@/lib/api';
import { Info, Download, Sparkles, ChevronRight, Eye, Layers } from 'lucide-react';

interface StructureViewerProps {
  prediction: PredictionResult;
  selectedResiduePosition?: number | null;
  onSelectResidue?: (residue: ResiduePrediction) => void;
}

export const StructureViewer: React.FC<StructureViewerProps> = ({
  prediction,
  selectedResiduePosition: externalSelectedPos,
  onSelectResidue
}) => {
  const [internalSelected, setInternalSelected] = useState<ResiduePrediction | null>(
    prediction.residues.length > 0 ? prediction.residues[0] : null
  );
  const [hoveredResidue, setHoveredResidue] = useState<ResiduePrediction | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'wrap' | 'horizontal'>('wrap');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleResidueClick = (res: ResiduePrediction) => {
    setInternalSelected(res);
    if (onSelectResidue) {
      onSelectResidue(res);
    }
  };

  useEffect(() => {
    if (externalSelectedPos) {
      const match = prediction.residues.find((r) => r.position === externalSelectedPos);
      if (match) setInternalSelected(match);
    }
  }, [externalSelectedPos, prediction]);

  useEffect(() => {
    setInternalSelected(prediction.residues[0] || null);
    setHoveredResidue(null);
  }, [prediction]);

  const activeResidue = hoveredResidue || internalSelected;

  // Split residues into display blocks of chunkSize
  const chunks: ResiduePrediction[][] = [];
  for (let i = 0; i < prediction.residues.length; i += chunkSize) {
    chunks.push(prediction.residues.slice(i, i + chunkSize));
  }

  // Export as SVG
  const handleExportSVG = () => {
    const svgElem = document.getElementById('ss-viewer-svg');
    if (!svgElem) return;
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prediction.id}_secondary_structure.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SecondarySchematic prediction={prediction} onSelect={handleResidueClick} />

      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs">
        <div>
          <h3 className="font-serif text-base font-semibold text-[var(--ink)] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--forest)]" />
            <span>Interactive Residue Alignment Track</span>
          </h3>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Protein ID: <span className="font-mono font-medium text-[var(--ink)]">{prediction.id}</span> ({prediction.length} residues)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-[var(--line)] p-0.5 bg-[var(--paper)] text-xs">
            <button
              onClick={() => setViewMode('wrap')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'wrap'
                  ? 'bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              Wrapped Blocks
            </button>
            <button
              onClick={() => setViewMode('horizontal')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'horizontal'
                  ? 'bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              Continuous Track
            </button>
          </div>

          {/* Chunk size selector (for wrapped mode) */}
          {viewMode === 'wrap' && (
            <select
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value))}
              aria-label="Residues per line"
              className="px-2.5 py-1 text-xs rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] font-medium focus:outline-hidden"
            >
              <option value={30}>30 / line</option>
              <option value={50}>50 / line</option>
              <option value={60}>60 / line</option>
              <option value={100}>100 / line</option>
            </select>
          )}

          <button
            onClick={handleExportSVG}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-high)] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[var(--forest)]" />
            <span>Export SVG</span>
          </button>
        </div>
      </div>

      {/* Main Alignment Viewer Track */}
      <div
        ref={containerRef}
        className="p-6 rounded-2xl bg-[var(--surface-high)] border border-[var(--line)] shadow-xs overflow-x-auto"
      >
        {viewMode === 'wrap' ? (
          <div className="space-y-8 font-mono text-sm">
            {chunks.map((chunk, chunkIdx) => {
              const startPos = chunk[0].position;
              const endPos = chunk[chunk.length - 1].position;

              return (
                <div
                  key={chunkIdx}
                  className="border-b border-[var(--line)] pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-muted)] mb-2">
                    <span>Position {startPos}&ndash;{endPos}</span>
                    <span className="text-[11px] text-[var(--ink-faint)]">AA / Q8 / Q3</span>
                  </div>

                  <div className="grid grid-flow-col auto-cols-max gap-1">
                    {chunk.map((res) => {
                      const isSelected = (internalSelected?.position === res.position) || (externalSelectedPos === res.position);
                      const q8Meta = Q8_METADATA[res.q8_state] || Q8_METADATA['C'];
                      const q3Meta = Q3_METADATA[res.q3_state] || Q3_METADATA['C'];

                      return (
                        <div
                          key={res.position}
                          onClick={() => handleResidueClick(res)}
                          onMouseEnter={() => setHoveredResidue(res)}
                          onMouseLeave={() => setHoveredResidue(null)}
                          className={`cursor-pointer flex flex-col items-center select-none transition-all duration-150 p-1 rounded-md ${
                            isSelected
                              ? 'ring-2 ring-[var(--forest)] bg-[var(--paper-deep)] scale-105 z-10'
                              : 'hover:bg-[var(--paper)]'
                          }`}
                        >
                          {/* Position Marker */}
                          <span className="text-[10px] text-[var(--ink-faint)] font-sans h-4">
                            {res.position % 10 === 0 ? res.position : ''}
                          </span>

                          {/* Row 1: Amino Acid */}
                          <span className="w-6 h-6 flex items-center justify-center font-bold text-[var(--ink)]">
                            {res.amino_acid}
                          </span>

                          {/* Row 2: Q8 Prediction Badge */}
                          <span
                            style={{ backgroundColor: q8Meta.color }}
                            className="w-5 h-5 my-0.5 rounded flex items-center justify-center text-[11px] font-bold text-white shadow-xs"
                            title={`Q8: ${res.q8_state} (${q8Meta.name})`}
                          >
                            {res.q8_state}
                          </span>

                          {/* Row 3: Q3 Prediction Badge */}
                          <span
                            style={{ backgroundColor: q3Meta.color }}
                            className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold text-white shadow-xs"
                            title={`Q3: ${res.q3_state} (${q3Meta.name})`}
                          >
                            {res.q3_state}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Continuous horizontal scroll track */
          <div className="min-w-max py-4 font-mono text-sm">
            <div className="grid grid-flow-col auto-cols-max gap-1">
              {prediction.residues.map((res) => {
                const isSelected = (internalSelected?.position === res.position) || (externalSelectedPos === res.position);
                const q8Meta = Q8_METADATA[res.q8_state] || Q8_METADATA['C'];
                const q3Meta = Q3_METADATA[res.q3_state] || Q3_METADATA['C'];

                return (
                  <div
                    key={res.position}
                    onClick={() => handleResidueClick(res)}
                    onMouseEnter={() => setHoveredResidue(res)}
                    onMouseLeave={() => setHoveredResidue(null)}
                    className={`cursor-pointer flex flex-col items-center select-none transition-all duration-150 p-1 rounded-md ${
                      isSelected
                        ? 'ring-2 ring-[var(--forest)] bg-[var(--paper-deep)] scale-105 z-10'
                        : 'hover:bg-[var(--paper)]'
                    }`}
                  >
                    <span className="text-[10px] text-[var(--ink-faint)] font-sans h-4">
                      {res.position % 10 === 0 ? res.position : ''}
                    </span>
                    <span className="w-6 h-6 flex items-center justify-center font-bold text-[var(--ink)]">
                      {res.amino_acid}
                    </span>
                    <span
                      style={{ backgroundColor: q8Meta.color }}
                      className="w-5 h-5 my-0.5 rounded flex items-center justify-center text-[11px] font-bold text-white shadow-xs"
                      title={`Q8: ${res.q8_state} (${q8Meta.name})`}
                    >
                      {res.q8_state}
                    </span>
                    <span
                      style={{ backgroundColor: q3Meta.color }}
                      className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold text-white shadow-xs"
                      title={`Q3: ${res.q3_state} (${q3Meta.name})`}
                    >
                      {res.q3_state}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Per-Residue Inspector Detail Panel */}
      {activeResidue && (
        <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <span className="w-10 h-10 rounded-xl bg-[var(--forest)] text-[var(--lime)] font-mono font-bold text-lg flex items-center justify-center">
                {activeResidue.amino_acid}
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-serif font-bold text-base text-[var(--ink)]">
                    {AMINO_ACIDS[activeResidue.amino_acid]?.name || 'Amino Acid'}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-[var(--paper-deep)] text-[var(--ink-soft)]">
                    Position {activeResidue.position} of {prediction.length}
                  </span>
                </div>
                <p className="text-xs text-[var(--ink-muted)]">
                  Class: {AMINO_ACIDS[activeResidue.amino_acid]?.category || 'Standard'} &middot; Entropy H = {activeResidue.entropy.toFixed(3)} bits
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-bold block">
                  Q8 Prediction
                </span>
                <span
                  style={{ color: Q8_METADATA[activeResidue.q8_state]?.color }}
                  className="font-mono font-bold text-sm"
                >
                  {activeResidue.q8_state} &middot; {Q8_METADATA[activeResidue.q8_state]?.name}
                </span>
              </div>
              <div className="text-right pl-3 border-l border-[var(--line)]">
                <span className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-bold block">
                  Q3 Reduction
                </span>
                <span
                  style={{ color: Q3_METADATA[activeResidue.q3_state]?.color }}
                  className="font-mono font-bold text-sm"
                >
                  {activeResidue.q3_state} &middot; {Q3_METADATA[activeResidue.q3_state]?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Probabilities Breakdown */}
          {activeResidue.q8_probabilities && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[var(--ink)] block">
                Model Softmax Probabilities Across All 8 DSSP Classes:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {Object.entries(activeResidue.q8_probabilities).map(([st, prob]) => {
                  const meta = Q8_METADATA[st] || Q8_METADATA['C'];
                  const isTop = st === activeResidue.q8_state;
                  return (
                    <div
                      key={st}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isTop
                          ? 'border-[var(--forest)] bg-[var(--paper-deep)] shadow-xs'
                          : 'border-[var(--line)] bg-[var(--surface-high)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold font-mono" style={{ color: meta.color }}>
                          {st}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                          {(prob * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${prob * 100}%`,
                            backgroundColor: meta.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden SVG for vector download */}
      <svg
        id="ss-viewer-svg"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden"
        width={prediction.residues.length * 28 + 40}
        height="120"
      >
        <rect width="100%" height="100%" fill="#fbfaf5" />
        {prediction.residues.map((res, idx) => {
          const x = 20 + idx * 28;
          const q8Meta = Q8_METADATA[res.q8_state] || Q8_METADATA['C'];
          return (
            <g key={idx} transform={`translate(${x}, 10)`}>
              <text x="12" y="14" textAnchor="middle" fontSize="10" fill="#647d72" fontFamily="monospace">
                {res.position % 10 === 0 ? res.position : ''}
              </text>
              <text x="12" y="36" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#183d32" fontFamily="monospace">
                {res.amino_acid}
              </text>
              <rect x="2" y="44" width="20" height="20" rx="3" fill={q8Meta.color} />
              <text x="12" y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ffffff" fontFamily="monospace">
                {res.q8_state}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
