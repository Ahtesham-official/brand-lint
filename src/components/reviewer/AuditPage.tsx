import React from 'react';
import { FileText, Shield, AlertCircle, Upload, Search, Wrench, CheckSquare } from 'lucide-react';
import { AuditLog } from '@/types';

interface AuditPageProps {
  auditLogs: AuditLog[];
}

const ACTION_META: Record<AuditLog['action'], { label: string; icon: React.ElementType }> = {
  guideline_extracted: { label: 'Guideline Extracted', icon: FileText },
  guideline_confirmed: { label: 'Guideline Confirmed', icon: CheckSquare },
  rule_updated:        { label: 'Rule Updated',        icon: Shield },
  submission_created:  { label: 'Submission Created',  icon: Upload },
  submission_analyzed: { label: 'Submission Analyzed', icon: Search },
  fix_applied:         { label: 'Fix Applied',         icon: Wrench },
  submission_reviewed: { label: 'Submission Reviewed', icon: AlertCircle },
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

export const AuditPage: React.FC<AuditPageProps> = ({ auditLogs }) => {
  const sorted = [...auditLogs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-sans text-slate-900">
      {/* ── Page Header ── */}
      <div className="border-b border-slate-200 pb-6">
        <span className="kicker-accent mb-1.5">Immutable Record</span>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {sorted.length} recorded events tracking guideline updates, AI analysis runs, and human decisions.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="saas-card p-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No audit entries recorded yet.</p>
        </div>
      ) : (
        <div className="saas-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Entity Reference</th>
                  <th className="text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((log) => {
                  const meta = ACTION_META[log.action] ?? {
                    label: log.action,
                    icon: FileText,
                  };
                  const Icon = meta.icon;

                  return (
                    <tr key={log.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                            <Icon className="h-3.5 w-3.5 text-slate-600" />
                          </div>
                          <span className="text-xs font-semibold text-slate-900">{meta.label}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-800">{log.actor_name}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[9px] uppercase text-slate-500">
                            {log.actor_role}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-slate-500">{log.entity_id}</span>
                      </td>
                      <td className="text-right font-mono text-xs text-slate-400">
                        {formatTimestamp(log.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
