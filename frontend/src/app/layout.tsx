import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { Dna, ShieldCheck, ArrowUpRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ProteinFold AI | Production Protein Secondary Structure Prediction',
  description:
    'Scientifically grounded protein secondary structure prediction platform powered by Champion Version 10 Hybrid MultiScale CNN + BiGRU + Self-Attention.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          {/* Touchline-inspired Navigation Sidebar */}
          <Navbar />

          {/* Main Workbench Area */}
          <div className="workspace">
            {/* Topbar Header */}
            <header className="topbar">
              <div className="breadcrumb">
                <span>ProteinFold</span>
                <span className="crumb-slash">/</span>
                <span>Workspace</span>
                <span className="crumb-slash">/</span>
                <strong>Computational Secondary Structure Desk</strong>
              </div>

              <div className="flex items-center gap-3">
                <div className="health-pill">
                  <i />
                  <span>Neural Inference Ready &middot; 6.63M Params &middot; MPS/Torch</span>
                </div>
                <Link
                  href="/docs"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-high)] text-[var(--ink)] hover:bg-white text-xs font-medium transition-colors"
                >
                  <BookOpen size={13} className="text-[var(--forest)]" />
                  <span>DSSP Guide</span>
                </Link>
              </div>
            </header>

            {/* Page Content */}
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
              {children}
            </main>

            {/* Scientific Grounded Footer */}
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
