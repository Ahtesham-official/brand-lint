import React, { useState } from 'react';
import { Upload, FileText, ChevronRight, X, Loader2 } from 'lucide-react';
import { Guideline, Rule, GuidelineStatus } from '@/types';
import { RAW_GUIDELINE_SAMPLE } from '@/data/seedData';

interface GuidelinesPageProps {
  guidelines: Guideline[];
  rules: Rule[];
  onAddGuideline: (filename: string, raw_text: string) => Guideline;
  onExtractRules: (id: string) => Promise<void>;
  onConfirmGuideline: (id: string) => void;
}

const statusColor: Record<GuidelineStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  extracted: 'bg-blue-50 text-blue-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
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

  const handleSubmit = () => {
    if (!filename.trim() || !rawText.trim()) return;
    onAddGuideline(filename.trim(), rawText.trim());
    setFilename('');
    setRawText(RAW_GUIDELINE_SAMPLE);
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

  const rulesCountFor = (glId: string) =>
    rules.filter((r) => r.guideline_id === glId).length;

  return (
    <div className="min-h-full bg-slate-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Guidelines</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload brand guideline documents and extract compliance rules.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Guideline
        </button>
      </div>

      {/* Guidelines list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {guidelines.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-slate-400">
            No guidelines uploaded yet.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-2.5 font-medium">Filename</th>
                <th className="px-4 py-2.5 font-medium">Uploaded</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium text-right">Rules</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guidelines.map((gl) => (
                <tr
                  key={gl.id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-800">{gl.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(gl.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusColor[gl.status]}`}
                    >
                      {gl.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 text-right">
                    {rulesCountFor(gl.id)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {gl.status === 'pending' && (
                        <button
                          onClick={() => handleExtract(gl.id)}
                          disabled={extractingId === gl.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                          {extractingId === gl.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                          Extract Rules
                        </button>
                      )}
                      {gl.status === 'extracted' && (
                        <>
                          <button
                            onClick={() => handleExtract(gl.id)}
                            disabled={extractingId === gl.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                          >
                            {extractingId === gl.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                            Re-extract
                          </button>
                          <button
                            onClick={() => onConfirmGuideline(gl.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            Confirm
                          </button>
                        </>
                      )}
                      {gl.status === 'confirmed' && (
                        <span className="text-xs text-slate-400">Confirmed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">Upload Guideline</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Filename
                </label>
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="e.g. Brand_Guidelines_v3.pdf"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Content
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!filename.trim() || !rawText.trim()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidelinesPage;
