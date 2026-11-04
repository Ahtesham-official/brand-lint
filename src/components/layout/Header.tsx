import React from 'react';
import { User, UserRole, Brand } from '@/types';
import { ShieldCheck, Sparkles, BookOpen, Database, RefreshCw, PlayCircle, Eye, UserCheck, PenTool } from 'lucide-react';

interface HeaderProps {
  brand: Brand;
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  activeRulesCount: number;
  factsCount: number;
  onResetSeed: () => void;
  onOpenDemoGuide: () => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brand,
  currentUser,
  onRoleChange,
  activeRulesCount,
  factsCount,
  onResetSeed,
  onOpenDemoGuide,
  demoMode,
  onToggleDemoMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-slate-900">BrandLint</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 border border-blue-200">
                  v1.0
                </span>
                <span className="hidden md:inline-flex text-[11px] text-slate-500 italic">
                  “ESLint for brand content, with evidence and human approval”
                </span>
              </div>
            </div>
          </div>

          {/* Center Brand & Active Counts Pill */}
          <div className="hidden lg:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{brand.name}</span>
              <div className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full border border-black/10 shadow-inner"
                  style={{ backgroundColor: brand.palette.primary }}
                  title={`Primary: ${brand.palette.primary}`}
                />
                <span
                  className="w-3 h-3 rounded-full border border-black/10 shadow-inner"
                  style={{ backgroundColor: brand.palette.secondary }}
                  title={`Secondary: ${brand.palette.secondary}`}
                />
                <span
                  className="w-3 h-3 rounded-full border border-black/10 shadow-inner"
                  style={{ backgroundColor: brand.palette.accent }}
                  title={`Accent: ${brand.palette.accent}`}
                />
              </div>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-slate-600">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>
                <strong className="text-slate-900">{activeRulesCount}</strong> active rules
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                <strong className="text-slate-900">{factsCount}</strong> facts in vault
              </span>
            </div>
          </div>

          {/* Right Action Controls: Demo Guide, Demo Role Switcher, Reset */}
          <div className="flex items-center gap-3">
            {/* Demo Script Walkthrough Button */}
            <button
              onClick={onOpenDemoGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow"
              title="Launch the 2m 45s Hackathon Demo Script Guide"
            >
              <PlayCircle className="w-4 h-4 text-white" />
              <span>Demo Script (2m 45s)</span>
            </button>

            {/* Seed Reset Button */}
            <button
              onClick={onResetSeed}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              title="Reset state to initial seed data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Demo Role Switcher Bar (FR-1.4: Visible only when DEMO_MODE=true) */}
        {demoMode && (
          <div className="py-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Demo Role Switcher:
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                <button
                  onClick={() => onRoleChange('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                    currentUser.role === 'admin'
                      ? 'bg-white text-blue-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Admin (Brand Manager)</span>
                </button>

                <button
                  onClick={() => onRoleChange('creator')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                    currentUser.role === 'creator'
                      ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Creator (Content Specialist)</span>
                </button>

                <button
                  onClick={() => onRoleChange('reviewer')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                    currentUser.role === 'reviewer'
                      ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reviewer (Brand Lead)</span>
                </button>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Signed in as: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.title})</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

