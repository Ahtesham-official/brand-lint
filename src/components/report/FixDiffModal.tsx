import React, { useMemo } from 'react';
import { X, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { diffWords } from 'diff';
import { Issue } from '@/types';

interface FixDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue;
  currentCaption: string;
  onAcceptFix: (issueId: string, updatedCaption: string) => void;
}

export const FixDiffModal: React.FC<FixDiffModalProps> = ({
  isOpen,
  onClose,
  issue,
  currentCaption,
  onAcceptFix,
}) => {
  if (!isOpen || !issue.suggested_text) return null;

  // Determine what the original text segment is vs suggested text
  const originalSegment = issue.evidence.matched_text || currentCaption;
  const suggestedSegment = issue.suggested_text;

  // Calculate word diff
  const diffParts = useMemo(() => {
    try {
      return diffWords(originalSegment, suggestedSegment);
    } catch {
      return [
        { removed: true, value: originalSegment },
        { added: true, value: suggestedSegment },
      ];
    }
  }, [originalSegment, suggestedSegment]);

  // Determine updated full caption
  const updatedFullCaption = useMemo(() => {
    const isFullText = suggestedSegment.length > 50 && suggestedSegment.includes(' ');
    if (isFullText) {
      return suggestedSegment;
    }
    if (issue.evidence.matched_text && currentCaption.includes(issue.evidence.matched_text)) {
      return currentCaption.replace(issue.evidence.matched_text, suggestedSegment);
    }
    return suggestedSegment;
  }, [currentCaption, issue.evidence.matched_text, suggestedSegment]);

  const handleApply = () => {
    onAcceptFix(issue.id, updatedFullCaption);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">One-Click Fix Suggestion</h3>
              <p className="text-xs text-slate-500">
                Review word diff and apply brand-compliant replacement (FR-10.2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-[2px_2px_0px_#1c1917]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Issue context */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs">
            <div className="flex items-center gap-2 font-medium text-amber-900 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Flagged: {issue.rule_title || issue.category}</span>
            </div>
            <p className="text-amber-800 leading-relaxed">{issue.explanation}</p>
          </div>

          {/* Inline Visual Diff */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Word-Level Diff Comparison
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> Original (Removed)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Compliant (Added)
                </span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm leading-relaxed font-sans font-normal">
              {diffParts.map((part, index) => {
                if (part.added) {
                  return (
                    <ins
                      key={index}
                      className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-medium no-underline border border-emerald-300"
                    >
                      {part.value}
                    </ins>
                  );
                }
                if (part.removed) {
                  return (
                    <del
                      key={index}
                      className="bg-red-100 text-red-900 px-1 py-0.5 rounded line-through font-medium border border-red-300 mx-0.5 opacity-80"
                    >
                      {part.value}
                    </del>
                  );
                }
                return <span key={index} className="text-slate-700">{part.value}</span>;
              })}
            </div>
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100">
              <span className="font-semibold text-red-800 block mb-1">Original Span</span>
              <p className="text-red-950 font-mono text-[11px] break-words line-through opacity-85">
                "{originalSegment}"
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="font-semibold text-emerald-800 block mb-1">Approved Replacement</span>
              <p className="text-emerald-950 font-medium text-[11px] break-words">
                "{suggestedSegment}"
              </p>
            </div>
          </div>

          {/* Full updated preview */}
          <div>
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Full Mutated Caption Result
            </span>
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono leading-relaxed max-h-32 overflow-y-auto">
              {updatedFullCaption}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Accept Fix & Mutate Content
          </button>
        </div>
      </div>
    </div>
  );
};

