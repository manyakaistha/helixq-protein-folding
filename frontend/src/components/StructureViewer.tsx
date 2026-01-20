'use client';

import React, { useState, useRef } from 'react';
import { Q8_METADATA, Q3_METADATA, AMINO_ACIDS } from '@/lib/constants';
import { ResiduePrediction, PredictionResult } from '@/lib/api';
import { Info, Download, Sparkles, ChevronRight, Eye, Layers } from 'lucide-react';

interface StructureViewerProps {
  prediction: PredictionResult;
  onSelectResidue?: (residue: ResiduePrediction) => void;
}

export const StructureViewer: React.FC<StructureViewerProps> = ({
  prediction,
  onSelectResidue
}) => {
  const [selectedResidue, setSelectedResidue] = useState<ResiduePrediction | null>(
    prediction.residues.length > 0 ? prediction.residues[0] : null
  );
  const [hoveredResidue, setHoveredResidue] = useState<ResiduePrediction | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(50); // display residues in chunks of 50
  const [viewMode, setViewMode] = useState<'wrap' | 'horizontal'>('wrap');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleResidueClick = (res: ResiduePrediction) => {
    setSelectedResidue(res);
    if (onSelectResidue) {
      onSelectResidue(res);
    }
  };

  const activeResidue = hoveredResidue || selectedResidue;

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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <span>Interactive Secondary Structure Alignment</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Protein: <span className="font-medium text-slate-700 dark:text-slate-200">{prediction.id}</span> ({prediction.length} residues)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800 text-xs">
            <button
              onClick={() => setViewMode('wrap')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'wrap' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Wrapped Blocks
            </button>
            <button
              onClick={() => setViewMode('horizontal')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'horizontal' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
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
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <option value={30}>30 / line</option>
              <option value={50}>50 / line</option>
              <option value={60}>60 / line</option>
              <option value={100}>100 / line</option>
            </select>
          )}

          <button
            onClick={handleExportSVG}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Export SVG</span>
          </button>
        </div>
      </div>

      {/* Main Alignment Viewer */}
      <div
        ref={containerRef}
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto"
      >
        {viewMode === 'wrap' ? (
          <div className="space-y-8 font-mono text-sm">
            {chunks.map((chunk, chunkIdx) => {
              const startPos = chunk[0].position;
              const endPos = chunk[chunk.length - 1].position;

              return (
                <div key={chunkIdx} className="border-b border-slate-100 dark:border-slate-800/60 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                    <span>Position {startPos}–{endPos}</span>
                    <span className="text-[11px] text-slate-400">AA / Q8 / Q3</span>
                  </div>

                  <div className="grid grid-flow-col auto-cols-max gap-1">
                    {chunk.map((res) => {
                      const isSelected = selectedResidue?.position === res.position;
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
                              ? 'ring-2 ring-purple-600 bg-purple-50 dark:bg-purple-950/50 scale-105 z-10'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          {/* Position Marker */}
                          <span className="text-[10px] text-slate-400 font-sans h-4">
                            {res.position % 10 === 0 ? res.position : ''}
                          </span>

                          {/* Row 1: Amino Acid */}
                          <span className="w-6 h-6 flex items-center justify-center font-bold text-slate-800 dark:text-slate-100">
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
                const isSelected = selectedResidue?.position === res.position;
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
                        ? 'ring-2 ring-purple-600 bg-purple-50 dark:bg-purple-950/50 scale-105 z-10'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-sans h-4">
                      {res.position % 10 === 0 ? res.position : ''}
                    </span>
                    <span className="w-6 h-6 flex items-center justify-center font-bold text-slate-800 dark:text-slate-100">
                      {res.amino_acid}
                    </span>
                    <span
                      style={{ backgroundColor: q8Meta.color }}
                      className="w-5 h-5 my-0.5 rounded flex items-center justify-center text-[11px] font-bold text-white shadow-xs"
                    >
                      {res.q8_state}
                    </span>
                    <span
                      style={{ backgroundColor: q3Meta.color }}
                      className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold text-white shadow-xs"
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

      {/* Hidden SVG for vector download */}
      <svg
        id="ss-viewer-svg"
        xmlns="http://www.w3.org/2000/svg"
        className="hidden"
        width={prediction.residues.length * 24 + 100}
        height="140"
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        <text x="20" y="25" fontFamily="monospace" fontSize="14" fontWeight="bold" fill="#1e293b">
          ProteinFold AI - {prediction.id} (Length: {prediction.length})
        </text>
        <text x="20" y="55" fontFamily="monospace" fontSize="11" fill="#64748b">AA</text>
        <text x="20" y="80" fontFamily="monospace" fontSize="11" fill="#64748b">Q8</text>
        <text x="20" y="105" fontFamily="monospace" fontSize="11" fill="#64748b">Q3</text>
        {prediction.residues.map((res, i) => {
          const x = 50 + i * 22;
          const q8Color = Q8_METADATA[res.q8_state]?.color || '#64748b';
          const q3Color = Q3_METADATA[res.q3_state]?.color || '#64748b';
          return (
            <g key={i}>
              <text x={x + 6} y="55" fontFamily="monospace" fontSize="12" fontWeight="bold" fill="#0f172a">
                {res.amino_acid}
              </text>
              <rect x={x} y="68" width="18" height="18" rx="3" fill={q8Color} />
              <text x={x + 5} y="82" fontFamily="monospace" fontSize="11" fontWeight="bold" fill="#ffffff">
                {res.q8_state}
              </text>
              <rect x={x} y="93" width="18" height="18" rx="3" fill={q3Color} />
              <text x={x + 5} y="107" fontFamily="monospace" fontSize="11" fontWeight="bold" fill="#ffffff">
                {res.q3_state}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Selected Residue Detailed Inspection Card */}
      {activeResidue && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-xl">
                {activeResidue.amino_acid}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Residue {activeResidue.position}: {AMINO_ACIDS[activeResidue.amino_acid] || activeResidue.amino_acid}</span>
                  {hoveredResidue && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                      Hovering
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Predicted Q8: <strong className="text-purple-600">{activeResidue.q8_state}</strong> ({Q8_METADATA[activeResidue.q8_state]?.name}) • Predicted Q3: <strong className="text-sky-600">{activeResidue.q3_state}</strong> ({Q3_METADATA[activeResidue.q3_state]?.name})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Q8 Model Probability</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">
                  {(activeResidue.q8_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Q3 Model Probability</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">
                  {(activeResidue.q3_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Predictive Entropy (H)</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">
                  {activeResidue.entropy.toFixed(3)} nats
                </span>
              </div>
            </div>
          </div>

          {/* Biological State Probabilities Breakdown */}
          {activeResidue.q8_probabilities && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Q8 State Probabilities
                </h5>
                <div className="space-y-2">
                  {Object.entries(activeResidue.q8_probabilities).map(([state, prob]) => {
                    const meta = Q8_METADATA[state] || Q8_METADATA['C'];
                    const isPredicted = state === activeResidue.q8_state;
                    const pct = (prob * 100).toFixed(1);

                    return (
                      <div key={state} className="flex items-center text-xs">
                        <span
                          style={{ backgroundColor: meta.color }}
                          className="w-5 h-5 rounded flex items-center justify-center font-bold text-white text-[10px] mr-2 flex-shrink-0"
                        >
                          {state}
                        </span>
                        <span className={`w-28 truncate ${isPredicted ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {meta.name}
                        </span>
                        <div className="flex-1 mx-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: meta.color
                            }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Q3 State Probabilities
                </h5>
                <div className="space-y-3">
                  {activeResidue.q3_probabilities && Object.entries(activeResidue.q3_probabilities).map(([state, prob]) => {
                    const meta = Q3_METADATA[state] || Q3_METADATA['C'];
                    const isPredicted = state === activeResidue.q3_state;
                    const pct = (prob * 100).toFixed(1);

                    return (
                      <div key={state} className="flex items-center text-xs">
                        <span
                          style={{ backgroundColor: meta.color }}
                          className="w-5 h-5 rounded flex items-center justify-center font-bold text-white text-[10px] mr-2 flex-shrink-0"
                        >
                          {state}
                        </span>
                        <span className={`w-24 truncate ${isPredicted ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                          {meta.name}
                        </span>
                        <div className="flex-1 mx-3 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: meta.color
                            }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-300">
                  <div className="font-semibold mb-1 flex items-center space-x-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-600" />
                    <span>Biological Description:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {Q8_METADATA[activeResidue.q8_state]?.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs">
        <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Secondary Structure Color Palette:</h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {Object.entries(Q8_METADATA).map(([code, meta]) => (
            <div key={code} className="flex items-center space-x-2">
              <span
                style={{ backgroundColor: meta.color }}
                className="w-4 h-4 rounded text-white flex items-center justify-center font-bold text-[10px]"
              >
                {code}
              </span>
              <span className="text-slate-600 dark:text-slate-400 truncate">{meta.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
