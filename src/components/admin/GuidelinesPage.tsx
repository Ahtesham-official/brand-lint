import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Loader2,
  FileUp,
  Sparkles,
  CheckCircle2,
  Eye,
  Split,
  Trash2,
  ToggleLeft,
  ToggleRight,
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

const statusColor: Record<GuidelineStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  extracted: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  disabled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const GuidelinesPage: React.FC<GuidelinesPageProps> = ({
  guidelines,
  rules,
  onAddGuideline,
  onExtractRules,
  onConfirmGuideline,
  onSelectVersion,
  onDeleteGuideline,
  onToggleGuideline,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedGuideline, setSelectedGuideline] = useState<Guideline | null>(null);
  const [filename, setFilename] = useState('Apex_Brand_Guidelines_v2.4.pdf');
  const [rawText, setRawText] = useState(RAW_GUIDELINE_SAMPLE);
  const [extractingId, setExtractingId] = useState<string | null>(null);
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
    if (e) e.stopPropagation();
    setExtractingId(id);
    try {
      await onExtractRules(id);
    } finally {
      setExtractingId(null);
    }
  };

  const handleDelete = async (gl: Guideline, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteGuideline) return;
    if (!window.confirm(`Delete guideline "${gl.filename}" and all its rules? This cannot be undone.`)) return;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFilename('Apex_Brand_Guidelines_v2.4.pdf');
    setRawText(RAW_GUIDELINE_SAMPLE);
  };

  const rulesCountFor = (glId: string) =>
    rules.filter((r) => r.guideline_id === glId).length;

  return (
    <div className="min-h-full bg-slate-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Brand Guidelines Ingestion</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Click on any guideline to view what the AI understood, inspect rules, and compare original vs AI Enhanced versions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Guideline (FR-3.1)
        </button>
      </div>

      {/* Guidelines list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {guidelines.length === 0 ? (
          <div className="px-5 py-12 text-center text-xs text-slate-400">
            No guidelines uploaded yet. Click &quot;Upload Guideline&quot; to begin.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 bg-slate-50/70">
                <th className="px-4 py-3 font-semibold">Document (Click to inspect)</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                <th className="px-4 py-3 font-semibold">Selected Version</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Enabled</th>
                <th className="px-4 py-3 font-semibold text-right">Rules</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guidelines.map((gl) => {
                const selectedVer = gl.selected_version || 'original';
                const isEnabled = gl.enabled !== false;
                const isDisabled = gl.status === 'disabled' || !isEnabled;

                return (
                  <tr
                    key={gl.id}
                    onClick={() => setSelectedGuideline(gl)}
                    className={`transition-colors cursor-pointer group ${isDisabled ? 'opacity-60' : 'hover:bg-blue-50/40'}`}
                    title="Click to view AI comprehension and compare versions"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isDisabled ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {gl.filename}
                            </span>
                            <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block">
                            {gl.raw_text ? `${gl.raw_text.length} chars` : 'Uploaded Document'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {new Date(gl.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                          selectedVer === 'enhanced'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {selectedVer}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-full border uppercase tracking-wider ${statusColor[gl.status] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}
                      >
                        {isDisabled && gl.status !== 'disabled' ? 'disabled' : gl.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 font-medium text-right">
                      {rulesCountFor(gl.id)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                        {/* Review & Compare */}
                        <button
                          onClick={() => setSelectedGuideline(gl)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Review AI comprehension & compare versions"
                        >
                          <Split className="w-3 h-3 text-purple-600" />
                          Review
                        </button>

                        {/* Extract Rules (pending only) */}
                        {gl.status === 'pending' && isEnabled && (
                          <button
                            onClick={(e) => handleExtract(gl.id, e)}
                            disabled={extractingId === gl.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                          >
                            {extractingId === gl.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            {extractingId === gl.id ? 'Extracting…' : 'Extract'}
                          </button>
                        )}

                        {/* Confirm Rules (extracted only) */}
                        {gl.status === 'extracted' && isEnabled && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onConfirmGuideline(gl.id); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-emerald-300 text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Confirm
                          </button>
                        )}

                        {/* Enable / Disable toggle */}
                        {onToggleGuideline && (
                          <button
                            onClick={(e) => handleToggle(gl, e)}
                            disabled={togglingId === gl.id}
                            title={isEnabled ? 'Disable this guideline' : 'Enable this guideline'}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                              isEnabled
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {togglingId === gl.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isEnabled ? (
                              <ToggleRight className="w-3.5 h-3.5" />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5" />
                            )}
                            {isEnabled ? 'On' : 'Off'}
                          </button>
                        )}

                        {/* Delete */}
                        {onDeleteGuideline && (
                          <button
                            onClick={(e) => handleDelete(gl, e)}
                            disabled={deletingId === gl.id}
                            title="Delete guideline and all its rules"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {deletingId === gl.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
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

      {/* Upload Modal (FR-3.1, FR-3.2) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Upload Guideline Document</h3>
                <p className="text-xs text-slate-500">PDF upload or raw text paste for LLM extraction (FR-3.1)</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Guideline File (PDF, TXT, MD ≤10MB)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.md"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
                >
                  <FileUp className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-xs font-medium text-slate-700 block">
                    Click to browse or drop file here
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Supports Apex Audio brand policy PDFs and plaintext guidelines
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">Filename</label>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    Load Sample Brand Guideline
                  </button>
                </div>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="e.g. Apex_Brand_Guidelines_v2.4.pdf"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Guideline Content / Extracted Raw Text
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste brand guideline content here..."
                  rows={8}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px] leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Strict JSON rule extraction will extract category, severity, and citations.</span>
                  <span>{rawText.length} characters</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!filename.trim() || !rawText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
              >
                Save Guideline &amp; Prepare Rules
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guideline Detail & Version Review Modal */}
      {selectedGuideline && (
        <GuidelineDetailModal
          guideline={selectedGuideline}
          rules={rules}
          isOpen={Boolean(selectedGuideline)}
          onClose={() => setSelectedGuideline(null)}
          onConfirmGuideline={(id) => {
            onConfirmGuideline(id);
            setSelectedGuideline(null);
          }}
          onSelectVersion={async (glId, ver) => {
            if (onSelectVersion) {
              await onSelectVersion(glId, ver);
              const updatedGl = guidelines.find((g) => g.id === glId);
              if (updatedGl) {
                setSelectedGuideline({ ...updatedGl, selected_version: ver });
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default GuidelinesPage;
