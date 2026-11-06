import React from 'react';
import { User, UserRole, Brand } from '@/types';
import {
  ShieldCheck,
  FileText,
  Database,
  PenTool,
  Eye,
  BookOpen,
  Palette,
  RefreshCw,
  PlayCircle,
  LogIn,
  History,
  Sparkles,
  Cpu,
  Building2,
  ArrowLeft,
} from 'lucide-react';

export type Page = 'dashboard' | 'guidelines' | 'rules' | 'facts' | 'brand' | 'submit' | 'submissions' | 'review' | 'audit';

interface SidebarProps {
  brand: Brand;
  currentUser: User;
  activePage: Page;
  onNavigate: (page: Page) => void;
  onRoleChange: (role: UserRole) => void;
  onResetSeed: () => void;
  onOpenDemoGuide: () => void;
  onOpenAuth: () => void;
  onOpenGroqModal: () => void;
  groqActive: boolean;
  activeRulesCount: number;
  factsCount: number;
  onExitOrg?: () => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ElementType; roles: UserRole[] }[] = [
  { page: 'guidelines', label: 'Guidelines', icon: FileText, roles: ['admin'] },
  { page: 'rules', label: 'Rules', icon: BookOpen, roles: ['admin'] },
  { page: 'facts', label: 'Fact Vault', icon: Database, roles: ['admin'] },
  { page: 'brand', label: 'Brand Profile', icon: Palette, roles: ['admin'] },
  { page: 'submit', label: 'New Check', icon: PenTool, roles: ['creator'] },
  { page: 'submissions', label: 'Submissions', icon: FileText, roles: ['creator', 'reviewer'] },
  { page: 'review', label: 'Review Queue', icon: Eye, roles: ['reviewer'] },
  { page: 'audit', label: 'Audit Log', icon: History, roles: ['admin', 'reviewer'] },
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  creator: 'Creator',
  reviewer: 'Reviewer',
};

export const Sidebar: React.FC<SidebarProps> = ({
  brand,
  currentUser,
  activePage,
  onNavigate,
  onRoleChange,
  onResetSeed,
  onOpenDemoGuide,
  onOpenAuth,
  onOpenGroqModal,
  groqActive,
  activeRulesCount,
  factsCount,
  onExitOrg,
}) => {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role));

  return (
    <aside className="w-60 h-screen sticky top-0 flex flex-col border-r border-slate-200/90 bg-white shrink-0">
      {/* Brand & App Title */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={onExitOrg}
          className="flex items-center gap-2.5 text-left group transition-all"
          title="Return to Landing Page"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">BrandLint</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono ml-1.5">v1.0</span>
          </div>
        </button>
      </div>

      {/* Brand Pill */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.palette.primary }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.palette.secondary }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.palette.accent }} />
          </div>
          <span className="text-xs font-semibold text-slate-800 truncate">{brand.name}</span>
          <span className="text-[10px] text-slate-400 ml-auto font-mono">Governed</span>
        </div>

        {onExitOrg && (
          <button
            onClick={onExitOrg}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors mt-1.5"
            title="Leave workspace and return to landing page"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch Organisation</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.page;
          const count = item.page === 'rules' ? activeRulesCount : item.page === 'facts' ? factsCount : undefined;

          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-200/70 text-slate-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        <a
          href="/orgs"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="flex-1 text-left">Organisations</span>
        </a>
      </nav>

      {/* Bottom tools & role switcher */}
      <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2.5">
        {/* Groq GenAI indicator / toggle */}
        <button
          onClick={onOpenGroqModal}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            groqActive
              ? 'bg-orange-50/70 text-orange-800 border-orange-200 hover:bg-orange-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
          title="Configure Groq GenAI Llama-3.3-70B Key"
        >
          <span className="flex items-center gap-1.5">
            <Cpu className={`w-3.5 h-3.5 ${groqActive ? 'text-orange-600' : 'text-slate-400'}`} />
            <span>Groq GenAI</span>
          </span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
            groqActive ? 'bg-orange-200 text-orange-900' : 'bg-slate-200 text-slate-600'
          }`}>
            {groqActive ? 'Live' : 'Fallback'}
          </span>
        </button>

        {/* Demo script button */}
        <button
          onClick={onOpenDemoGuide}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200/70"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Demo Script (2m 45s)</span>
        </button>

        {/* Reset button */}
        <button
          onClick={onResetSeed}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Demo Seed</span>
        </button>

        {/* Demo Role Switcher toggle (PRD FR-1.4) */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Demo Switcher (FR-1.4)
            </span>
            <button
              onClick={onOpenAuth}
              className="text-[10px] text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
              title="Open Auth / Login"
            >
              <LogIn className="w-2.5 h-2.5" />
              Auth
            </button>
          </div>

          <div
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt=""
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                {currentUser.name.slice(0, 1)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.title}</div>
            </div>
          </div>

          {/* Quick 1-click role switcher pills */}
          <div className="flex gap-1 pt-0.5">
            {(['admin', 'creator', 'reviewer'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  currentUser.role === role
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
