import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Database,
  FileText,
  Eye,
  PenTool,
  ShieldCheck,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Activity,
} from 'lucide-react';
import type { Brand, User, Rule, Fact, Submission, AuditLog } from '@/types';
import type { Page } from '@/components/layout/Sidebar';
import { AnimatedCounter, EASE_OUT_EXPO } from '@/components/motion/MotionPrimitives';

interface DashboardPageProps {
  brand: Brand;
  currentUser: User;
  activeOrgId: string | null;
  rules: Rule[];
  facts: Fact[];
  submissions: Submission[];
  auditLogs: AuditLog[];
  onNavigate: (page: Page) => void;
  onSelectSubmission: (id: string) => void;
}

const RISK_PILL: Record<string, string> = {
  Critical: 'border-rose-200 bg-rose-50 text-rose-700',
  High:     'border-rose-200 bg-rose-50 text-rose-700',
  Moderate: 'border-amber-200 bg-amber-50 text-amber-700',
  Low:      'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  brand,
  currentUser,
  activeOrgId,
  rules,
  facts,
  submissions,
  auditLogs,
  onNavigate,
  onSelectSubmission,
}) => {
  const confirmedRules = rules.filter((r) => r.status === 'confirmed').length;
  const activeFacts = facts.filter((f) => f.status === 'active').length;
  const pendingReviews = submissions.filter((s) => !s.review_status || s.review_status === 'pending');
  const avgRisk =
    submissions.length > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.risk_score || 0), 0) / submissions.length)
      : 0;

  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentLogs = [...auditLogs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-sans text-slate-900">
      {/* ── Page Header ── */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="kicker-accent mb-1.5">Workspace Overview</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            {brand.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as <strong className="font-medium text-slate-800">{currentUser.name}</strong> ({currentUser.role}) · AI detects and explains. Humans decide and approve.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {currentUser.role === 'admin' && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('guidelines')}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <FileText className="h-3.5 w-3.5" />
                Upload Guideline
              </button>
              {activeOrgId && (
                <Link
                  href={`/orgs/${activeOrgId}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Org Settings
                </Link>
              )}
            </>
          )}
          {currentUser.role === 'creator' && (
            <button
              type="button"
              onClick={() => onNavigate('submit')}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <PenTool className="h-3.5 w-3.5" />
              New Compliance Check
            </button>
          )}
          {currentUser.role === 'reviewer' && (
            <button
              type="button"
              onClick={() => onNavigate('review')}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Eye className="h-3.5 w-3.5" />
              Open Review Queue ({pendingReviews.length})
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Stats Grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Confirmed Rules"
          value={confirmedRules}
          sub={`${rules.length} total extracted`}
          icon={BookOpen}
          tone="sky"
        />
        <StatCard
          label="Active Facts"
          value={activeFacts}
          sub={`${facts.length} in Fact Vault`}
          icon={Database}
          tone="emerald"
        />
        <StatCard
          label="Pending Reviews"
          value={pendingReviews.length}
          sub={`${submissions.length} total submissions`}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Avg. Risk Score"
          value={`${avgRisk}`}
          sub="Out of 100 risk index"
          icon={ShieldCheck}
          tone="slate"
        />
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Recent Submissions + Pending Reviews */}
        <div className="space-y-6 lg:col-span-7">
          {/* Recent Submissions */}
          <div className="saas-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Recent Submissions</h2>
                <p className="text-xs text-slate-500">Latest marketing assets evaluated by BrandLint</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(currentUser.role === 'reviewer' ? 'review' : 'submissions')}
                className="btn-plain inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {recentSubmissions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No submissions yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Submit a poster, caption, or video to run an AI compliance check.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSubmissions.map((sub, idx) => {
                  const riskCls = RISK_PILL[sub.risk_level || 'Low'] || RISK_PILL.Low;
                  return (
                    <motion.button
                      key={sub.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.28, ease: EASE_OUT_EXPO }}
                      onClick={() => onSelectSubmission(sub.id)}
                      className="btn-plain flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {sub.title}
                          </span>
                          <span className={`badge ${riskCls}`}>
                            {sub.risk_score ?? 0} · {sub.risk_level || 'Low'}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {sub.creator_name || 'Creator'} · {timeAgo(sub.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase text-slate-600">
                          {sub.review_status === 'approved'
                            ? 'Approved'
                            : sub.review_status === 'changes_requested'
                            ? 'Changes Req.'
                            : 'Pending'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Reviews */}
          <div className="saas-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Pending Human Reviews</h2>
                <p className="text-xs text-slate-500">Assets awaiting explicit reviewer sign-off</p>
              </div>
              <span className="badge border-amber-200 bg-amber-50 text-amber-700">
                {pendingReviews.length} Pending
              </span>
            </div>

            {pendingReviews.length === 0 ? (
              <div className="flex items-center gap-3 px-6 py-6 text-xs text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>All submitted assets have been reviewed.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReviews.slice(0, 4).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-4 px-6 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">{sub.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        <span>Risk score {sub.risk_score ?? 0}/100</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectSubmission(sub.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="lg:col-span-5">
          <div className="saas-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-sky-600" />
                <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
              </div>
              {(currentUser.role === 'admin' || currentUser.role === 'reviewer') && (
                <button
                  type="button"
                  onClick={() => onNavigate('audit')}
                  className="btn-plain text-xs font-semibold text-sky-600 hover:text-sky-700"
                >
                  Audit log
                </button>
              )}
            </div>

            {recentLogs.length === 0 ? (
              <div className="px-6 py-12 text-center text-xs text-slate-400">
                No recent governance events recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLogs.map((log) => (
                  <div key={log.id} className="px-6 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {log.action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {timeAgo(log.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {log.actor_name} · <span className="font-mono text-[11px]">{log.entity_id}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  tone: 'sky' | 'emerald' | 'amber' | 'slate';
}) {
  const toneMap = {
    sky:     'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    slate:   'bg-slate-100 text-slate-700',
  };

  const numericVal = typeof value === 'number' ? value : parseInt(String(value), 10);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="saas-card p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 font-serif text-3xl font-bold tracking-tight text-slate-900">
        {!Number.isNaN(numericVal) ? <AnimatedCounter value={numericVal} /> : value}
      </div>
      <div className="mt-1 text-xs text-slate-400">{sub}</div>
    </motion.div>
  );
}

