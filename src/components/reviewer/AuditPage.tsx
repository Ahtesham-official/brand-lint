import React from 'react';
import { FileText, Shield, AlertCircle, Upload, Search, Wrench, CheckSquare } from 'lucide-react';
import { AuditLog } from '@/types';

interface AuditPageProps {
  auditLogs: AuditLog[];
}

const ACTION_META: Record<
  AuditLog['action'],
  { label: string; icon: React.ElementType; color: string }
> = {
  guideline_extracted: { label: 'Guideline Extracted', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
  guideline_confirmed: { label: 'Guideline Confirmed', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50' },
  rule_updated: { label: 'Rule Updated', icon: Shield, color: 'text-amber-600 bg-amber-50' },
  submission_created: { label: 'Submission Created', icon: Upload, color: 'text-blue-600 bg-blue-50' },
  submission_analyzed: { label: 'Submission Analyzed', icon: Search, color: 'text-violet-600 bg-violet-50' },
  fix_applied: { label: 'Fix Applied', icon: Wrench, color: 'text-teal-600 bg-teal-50' },
  submission_reviewed: { label: 'Submission Reviewed', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
};

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export const AuditPage: React.FC<AuditPageProps> = ({ auditLogs }) => {
  const sorted = [...auditLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-base font-semibold text-slate-900 mb-6">Audit Log</h1>

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">No audit entries yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((log) => {
            const meta = ACTION_META[log.action] ?? {
              label: log.action,
              icon: FileText,
              color: 'text-slate-600 bg-slate-50',
            };
            const Icon = meta.icon;

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 py-3 px-4 border border-slate-200 rounded-lg bg-white"
              >
                {/* Icon */}
                <div className={`mt-0.5 p-1.5 rounded-md ${meta.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">{meta.label}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-600">
                      {log.actor_name}{' '}
                      <span className="text-slate-400">({roleLabel(log.actor_role)})</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-0.5">{formatTimestamp(log.created_at)}</p>

                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <pre className="mt-2 text-[11px] leading-relaxed text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-3 py-2 overflow-x-auto">
                      {JSON.stringify(log.meta, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
