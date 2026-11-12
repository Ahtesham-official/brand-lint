import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Loader2,
  FileUp,
  Sparkles,
  CheckCircle2,
  Split,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Fact, Guideline, Rule, GuidelineStatus } from '@/types';
import { RAW_GUIDELINE_SAMPLE } from '@/data/seedData';
import { GuidelineDetailModal } from './GuidelineDetailModal';

interface ExtractionBanner {
  status: 'loading' | 'success' | 'partial' | 'failed' | 'empty';
  message: string;
}

interface GuidelinesPageProps {
  guidelines: Guideline[];
  rules: Rule[];
  facts?: Fact[];
  onAddGuideline: (filename: string, raw_text: string) => Guideline | Promise<Guideline>;
  onExtractRules: (id: string) => Promise<any>;
  onConfirmGuideline: (id: string) => void;
  onSelectVersion?: (guidelineId: string, version: 'original' | 'enhanced') => Promise<void>;
  onDeleteGuideline?: (id: string) => Promise<void>;
  onToggleGuideline?: (id: string, enabled: boolean) => Promise<void>;
}

const STATUS_CLASS: Record<GuidelineStatus, { cls: string; label: string }> = {
  pending:   { cls: 'border-sky-200 bg-sky-50 text-sky-700',           label: 'Pending' },
  extracted: { cls: 'border-amber-200 bg-amber-50 text-amber-700',     label: 'Extracted' },
  confirmed: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', label: 'Confirmed' },
  disabled:  { cls: 'border-slate-200 bg-slate-100 text-slate-500',   label: 'Disabled' },
};

