import React, { useState } from 'react';
import { Submission, Review, AuditLog, Brand, User } from '@/types';
import { 
  Eye, CheckCircle2, AlertOctagon, MessageSquare, Clock, ShieldCheck, 
  ArrowRight, UserCheck, History, ExternalLink 
} from 'lucide-react';

interface ReviewerDashboardProps {
  brand: Brand;
  currentUser: User;
  submissions: Submission[];
  auditLogs: AuditLog[];
  onSelectSubmission: (id: string) => void;
  onSubmitReview: (submissionId: string, decision: 'approve' | 'request_changes', comment: string) => void;
}

export const ReviewerDashboard: React.FC<ReviewerDashboardProps> = ({
  brand,
  currentUser,
  submissions,
  auditLogs,
  onSelectSubmission,
  onSubmitReview,
}) => {
  const [activeReviewSubId, setActiveReviewSubId] = useState<string | null>(null);
  const [decision, setDecision] = useState<'approve' | 'request_changes'>('approve');
  const [comment, setComment] = useState<string>(
    'Verified fixes: Warranty corrected to 12 months. Audio specs verified against Fact Vault. Approved for publishing.'
  );

  const pendingSubmissions = submissions.filter(
    (s) => s.status === 'analyzed' || s.review_status === 'pending'
  );
  const reviewedSubmissions = submissions.filter(
    (s) => s.review_status === 'approved' || s.review_status === 'changes_requested'
  );

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewSubId) return;
    onSubmitReview(activeReviewSubId, decision, comment);
    setActiveReviewSubId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Reviewer Workspace
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-sm font-medium text-slate-600">Brand Governance &amp; Decision Queue</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Review Queue &amp; Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Evaluate flagged issues, inspect cited evidence chains, and record authoritative approval decisions.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="font-bold text-slate-900 text-base">{pendingSubmissions.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Awaiting Decision</div>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="font-bold text-emerald-600 text-base">{reviewedSubmissions.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Decided</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Submissions Awaiting Review */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Submissions Awaiting Review ({pendingSubmissions.length})</span>
              </h2>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No submissions currently waiting in the review queue. Switch to <strong>Creator</strong> role to submit a campaign!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{sub.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {sub.creator_name || 'Creator'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{sub.caption}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span>Risk Score: <strong className="text-rose-600">{sub.risk_score}/100</strong></span>
                        <span>•</span>
                        <span>Submitted: {new Date(sub.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        onClick={() => onSelectSubmission(sub.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        Inspect Report
                      </button>

                      <button
                        onClick={() => setActiveReviewSubId(sub.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Decide</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Decisions */}
          {reviewedSubmissions.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100 mb-3">
                Decided Submissions ({reviewedSubmissions.length})
              </h3>
              <div className="space-y-2.5">
                {reviewedSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onSelectSubmission(sub.id)}
                    className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{sub.title}</div>
                      <div className="text-[11px] text-slate-400">Risk Score: {sub.risk_score}/100</div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        sub.review_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.review_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Minimal Audit Log (FR-11.4) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-slate-900 text-sm">Minimal Event Log (FR-11.4)</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">v1 Minimal Trail</span>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 font-mono text-[11px]">
                      {log.action.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    Actor: <strong className="text-slate-900">{log.actor_name}</strong> ({log.actor_role})
                  </div>

                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <div className="p-1.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 overflow-x-auto">
                      {JSON.stringify(log.meta)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW DECISION MODAL */}
      {activeReviewSubId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">Authoritative Review Decision</h3>
              <button onClick={() => setActiveReviewSubId(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Review Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('approve')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      decision === 'approve'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Approve Submission</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision('request_changes')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      decision === 'request_changes'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    <span>Request Changes</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reviewer Comment &amp; Governance Notes
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReviewSubId(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-lg text-white text-xs font-bold shadow-sm transition-all ${
                    decision === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirm {decision === 'approve' ? 'Approval' : 'Changes Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
