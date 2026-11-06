import React, { useState, useRef } from 'react';
import {
  Upload, FileText, X, Loader2, FileUp, Sparkles,
  CheckCircle2, Split, Trash2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Guideline, Rule, GuidelineStatus } from '@/types';
import { RAW_GUIDELINE_SAMPLE } from '@/data/seedData';
import { GuidelineDetailModal } from './GuidelineDetailModal';

interface GuidelinesPageProps {
  guidelines: Guideline[];
  rules: Rule[];
  onAddGuideline: (filename: string, raw_text: string) => Guideline | Promise<Guideline>;
  onExtractRules: (id: string) => Promise<void>;
  onConfirmGuideline: (id: string) => void;
  onSelectVersion?: (guidelineId: string, version: 'original' | 'enhanced') => Promise<void>;
  onDeleteGuideline?: (id: string) => Promise<void>;
  onToggleGuideline?: (id: string, enabled: boolean) => Promise<void>;
}

const STATUS: Record<GuidelineStatus, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: '#fef3c7', color: '#92400e', border: '#fcd34d',  label: 'Pending' },
  extracted: { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe',  label: 'Extracted' },
  confirmed: { bg: '#f0fdf4', color: '#15803d', border: '#86efac',  label: 'Confirmed' },
  disabled:  { bg: 'var(--paper-mid)', color: 'var(--ink-faint)', border: 'var(--rule)', label: 'Disabled' },
};

