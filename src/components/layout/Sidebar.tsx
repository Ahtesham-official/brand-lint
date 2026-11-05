import React from 'react';
import { User, UserRole, Brand } from '@/types';
import {
  ShieldCheck, FileText, Database, PenTool, Eye,
  BookOpen, Palette, RefreshCw, PlayCircle, ChevronDown, History
} from 'lucide-react';

export type Page = 'guidelines' | 'rules' | 'facts' | 'brand' | 'submit' | 'submissions' | 'review' | 'audit';

interface SidebarProps {
  brand: Brand;
  currentUser: User;
  activePage: Page;
  onNavigate: (page: Page) => void;
  onRoleChange: (role: UserRole) => void;
  onResetSeed: () => void;
  onOpenDemoGuide: () => void;
  activeRulesCount: number;
  factsCount: number;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ElementType; roles: UserRole[] }[] = [
  { page: 'guidelines', label: 'Guidelines', icon: FileText, roles: ['admin'] },
  { page: 'rules', label: 'Rules', icon: BookOpen, roles: ['admin'] },
  { page: 'facts', label: 'Fact Vault', icon: Database, roles: ['admin'] },
  { page: 'brand', label: 'Brand', icon: Palette, roles: ['admin'] },
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
  activeRulesCount,
  factsCount,
}) => {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role));

  return (
    <aside className="w-56 h-screen sticky top-0 flex flex-col border-r border-slate-200/80 bg-white shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-sm text-slate-900 tracking-tight">BrandLint</span>
            <span className="text-[10px] text-slate-400 ml-1.5">v1.0</span>
          </div>
        </div>
      </div>

      {/* Brand pill */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex gap-0.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.palette.primary }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.palette.secondary }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.palette.accent }} />
          </div>
          <span className="text-xs font-medium text-slate-700 truncate">{brand.name}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.page;
          const count = item.page === 'rules' ? activeRulesCount : item.page === 'facts' ? factsCount : undefined;

          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {count !== undefined && (
                <span className={`text-2xs px-1.5 py-0.5 rounded-full font-medium ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2 border-t border-slate-100 pt-3">
        {/* Demo guide button */}
        <button
          onClick={onOpenDemoGuide}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Demo Script</span>
        </button>

        {/* Reset button */}
        <button
          onClick={onResetSeed}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Data</span>
        </button>

        {/* Role switcher */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            {currentUser.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUser.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-800 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.title}</div>
            </div>
          </div>
          <div className="flex gap-1">
            {(['admin', 'creator', 'reviewer'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`flex-1 px-1.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  currentUser.role === role
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
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

