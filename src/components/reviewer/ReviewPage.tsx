import React, { useState } from 'react';
import { Eye, CheckCircle2, XCircle, Send, Video, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { Brand, User, Submission } from '@/types';

interface ReviewPageProps {
  brand: Brand;
  currentUser: User;
  submissions: Submission[];
  onSelectSubmission: (id: string) => void;
  onSubmitReview: (submissionId: string, decision: 'approve' | 'request_changes', comment: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  brand,
  submissions,
  onSelectSubmission,
  onSubmitReview,
}) => {
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'approve' | 'request_changes'>('approve');
  const [comment, setComment] = useState('');

  const pending = submissions.filter(
    (s) => s.review_status === 'pending' || !s.review_status
  );
  const decided = submissions.filter(
    (s) => s.review_status === 'approved' || s.review_status === 'changes_requested'
  );

  const handleSubmit = () => {
    if (!decidingId) return;
    onSubmitReview(decidingId, decision, comment);
    setDecidingId(null);
    setDecision('approve');
    setComment('');
  };

  const handleCancel = () => {
    setDecidingId(null);
    setDecision('approve');
    setComment('');
  };

  const renderRow = (sub: Submission, showActions: boolean) => {
    const isVideo = sub.media_type === 'video' || !!sub.video_url;
    const isDeciding = decidingId === sub.id;

    return (
      <div key={sub.id} className="saas-card overflow-hidden">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600">
                {isVideo ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                {isVideo ? 'Video' : 'Image'}
              </span>
              <span className="text-sm font-semibold text-slate-900">{sub.title}</span>
              <span
                className={`badge ${
                  (sub.risk_score ?? 0) >= 70
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : (sub.risk_score ?? 0) >= 40
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}
              >
                Risk {sub.risk_score ?? 0}/100
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">
              Submitted by {sub.creator_name || 'Creator'} · {timeAgo(sub.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectSubmission(sub.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-3.5 w-3.5" />
              Inspect Evidence
            </button>

            {showActions ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDecidingId(sub.id);
                    setDecision('approve');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecidingId(sub.id);
                    setDecision('request_changes');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Request Changes
                </button>
              </>
            ) : (
              <span
                className={`badge ${
                  sub.review_status === 'approved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {sub.review_status === 'approved' ? 'Approved' : 'Changes Requested'}
              </span>
            )}
          </div>
        </div>

        {/* Inline Decision Drawer */}
        {isDeciding && (
          <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                {decision === 'approve' ? 'Confirm Approval' : 'Request Changes'} — Add Review Comment
              </span>
              <span className="font-mono text-[10px] text-slate-400">Logged to Audit Trail</span>
            </div>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                decision === 'approve'
                  ? 'Optional sign-off note...'
                  : 'Specify required revisions based on cited brand rules...'
              }
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none focus:border-sky-500"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white ${
                  decision === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Send className="h-3 w-3" />
                Submit Decision
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 font-sans text-slate-900">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="kicker-accent mb-1.5">Human-in-the-Loop Governance</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            Review Queue
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inspect evidence-backed AI findings for <strong className="font-medium text-slate-800">{brand.name}</strong> and record final approval.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
          AI detects and explains. Humans decide and approve.
        </div>
      </div>

      {/* ── Pending Queue ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pending Review ({pending.length})
          </h2>
        </div>

        {pending.length === 0 ? (
          <div className="saas-card p-10 text-center">
            <CheckCircle2 className="mx-auto mb-2.5 h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium text-slate-700">Queue is clear</p>
            <p className="mt-1 text-xs text-slate-400">
              All submitted assets have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">{pending.map((sub) => renderRow(sub, true))}</div>
        )}
      </section>

      {/* ── Review History ── */}
      {decided.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Review History ({decided.length})
          </h2>
          <div className="space-y-3">{decided.map((sub) => renderRow(sub, false))}</div>
        </section>
      )}
    </div>
  );
};