const GuidelinesPage: React.FC<GuidelinesPageProps> = ({
  guidelines, rules, onAddGuideline, onExtractRules,
  onConfirmGuideline, onSelectVersion, onDeleteGuideline, onToggleGuideline,
}) => {
  const [showModal, setShowModal]           = useState(false);
  const [selectedGuideline, setSelected]    = useState<Guideline | null>(null);
  const [filename, setFilename]             = useState('Apex_Brand_Guidelines_v2.4.pdf');
  const [rawText, setRawText]               = useState(RAW_GUIDELINE_SAMPLE);
  const [extractingId, setExtractingId]     = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [togglingId, setTogglingId]         = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!filename.trim() || !rawText.trim()) return;
    await onAddGuideline(filename.trim(), rawText.trim());
    setFilename(''); setRawText(''); setShowModal(false);
  };

  const handleExtract = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); setExtractingId(id);
    try { await onExtractRules(id); } finally { setExtractingId(null); }
  };

  const handleDelete = async (gl: Guideline, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteGuideline || !window.confirm(`Delete "${gl.filename}" and all its rules?`)) return;
    setDeletingId(gl.id);
    try { await onDeleteGuideline(gl.id); } finally { setDeletingId(null); }
  };

  const handleToggle = async (gl: Guideline, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleGuideline) return;
    setTogglingId(gl.id);
    try { await onToggleGuideline(gl.id, !(gl.enabled !== false)); } finally { setTogglingId(null); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setFilename(file.name);
    const r = new FileReader();
    r.onload = (ev) => { if (ev.target?.result) setRawText(ev.target.result as string); };
    r.readAsText(file);
  };

  const rulesFor = (id: string) => rules.filter((r) => r.guideline_id === id).length;

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>

      {/* ── Page header ────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div className="kicker-accent" style={{ marginBottom: 8 }}>Brand Compliance System</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 34, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', lineHeight: 1 }}>
            Guideline Ingestion
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 8, fontWeight: 300 }}>
            Upload brand guidelines — AI extracts enforceable rules automatically.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'var(--btn-primary)', color: 'var(--white)', border: '1px solid var(--rule-dark)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <Upload style={{ width: 14, height: 14 }} /> Upload Guideline
        </button>
      </div>

      {/* ── Stats ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Total Documents',  value: guidelines.length },
          { label: 'Active Rules',     value: rules.filter(r => r.status === 'confirmed').length },
          { label: 'Confirmed Docs',   value: guidelines.filter(g => g.status === 'confirmed').length },
        ].map((s) => (
          <div key={s.label} style={{ padding: '20px 22px', background: 'var(--white)', border: '1px solid var(--rule)' }}>
            <div className="kicker" style={{ marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Table ──────────────────────────────── */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--rule)' }}>
        {guidelines.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <FileText style={{ width: 32, height: 32, color: 'var(--rule)', margin: '0 auto 12px' }} />
            <div className="kicker" style={{ marginBottom: 6, textAlign: 'center' }}>No Guidelines Yet</div>
            <p style={{ fontSize: 14, color: 'var(--ink-faint)' }}>Upload a guideline document to begin.</p>
          </div>
        ) : (
          <table className="ed-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Uploaded</th>
                <th>Version</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Rules</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {guidelines.map((gl) => {
                const selectedVer = gl.selected_version || 'original';
                const isEnabled   = gl.enabled !== false;
                const st          = STATUS[isEnabled ? gl.status : 'disabled'] ?? STATUS.disabled;

                return (
                  <tr key={gl.id} onClick={() => setSelected(gl)} style={{ cursor: 'pointer', opacity: isEnabled ? 1 : 0.6 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, background: isEnabled ? 'var(--paper-mid)' : 'var(--paper-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--rule)' }}>
                          <FileText style={{ width: 15, height: 15, color: isEnabled ? 'var(--ink-mid)' : 'var(--ink-faint)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{gl.filename}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                            {gl.raw_text ? `${gl.raw_text.length.toLocaleString()} chars` : '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-light)' }}>
                      {new Date(gl.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <span className="badge" style={{ background: selectedVer === 'enhanced' ? '#fef3c7' : 'transparent', color: selectedVer === 'enhanced' ? '#92400e' : 'var(--ink-faint)', borderColor: selectedVer === 'enhanced' ? '#fcd34d' : 'var(--rule)' }}>
                        {selectedVer}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                      {rulesFor(gl.id)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                        {/* Review */}
                        <Chip onClick={() => setSelected(gl)} icon={<Split style={{ width: 11, height: 11 }} />}>Review</Chip>

                        {/* Extract */}
                        {gl.status === 'pending' && isEnabled && (
                          <Chip onClick={(e) => handleExtract(gl.id, e)} color="info" icon={
                            extractingId === gl.id
                              ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
                              : <Sparkles style={{ width: 11, height: 11 }} />
                          }>
                            {extractingId === gl.id ? 'Working…' : 'Extract'}
                          </Chip>
                        )}

                        {/* Confirm */}
                        {gl.status === 'extracted' && isEnabled && (
                          <Chip onClick={(e) => { e.stopPropagation(); onConfirmGuideline(gl.id); }} color="success" icon={<CheckCircle2 style={{ width: 11, height: 11 }} />}>
                            Confirm
                          </Chip>
                        )}

                        {/* Toggle */}
                        {onToggleGuideline && (
                          <Chip
                            onClick={(e) => handleToggle(gl, e)}
                            color={isEnabled ? 'success' : 'default'}
                            icon={togglingId === gl.id
                              ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
                              : isEnabled ? <ToggleRight style={{ width: 11, height: 11 }} /> : <ToggleLeft style={{ width: 11, height: 11 }} />}
                          >
                            {isEnabled ? 'On' : 'Off'}
                          </Chip>
                        )}

                        {/* Delete */}
                        {onDeleteGuideline && (
                          <Chip onClick={(e) => handleDelete(gl, e)} color="danger" icon={
                            deletingId === gl.id
                              ? <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
                              : <Trash2 style={{ width: 11, height: 11 }} />
                          } />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Upload modal ──────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.55)', padding: 24 }}>
          <div className="animate-in" style={{ background: 'var(--white)', border: '1px solid var(--rule)', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="kicker-accent" style={{ marginBottom: 4 }}>Ingestion — FR-3.1</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: 0 }}>Upload Guideline</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* File drop */}
              <input type="file" ref={fileInputRef} onChange={handleFile} accept=".pdf,.txt,.md" style={{ display: 'none' }} />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: '1px dashed var(--rule)', padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--paper)' }}
              >
                <FileUp style={{ width: 22, height: 22, color: 'var(--ink-faint)', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-mid)', marginBottom: 4 }}>Click to browse or drop file</div>
                <div className="kicker" style={{ textAlign: 'center', color: 'var(--ink-faint)' }}>PDF · TXT · MD — max 10 MB</div>
              </div>

              {/* Filename */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <label className="kicker">Filename</label>
                  <button onClick={() => { setFilename('Apex_Brand_Guidelines_v2.4.pdf'); setRawText(RAW_GUIDELINE_SAMPLE); }} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Load Sample ↓
                  </button>
                </div>
                <input type="text" value={filename} onChange={e => setFilename(e.target.value)} placeholder="e.g. Brand_Guidelines_v2.pdf" style={iStyle()} />
              </div>

              {/* Content */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <label className="kicker">Guideline Content</label>
                  <span className="kicker">{rawText.length.toLocaleString()} chars</span>
                </div>
                <textarea value={rawText} onChange={e => setRawText(e.target.value)} placeholder="Paste brand guideline content here…" rows={8} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6 }} />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--paper)' }}>
              <button onClick={() => setShowModal(false)} style={ghostBtn()}>Cancel</button>
              <button onClick={handleSubmit} disabled={!filename.trim() || !rawText.trim()} style={solidBtn(!filename.trim() || !rawText.trim())}>
                Save &amp; Prepare Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail modal ──────────────────────── */}
      {selectedGuideline && (
        <GuidelineDetailModal
          guideline={selectedGuideline}
          rules={rules}
          isOpen
          onClose={() => setSelected(null)}
          onConfirmGuideline={(id) => { onConfirmGuideline(id); setSelected(null); }}
          onSelectVersion={async (glId, ver) => {
            if (onSelectVersion) {
              await onSelectVersion(glId, ver);
              const updated = guidelines.find(g => g.id === glId);
              if (updated) setSelected({ ...updated, selected_version: ver });
            }
          }}
        />
      )}
    </div>
  );
};

/* ── Action chip ───────────────────────────────────────────────── */
const CHIP_COLORS = {
  default: { bg: 'var(--paper-mid)', color: 'var(--ink-mid)', border: 'var(--rule)' },
  info:    { bg: '#eff6ff',         color: '#1e40af',        border: '#bfdbfe' },
  success: { bg: '#f0fdf4',         color: '#15803d',        border: '#86efac' },
  danger:  { bg: '#fef2f2',         color: '#b91c1c',        border: '#fca5a5' },
};

function Chip({ children, icon, onClick, color = 'default' }: { children?: React.ReactNode; icon?: React.ReactNode; onClick?: (e: React.MouseEvent) => void; color?: keyof typeof CHIP_COLORS }) {
  const c = CHIP_COLORS[color];
  return (
    <button
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}
    >
      {icon}{children}
    </button>
  );
}

function iStyle(): React.CSSProperties {
  return { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)' };
}
function ghostBtn(): React.CSSProperties {
  return { padding: '9px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'var(--ink-mid)', border: '1px solid var(--rule)' };
}
function solidBtn(disabled: boolean): React.CSSProperties {
  return { padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--btn-primary)', color: 'var(--white)', border: '1px solid var(--rule-dark)', opacity: disabled ? 0.4 : 1 };
}

export default GuidelinesPage;
