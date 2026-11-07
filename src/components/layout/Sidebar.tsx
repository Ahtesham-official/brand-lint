import React from 'react';
import Image from 'next/image';
import { User, UserRole, Brand } from '@/types';
import { SEEDED_USERS } from '@/data/seedData';
import {
  FileText, Database, PenTool, Eye, BookOpen, Palette,
  RefreshCw, PlayCircle, LogIn, History, Cpu, Building2,
  ArrowLeft, Sparkles, UserCheck,
} from 'lucide-react';

export type Page =
  | 'dashboard' | 'guidelines' | 'rules' | 'facts' | 'brand'
  | 'submit' | 'submissions' | 'review' | 'audit';

interface SidebarProps {
  brand: Brand;
  currentUser: User;
  activePage: Page;
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
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ElementType; roles: UserRole[] }[] = [
  { page: 'guidelines',  label: 'Guidelines',    icon: FileText,  roles: ['admin'] },
  { page: 'rules',       label: 'Rules',         icon: BookOpen,  roles: ['admin'] },
  { page: 'facts',       label: 'Fact Vault',    icon: Database,  roles: ['admin'] },
  { page: 'brand',       label: 'Brand Profile', icon: Palette,   roles: ['admin'] },
  { page: 'submit',      label: 'New Check',     icon: PenTool,   roles: ['creator'] },
  { page: 'submissions', label: 'Submissions',   icon: FileText,  roles: ['creator', 'reviewer'] },
  { page: 'review',      label: 'Review Queue',  icon: Eye,       roles: ['reviewer'] },
  { page: 'audit',       label: 'Audit Log',     icon: History,   roles: ['admin', 'reviewer'] },
];

