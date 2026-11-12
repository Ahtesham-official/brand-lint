import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole, Brand } from '@/types';
import { SEEDED_USERS } from '@/data/seedData';
import { SPRING_SNAPPY, EASE_OUT_EXPO } from '@/components/motion/MotionPrimitives';
import {
  FileText,
  Database,
  PenTool,
  Eye,
  BookOpen,
  Palette,
  RefreshCw,
  PlayCircle,
  History,
  Cpu,
  ArrowLeft,
  UserCheck,
  LayoutDashboard,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { ModeToggle, AppMode } from '@/components/navigation/ModeToggle';

export type Page =
  | 'dashboard'
  | 'guidelines'
  | 'rules'
  | 'facts'
  | 'brand'
  | 'submit'
  | 'submissions'
  | 'review'
  | 'audit';

interface SidebarProps {
  brand: Brand;
  currentUser: User;
  activePage: Page;
  activeOrgId?: string | null;
  onNavigate: (page: Page) => void;
  onRoleChange: (role: UserRole) => void;
  onSelectDemoUser?: (userId: string) => void;
  onResetSeed: () => void;
  onOpenDemoGuide: () => void;
  onOpenAuth?: () => void;
  onOpenGroqModal: () => void;
  groqActive: boolean;
  activeRulesCount: number;
  factsCount: number;
  onExitOrg?: () => void;
  appMode?: AppMode;
  onToggleAppMode?: (mode: AppMode) => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ElementType; roles: UserRole[] }[] = [
  { page: 'dashboard',   label: 'Overview',      icon: LayoutDashboard, roles: ['admin', 'creator', 'reviewer'] },
  { page: 'guidelines',  label: 'Guidelines',    icon: FileText,        roles: ['admin'] },
  { page: 'rules',       label: 'Rules',         icon: BookOpen,        roles: ['admin'] },
  { page: 'facts',       label: 'Fact Vault',    icon: Database,        roles: ['admin'] },
  { page: 'brand',       label: 'Brand Profile', icon: Palette,         roles: ['admin'] },
  { page: 'submit',      label: 'New Check',     icon: PenTool,         roles: ['creator'] },
  { page: 'submissions', label: 'Submissions',   icon: FileText,        roles: ['creator', 'reviewer'] },
  { page: 'review',      label: 'Review Queue',  icon: Eye,             roles: ['reviewer'] },
  { page: 'audit',       label: 'Audit Log',     icon: History,         roles: ['admin', 'reviewer'] },
];

export const Sidebar: React.FC<SidebarProps> = ({
  brand,
  currentUser,
  activePage,
  activeOrgId,
  onNavigate,
  onRoleChange,
  onSelectDemoUser,
  onResetSeed,
  onOpenDemoGuide,
  onOpenGroqModal,
  groqActive,
  activeRulesCount,
  factsCount,
  onExitOrg,
  appMode = 'demo',
  onToggleAppMode,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role));

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white text-slate-900">
      {/* ── Brand & Organisation Switcher ── */}
      <div className="border-b border-slate-200 px-5 py-5">
        <button
          type="button"
          onClick={onExitOrg}
          className="btn-plain flex w-full items-center gap-2.5 text-left"
          title="Switch workspace"
        >
          <Image
            src="/brandlint-mark.png"
            alt="BrandLint"
            width={168}
            height={120}
            priority
            className="h-7 w-auto shrink-0 object-contain"
          />
          <div className="min-w-0">
            <div className="font-serif text-lg font-bold leading-none tracking-tight text-slate-900">
              BrandLint
            </div>
            <div className="mt-1 truncate text-[11px] font-medium text-slate-500">
              {brand.name}
            </div>
          </div>
        </button>

        <div className="mt-3 flex items-center justify-between gap-2">
          {onExitOrg && (
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onExitOrg();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-3 w-3" />
              Switch workspace
            </button>
          )}
          {currentUser.role === 'admin' && activeOrgId && (
            <Link
              href={`/orgs/${activeOrgId}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              title="Organisation Settings & Members"
            >
              <Settings className="h-3 w-3" />
              Org
            </Link>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isAct = activePage === item.page;
          const count =
            item.page === 'rules'
              ? activeRulesCount
              : item.page === 'facts'
              ? factsCount
              : undefined;

          return (
            <button
              key={item.page}
              type="button"
              onClick={() => {
                onNavigate(item.page);
                setMobileOpen(false);
              }}
              className={`btn-plain relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                isAct
                  ? 'font-semibold text-white'
                  : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {isAct && (
                <motion.span
                  layoutId="sidebar-nav-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-lg bg-slate-900"
                />
              )}
              <span className="relative z-10 flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${isAct ? 'text-sky-400' : 'text-slate-400'}`} />
                {item.label}
              </span>
              {count !== undefined && (
                <span
                  className={`relative z-10 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
                    isAct ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom Utilities & Demo Persona Switcher ── */}
      <div className="space-y-3 border-t border-slate-200 bg-slate-50/60 px-4 py-4">
        {/* Groq Engine Status */}
        <button
          type="button"
          onClick={onOpenGroqModal}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300"
        >
          <span className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-sky-600" />
            Groq AI Engine
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase ${
              groqActive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            {groqActive ? 'LIVE' : 'OFF'}
          </span>
        </button>

        {/* Demo Script & Reset */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onOpenDemoGuide}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <PlayCircle className="h-3 w-3" />
            Guide
          </button>
          <button
            type="button"
            onClick={onResetSeed}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <RefreshCw className="h-3 w-3" />
            Reset
          </button>
        </div>

        {/* Judge Demo Profile Switcher — or Signed In Profile in actual mode */}
        {appMode === 'demo' ? (
          <div className="border-t border-slate-200 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <UserCheck className="h-3 w-3" /> Demo Profile
              </span>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase text-white">
                {currentUser.role}
              </span>
            </div>

            <div className="space-y-1">
              {SEEDED_USERS.map((user) => {
                const isCurrent = currentUser.id === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      if (onSelectDemoUser) {
                        onSelectDemoUser(user.id);
                      } else {
                        onRoleChange(user.role);
                      }
                    }}
                    className={`btn-plain flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                      isCurrent
                        ? 'bg-slate-900 font-semibold text-white'
                        : 'border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50'
                    }`}
                    title={`Switch to ${user.name} (${user.role})`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isCurrent ? 'bg-sky-400' : 'bg-slate-300'
                        }`}
                      />
                      <span className="truncate">{user.name}</span>
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase ${
                        isCurrent ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      {user.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-200 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Signed In
              </span>
              <span className="rounded-full bg-sky-600 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase text-white">
                {currentUser.role}
              </span>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                {currentUser.name[0]}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-slate-900">{currentUser.name}</div>
                <div className="truncate text-[10px] text-slate-500">{currentUser.email}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Image src="/brandlint-mark.png" alt="BrandLint" width={168} height={120} className="h-6 w-auto" />
          <span className="font-serif text-base font-bold text-slate-900">BrandLint</span>
          <span className="text-xs text-slate-400">/ {brand.name}</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          className="rounded-lg border border-slate-200 p-1.5 text-slate-700"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
              className="relative z-50 w-64 border-r border-slate-200 bg-white"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop Sticky Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        {sidebarContent}
      </aside>
    </>
  );
};
