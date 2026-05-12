'use client';

import React from 'react';
import { PredictionResult, ResiduePrediction } from '@/lib/api';

const colors: Record<string, string> = {
  H: '#1e785e', // Emerald
  E: '#d97706', // Amber
  C: '#64748b'  // Slate
};

export function SecondarySchematic({
  prediction,
  onSelect
}: {
  prediction: PredictionResult;
  onSelect: (residue: ResiduePrediction) => void;
}) {
  const segments: { state: string; start: number; end: number }[] = [];
  prediction.q3.split('').forEach((state, i) => {
    const previous = segments[segments.length - 1];
    if (previous?.state === state) previous.end = i;
    else segments.push({ state, start: i, end: i });
  });

  const width = 900;
  const pad = 24;
  const scale = (width - pad * 2) / prediction.length;

  return (
    <section
      className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--line)] shadow-xs"
      aria-label="Predicted secondary structure schematic"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <h3 className="font-serif font-semibold text-base text-[var(--ink)]">
            Continuous Structural Topology Track
          </h3>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Secondary structure elements mapped along the sequence &middot; Click any segment to inspect
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-[var(--ink-soft)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1e785e]" /> &alpha;-Helix (H)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" /> &beta;-Strand (E)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]" /> Coil (C)
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} 125`}
          className="w-full h-auto min-w-[600px]"
          role="img"
          aria-label={`${prediction.length} residues in ${segments.length} predicted secondary structure segments`}
        >
          {/* Baseline Backbone */}
          <line x1={pad} x2={width - pad} y1="62" y2="62" stroke="#d5dcce" strokeWidth="2" strokeDasharray="3 3" />

          {segments.map(({ state, start, end }) => {
            const x = pad + start * scale;
            const w = Math.max(3, (end - start + 1) * scale);
            let d = '';

            if (state === 'H') {
              const loops = Math.max(4, Math.round(w / 8));
              for (let j = 0; j <= loops; j++) {
                const xx = (j / loops) * w;
                d += `${j ? 'L' : 'M'}${x + xx},${62 + Math.sin(j * 1.5) * 11} `;
              }
            } else if (state === 'C') {
              d = `M${x},62 Q${x + w * 0.25},53 ${x + w * 0.5},62 T${x + w},62`;
            }

            return (
              <g
                key={start}
                role="button"
                tabIndex={0}
                className="cursor-pointer transition-opacity hover:opacity-80"
                aria-label={`${state === 'H' ? 'Helix' : state === 'E' ? 'Strand' : 'Coil'}, residues ${start + 1} to ${end + 1}`}
                onClick={() => onSelect(prediction.residues[start])}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(prediction.residues[start]);
                  }
                }}
              >
                <rect x={x} y="30" width={w} height="64" fill="transparent" />
                {state === 'E' ? (
                  // Beta-strand arrow
                  <path
                    d={`M${x},55 H${x + Math.max(2, w - 8)} V50 L${x + w},62 L${x + Math.max(2, w - 8)},74 V69 H${x} Z`}
                    fill={colors.E}
                  />
                ) : (
                  <path
                    d={d}
                    fill="none"
                    stroke={colors[state] || colors.C}
                    strokeWidth={state === 'H' ? 4.5 : 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </g>
            );
          })}

          {/* Start and End Coordinates */}
          <text x={pad} y="112" fill="#78877c" fontSize="11" fontFamily="monospace">
            Residue 1
          </text>
          <text x={width - pad} y="112" textAnchor="end" fill="#78877c" fontSize="11" fontFamily="monospace">
            Residue {prediction.length}
          </text>
        </svg>
      </div>
    </section>
  );
}
