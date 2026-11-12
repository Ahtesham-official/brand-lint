import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, ChevronRight, ArrowLeft } from 'lucide-react';
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
      const demoUser = localStorage.getItem('brandlint_demo_user_id');
      if (demoUser) {
        const match = SEEDED_USERS.find((u) => u.id === demoUser);
        if (match) setCurrentUser(match);
      } else {
        const stored = localStorage.getItem('brandlint_current_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) {
            const match = SEEDED_USERS.find((u) => u.id === parsed.id) || parsed;
            setCurrentUser(match);
          }
        }
      }
    } catch {}
  }, []);

  const handleUserChange = (userId: string) => {
    const user = SEEDED_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      try {
        localStorage.setItem('brandlint_demo_user_id', user.id);
        localStorage.setItem('brandlint_current_user', JSON.stringify(user));
      } catch {}
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB] font-sans text-slate-900">
      <Head>
        <title>{title} — BrandLint Organisations</title>
      </Head>

      {/* Top Sticky SaaS Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-5">
            <Link href="/?view=workspaces" className="flex items-center gap-2.5 text-slate-900 no-underline">
              <Image
                src="/brandlint-mark.png"
                alt="BrandLint"
                width={168}
                height={120}
                priority
                className="h-7 w-auto shrink-0 object-contain"
              />
              <span className="font-serif text-lg font-bold tracking-tight text-slate-900">
                BrandLint
              </span>
            </Link>

            <div className="hidden h-4 w-px bg-slate-200 sm:block" />

            <nav className="hidden items-center gap-2 text-xs sm:flex">
              <Link
                href="/?view=workspaces"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Workspaces
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                href="/orgs"
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 font-semibold text-sky-700"
              >
                <Building2 className="h-3.5 w-3.5" />
                Organisations
              </Link>
            </nav>
          </div>

          {isClient && (
            <div className="flex items-center gap-2.5">
              <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">
                Demo Profile:
              </span>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white font-serif text-[10px] font-bold text-slate-700">
                  {currentUser.name[0]}
                </div>
                <select
                  value={currentUser.id}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="cursor-pointer bg-transparent text-xs font-semibold text-slate-900 outline-none"
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {breadcrumbs.length > 0 && (
          <nav className="mb-5 flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/orgs" className="hover:text-slate-900">
              Organisations
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-slate-900">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-900">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="kicker-accent mb-1.5">Tenant Governance</span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2.5">{actions}</div>}
        </div>

        {children}
      </main>
    </div>
  );
};
