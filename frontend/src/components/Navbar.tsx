'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dna, Activity, Cpu, BarChart2, Layers, FileText, Layers2, Server } from 'lucide-react';
import { checkHealth, HealthStatus } from '@/lib/api';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const data = await checkHealth();
        if (mounted) {
          setHealth(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setHealth(null);
          setLoading(false);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Overview', icon: Dna },
    { href: '/predict', label: 'Predict', icon: Activity },
    { href: '/viewer', label: 'Viewer', icon: Layers },
    { href: '/analysis', label: 'Analysis', icon: BarChart2 },
    { href: '/models', label: 'Architecture', icon: Cpu },
    { href: '/benchmarks', label: 'Benchmarks', icon: Layers2 },
    { href: '/batch', label: 'Batch Processing', icon: Server },
    { href: '/docs', label: 'Documentation', icon: FileText }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <Dna className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-purple-100 dark:to-slate-200 bg-clip-text text-transparent">
                  ProteinFold AI
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-600 dark:text-purple-400">
                  Champion Model v10 (0.4910)
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Backend Status Badge */}
          <div className="flex items-center space-x-2">
            {loading ? (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Checking...</span>
              </div>
            ) : health?.status === 'healthy' ? (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Engine Ready ({health.device})</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Backend Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
