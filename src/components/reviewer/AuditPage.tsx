import React from 'react';
import { FileText, Shield, AlertCircle, Upload, Search, Wrench, CheckSquare } from 'lucide-react';
import { AuditLog } from '@/types';

interface AuditPageProps {
  auditLogs: AuditLog[];
}

const ACTION_META: Record<
  AuditLog['action'],
  { label: string; icon: React.ElementType }
> = {
  guideline_extracted: { label: 'Guideline Extracted', icon: FileText },
  guideline_confirmed: { label: 'Guideline Confirmed', icon: CheckSquare },
  rule_updated: { label: 'Rule Updated', icon: Shield },
  submission_created: { label: 'Submission Created', icon: Upload },
  submission_analyzed: { label: 'Submission Analyzed', icon: Search },
  fix_applied: { label: 'Fix Applied', icon: Wrench },
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
    <div style={{ maxWidth: 860, margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div className="kicker-accent" style={{ marginBottom: 8 }}>Immutable Record</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 34, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', lineHeight: 1 }}>
            Audit Log
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 8, fontWeight: 300 }}>
            {sorted.length} recorded events tracking brand guideline changes, analysis runs, and decisions.
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--white)', border: '1px solid var(--rule)' }}>
          <p style={{ fontSize: 14, color: 'var(--ink-faint)', margin: 0 }}>No audit entries recorded yet.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--rule)' }}>
          <table className="ed-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Entity Reference</th>
                <th style={{ textAlign: 'right' }}>Timestamp</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, background: 'var(--paper-mid)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 13, height: 13, color: 'var(--ink-mid)' }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{meta.label}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontSize: 13, color: 'var(--ink)' }}>{log.actor_name}</span>
                        <span className="kicker" style={{ marginTop: 2 }}>{log.actor_role}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-light)' }}>
                        {log.entity}:{log.entity_id.slice(0, 16)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>
                      {formatTimestamp(log.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
