import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  ChevronRight,
  X,
  Loader2,
  FileUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Guideline, Rule, GuidelineStatus } from '@/types';
import { RAW_GUIDELINE_SAMPLE } from '@/data/seedData';

interface GuidelinesPageProps {
  guidelines: Guideline[];
  rules: Rule[];
  onAddGuideline: (filename: string, raw_text: string) => Guideline | Promise<Guideline>;
  onExtractRules: (id: string) => Promise<void>;
  onConfirmGuideline: (id: string) => void;
}

const statusColor: Record<GuidelineStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  extracted: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const GuidelinesPage: React.FC<GuidelinesPageProps> = ({
  guidelines,
  rules,
  onAddGuideline,
  onExtractRules,
  onConfirmGuideline,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [filename, setFilename] = useState('Apex_Brand_Guidelines_v2.4.pdf');
  const [rawText, setRawText] = useState(RAW_GUIDELINE_SAMPLE);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!filename.trim() || !rawText.trim()) return;
    await onAddGuideline(filename.trim(), rawText.trim());
    setFilename('');
    setRawText('');
    setShowModal(false);
  };

  const handleExtract = async (id: string) => {
    setExtractingId(id);
    try {
      await onExtractRules(id);
    } finally {
      setExtractingId(null);
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
            Upload PDF/text brand guidelines to compile structured, cited rules with confidence scores (PRD FR-3.1 - FR-3.7).
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
                <th className="px-4 py-3 font-semibold">Document</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Extracted Rules</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guidelines.map((gl) => (
                <tr
                  key={gl.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">{gl.filename}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
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
                      className={`inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-full border uppercase tracking-wider ${statusColor[gl.status]}`}
                    >
                      {gl.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-700 font-medium text-right">
                    {rulesCountFor(gl.id)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {gl.status === 'pending' && (
                        <button
                          onClick={() => handleExtract(gl.id)}
                          disabled={extractingId === gl.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {extractingId === gl.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Extracting Rules...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                              Extract Rules (FR-3.3)
                            </>
                          )}
                        </button>
                      )}
                      {gl.status === 'extracted' && (
                        <button
                          onClick={() => onConfirmGuideline(gl.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-emerald-300 text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Confirm Rules (FR-4.4)
                        </button>
                      )}
                      {gl.status === 'confirmed' && (
                        <span className="text-xs text-emerald-700 font-medium flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active Rulebook
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
              {/* File dropzone / upload */}
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

              {/* Filename input */}
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

              {/* Raw text */}
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

            {/* Modal footer */}
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
                Save Guideline & Prepare Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidelinesPage;