const GuidelinesPage: React.FC<GuidelinesPageProps> = ({
  guidelines,
  rules,
  facts = [],
  onAddGuideline,
  onExtractRules,
  onConfirmGuideline,
  onSelectVersion,
  onDeleteGuideline,
  onToggleGuideline,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedGuideline, setSelected] = useState<Guideline | null>(null);
  const [filename, setFilename] = useState('');
  const [rawText, setRawText] = useState('');
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [extractionStatusMap, setExtractionStatusMap] = useState<Record<string, ExtractionBanner>>({});
  const [lastBannerId, setLastBannerId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!filename.trim() || !rawText.trim()) return;
    await onAddGuideline(filename.trim(), rawText.trim());
    setFilename('');
    setRawText('');
    setShowModal(false);
  };

  const handleExtract = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExtractingId(id);
    setLastBannerId(id);
    setExtractionStatusMap((prev) => ({
      ...prev,
      [id]: { status: 'loading', message: 'Analysing brand guidelines...' },
    }));
    try {
      const result = await onExtractRules(id);
      if (result?.extraction_status === 'partial') {
        setExtractionStatusMap((prev) => ({
          ...prev,
          [id]: { status: 'partial', message: 'Extraction completed with warnings.' },
        }));
      } else if (result?.extractedCount === 0 && result?.factsCount === 0) {
        setExtractionStatusMap((prev) => ({
          ...prev,
          [id]: { status: 'empty', message: 'No rules or facts were identified.' },
        }));
      } else {
        setExtractionStatusMap((prev) => ({
          ...prev,
          [id]: { status: 'success', message: 'Extraction completed successfully.' },
        }));
      }
    } catch {
      setExtractionStatusMap((prev) => ({
        ...prev,
        [id]: { status: 'failed', message: 'Extraction failed. Please retry.' },
      }));
    } finally {
      setExtractingId(null);
    }
  };

  const handleDelete = async (gl: Guideline, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteGuideline || !window.confirm(`Delete "${gl.filename}" and all its rules?`)) return;
    setDeletingId(gl.id);
    try {
      await onDeleteGuideline(gl.id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (gl: Guideline, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleGuideline) return;
    setTogglingId(gl.id);
    try {
      await onToggleGuideline(gl.id, !(gl.enabled !== false));
    } finally {
      setTogglingId(null);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setRawText('Extracting text from PDF…');
      const r = new FileReader();
      r.onload = async (ev) => {
        const base64Data = ev.target?.result;
        if (typeof base64Data !== 'string') return;
        try {
          const res = await fetch('/api/guidelines/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, filename: file.name }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to parse PDF.');
          }
          setRawText(data.text || '');
        } catch (err: any) {
          setRawText('');
          alert(err?.message || 'Failed to extract text from PDF.');
        }
      };
      r.readAsDataURL(file);
      return;
    }

    const r = new FileReader();
    r.onload = (ev) => {
      if (ev.target?.result) setRawText(ev.target.result as string);
    };
    r.readAsText(file);
  };

  const rulesFor = (id: string) => rules.filter((r) => r.guideline_id === id).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-sans text-slate-900">
      {/* ── Page Header ── */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="kicker-accent mb-1.5">Brand Policy Ingestion</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            Brand Guidelines
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload policy documents and extract structured compliance rules via Groq AI.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Guideline
        </button>
      </div>

      {/* ── Extraction Status Banner ── */}
      {lastBannerId && extractionStatusMap[lastBannerId] && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-xs font-medium flex items-center justify-between ${
            extractionStatusMap[lastBannerId].status === 'failed'
              ? 'border-red-200 bg-red-50 text-red-700'
              : extractionStatusMap[lastBannerId].status === 'partial'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : extractionStatusMap[lastBannerId].status === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-sky-200 bg-sky-50 text-sky-700'
          }`}
        >
          <span>{extractionStatusMap[lastBannerId].message}</span>
          {extractionStatusMap[lastBannerId].status === 'failed' && (
            <button
              type="button"
              onClick={() => handleExtract(lastBannerId)}
              className="underline font-semibold ml-4"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── Guidelines List ── */}
      {guidelines.length === 0 ? (
        <div className="saas-card p-16 text-center">
          <FileText className="mx-auto mb-3 h-9 w-9 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No brand guidelines uploaded yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Upload a PDF or policy text file to extract enforceable brand rules.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload First Guideline
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {guidelines.map((gl) => {
            const isEnabled = gl.enabled !== false;
            const st = isEnabled
              ? STATUS_CLASS[gl.status] || STATUS_CLASS.pending
              : STATUS_CLASS.disabled;
            const count = rulesFor(gl.id);
            const isExtracting = extractingId === gl.id;

            return (
              <div
                key={gl.id}
                onClick={() => setSelected(gl)}
                className={`saas-card saas-card-interactive cursor-pointer p-5 ${
                  !isEnabled ? 'opacity-65' : ''
                }`}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {gl.filename}
                        </h3>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                        {gl.selected_version === 'enhanced' && (
                          <span className="badge border-sky-200 bg-sky-50 text-sky-700">
                            <Split className="h-2.5 w-2.5" /> Enhanced
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {count} rule{count === 1 ? '' : 's'} extracted · Added{' '}
                        {new Date(gl.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleExtract(gl.id, e)}
                      disabled={isExtracting}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {isExtracting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-600" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                      )}
                      {isExtracting ? 'Extracting…' : 'Extract Rules'}
                    </button>

                    {gl.status === 'extracted' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmGuideline(gl.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Confirm Rules
                      </button>
                    )}

                    {onToggleGuideline && (
                      <button
                        type="button"
                        onClick={(e) => handleToggle(gl, e)}
                        disabled={togglingId === gl.id}
                        title={isEnabled ? 'Disable guideline' : 'Enable guideline'}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
                      >
                        {isEnabled ? (
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    )}

                    {onDeleteGuideline && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(gl, e)}
                        disabled={deletingId === gl.id}
                        title="Delete guideline"
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="animate-in w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-serif text-lg font-bold text-slate-900">
                Upload Brand Guideline
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="kicker mb-1.5">Document Filename</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="e.g. Brand_Guidelines_2026.pdf"
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    Browse File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.pdf,.doc,.docx"
                    onChange={handleFile}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="kicker mb-1.5">Guideline Policy Text</label>
                <textarea
                  rows={10}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste brand guideline rules, banned terms, disclaimers, and colour policies..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!filename.trim() || !rawText.trim()}
                  className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Save Guideline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedGuideline && (() => {
        const liveGuideline = guidelines.find((g) => g.id === selectedGuideline.id) || selectedGuideline;
        return (
          <GuidelineDetailModal
            isOpen={true}
            guideline={liveGuideline}
            rules={rules.filter((r) => r.guideline_id === liveGuideline.id)}
            facts={facts}
            onClose={() => setSelected(null)}
            onConfirmGuideline={onConfirmGuideline}
            onSelectVersion={onSelectVersion || (async () => {})}
            extracting={extractingId === liveGuideline.id}
            extractionBanner={extractionStatusMap[liveGuideline.id] || null}
            onRetryExtract={(id) => handleExtract(id)}
          />
        );
      })()}
    </div>
  );
};

export default GuidelinesPage;
