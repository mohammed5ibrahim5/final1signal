import React, { useState } from 'react';
import { Activity, Menu, X, CheckSquare, Zap, Sigma, RefreshCw, BarChart2, Hash, BookOpen } from 'lucide-react';

const POINTS = [
  { id: 1, title: 'تحويل الإشارات', engTitle: 'Signal Transformation', icon: RefreshCw },
  { id: 2, title: 'الزوجي والفردي', engTitle: 'Odd/Even Decomposition', icon: CheckSquare },
  { id: 3, title: 'الإشارات الأساسية', engTitle: 'Basic Signals', icon: Activity },
  { id: 4, title: 'الدوال الأسية', engTitle: 'Complex Exponentials', icon: Zap },
  { id: 5, title: 'الطاقة والقدرة', engTitle: 'Energy & Power', icon: Sigma },
  { id: 6, title: 'الالتفاف', engTitle: 'Convolution', icon: BarChart2 },
  { id: 7, title: 'تحويل فورييه', engTitle: 'Fourier Transform', icon: Activity },
  { id: 8, title: 'أخذ العينات', engTitle: 'Sampling & Aliasing', icon: Hash },
  { id: 9, title: 'تحويل Z و DFT', engTitle: 'Z-Transform / DFT', icon: Hash },
  { id: 10, title: 'التقرير النهائي', engTitle: 'Integration Report', icon: BookOpen },
];

interface LayoutProps {
  children: React.ReactNode;
  activePoint: number;
  setActivePoint: (id: number) => void;
}

export function Layout({ children, activePoint, setActivePoint }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-background font-arabic overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-30">
        <div className="w-full mx-auto px-3 md:px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-md hover:bg-slate-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">مُحلل الإشارات الهندسي</h1>
              <p className="text-sm text-slate-500 font-sans mt-1 font-semibold tracking-wide" dir="ltr">Signal Analyzer Pro</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 hidden md:block font-medium">
            مرحباً بكم يا بشمهندسين في أداة تحليل الإشارات والنظم
          </p>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 right-0 z-20 w-56 bg-white border-l border-slate-200 pt-16 transition-transform duration-300 lg:static lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
          <div className="h-full overflow-y-auto p-4 py-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-3 font-sans" dir="ltr">Lecture Points</h2>
            <nav className="space-y-1.5">
              {POINTS.map((point) => {
                const Icon = point.icon;
                const isActive = activePoint === point.id;
                return (
                  <button
                    key={point.id}
                    onClick={() => { setActivePoint(point.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-right group ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-white/20' : 'bg-slate-200/50 group-hover:bg-white'}`}>
                      <span className="font-mono font-bold">{point.id}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold leading-none" dir="ltr">{point.engTitle}</div>
                      <div className={`text-[10px] mt-1 font-sans ${isActive ? 'text-primary-foreground/80' : 'text-slate-400'}`} dir="rtl">{point.title}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-10 lg:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-5">
          <div className="max-w-2xl lg:max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

