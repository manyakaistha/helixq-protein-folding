'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Pause, Play, Sparkles, RefreshCw } from 'lucide-react';

// Mulberry32 deterministic 32-bit PRNG for seedable organic generation
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PeptideNode {
  index: number;
  phase: number;
  radius: number;
  color: string;
  type: 'helix' | 'strand' | 'coil';
}

interface SolventOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

// Hermite smoothstep for smooth cursor attraction
function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function MolecularField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paused, setPaused] = useState<boolean>(false);
  const pausedRef = useRef<boolean>(false);
  pausedRef.current = paused;

  const [interactionSeed, setInteractionSeed] = useState<number>(1042);

  const togglePause = () => {
    setPaused((prev) => {
      const next = !prev;
      pausedRef.current = next;
      return next;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prng = mulberry32(interactionSeed);

    // Pre-computed peptide nodes along an alpha-helical strand
    const nodeCount = 58;
    const nodes = Array.from({ length: nodeCount }, (_, i) => {
      // Secondary structure assignment for visual variety
      const isHelix = i >= 12 && i <= 38;
      const isStrand = (i >= 5 && i <= 9) || (i >= 42 && i <= 48);
      const type: 'helix' | 'strand' | 'coil' = isHelix
        ? 'helix'
        : isStrand
        ? 'strand'
        : 'coil';

      const color =
        type === 'helix'
          ? '#1e785e' // Touchline emerald
          : type === 'strand'
          ? '#d97706' // Touchline amber
          : '#64748b'; // Touchline slate

      return {
        index: i,
        phase: (i / nodeCount) * Math.PI * 4.5,
        radius: isHelix ? 4.2 : isStrand ? 4.8 : 3.0,
        color,
        type
      };
    });

    // Wandering kinetic solvent molecules
    const orbCount = 14;
    const orbs: SolventOrb[] = Array.from({ length: orbCount }, () => ({
      x: prng() * 600,
      y: prng() * 320,
      vx: (prng() - 0.5) * 0.35,
      vy: (prng() - 0.5) * 0.35,
      size: 1.2 + prng() * 2.2,
      alpha: 0.15 + prng() * 0.25
    }));

    let animId = 0;
    let time = 0;
    let lastTime = performance.now();
    let width = 1;
    let height = 1;
    let isVisible = true;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;

    // Pointer dynamics with damped spring follow
    let pointer = { x: 0, y: 0 };
    let smooth = { x: 0, y: 0 };
    let pointerDist = 0;

    const render = (now: number) => {
      // Clamped delta-time to prevent physics explosion
      const dt = Math.min(64, Math.max(0, now - lastTime));
      lastTime = now;

      if (!pausedRef.current && !reducedMotion) {
        time += dt / 1000;
      }

      // Damped harmonic easing for pointer magnetic pull
      const springK = 1 - Math.exp(-dt / 140);
      smooth.x += (pointer.x - smooth.x) * springK;
      smooth.y += (pointer.y - smooth.y) * springK;
      pointerDist = Math.hypot(smooth.x, smooth.y);

      ctx.clearRect(0, 0, width, height);

      // Compute dynamic node coordinates in 3D-projected space
      const points = nodes.map((node, i) => {
        const angle = node.phase + time * 0.25;
        const z = Math.cos(angle);
        const yFrac = i / (nodeCount - 1);

        // Alpha-helical coil width with smoothstep pointer attraction
        const attract = smoothstep(0.7, 0, Math.abs(yFrac - 0.5));
        const waveX = Math.sin(angle) * (width * 0.18 + attract * 12);
        const waveY = (yFrac - 0.5) * (height * 0.76);

        const px = width * 0.5 + waveX + smooth.x * 22;
        const py = height * 0.5 + waveY + smooth.y * 14;

        return {
          ...node,
          x: px,
          y: py,
          z,
          scale: 0.8 + (z + 1) * 0.2
        };
      });

      // PASS 1: Ambient Shadow & Hydrogen Bond Lattice
      ctx.save();
      ctx.strokeStyle = 'rgba(23, 62, 50, 0.08)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x + 4, points[i].y + 6);
        else ctx.lineTo(points[i].x + 4, points[i].y + 6);
      }
      ctx.stroke();

      // Hydrogen bonds (i -> i+4 in helices)
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(30, 120, 94, 0.16)';
      for (let i = 0; i < points.length - 4; i++) {
        if (points[i].type === 'helix' && points[i + 4].type === 'helix') {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[i + 4].x, points[i + 4].y);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      ctx.restore();

      // PASS 2: Continuous Polypeptide Backbone Ribbon
      ctx.save();
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const avgZ = (a.z + b.z) * 0.5;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        // Color coding along the secondary structure with z-depth fog
        if (b.type === 'helix') {
          ctx.strokeStyle = avgZ > 0 ? '#1e785e' : '#3d826f';
          ctx.lineWidth = 3.5;
        } else if (b.type === 'strand') {
          ctx.strokeStyle = avgZ > 0 ? '#d97706' : '#b45309';
          ctx.lineWidth = 4.2;
        } else {
          ctx.strokeStyle = avgZ > 0 ? '#64748b' : '#94a3b8';
          ctx.lineWidth = 2.0;
        }
        ctx.stroke();
      }
      ctx.restore();

      // PASS 3: Residue Atoms with Radial Lighting & Depth Sorting
      const sortedPoints = [...points].sort((a, b) => a.z - b.z);
      for (const p of sortedPoints) {
        ctx.save();
        const r = p.radius * p.scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);

        const grad = ctx.createRadialGradient(
          p.x - r * 0.35,
          p.y - r * 0.35,
          r * 0.1,
          p.x,
          p.y,
          r
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, p.z > 0 ? p.color : '#8fa496');
        grad.addColorStop(1, '#0e2720');

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      }

      // PASS 4: Wandering Kinetic Solvent Orbs
      ctx.save();
      for (const orb of orbs) {
        if (!pausedRef.current && !reducedMotion) {
          orb.x += orb.vx;
          orb.y += orb.vy;
          if (orb.x < 0) orb.x = width;
          if (orb.x > width) orb.x = 0;
          if (orb.y < 0) orb.y = height;
          if (orb.y > height) orb.y = 0;
        }

        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 230, 77, ${orb.alpha})`;
        ctx.fill();
      }
      ctx.restore();

      if (isVisible && !document.hidden) {
        animId = requestAnimationFrame(render);
      }
    };

    const restart = () => {
      cancelAnimationFrame(animId);
      lastTime = performance.now();
      render(lastTime);
    };

    // Substrate: Retina DPR Setup
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      restart();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting || false;
      if (isVisible) restart();
    });
    intersectionObserver.observe(canvas);

    // Pointer Micro-Interactions
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = {
        x: (e.clientX - rect.left) / width - 0.5,
        y: (e.clientY - rect.top) / height - 0.5
      };
    };

    const onPointerLeave = () => {
      pointer = { x: 0, y: 0 };
    };

    const onVisibilityChange = () => {
      if (!document.hidden && isVisible) restart();
    };

    const onMotionChange = () => {
      reducedMotion = motionQuery.matches;
      restart();
    };

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    motionQuery.addEventListener('change', onMotionChange);

    resize();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, [interactionSeed]);

  return (
    <div className="relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--line)] bg-[var(--surface-high)]/80 text-[10px] text-[var(--ink-muted)]">
        <span className="font-mono font-medium tracking-wider flex items-center gap-1.5 text-[var(--forest)]">
          <Sparkles size={12} className="text-[var(--lime)]" />
          KINETIC POLYPEPTIDE FIELD
        </span>
        <div className="flex items-center gap-2">
          <span>Move cursor to attract chain</span>
          <button
            type="button"
            onClick={togglePause}
            aria-label={paused ? 'Resume animation' : 'Pause animation'}
            className={`p-1 rounded-md border transition-colors ${
              paused
                ? 'bg-[var(--paper-deep)] border-[var(--line-strong)] text-[var(--forest)] font-semibold'
                : 'hover:bg-[var(--paper)] border-[var(--line)] text-[var(--ink-soft)]'
            }`}
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button
            type="button"
            onClick={() => setInteractionSeed((s) => s + 1)}
            title="Regenerate field"
            className="p-1 rounded-md hover:bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-soft)] transition-colors"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      <div className="relative w-full h-[320px] bg-[var(--paper-deep)]">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

        {/* Floating captions inspired by Touchline */}
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-[9px] font-mono text-[var(--ink-muted)] pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[var(--forest)] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#1e785e]" /> &alpha;-Helix (i &rarr; i+4)
            </span>
            <span className="flex items-center gap-1 text-[#b45309] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#d97706] subterranean-dot" /> &beta;-Strand Sheet
            </span>
          </div>
          <span>Seeded Mulberry32 &middot; 60 FPS Retina</span>
        </div>
      </div>
    </div>
  );
}
