import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, Video, Image as ImageIcon } from 'lucide-react';
import type { Submission, User } from '@/types';
import { EASE_OUT_EXPO } from '@/components/motion/MotionPrimitives';

interface SubmissionsPageProps {
  submissions: Submission[];
  onSelectSubmission: (id: string) => void;
  currentUser?: User;
}

const RISK_PILL: Record<string, string> = {
  Critical: 'border-rose-200 bg-rose-50 text-rose-700',
  High:     'border-rose-200 bg-rose-50 text-rose-700',
  Moderate: 'border-amber-200 bg-amber-50 text-amber-700',
  Low:      'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SubmissionsPage: React.FC<SubmissionsPageProps> = ({
  submissions,
  onSelectSubmission,
  currentUser,
}) => {
  const displayedSubmissions =
    currentUser && currentUser.role === 'creator'
      ? submissions.filter((s) => s.creator_id === currentUser.id || s.creator_name === currentUser.name)
      : submissions;

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-sans text-slate-900">
      {/* ── Page Header ── */}
      <div className="border-b border-slate-200 pb-6">
        <span className="kicker-accent mb-1.5">Compliance Archive</span>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
          {currentUser?.role === 'creator' ? 'My Submissions' : 'All Submissions'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {displayedSubmissions.length} content checks{' '}
          {currentUser?.role === 'creator' ? 'submitted by you.' : 'submitted for brand governance review.'}
        </p>
      </div>

      {/* ── List ── */}
      {displayedSubmissions.length === 0 ? (
        <div className="saas-card p-16 text-center">
          <FileText className="mx-auto mb-3 h-9 w-9 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No submissions found</p>
          <p className="mt-1 text-xs text-slate-400">
            Run a new content check to see compliance reports here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedSubmissions.map((sub, idx) => {
            const riskCls = RISK_PILL[sub.risk_level || 'Low'] || RISK_PILL.Low;
            const isVideo = sub.media_type === 'video' || !!sub.video_url;

            return (
              <motion.button
                key={sub.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -2 }}
                onClick={() => onSelectSubmission(sub.id)}
                className="saas-card saas-card-interactive btn-plain flex w-full flex-col justify-between gap-4 p-5 text-left sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                    {sub.image_url ? (
                      <img src={sub.image_url} alt={sub.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        {isVideo ? <Video className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {sub.title}
                      </span>
                      <span className={`badge ${riskCls}`}>
                        {sub.risk_score ?? 0} · {sub.risk_level || 'Low'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                        {isVideo ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                        {isVideo ? 'Video' : 'Image'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {sub.caption || sub.ocr_text || 'Video asset audit'} · {formatTime(sub.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`badge ${
                      sub.review_status === 'approved'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : sub.review_status === 'changes_requested'
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {sub.review_status === 'approved'
                      ? 'Approved'
                      : sub.review_status === 'changes_requested'
                      ? 'Changes Requested'
                      : 'Pending Review'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubmissionsPage;
