'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Box,
  RotateCcw,
  Download,
  Info,
  Layers,
  Sparkles,
  Maximize2,
  Compass,
  Pause,
  Play
} from 'lucide-react';
import { PredictionResult, ResiduePrediction } from '@/lib/api';
import { Q8_METADATA, Q3_METADATA, AMINO_ACIDS } from '@/lib/constants';

// Vector 3D math helpers
interface Point3D {
  x: number;
  y: number;
  z: number;
}

function vAdd(a: Point3D, b: Point3D): Point3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vSub(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vScale(v: Point3D, s: number): Point3D {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vDot(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function vCross(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function vLen(v: Point3D): number {
  return Math.hypot(v.x, v.y, v.z) || 1e-6;
}

function vNorm(v: Point3D): Point3D {
  const l = vLen(v);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

interface Residue3DNode {
  index: number;
  position: number;
  aa: string;
  q8: string;
  q3: string;
  prob: number;
  entropy: number;
  pos3D: Point3D;
  tangent: Point3D;
  normal: Point3D;
  binormal: Point3D;
}

interface ProteinStructure3DProps {
  prediction: PredictionResult;
  selectedResiduePosition?: number;
  onSelectResidue?: (residue: ResiduePrediction) => void;
  className?: string;
  height?: number;
}

// Procedural Ramachandran Backbone Kinematics
// Generates realistic 3D coordinates based on secondary structure conformations
function generateBackboneCoordinates(
  sequence: string,
  q8: string,
  seqId: string
): Point3D[] {
  const L = sequence.length;
  const coords: Point3D[] = [];

  let currentPos: Point3D = { x: 0, y: 0, z: 0 };
  let dir: Point3D = { x: 1, y: 0, z: 0 };
  let up: Point3D = { x: 0, y: 1, z: 0 };

  coords.push({ ...currentPos });

  for (let i = 1; i < L; i++) {
    const state = q8[i - 1] || 'C';
    let step: Point3D;

    if (state === 'H' || state === 'G' || state === 'I') {
      // Alpha-helix: 3.6 residues per turn, pitch ~5.4 Å (rise ~1.5 Å per residue, radius ~2.3 Å)
      const turnAngle = (2 * Math.PI) / (state === 'G' ? 3.0 : state === 'I' ? 4.4 : 3.6);
      const axis = dir;
      // Rotate up around axis by turnAngle
      const cosA = Math.cos(turnAngle);
      const sinA = Math.sin(turnAngle);
      const newUp = vNorm(
        vAdd(
          vAdd(vScale(up, cosA), vScale(vCross(axis, up), sinA)),
          vScale(axis, vDot(axis, up) * (1 - cosA))
        )
      );
      up = newUp;

      // Forward step along helix axis + radial offset
      const rise = state === 'G' ? 2.0 : state === 'I' ? 1.1 : 1.5;
      const radius = state === 'G' ? 1.9 : state === 'I' ? 2.8 : 2.3;
      step = vAdd(vScale(dir, rise), vScale(up, radius * 0.7));
    } else if (state === 'E' || state === 'B') {
      // Beta-strand: extended pleated conformation (~3.4 Å rise per residue) with alternating pleat
      const pleatSign = i % 2 === 0 ? 1 : -1;
      const pleat = vScale(up, pleatSign * 0.7);
      step = vAdd(vScale(dir, 3.4), pleat);
    } else if (state === 'T' || state === 'S') {
      // Turn or Bend: abrupt direction change
      const bendAngle = state === 'T' ? 0.95 : 0.65;
      const rotAxis = vNorm(vAdd(up, { x: 0.2, y: 0.1, z: 0.3 }));
      const newDir = vNorm(
        vAdd(
          vScale(dir, Math.cos(bendAngle)),
          vScale(vCross(rotAxis, dir), Math.sin(bendAngle))
        )
      );
      dir = newDir;
      up = vNorm(vCross(vCross(dir, up), dir));
      step = vScale(dir, 3.2);
    } else {
      // Random coil / Loop: gentle pseudo-Brownian wandering with global centering pull
      const hash1 = Math.sin(i * 12.9898 + (seqId.charCodeAt(0) || 42)) * 43758.5453;
      const hash2 = Math.cos(i * 78.233 + (seqId.charCodeAt(1) || 17)) * 23421.631;
      const r1 = hash1 - Math.floor(hash1);
      const r2 = hash2 - Math.floor(hash2);

      const rotAxis = vNorm({
        x: (r1 - 0.5) * 2,
        y: (r2 - 0.5) * 2,
        z: Math.sin(r1 * 10)
      });
      const bendAngle = (r1 - 0.4) * 0.65;

      // Soft centering pull to keep polymer globular
      const distFromOrigin = vLen(currentPos);
      let centeringPull: Point3D = { x: 0, y: 0, z: 0 };
      if (distFromOrigin > 35) {
        centeringPull = vScale(vNorm(vScale(currentPos, -1)), 0.3);
      }

      const deflected = vNorm(
        vAdd(
          vAdd(dir, vScale(vCross(rotAxis, dir), Math.sin(bendAngle))),
          centeringPull
        )
      );
      dir = deflected;
      up = vNorm(vCross(vCross(dir, up), dir));

      step = vScale(dir, 3.6);
    }

    currentPos = vAdd(currentPos, step);
    coords.push({ ...currentPos });
  }

  // Center coordinates at origin
  let cx = 0, cy = 0, cz = 0;
  for (const c of coords) {
    cx += c.x;
    cy += c.y;
    cz += c.z;
  }
  cx /= L;
  cy /= L;
  cz /= L;

  return coords.map((c) => ({
    x: c.x - cx,
    y: c.y - cy,
    z: c.z - cz
  }));
}

export const ProteinStructure3D: React.FC<ProteinStructure3DProps> = ({
  prediction,
  selectedResiduePosition,
  onSelectResidue,
  className = '',
  height = 420
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // View state
  const [styleMode, setStyleMode] = useState<'ribbon' | 'backbone' | 'spheres'>('ribbon');
  const [colorMode, setColorMode] = useState<'secondary' | 'rainbow' | 'hydrophobic'>('secondary');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Refs for animation & stable event access
  const autoRotateRef = useRef<boolean>(true);
  autoRotateRef.current = autoRotate;

  const hoveredIndexRef = useRef<number | null>(null);
  const selectedResidueRef = useRef<number | undefined>(selectedResiduePosition);
  selectedResidueRef.current = selectedResiduePosition;

  // Rotation Euler angles and zoom
  const rotRef = useRef<{ x: number; y: number; z: number }>({ x: 0.35, y: -0.65, z: 0 });
  const zoomRef = useRef<number>(1.0);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isDraggingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate 3D nodes with Frenet-Serret frames
  const nodes3D: Residue3DNode[] = useMemo(() => {
    const rawCoords = generateBackboneCoordinates(
      prediction.sequence,
      prediction.q8,
      prediction.id
    );

    const L = rawCoords.length;
    return rawCoords.map((pos, i) => {
      const prev = rawCoords[Math.max(0, i - 1)];
      const next = rawCoords[Math.min(L - 1, i + 1)];
      const tangent = vNorm(vSub(next, prev));

      // Compute normal and binormal
      let upCandidate: Point3D = { x: 0, y: 1, z: 0 };
      if (Math.abs(vDot(tangent, upCandidate)) > 0.9) {
        upCandidate = { x: 1, y: 0, z: 0 };
      }
      const binormal = vNorm(vCross(tangent, upCandidate));
      const normal = vNorm(vCross(binormal, tangent));

      const resData = prediction.residues[i];

      return {
        index: i,
        position: i + 1,
        aa: prediction.sequence[i] || 'A',
        q8: prediction.q8[i] || 'C',
        q3: prediction.q3[i] || 'C',
        prob: resData?.q8_probability || 0.85,
        entropy: resData?.entropy || 0.2,
        pos3D: pos,
        tangent,
        normal,
        binormal
      };
    });
  }, [prediction]);

  // Max span for auto-fit zoom scaling
  const maxSpan = useMemo(() => {
    let maxD = 10;
    for (const n of nodes3D) {
      const d = vLen(n.pos3D);
      if (d > maxD) maxD = d;
    }
    return maxD;
  }, [nodes3D]);

  // Toggle auto-rotation cleanly without teardown
  const handleToggleAutoRotate = () => {
    setAutoRotate((prev) => {
      const next = !prev;
      autoRotateRef.current = next;
      return next;
    });
  };

  // Main canvas animation and rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let width = 1;
    let heightPx = 1;
    let isVisible = true;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;

    // Projected 2D screen positions for mouse picking
    const screenProjections: Array<{ x: number; y: number; z: number; index: number }> = [];

    const render = (now: number) => {
      const dt = Math.min(64, Math.max(0, now - lastTime));
      lastTime = now;

      // Auto-rotation strictly controlled: gentle drift when enabled and not dragging
      if (autoRotateRef.current && !isDraggingRef.current && !reducedMotion) {
        rotRef.current.y += 0.0025 * (dt / 16.6);
      }

      ctx.clearRect(0, 0, width, heightPx);

      // Camera transformation matrices
      const rx = rotRef.current.x;
      const ry = rotRef.current.y;
      const cosX = Math.cos(rx), sinX = Math.sin(rx);
      const cosY = Math.cos(ry), sinY = Math.sin(ry);

      // Fit scale
      const baseScale = (Math.min(width, heightPx) * 0.44) / (maxSpan || 25);
      const scale = baseScale * zoomRef.current;
      const centerX = width * 0.5 + panRef.current.x;
      const centerY = heightPx * 0.5 + panRef.current.y;

      // Project all 3D points
      screenProjections.length = 0;
      const projectedNodes = nodes3D.map((node) => {
        const p = node.pos3D;
        // Rotate around Y then X
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        // Weak perspective projection
        const fov = 400;
        const persp = fov / (fov + z2);
        const screenX = centerX + x1 * scale * persp;
        const screenY = centerY + y2 * scale * persp;

        // Also rotate normal for ribbon extrusion
        const n = node.normal;
        const nx1 = n.x * cosY + n.z * sinY;
        const nz1 = -n.x * sinY + n.z * cosY;
        const ny2 = n.y * cosX - nz1 * sinX;
        const nz2 = n.y * sinX + nz1 * cosX;

        const screenNormX = nx1 * persp;
        const screenNormY = ny2 * persp;

        screenProjections.push({
          x: screenX,
          y: screenY,
          z: z2,
          index: node.index
        });

        return {
          ...node,
          projX: screenX,
          projY: screenY,
          projZ: z2,
          normProjX: screenNormX,
          normProjY: screenNormY,
          persp
        };
      });

      // Depth sorting segments/nodes from back to front
      const sortedNodes = [...projectedNodes].sort((a, b) => b.projZ - a.projZ);

      // Helper to get color for a node based on active colorMode
      const getNodeColor = (node: Residue3DNode): { hex: string; stroke: string } => {
        if (colorMode === 'rainbow') {
          const ratio = node.index / Math.max(1, nodes3D.length - 1);
          const hue = Math.round(240 * (1 - ratio)); // blue to red
          return { hex: `hsl(${hue}, 85%, 48%)`, stroke: `hsl(${hue}, 85%, 32%)` };
        }
        if (colorMode === 'hydrophobic') {
          const meta = AMINO_ACIDS[node.aa];
          const isHydro = meta?.category.includes('Hydrophobic') || meta?.category.includes('Aromatic');
          return isHydro
            ? { hex: '#d97706', stroke: '#92400e' }
            : { hex: '#1e785e', stroke: '#114436' };
        }
        // Secondary structure DSSP colors
        const meta = Q8_METADATA[node.q8] || Q8_METADATA['C'];
        return { hex: meta.color, stroke: meta.color };
      };

      // PASS 1: Ambient Shadow Track (Sandwich Pass 1 - Depth)
      ctx.save();
      ctx.strokeStyle = 'rgba(23, 62, 50, 0.07)';
      ctx.lineWidth = 14 * zoomRef.current;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < projectedNodes.length; i++) {
        const p = projectedNodes[i];
        if (i === 0) ctx.moveTo(p.projX + 6, p.projY + 10);
        else ctx.lineTo(p.projX + 6, p.projY + 10);
      }
      ctx.stroke();
      ctx.restore();

      // PASS 2: Structural Ribbon or Backbone
      if (styleMode === 'ribbon') {
        ctx.save();
        for (let i = 1; i < projectedNodes.length; i++) {
          const p1 = projectedNodes[i - 1];
          const p2 = projectedNodes[i];
          const avgZ = (p1.projZ + p2.projZ) * 0.5;

          const isHelix = p2.q8 === 'H' || p2.q8 === 'G' || p2.q8 === 'I';
          const isStrand = p2.q8 === 'E' || p2.q8 === 'B';
          const halfWidth = (isStrand ? 6.5 : isHelix ? 5.2 : 2.4) * zoomRef.current * p2.persp;

          const { hex, stroke } = getNodeColor(p2);

          // Top edge
          const top1X = p1.projX + p1.normProjX * halfWidth;
          const top1Y = p1.projY + p1.normProjY * halfWidth;
          const top2X = p2.projX + p2.normProjX * halfWidth;
          const top2Y = p2.projY + p2.normProjY * halfWidth;

          // Bottom edge
          const bot1X = p1.projX - p1.normProjX * halfWidth;
          const bot1Y = p1.projY - p1.normProjY * halfWidth;
          const bot2X = p2.projX - p2.normProjX * halfWidth;
          const bot2Y = p2.projY - p2.normProjY * halfWidth;

          ctx.beginPath();
          ctx.moveTo(top1X, top1Y);
          ctx.lineTo(top2X, top2Y);
          ctx.lineTo(bot2X, bot2Y);
          ctx.lineTo(bot1X, bot1Y);
          ctx.closePath();

          // Depth fog lighting
          const fog = Math.max(0.4, Math.min(1.0, 1 - avgZ / 300));
          ctx.fillStyle = hex;
          ctx.globalAlpha = fog;
          ctx.fill();

          ctx.strokeStyle = stroke;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        ctx.restore();
      } else if (styleMode === 'backbone') {
        // Covalent backbone cylinder bonds
        ctx.save();
        for (let i = 1; i < projectedNodes.length; i++) {
          const p1 = projectedNodes[i - 1];
          const p2 = projectedNodes[i];
          const { hex } = getNodeColor(p1);

          ctx.beginPath();
          ctx.moveTo(p1.projX, p1.projY);
          ctx.lineTo(p2.projX, p2.projY);
          ctx.strokeStyle = hex;
          ctx.lineWidth = 4 * zoomRef.current;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.restore();
      }

      // PASS 3: Residue Atoms / Calphas with Depth Sorting
      for (const node of sortedNodes) {
        const { hex, stroke } = getNodeColor(node);
        const isSelected = selectedResidueRef.current === node.position;
        const isHovered = hoveredIndexRef.current === node.index;

        const baseRadius = styleMode === 'spheres' ? 9 : 3.8;
        const radius = (baseRadius * (styleMode === 'spheres' ? 1.0 : zoomRef.current)) * node.persp;

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.projX, node.projY, Math.max(2, radius), 0, Math.PI * 2);

        // Radial lighting gradient
        const lightGrad = ctx.createRadialGradient(
          node.projX - radius * 0.35,
          node.projY - radius * 0.35,
          radius * 0.1,
          node.projX,
          node.projY,
          radius
        );
        lightGrad.addColorStop(0, '#ffffff');
        lightGrad.addColorStop(0.3, hex);
        lightGrad.addColorStop(1, stroke);

        ctx.fillStyle = lightGrad;
        ctx.fill();

        // Outline or Selection halo
        if (isSelected || isHovered) {
          ctx.strokeStyle = isSelected ? '#c9e64d' : '#ffffff';
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.stroke();

          // Selection radar beacon
          ctx.beginPath();
          ctx.arc(node.projX, node.projY, radius + (isSelected ? 6 : 4), 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? 'rgba(201, 230, 77, 0.7)' : 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Floating residue tag
          ctx.font = '600 10px monospace';
          const label = `${node.aa}${node.position} (${node.q8})`;
          const metrics = ctx.measureText(label);
          const px = node.projX;
          const py = node.projY - radius - 14;

          ctx.fillStyle = '#14382e';
          ctx.fillRect(px - metrics.width / 2 - 5, py - 10, metrics.width + 10, 15);
          ctx.strokeStyle = '#c9e64d';
          ctx.lineWidth = 1;
          ctx.strokeRect(px - metrics.width / 2 - 5, py - 10, metrics.width + 10, 15);
          ctx.fillStyle = '#f5f6ee';
          ctx.textAlign = 'center';
          ctx.fillText(label, px, py + 1);
        }
        ctx.restore();
      }

      if (isVisible && !document.hidden) {
        animId = requestAnimationFrame(render);
      }
    };

    // Substrate: Retina DPR setup
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      heightPx = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(heightPx * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastTime = performance.now();
      render(lastTime);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting || false;
      if (isVisible) {
        cancelAnimationFrame(animId);
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    });
    intersectionObserver.observe(canvas);

    const onVisibilityChange = () => {
      if (!document.hidden && isVisible) {
        lastTime = performance.now();
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Pointer events for orbit, pan, and hover picking
    const getPointerPos = (e: MouseEvent | Touch) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: MouseEvent) => {
      if (e.button === 2 || e.shiftKey) {
        isPanningRef.current = true;
      } else {
        isDraggingRef.current = true;
      }
      lastPointerRef.current = getPointerPos(e);
    };

    const onPointerMove = (e: MouseEvent) => {
      const pos = getPointerPos(e);

      // Direct 1:1 rotation tracking without slingshot inertia
      if (isDraggingRef.current) {
        const dx = pos.x - lastPointerRef.current.x;
        const dy = pos.y - lastPointerRef.current.y;
        rotRef.current.y += dx * 0.005;
        rotRef.current.x += dy * 0.005;
        lastPointerRef.current = pos;
        return;
      }

      if (isPanningRef.current) {
        const dx = pos.x - lastPointerRef.current.x;
        const dy = pos.y - lastPointerRef.current.y;
        panRef.current.x += dx;
        panRef.current.y += dy;
        lastPointerRef.current = pos;
        return;
      }

      // Hover Hit-Test: find closest residue within 18px
      let closestIdx: number | null = null;
      let minDist = 18;

      for (const p of screenProjections) {
        const dist = Math.hypot(pos.x - p.x, pos.y - p.y);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = p.index;
        }
      }
      if (closestIdx !== hoveredIndexRef.current) {
        hoveredIndexRef.current = closestIdx;
        setHoveredIndex(closestIdx);
      }
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      isPanningRef.current = false;
    };

    const onClick = (e: MouseEvent) => {
      const pos = getPointerPos(e);
      let closestIdx: number | null = null;
      let minDist = 18;
      for (const p of screenProjections) {
        const dist = Math.hypot(pos.x - p.x, pos.y - p.y);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = p.index;
        }
      }
      if (closestIdx !== null && onSelectResidue) {
        const res = prediction.residues[closestIdx];
        if (res) onSelectResidue(res);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      zoomRef.current = Math.max(0.3, Math.min(4.0, zoomRef.current * zoomFactor));
    };

    // Touch support: direct controlled rotation without centrifugal throw
    let touchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        lastPointerRef.current = getPointerPos(e.touches[0]);
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        touchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const pos = getPointerPos(e.touches[0]);
        const dx = pos.x - lastPointerRef.current.x;
        const dy = pos.y - lastPointerRef.current.y;
        rotRef.current.y += dx * 0.005;
        rotRef.current.x += dy * 0.005;
        lastPointerRef.current = pos;
      } else if (e.touches.length === 2) {
        const curDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (touchDist > 0) {
          const ratio = curDist / touchDist;
          zoomRef.current = Math.max(0.3, Math.min(4.0, zoomRef.current * ratio));
        }
        touchDist = curDist;
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      touchDist = 0;
    };

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);

    resize();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);

      canvas.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);

      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [nodes3D, styleMode, colorMode, maxSpan, prediction, onSelectResidue]);

  // Reset view to default front orientation
  const handleResetView = () => {
    rotRef.current = { x: 0.35, y: -0.65, z: 0 };
    zoomRef.current = 1.0;
    panRef.current = { x: 0, y: 0 };
  };

  // Preset camera angles
  const setPresetAngle = (preset: 'front' | 'top' | 'side') => {
    if (preset === 'front') rotRef.current = { x: 0, y: 0, z: 0 };
    if (preset === 'top') rotRef.current = { x: Math.PI / 2, y: 0, z: 0 };
    if (preset === 'side') rotRef.current = { x: 0, y: Math.PI / 2, z: 0 };
  };

  // High-Res snapshot export
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prediction.id}_structure_3d.png`;
    a.click();
  };

  // Hovered or selected residue active metadata
  const activeResidue = useMemo(() => {
    if (hoveredIndex !== null && nodes3D[hoveredIndex]) {
      return nodes3D[hoveredIndex];
    }
    if (selectedResiduePosition) {
      return nodes3D.find((n) => n.position === selectedResiduePosition) || null;
    }
    return null;
  }, [hoveredIndex, selectedResiduePosition, nodes3D]);

  const activeAAMeta = activeResidue ? AMINO_ACIDS[activeResidue.aa] : null;
  const activeQ8Meta = activeResidue ? Q8_METADATA[activeResidue.q8] || Q8_METADATA['C'] : null;

  return (
    <div className={`relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-sm flex flex-col ${className}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--line)] bg-[var(--surface-high)]/90 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--forest)] text-[var(--lime)]">
            <Box size={16} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-sm font-semibold text-[var(--ink)] tracking-tight">
                3D Protein Structure Visualizer
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-[var(--paper)] text-[var(--ink-soft)] border border-[var(--line)]">
                {prediction.length} Residues
              </span>
            </div>
            <p className="text-[10px] text-[var(--ink-muted)]">
              Interactive structural projection &middot; Drag to rotate, scroll to zoom
            </p>
          </div>
        </div>

        {/* View and Style Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Render Mode */}
          <div className="inline-flex rounded-lg border border-[var(--line)] p-0.5 bg-[var(--paper)] text-[11px]">
            <button
              type="button"
              onClick={() => setStyleMode('ribbon')}
              className={`px-2 py-1 rounded-md transition-colors font-medium ${
                styleMode === 'ribbon'
                  ? 'bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              Ribbon
            </button>
            <button
              type="button"
              onClick={() => setStyleMode('backbone')}
              className={`px-2 py-1 rounded-md transition-colors font-medium ${
                styleMode === 'backbone'
                  ? 'bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              Backbone
            </button>
            <button
              type="button"
              onClick={() => setStyleMode('spheres')}
              className={`px-2 py-1 rounded-md transition-colors font-medium ${
                styleMode === 'spheres'
                  ? 'bg-[var(--forest)] text-[#f5f6ee] shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              Spheres
            </button>
          </div>

          {/* Color Mode */}
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value as any)}
            aria-label="Color scheme"
            className="px-2 py-1 text-[11px] rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] font-medium focus:outline-hidden"
          >
            <option value="secondary">DSSP Secondary Structure</option>
            <option value="rainbow">N &rarr; C Terminus Rainbow</option>
            <option value="hydrophobic">Hydrophobicity</option>
          </select>

          {/* Auto-Rotate / Pause Button with Explicit Icon and Label */}
          <button
            type="button"
            onClick={handleToggleAutoRotate}
            aria-label={autoRotate ? 'Pause rotation' : 'Resume rotation'}
            title={autoRotate ? 'Pause rotation' : 'Resume rotation'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              autoRotate
                ? 'bg-[var(--forest)] text-[var(--lime)] border-[var(--forest)] shadow-xs'
                : 'bg-[var(--paper)] text-[var(--ink-soft)] border-[var(--line)] hover:text-[var(--ink)]'
            }`}
          >
            {autoRotate ? <Pause size={12} /> : <Play size={12} />}
            <span>{autoRotate ? 'Pause' : 'Play'}</span>
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={handleResetView}
            title="Reset Camera Orientation"
            className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
          >
            <RotateCcw size={13} />
          </button>

          {/* Export Snapshot */}
          <button
            type="button"
            onClick={handleExportPNG}
            title="Export High-Resolution PNG"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--surface-high)] font-medium text-[11px] transition-colors"
          >
            <Download size={12} className="text-[var(--forest)]" />
            <span>Snapshot</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="relative w-full bg-[var(--paper-deep)] cursor-grab active:cursor-grabbing select-none" style={{ height }}>
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating HUD: Active Residue Details */}
        {activeResidue && (
          <div className="absolute top-3 left-3 max-w-xs p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-high)]/95 backdrop-blur-md shadow-md text-xs animate-fadeIn pointer-events-none">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-1.5 mb-2">
              <span className="font-mono font-bold text-sm text-[var(--forest)]">
                {activeResidue.aa}#{activeResidue.position}
              </span>
              <span className="text-[10px] text-[var(--ink-muted)]">
                {activeAAMeta?.name || 'Amino Acid'} ({activeAAMeta?.code3 || 'RES'})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <span className="text-[var(--ink-muted)]">Q8 State:</span>
              <span className="font-mono font-medium text-[var(--ink)]">
                {activeResidue.q8} &middot; {activeQ8Meta?.name.split(' ')[0] || 'State'}
              </span>

              <span className="text-[var(--ink-muted)]">Q3 State:</span>
              <span className="font-mono font-medium text-[var(--ink)]">
                {Q3_METADATA[activeResidue.q3]?.name || activeResidue.q3}
              </span>

              <span className="text-[var(--ink-muted)]">Confidence:</span>
              <span className="font-mono font-semibold text-[var(--forest)]">
                {(activeResidue.prob * 100).toFixed(1)}%
              </span>

              <span className="text-[var(--ink-muted)]">Class:</span>
              <span className="text-[var(--ink-soft)] truncate">
                {activeAAMeta?.category || 'Standard'}
              </span>
            </div>
          </div>
        )}

        {/* Camera Orientation Pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--surface-high)]/90 backdrop-blur-xs text-[10px] font-mono text-[var(--ink-muted)]">
          <Compass size={12} className="text-[var(--forest)]" />
          <span>View:</span>
          <button
            type="button"
            onClick={() => setPresetAngle('front')}
            className="hover:text-[var(--forest)] font-medium transition-colors"
          >
            Front
          </button>
          <span>&middot;</span>
          <button
            type="button"
            onClick={() => setPresetAngle('top')}
            className="hover:text-[var(--forest)] font-medium transition-colors"
          >
            Top
          </button>
          <span>&middot;</span>
          <button
            type="button"
            onClick={() => setPresetAngle('side')}
            className="hover:text-[var(--forest)] font-medium transition-colors"
          >
            Side
          </button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1 rounded-lg border border-[var(--line)] bg-[var(--surface-high)]/90 backdrop-blur-xs text-[10px] font-medium text-[var(--ink-soft)]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#1e785e]" />
            <span>Helix (H)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#d97706]" />
            <span>Strand (E)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
            <span>Turn (T)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#64748b]" />
            <span>Coil (C)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
