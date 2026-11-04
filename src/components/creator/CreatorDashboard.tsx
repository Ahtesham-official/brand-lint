import React, { useState } from 'react';
import { Submission, Brand } from '@/types';
import { DEMO_SUBMISSION_INITIAL } from '@/data/seedData';
import { 
  PenTool, Image as ImageIcon, Sparkles, AlertCircle, CheckCircle2, 
  ArrowRight, ShieldAlert, Clock, RefreshCw, Zap
} from 'lucide-react';

interface CreatorDashboardProps {
  brand: Brand;
  submissions: Submission[];
  onCreateSubmission: (data: {
    title: string;
    caption: string;
    image_url: string;
    ocr_text?: string;
  }) => Submission;
  onSelectSubmission: (id: string) => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  brand,
  submissions,
  onCreateSubmission,
  onSelectSubmission,
}) => {
  const [title, setTitle] = useState<string>('Diwali Festive Launch Campaign — Wireless Earbuds Promo');
  const [caption, setCaption] = useState<string>(DEMO_SUBMISSION_INITIAL.caption);
  const [imageUrl, setImageUrl] = useState<string>(DEMO_SUBMISSION_INITIAL.image_url);
  const [ocrText, setOcrText] = useState<string>(DEMO_SUBMISSION_INITIAL.ocr_text);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [customOcrEnabled, setCustomOcrEnabled] = useState<boolean>(false);

  const handleLoadDemoCase = () => {
    setTitle('Diwali Festive Launch Campaign — Wireless Earbuds Promo');
    setCaption(DEMO_SUBMISSION_INITIAL.caption);
    setImageUrl(DEMO_SUBMISSION_INITIAL.image_url);
    setOcrText(DEMO_SUBMISSION_INITIAL.ocr_text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() || !imageUrl.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const sub = onCreateSubmission({
        title,
        caption,
        image_url: imageUrl,
        ocr_text: ocrText,
      });
      setIsSubmitting(false);
      onSelectSubmission(sub.id);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800">
              Creator Workspace
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-sm font-medium text-slate-600">Content Submission & Pre-Flight Brand Linter</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Submit Marketing Content for Linting
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Test captions and poster assets against verified brand rules and Fact Vault claims before review.
          </p>
        </div>

        <button
          onClick={handleLoadDemoCase}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Load PRD Demo Case (2m 45s Script)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Create Submission */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">New Campaign Submission</h2>
            </div>
            <span className="text-xs text-slate-400">Sequential OCR + Deterministic + AI Pipeline</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Campaign / Post Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Festive Wireless Earbuds Announcement"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Social Media Caption Copy
                </label>
                <span className="text-[11px] text-slate-400">{caption.length} characters</span>
              </div>
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Paste the caption copy here..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Poster Graphic Image URL (PNG/JPG ≤10 MB)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Poster Preview and Detected Visual Simulation */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-4">
              <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-900 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Poster preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] text-white font-mono">
                  Poster
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-800">Poster Visual Inspection Attributes</div>
                <div className="text-slate-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                  <span>Detected Dominant Tone: <strong>#E11D48 (Hot Crimson)</strong></span>
                </div>
                <div className="text-slate-500">
                  Typography Contrast: <strong className="text-amber-700">2.8:1</strong> (Fails 4.5:1 WCAG AA)
                </div>
                <div className="text-slate-500">
                  OCR Engine: <strong>Tesseract (Simulated Provenance)</strong>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomOcrEnabled(!customOcrEnabled)}
                  className="text-xs text-indigo-600 hover:underline pt-1 block font-medium"
                >
                  {customOcrEnabled ? 'Hide OCR text box' : 'Inspect extracted OCR text span ▾'}
                </button>
              </div>
            </div>

            {customOcrEnabled && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Extracted Poster OCR Text
                </label>
                <textarea
                  rows={2}
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>{isSubmitting ? 'Running Sequential Lint Engine...' : 'Run BrandLint Check (< 15s)'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Submissions History */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Recent Submissions ({submissions.length})</h3>
              <span className="text-xs text-slate-400">Click to view cited report</span>
            </div>

            <div className="mt-4 space-y-3">
              {submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No submissions yet. Click <strong>“Load PRD Demo Case”</strong> and submit above to trigger the lint report!
                </div>
              ) : (
                submissions.map((sub) => {
                  const isHighRisk = sub.risk_score > 50;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => onSelectSubmission(sub.id)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 hover:bg-white flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">{sub.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{sub.caption}</p>
                        </div>

                        {/* Risk score badge */}
                        <div
                          className={`px-2.5 py-1 rounded-lg text-center flex-shrink-0 ${
                            isHighRisk
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wider">Risk Score</div>
                          <div className="text-sm font-extrabold">{sub.risk_score}/100</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(sub.created_at).toLocaleTimeString()}</span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                            sub.review_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.review_status === 'changes_requested'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {sub.review_status || 'Pending Review'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

