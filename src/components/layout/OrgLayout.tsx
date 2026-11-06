import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, Building2, ChevronRight, ArrowLeft } from 'lucide-react';
import { SEEDED_USERS } from '@/data/seedData';
import { User } from '@/types';

interface OrgLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const OrgLayout: React.FC<OrgLayoutProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  children,
  actions,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(SEEDED_USERS[0]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const stored = localStorage.getItem('brandlint_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          const match = SEEDED_USERS.find((u) => u.id === parsed.id) || parsed;
          setCurrentUser(match);
        }
      }
    } catch {}
  }, []);

  const handleUserChange = (userId: string) => {
    const user = SEEDED_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      try {
        localStorage.setItem('brandlint_current_user', JSON.stringify(user));
      } catch {}
      window.location.reload();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      <Head>
        <title>{title} — BrandLint Organisations</title>
      </Head>

      {/* Top Editorial Masthead / Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'var(--white)',
        borderBottom: '1px solid var(--rule)',
        padding: '14px 24px',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                width: 34, height: 34,
                background: 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ShieldCheck style={{ width: 18, height: 18, color: '#fef3c7' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  BrandLint
                </span>
                <span className="kicker" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>
                  Workspace Governance
                </span>
              </div>
            </Link>

            <div style={{ height: 16, width: 1, background: 'var(--rule)' }} />

            <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <Link
                href="/"
                style={{
                  color: 'var(--ink-mid)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <ArrowLeft style={{ width: 12, height: 12 }} />
                Main Console
              </Link>
              <span style={{ color: 'var(--ink-faint)' }}>/</span>
              <Link
                href="/orgs"
                style={{
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontWeight: 700,
                  padding: '4px 8px',
                  background: 'var(--accent-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Building2 style={{ width: 13, height: 13 }} />
                Organisations
              </Link>
            </nav>
          </div>

          {/* User selector */}
          {isClient && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="kicker" style={{ fontSize: 10 }}>Active Account:</span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--paper)',
                border: '1px solid var(--rule)',
                padding: '4px 10px',
              }}>
                <div style={{
                  width: 20, height: 20,
                  background: 'var(--paper-mid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                  fontFamily: 'var(--font-serif)',
                  border: '1px solid var(--rule)',
                }}>
                  {currentUser.name[0]}
                </div>
                <select
                  value={currentUser.id}
                  onChange={(e) => handleUserChange(e.target.value)}
                  style={{
                    background: 'transparent',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    border: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {SEEDED_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: 1160, width: '100%', margin: '0 auto', padding: '36px 24px' }}>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-light)', marginBottom: 20 }}>
            <Link href="/orgs" style={{ color: 'var(--ink-mid)', textDecoration: 'none' }}>
              Organisations
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight style={{ width: 12, height: 12, color: 'var(--ink-faint)' }} />
                {crumb.href ? (
                  <Link href={crumb.href} style={{ color: 'var(--ink-mid)', textDecoration: 'none' }}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Page Header (Swiss Editorial) */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--rule)',
        }}>
          <div>
            <span className="kicker-accent" style={{ marginBottom: 6 }}>Governance & Tenants</span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.15 }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 14, color: 'var(--ink-mid)', marginTop: 8, maxWidth: 640 }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{actions}</div>}
        </div>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
};
