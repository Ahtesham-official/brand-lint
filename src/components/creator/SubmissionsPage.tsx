import React from 'react';
import { FileText } from 'lucide-react';
import type { Submission } from '@/types';

interface SubmissionsPageProps {
  submissions: Submission[];
  onSelectSubmission: (id: string) => void;
}

const severityColor = (level?: string): string => {
  switch (level) {
    case 'Critical':
    case 'High':
      return 'bg-red-50 text-red-700';
    case 'Moderate':
      return 'bg-amber-50 text-amber-700';
    case 'Low':
      return 'bg-green-50 text-green-700';
    default:
      return 'bg-slate-50 text-slate-600';
  }
};

const reviewStatusStyle = (status?: string): string => {
  switch (status) {
    case 'approved':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'changes_requested':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'pending':
      return 'bg-slate-50 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};

const reviewStatusLabel = (status?: string): string => {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'changes_requested':
      return 'Changes Requested';
    case 'pending':
      return 'Pending Review';
    default:
      return 'Draft';
  }
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
}) => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-base font-semibold text-slate-900">
          Submissions
          <span className="ml-2 text-xs font-normal text-slate-400">
            {submissions.length}
          </span>
        </h1>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-8 h-8 text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">No submissions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <button
              key={sub.id}
              onClick={() => onSelectSubmission(sub.id)}
              className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {sub.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {sub.caption.length > 80
                      ? sub.caption.slice(0, 80) + '…'
                      : sub.caption}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Risk score badge */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityColor(sub.risk_level)}`}
                  >
                    {sub.risk_score}
                  </span>

                  {/* Review status pill */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${reviewStatusStyle(sub.review_status)}`}
                  >
                    {reviewStatusLabel(sub.review_status)}
                  </span>

                  {/* Time */}
                  <span className="text-xs text-slate-400 w-14 text-right">
                    {formatTime(sub.created_at)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmissionsPage;
