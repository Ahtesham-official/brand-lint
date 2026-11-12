import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Plus,
  Link as LinkIcon,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Sparkles,
  Database,
  Eye,
  AlertTriangle,
  Lock,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { User } from '@/types';
import { Organization, OrgRole } from '@/types/org';
import { SEEDED_USERS } from '@/data/seedData';
import { ModeToggle, AppMode } from '@/components/navigation/ModeToggle';
import {
  EASE_OUT_EXPO,
  ScrollReveal,
  StaggerList,
  StaggerItem,
  AnimatedModalShell,
  PageTransition,
} from '@/components/motion/MotionPrimitives';
import { AnimatedWorkflowDemo } from './AnimatedWorkflowDemo';

export type LandingView = 'landing' | 'select-profile' | 'select-workspace';

interface LandingPageProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  onEnterOrg: (orgId: string) => void;
  onOpenAuth?: () => void;
  appMode?: AppMode;
  onToggleAppMode?: (mode: AppMode) => void;
}

const ROLE_STYLE: Record<OrgRole, { bg: string; color: string; border: string }> = {
  admin:    { bg: '#0F172A', color: '#F8FAFC', border: '#0F172A' },
  creator:  { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  reviewer: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
};

const HERO_WORDS = ['Your', 'Brand.', 'Your', 'Rules.'];

export const LandingPage: React.FC<LandingPageProps> = ({
  currentUser,
  onSelectUser,
  onEnterOrg,
  onOpenAuth,
  appMode = 'demo',
  onToggleAppMode,
}) => {
  const router = useRouter();
  const [view, setView]                   = useState<LandingView>('landing');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs]     = useState(true);
  const [orgsError, setOrgsError]         = useState<string | null>(null);
  const [deletedBanner, setDeletedBanner] = useState<string | null>(null);
  const [showJoin, setShowJoin]           = useState(false);
  const [showCreate, setShowCreate]       = useState(false);
  const [inviteToken, setInviteToken]     = useState('');
  const [joining, setJoining]             = useState(false);
  const [joinError, setJoinError]         = useState<string | null>(null);
  const [createName, setCreateName]       = useState('');
  const [createDesc, setCreateDesc]       = useState('');
  const [creating, setCreating]           = useState(false);
  const [createError, setCreateError]     = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      if (router.query.view === 'workspaces') {
        setView('select-workspace');
      }
      if (typeof router.query.deleted === 'string' && router.query.deleted.trim()) {
        setDeletedBanner(router.query.deleted.trim());
      }
    }
  }, [router.isReady, router.query.view, router.query.deleted]);

  const fetchOrgs = useCallback(async () => {
    setLoadingOrgs(true);
    setOrgsError(null);
    try {
      const res = await fetch(`/api/orgs?userId=${encodeURIComponent(currentUser.id)}`, {
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      if (res.ok && data.organizations) {
        setOrganizations(data.organizations);
      } else {
        setOrganizations([]);
        setOrgsError(data.error || 'Failed to load workspaces.');
      }
    } catch {
      setOrganizations([]);
      setOrgsError('Network error while loading workspaces. Please try again.');
    } finally {
      setLoadingOrgs(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    if (view === 'select-workspace') {
      fetchOrgs();
    }
  }, [fetchOrgs, view]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;
    let token = inviteToken.trim();
    if (token.includes('token=')) {
      try {
        const u = new URL(token, 'http://localhost');
        token = u.searchParams.get('token') || token;
      } catch {}
    }
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch('/api/orgs/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({ token, userId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join.');
      setShowJoin(false);
      setInviteToken('');
      await fetchOrgs();
      onEnterOrg(data.orgId);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({ name: createName.trim(), description: createDesc.trim(), userId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create.');
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      await fetchOrgs();
      onEnterOrg(data.organization.id);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const goToView = (nextView: LandingView) => {
    setView(nextView);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleSelectPersona = (user: User) => {
    onSelectUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brandlint_demo_user_id', user.id);
      localStorage.setItem('brandlint_current_user', JSON.stringify(user));
    }
    goToView('select-workspace');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans selection:bg-sky-100 selection:text-slate-900">
      {/* ── Sticky Minimalist Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
        className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#F9FAFB]/90 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <button
            type="button"
            onClick={() => goToView('landing')}
            className="btn-plain flex items-center gap-2.5 text-left"
          >
            <Image
              src="/brandlint-mark.png"
              alt="BrandLint logo"
              width={168}
              height={120}
              priority
              className="h-7 w-auto object-contain"
            />
            <span className="font-serif text-xl font-bold tracking-tight text-slate-900">
              BrandLint
            </span>
          </button>

          {view === 'landing' && (
            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
              <a href="#how-it-works" className="transition-colors hover:text-slate-900">
                How it works
              </a>
              <a href="#capabilities" className="transition-colors hover:text-slate-900">
                Live Pipeline
              </a>
              <a href="#trust" className="transition-colors hover:text-slate-900">
                Trust &amp; Governance
              </a>
            </nav>
          )}

          {onToggleAppMode && (
            <div className="hidden sm:flex items-center">
              <ModeToggle mode={appMode} onToggle={onToggleAppMode} />
            </div>
          )}

          <div className="flex items-center gap-3">
            {view === 'landing' && (
              <motion.button
                type="button"
                whileHover={{ y: -1, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => goToView('select-profile')}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                Try Demo
                <ArrowRight className="h-3.5 w-3.5" />
              </motion.button>
            )}

            {view === 'select-profile' && (
              <motion.button
                type="button"
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => goToView('landing')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Overview
              </motion.button>
            )}

            {view === 'select-workspace' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
                  <div className="h-5 w-5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold">
                        {currentUser.name[0]}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-900">{currentUser.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium uppercase text-slate-600">
                    {currentUser.role}
                  </span>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setDeletedBanner(null);
                    goToView('select-profile');
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Switch Persona
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW 1: PREMIUM ANIMATED LANDING PAGE
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'landing' && (
        <main>
            {/* ── Hero Section with Ambient Animated Shapes ── */}
            <section className="hero-backdrop relative overflow-hidden border-b border-slate-200/80 pb-20 pt-20 md:pt-28">
              {/* Ambient subtle animated background glows */}
              <motion.div
                aria-hidden="true"
                animate={{ x: [0, 28, 0], y: [0, -18, 0], scale: [1, 1.06, 1] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl"
              />
              <motion.div
                aria-hidden="true"
                animate={{ x: [0, -24, 0], y: [0, 22, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                className="pointer-events-none absolute top-24 right-1/4 h-80 w-80 rounded-full bg-slate-200/40 blur-3xl"
              />

              <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-xs"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
                  <span>AI detects and explains. Humans decide and approve.</span>
                </motion.div>

                {/* Staggered Word/Line Headline Reveal */}
                <h1 className="mx-auto max-w-4xl font-serif text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.08]">
                  <span className="inline-flex flex-wrap justify-center gap-x-3">
                    {HERO_WORDS.map((word, idx) => (
                      <motion.span
                        key={word + idx}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.08 + idx * 0.07,
                          duration: 0.5,
                          ease: EASE_OUT_EXPO,
                        }}
                        className="inline-block"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </span>{' '}
                  <motion.span
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.55, ease: EASE_OUT_EXPO }}
                    className="inline-block text-slate-500"
                  >
                    Always Consistent.
                  </motion.span>
                </h1>

                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.48, duration: 0.55, ease: EASE_OUT_EXPO }}
                  className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg"
                >
                  BrandLint checks marketing posters, captions, and campaign videos against your approved brand guidelines and verified Fact Vault—surfacing cited violations and instant fixes before anything goes live.
                </motion.p>

                {/* Hero CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.56, duration: 0.5, ease: EASE_OUT_EXPO }}
                  className="mt-10 flex flex-wrap items-center justify-center gap-4"
                >
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToView('select-profile')}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                  >
                    Try Demo
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                  <motion.a
                    href="#how-it-works"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50"
                  >
                    Explore Platform
                  </motion.a>
                </motion.div>

                {/* ── Scale-in + Subtle Floating Product Preview ── */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.62, duration: 0.65, ease: EASE_OUT_EXPO }}
                  className="mx-auto mt-16 max-w-5xl text-left"
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                        <span className="ml-3 font-mono text-[11px] text-slate-400">
                          brandlint.app / audit / festive-earbuds-launch
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        GROQ + DETERMINISTIC ENGINE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 divide-y divide-slate-100 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
                      <div className="p-6 lg:col-span-5">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Submitted Asset
                          </span>
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-rose-700">
                            RISK SCORE: 74 / 100
                          </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 text-xs font-semibold text-slate-900">
                            Festive Wireless Earbuds Campaign
                          </div>
                          <p className="text-sm leading-relaxed text-slate-700">
                            Experience{' '}
                            <span className="rounded bg-rose-100 px-1 py-0.5 font-medium text-rose-900 underline decoration-rose-400 decoration-wavy">
                              India&apos;s #1 Sound
                            </span>{' '}
                            with our studio earbuds. Now backed by an industry-leading{' '}
                            <span className="rounded bg-amber-100 px-1 py-0.5 font-medium text-amber-900 underline decoration-amber-400 decoration-wavy">
                              24-month warranty
                            </span>{' '}
                            and zero-latency acoustics.
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Database className="h-4 w-4 text-sky-600" />
                            <div>
                              <div className="text-xs font-semibold text-slate-900">
                                Fact Vault Cross-Check
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Verified Warranty: 12-Month Standard Limited
                              </div>
                            </div>
                          </div>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700">
                            MISMATCH
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 bg-slate-50/40 p-6 lg:col-span-7">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Cited Compliance Findings (2)
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            Pending Human Approval
                          </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-700">
                                HIGH
                              </span>
                              <span className="text-sm font-semibold text-slate-900">
                                Uncertified Superlative Claim
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-400">
                              Confidence 96%
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-600">
                            Guideline <span className="font-mono text-slate-800">§ 3.1</span> prohibits unverified &ldquo;#1&rdquo; leadership claims without an audited third-party citation.
                          </p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="diff-deleted">India&apos;s #1 Sound</span>
                              <ArrowRight className="h-3 w-3 text-slate-400" />
                              <span className="diff-added">Signature Studio Sound</span>
                            </div>
                            <span className="font-medium text-sky-600">AI Fix Ready</span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700">
                                MEDIUM
                              </span>
                              <span className="text-sm font-semibold text-slate-900">
                                Warranty Term Contradicts Fact Vault
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-slate-400">
                              Confidence 99%
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-slate-600">
                            Approved hardware specification states a 12-month standard warranty; &ldquo;24-month warranty&rdquo; is unauthorized.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </section>

            {/* ── How BrandLint Works (Scroll-Triggered) ── */}
            <section id="how-it-works" className="border-b border-slate-200/80 bg-white py-24">
              <div className="mx-auto max-w-6xl px-6">
                <ScrollReveal className="max-w-2xl">
                  <span className="kicker-accent mb-3">Workflow</span>
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    From static PDFs to enforceable brand intelligence.
                  </h2>
                  <p className="mt-4 text-base text-slate-600">
                    Five transparent stages keep marketing velocity high without compromising compliance.
                  </p>
                </ScrollReveal>

                <StaggerList className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-5" staggerDelay={0.08}>
                  {[
                    {
                      step: '01',
                      title: 'Upload Brand Guidelines',
                      desc: 'Ingest PDFs or policy documents directly into your organisation workspace.',
                      icon: FileText,
                    },
                    {
                      step: '02',
                      title: 'Extract & Approve Rules',
                      desc: 'Groq AI structures rules with confidence scores for admin confirmation.',
                      icon: Sparkles,
                    },
                    {
                      step: '03',
                      title: 'Submit Marketing Content',
                      desc: 'Creators upload campaign posters, copy, and video assets for pre-flight checks.',
                      icon: Layers,
                    },
                    {
                      step: '04',
                      title: 'AI Compliance Analysis',
                      desc: 'Deterministic + LLM checks evaluate copy, colours, and Fact Vault claims.',
                      icon: AlertTriangle,
                    },
                    {
                      step: '05',
                      title: 'Human Review & Approval',
                      desc: 'Reviewers inspect cited evidence and approve or request revisions.',
                      icon: ShieldCheck,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <StaggerItem key={item.step}>
                        <motion.div
                          whileHover={{ y: -3 }}
                          transition={{ duration: 0.2 }}
                          className="h-full rounded-xl border border-slate-200 bg-[#F9FAFB] p-6 transition-colors hover:border-slate-300 hover:bg-white hover:shadow-sm"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-mono text-xs font-semibold text-slate-400">
                              {item.step}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                          <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.desc}</p>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              </div>
            </section>

            {/* ── Interactive Animated Product Pipeline Showcase ── */}
            <section id="capabilities" className="border-b border-slate-200/80 bg-[#F9FAFB] py-24">
              <div className="mx-auto max-w-6xl px-6">
                <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
                  <span className="kicker-accent mb-3">Interactive Product Showcase</span>
                  <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                    Watch the governance pipeline in action.
                  </h2>
                  <p className="mt-3 text-sm text-slate-600">
                    Click any stage below to step through guideline ingestion, sequential rule extraction, content scanning, and cited AI fixes.
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <AnimatedWorkflowDemo />
                </ScrollReveal>

                {/* Feature Cards */}
                <StaggerList className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3" staggerDelay={0.1}>
                  <StaggerItem>
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition-shadow hover:shadow-md"
                    >
                      <div>
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Cited Rulebook Extraction
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          Every extracted rule links back to its exact source paragraph and confidence score so admins only approve what matters.
                        </p>
                      </div>
                      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">Banned Superlatives</span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                            CONFIRMED · 94%
                          </span>
                        </div>
                        <p className="mt-2 border-l-2 border-sky-400 pl-2.5 font-mono text-[11px] text-slate-500">
                          &ldquo;Never use #1 or Best without independent lab certification.&rdquo;
                        </p>
                      </div>
                    </motion.div>
                  </StaggerItem>

                  <StaggerItem>
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition-shadow hover:shadow-md"
                    >
                      <div>
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <Database className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Fact Vault &amp; Expiry Guard
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          Store verified product claims, warranty terms, and certifications with automatic expiration enforcement.
                        </p>
                      </div>
                      <div className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs">
                          <span className="font-medium text-slate-800">12-Month Warranty</span>
                          <span className="font-mono text-[10px] font-semibold text-emerald-700">ACTIVE</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs">
                          <span className="font-medium text-slate-800">2024 Acoustic Award</span>
                          <span className="font-mono text-[10px] font-semibold text-rose-700">EXPIRED</span>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>

                  <StaggerItem>
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition-shadow hover:shadow-md"
                    >
                      <div>
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                          <Eye className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Human-in-the-Loop Approval
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          Creators apply one-click AI diff fixes; compliance reviewers inspect evidence and record final sign-off in the audit log.
                        </p>
                      </div>
                      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">Reviewer Sign-off</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                            <Check className="h-3 w-3" /> APPROVED
                          </span>
                        </div>
                        <div className="mt-2 text-[11px] text-slate-500">
                          Signed by Marcus Vance · Logged to immutable audit trail
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                </StaggerList>
              </div>
            </section>

            {/* ── Trust & Transparency Section ── */}
            <section id="trust" className="border-b border-slate-200/80 bg-white py-24">
              <div className="mx-auto max-w-6xl px-6">
                <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                  <ScrollReveal className="lg:col-span-6">
                    <span className="kicker-accent mb-3">Trust &amp; Transparency</span>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                      AI detects and explains. Humans decide and approve.
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-slate-600">
                      Black-box moderation scores aren&apos;t enough for regulated or enterprise brands. BrandLint pairs deterministic rule checks with Groq LLM reasoning so every single flag carries a human-readable citation.
                    </p>
                  </ScrollReveal>

                  <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-6" staggerDelay={0.07}>
                    {[
                      {
                        icon: FileText,
                        title: 'Zero Uncited Flags',
                        desc: 'Every issue points directly to an approved rule or Fact Vault claim.',
                      },
                      {
                        icon: Lock,
                        title: 'Tenant Isolation',
                        desc: 'Role permissions and assets stay strictly scoped to each organisation.',
                      },
                      {
                        icon: CheckCircle2,
                        title: 'Explicit Human Sign-off',
                        desc: 'AI never auto-publishes or overrides reviewer governance decisions.',
                      },
                      {
                        icon: ShieldCheck,
                        title: 'Immutable Audit Trail',
                        desc: 'Every extraction, edit, fix, and review decision is timestamped.',
                      },
                    ].map((card) => {
                      const Icon = card.icon;
                      return (
                        <StaggerItem key={card.title}>
                          <motion.div
                            whileHover={{ y: -2 }}
                            className="h-full rounded-xl border border-slate-200 bg-[#F9FAFB] p-5 transition-colors hover:border-slate-300 hover:bg-white"
                          >
                            <Icon className="mb-3 h-4 w-4 text-sky-600" />
                            <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{card.desc}</p>
                          </motion.div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerList>
                </div>
              </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="bg-[#F9FAFB] py-24">
              <ScrollReveal className="mx-auto max-w-3xl px-6 text-center">
                <h2 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Ready to govern your brand with precision?
                </h2>
                <p className="mt-4 text-base text-slate-600">
                  Explore the live workspace with preconfigured Admin, Creator, and Reviewer roles—no signup required.
                </p>
                <div className="mt-8 flex justify-center">
                  <motion.button
                    type="button"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => goToView('select-profile')}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                  >
                    Try Demo
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                </div>
              </ScrollReveal>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-slate-200 bg-white py-8">
              <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                <div className="flex items-center gap-2">
                  <Image src="/brandlint-mark.png" alt="" width={168} height={120} className="h-5 w-auto object-contain" />
                  <span className="font-serif text-sm font-bold text-slate-900">BrandLint</span>
                </div>
                <p className="text-xs text-slate-500">
                  AI-powered brand governance · AI detects and explains. Humans decide and approve.
                </p>
              </div>
            </footer>
          </main>
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            VIEW 2: SIMPLIFIED DEMO PROFILE SELECTION
        ════════════════════════════════════════════════════════════════════════ */}
        {view === 'select-profile' && (
          <PageTransition key="view-select-profile" className="mx-auto max-w-4xl px-6 py-16 md:py-24">
            <div className="text-center">
              <span className="kicker-accent mb-3">Interactive Demo</span>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Select a Demo Profile
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600">
                Choose a persona to enter BrandLint. You can switch profiles anytime inside the workspace.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {SEEDED_USERS.map((user, idx) => {
                const roleStyle = ROLE_STYLE[user.role as OrgRole] || ROLE_STYLE.admin;
                const firstName = user.name.split(' ')[0];

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.4, ease: EASE_OUT_EXPO }}
                    whileHover={{ y: -4 }}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-shadow hover:border-slate-300 hover:shadow-md"
                  >
                    <div>
                      <div className="mb-5 flex items-center justify-between">
                        <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center font-serif text-xl font-bold text-slate-700">
                              {user.name[0]}
                            </span>
                          )}
                        </div>
                        <span
                          className="badge"
                          style={{
                            background: roleStyle.bg,
                            color: roleStyle.color,
                            borderColor: roleStyle.border,
                          }}
                        >
                          {user.role}
                        </span>
                      </div>

                      <h2 className="font-serif text-xl font-bold text-slate-900">
                        {user.name}
                      </h2>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPersona(user)}
                      className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      Continue as {firstName}
                      <ArrowRight className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </PageTransition>
        )}

        {/* ════════════════════════════════════════════════════════════════════════
            VIEW 3: ORGANISATION SELECTION (TWO-OPTION FOCUS)
        ════════════════════════════════════════════════════════════════════════ */}
        {view === 'select-workspace' && (
          <PageTransition key="view-select-workspace" className="mx-auto max-w-4xl px-6 py-14 md:py-20">
            {deletedBanner && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Workspace <strong>&ldquo;{deletedBanner}&rdquo;</strong> was permanently deleted.
                </span>
              </motion.div>
            )}

            <div className="mb-8">
              <span className="kicker-accent mb-2">Organisation Workspace</span>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
                Choose how to continue
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Create a new governed workspace as Admin or join an existing organisation with an invite link.
              </p>
            </div>

            {/* Primary Two-Option Interface */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <motion.button
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowCreate(true)}
                className="group flex flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-xs transition-all hover:border-slate-900 hover:shadow-md"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white transition-transform group-hover:scale-105">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Create Organisation</h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Launch a dedicated brand workspace and automatically become its administrator.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  Create new workspace <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowJoin(true)}
                className="group flex flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-xs transition-all hover:border-sky-600 hover:shadow-md"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-transform group-hover:scale-105">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Join Organisation</h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Paste an invitation token or link to join an existing team with your assigned role.
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600">
                  Enter invite token <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </motion.button>
            </div>

            {/* Available Workspaces List */}
            <div className="mt-12">
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Your Workspaces ({organizations.length})
                </h3>
              </div>

              {loadingOrgs ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading workspaces…
                </div>
              ) : orgsError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-800">
                  <p className="font-medium">{orgsError}</p>
                  <button
                    type="button"
                    onClick={fetchOrgs}
                    className="mt-3 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                  >
                    Retry
                  </button>
                </div>
              ) : organizations.length > 0 ? (
                <div className="space-y-3">
                  {organizations.map((org, idx) => {
                    const rs = org.role && ROLE_STYLE[org.role] ? ROLE_STYLE[org.role] : ROLE_STYLE.creator;
                    return (
                      <motion.div
                        key={org.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3, ease: EASE_OUT_EXPO }}
                        whileHover={{ y: -2 }}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-serif text-lg font-bold text-slate-900">
                              {org.name}
                            </span>
                            {org.role && (
                              <span
                                className="badge"
                                style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}
                              >
                                {org.role}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {org.description || `${org.member_count ?? 1} member(s)`}
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onEnterOrg(org.id)}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                        >
                          Enter Workspace
                          <ArrowRight className="h-3.5 w-3.5" />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                  No workspaces found for this profile yet. Click <strong>Create Organisation</strong> above to get started.
                </div>
              )}
            </div>
          </PageTransition>
        )}

      {/* ── Animated Modals ── */}
      <AnimatedModalShell isOpen={showJoin} onClose={() => setShowJoin(false)}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-serif text-lg font-bold text-slate-900">Join an Organisation</h3>
          <button
            type="button"
            onClick={() => setShowJoin(false)}
            aria-label="Close modal"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">
          {joinError && <ErrBox msg={joinError} />}
          <form onSubmit={handleJoin} className="space-y-4">
            <Field label="Invitation Token or Link">
              <input
                type="text"
                placeholder="Token or full invite URL"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
              />
            </Field>
            <BtnRow>
              <Btn onClick={() => setShowJoin(false)}>Cancel</Btn>
              <Btn primary disabled={joining || !inviteToken.trim()} type="submit">
                {joining && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Join Organisation
              </Btn>
            </BtnRow>
          </form>
        </div>
      </AnimatedModalShell>

      <AnimatedModalShell isOpen={showCreate} onClose={() => setShowCreate(false)}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-serif text-lg font-bold text-slate-900">Create New Organisation</h3>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            aria-label="Close modal"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">
          {createError && <ErrBox msg={createError} />}
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Organisation Name *">
              <input
                type="text"
                placeholder="e.g. Apex Media Group"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                rows={2}
                placeholder="Brand unit or division…"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
              />
            </Field>
            <BtnRow>
              <Btn onClick={() => setShowCreate(false)}>Cancel</Btn>
              <Btn primary disabled={creating || !createName.trim()} type="submit">
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Organisation
              </Btn>
            </BtnRow>
          </form>
        </div>
      </AnimatedModalShell>
    </div>
  );
};

/* ── Helpers ──────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="kicker mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function BtnRow({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2.5 pt-2">{children}</div>;
}

function Btn({
  children,
  primary,
  onClick,
  disabled,
  type,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <motion.button
      type={type || 'button'}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
        primary
          ? 'bg-slate-900 text-white hover:bg-slate-800'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </motion.button>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
      {msg}
    </div>
  );
}