export const Sidebar: React.FC<SidebarProps> = ({
  brand, currentUser, activePage, onNavigate, onRoleChange, onSelectDemoUser,
  onResetSeed, onOpenDemoGuide, onOpenAuth, onOpenGroqModal,
  groqActive, activeRulesCount, factsCount, onExitOrg,
}) => {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role));

  return (
    <aside style={{
      width: 240,
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--white)',
      borderRight: '1px solid var(--rule)',
      flexShrink: 0,
      fontFamily: 'var(--font-sans)',
    }}>

      {/* ── Logo / Brand ─────────────────────────── */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--rule)' }}>
        <button
          onClick={onExitOrg}
          className="btn-plain"
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', boxShadow: 'none', transform: 'none' }}
          title="Return to Landing"
        >
          <Image src="/brandlint-mark.png" alt="" width={168} height={120} priority style={{ width: 'auto', height: 34, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              BrandLint
            </div>
            <div className="kicker" style={{ marginTop: 2, color: 'var(--ink-faint)' }}>
              {brand.name}
            </div>
          </div>
        </button>

        {onExitOrg && (
          <button
            onClick={onExitOrg}
            className="btn-plain"
            style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.03em', padding: 0, boxShadow: 'none', transform: 'none' }}
          >
            <ArrowLeft style={{ width: 11, height: 11 }} /> Switch workspace
          </button>
        )}
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        <div className="kicker" style={{ padding: '0 12px 10px', color: 'var(--ink-faint)' }}>
          Navigation
        </div>
        {visibleItems.map((item) => {
          const Icon   = item.icon;
          const isAct  = activePage === item.page;
          const count  = item.page === 'rules' ? activeRulesCount : item.page === 'facts' ? factsCount : undefined;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', marginBottom: 6,
                background: isAct ? 'var(--paper)' : 'var(--white)',
                color: isAct ? 'var(--ink)' : 'var(--ink-soft)',
                border: `1px solid ${isAct ? 'var(--rule-dark)' : 'var(--rule)'}`,
                borderLeft: isAct ? '3.5px solid var(--accent)' : '1px solid var(--rule)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isAct ? 700 : 500,
                textAlign: 'left',
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => { if (!isAct) (e.currentTarget as HTMLElement).style.background = 'var(--paper-mid)'; }}
              onMouseLeave={(e) => { if (!isAct) (e.currentTarget as HTMLElement).style.background = 'var(--white)'; }}
            >
              <Icon style={{ width: 15, height: 15, color: isAct ? 'var(--accent)' : 'var(--ink-light)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {count !== undefined && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                  padding: '1px 6px',
                  background: isAct ? 'var(--accent-bg)' : 'var(--paper-mid)',
                  color: isAct ? 'var(--accent)' : 'var(--ink-mid)',
                  border: '1px solid var(--rule)',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Orgs link */}
        <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
          <a
            href="/orgs"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              color: 'var(--ink-soft)',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: 13,
              background: 'var(--white)',
              border: '1px solid var(--rule)',
              borderBottom: '2px solid var(--rule-dark)',
              borderRadius: 'var(--radius-btn)',
              boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translate(-1px, -1px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '3.5px 3.5px 0px var(--btn-shadow)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translate(0, 0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '2.5px 2.5px 0px var(--btn-shadow)';
            }}
          >
            <Building2 style={{ width: 15, height: 15, color: 'var(--ink-faint)' }} />
            Organisations
          </a>
        </div>
      </nav>

      {/* ── Footer ───────────────────────────────── */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Groq status pill */}
        <button
          onClick={onOpenGroqModal}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px',
            background: groqActive ? '#e0f2fe' : 'var(--paper-mid)',
            color: groqActive ? 'var(--warning)' : 'var(--ink-mid)',
            border: `1px solid ${groqActive ? '#7dd3fc' : 'var(--rule)'}`,
            cursor: 'pointer', fontSize: 12, fontWeight: 500, width: '100%',
          }}
          title="Configure Groq GenAI"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Cpu style={{ width: 13, height: 13 }} />
            Groq GenAI
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
            padding: '2px 6px', letterSpacing: '0.08em', textTransform: 'uppercase',
            background: groqActive ? '#fbbf24' : 'var(--paper-dark)',
            color: groqActive ? '#78350f' : 'var(--ink-faint)',
          }}>
            {groqActive ? 'LIVE' : 'OFF'}
          </span>
        </button>

        {/* Demo */}
        <button
          onClick={onOpenDemoGuide}
          className="btn-plain"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: 'transparent', color: 'var(--ink-mid)', border: '1px solid var(--rule)', cursor: 'pointer', fontSize: 12, width: '100%', boxShadow: 'none', transform: 'none' }}
        >
          <PlayCircle style={{ width: 13, height: 13 }} /> Demo Script
        </button>

        {/* Reset */}
        <button
          onClick={onResetSeed}
          className="btn-plain"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '6px', background: 'transparent', color: 'var(--ink-faint)', border: 'none', cursor: 'pointer', fontSize: 11, width: '100%', boxShadow: 'none', transform: 'none' }}
        >
          <RefreshCw style={{ width: 11, height: 11 }} /> Reset Demo Seed
        </button>

        {/* Judge Demo Profile Switcher */}
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="kicker" style={{ color: 'var(--ink-mid)' }}>Demo Persona</span>
            <span
              className="badge"
              style={{
                fontSize: 9,
                padding: '2px 6px',
                background: currentUser.role === 'admin' ? '#102142' : currentUser.role === 'creator' ? '#eff6ff' : '#e0f2fe',
                color: currentUser.role === 'admin' ? '#e0f2fe' : currentUser.role === 'creator' ? '#1e40af' : '#075985',
                borderColor: 'transparent',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {currentUser.role}
            </span>
          </div>

          {/* Active persona preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, padding: '8px 10px', background: 'var(--paper)', border: '1px solid var(--rule)' }}>
            <div style={{ width: 30, height: 30, background: 'var(--white)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--ink)', flexShrink: 0, fontFamily: 'var(--font-serif)', overflow: 'hidden' }}>
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                currentUser.name[0]
              )}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
            </div>
          </div>

          {/* Switch Demo Profile Pills */}
          <div className="kicker" style={{ marginBottom: 6, fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
            <UserCheck style={{ width: 10, height: 10 }} /> Switch Persona
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SEEDED_USERS.map((user) => {
              const isCurrent = currentUser.id === user.id;
              return (
                <button
                  key={user.id}
                  onClick={() => onSelectDemoUser ? onSelectDemoUser(user.id) : onRoleChange(user.role)}
                  className="btn-plain"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isCurrent ? 'var(--btn-primary)' : 'transparent',
                    color: isCurrent ? 'var(--white)' : 'var(--ink-mid)',
                    border: `1px solid ${isCurrent ? 'var(--rule-dark)' : 'var(--rule)'}`,
                    boxShadow: 'none',
                    transform: 'none',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.1s ease',
                  }}
                  title={`Switch to ${user.name} (${user.role})`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isCurrent ? 'var(--accent)' : 'var(--rule)',
                    }} />
                    <span>{user.name}</span>
                  </div>
                  <span style={{
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    opacity: isCurrent ? 0.9 : 0.6,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {user.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
