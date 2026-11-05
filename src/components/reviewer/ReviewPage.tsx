import React, { useState } from 'react';
import { Eye, CheckCircle2, XCircle, Clock, AlertTriangle, Send, X } from 'lucide-react';
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

function riskColor(score: number): string {
  if (score >= 75) return 'bg-red-50 text-red-700';
  if (score >= 40) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  brand,
  currentUser,
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

  const renderRow = (sub: Submission, showActions: boolean) => (
    <div
      key={sub.id}
      className="flex items-center justify-between py-3 px-4 border border-slate-200 rounded-lg bg-white"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{sub.title}</p>
          <p className="text-xs text-slate-500">
            {sub.creator_name ?? 'Unknown'} · {timeAgo(sub.created_at)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${riskColor(sub.risk_score)}`}>
          {sub.risk_score}
        </span>

        {sub.review_status === 'approved' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        )}
        {sub.review_status === 'changes_requested' && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
            <XCircle className="w-3 h-3" /> Changes
          </span>
        )}

        {showActions && (
          <>
            <button
              onClick={() => onSelectSubmission(sub.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Inspect
            </button>
            <button
              onClick={() => setDecidingId(sub.id)}
              className="inline-flex items-center gap-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
            >
              Decide
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-base font-semibold text-slate-900">Review Queue</h1>
        {pending.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Awaiting Review */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Awaiting Review
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No submissions awaiting review.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((sub) => (
              <React.Fragment key={sub.id}>
                {renderRow(sub, true)}

                {/* Inline decide modal */}
                {decidingId === sub.id && (
                  <div className="border border-blue-200 rounded-lg bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">Review Decision</p>
                      <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setDecision('approve')}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border transition-colors ${
                          decision === 'approve'
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => setDecision('request_changes')}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md border transition-colors ${
                          decision === 'request_changes'
                            ? 'border-red-400 bg-red-50 text-red-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Request Changes
                      </button>
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment…"
                      rows={2}
                      className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none bg-white"
                    />

                    <button
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Review
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </section>

      {/* Decided */}
      {decided.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Decided
          </h2>
          <div className="space-y-2">
            {decided.map((sub) => renderRow(sub, false))}
          </div>
        </section>
      )}
    </div>
  );
};
