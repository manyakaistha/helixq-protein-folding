'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Cpu,
  BarChart2,
  Layers,
  FileText,
  Layers2,
  Server,
  ArrowUpRight,
  Menu,
  X,
  Plus,
  Box,
  Dna,
  Compass
} from 'lucide-react';
import { checkHealth, HealthStatus } from '@/lib/api';
import { EXAMPLE_PROTEINS } from '@/lib/constants';

const navLinks = [
  { href: '/', label: 'Research Desk', icon: Compass },
  { href: '/predict', label: 'Prediction Workspace', icon: Activity },
  { href: '/viewer', label: '3D Structure Explorer', icon: Box },
  { href: '/analysis', label: 'Structural Analysis', icon: BarChart2 },
  { href: '/batch', label: 'Batch Processing', icon: Server },
  { href: '/models', label: 'Model Architecture', icon: Cpu },
  { href: '/benchmarks', label: 'Leaderboard & Metrics', icon: Layers2 },
  { href: '/docs', label: 'DSSP Field Guide', icon: FileText }
];

export function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const h = await checkHealth();
        if (mounted) setHealth(h);
      } catch {
        if (mounted) setHealth(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, 25000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  // Keyboard shortcut: [N] for new prediction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        window.location.href = '/predict';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Sticky Bar */}
      <div className="mobile-bar">
        <Link href="/" className="brand-name">
          ProteinFold<span>.</span>
        </Link>
        <button
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1 rounded-md text-[#dbe8e0]"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Scrim Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        {/* Brand Lockup */}
        <Link href="/" className="brand-lockup">
          <div className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="brand-name">
            ProteinFold<span>.</span>
            <small>BIOMOLECULAR RESEARCH DESK</small>
          </div>
        </Link>

        {/* Quick Action Button */}
        <Link href="/predict" className="new-action-btn">
          <span className="plus-icon">+</span>
          <span className="flex-1">New prediction</span>
          <kbd>N</kbd>
        </Link>

        {/* Main Navigation Section */}
        <div className="sidebar-section-label">
          <span>WORKSPACE SECTIONS</span>
          <span>08</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-link ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={16} />
                <span>{label}</span>
                {isActive && <span className="nav-dot" />}
              </Link>
            );
          })}
        </nav>

        {/* Curated Reference Proteins Section */}
        <div className="sidebar-section-label" style={{ marginTop: 12 }}>
          <span>REFERENCE PROTEINS</span>
          <span>{EXAMPLE_PROTEINS.length}</span>
        </div>

        <div className="sidebar-preset-list">
          {EXAMPLE_PROTEINS.map((prot) => (
            <Link
              key={prot.uniprotId}
              href={`/predict?example=${prot.uniprotId}`}
              className="preset-item"
              title={`${prot.name} (${prot.organism})`}
            >
              <span className="truncate max-w-[130px]">{prot.name.replace('Human ', '')}</span>
              <span className="preset-tag">{prot.uniprotId}</span>
            </Link>
          ))}
        </div>

        {/* Engine Status Card at Bottom */}
        <div className="sidebar-foot-card">
          <div className="engine-card">
            <div className="engine-heading">
              <span className={`status-orbit ${health?.model_loaded ? 'is-up' : 'is-down'}`} />
              <span>
                {loading
                  ? 'Connecting engine…'
                  : health?.model_loaded
                  ? 'Inference engine live'
                  : 'Engine offline'}
              </span>
            </div>
            <p>
              {health?.model_loaded
                ? `Champion v10 active &middot; 6.63M params &middot; ${health.device}`
                : 'Start the FastAPI service to execute live predictions.'}
            </p>
            <Link href="/models">
              <span>Inspect architecture</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="sidebar-signoff">
            <span>Harmonic F1: 0.4910</span>
            <span className="font-mono text-[9px] text-[#8fa496]">Q8 &middot; Q3</span>
          </div>
        </div>
      </aside>
    </>
  );
}
