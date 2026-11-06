import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, Building2, ChevronRight, UserCircle, ArrowLeft } from 'lucide-react';
import { SEEDED_USERS } from '@/data/seedData';
import { User, UserRole } from '@/types';

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
      // Reload page to reflect user change across endpoints
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Head>
        <title>{title} — BrandLint Organisations</title>
      </Head>

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 tracking-tight">BrandLint</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono ml-1.5">
                  v1.0
                </span>
              </div>
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            <nav className="flex items-center gap-2 text-xs">
              <Link
                href="/"
                className="text-slate-500 hover:text-slate-900 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/orgs"
                className="text-blue-600 font-semibold px-2 py-1 rounded-md bg-blue-50 transition-colors flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                Organisations
              </Link>
            </nav>
          </div>

          {/* User selector for easy testing between roles */}
          {isClient && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 font-medium">Active Account:</span>
              <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 px-2.5 py-1 rounded-lg">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <select
                  value={currentUser.id}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 border-none outline-none cursor-pointer pr-1"
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

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Link href="/orgs" className="hover:text-slate-800 transition-colors">
              Organisations
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-slate-800 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2.5">{actions}</div>}
        </div>

        {/* Children Content */}
        {children}
      </main>
    </div>
  );
};

