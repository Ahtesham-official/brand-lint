import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  Loader2,
  ScanText,
  Upload,
} from 'lucide-react';
import type { Brand, Submission } from '@/types';
import { DEMO_SUBMISSION_INITIAL } from '@/data/seedData';

interface SubmitPageProps {
  brand: Brand;
  onCreateSubmission: (data: {
    title: string;
    caption: string;
    image_url: string;
    ocr_text?: string;
  }) => Promise<Submission> | Submission;
  onSelectSubmission: (id: string) => void;
}

const PRESET_POSTERS = [
  {
    name: 'Diwali Festive Wireless Earbuds Poster',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    ocr: "INDIA'S #1 SOUND\nNOW WITH 24-MONTH WARRANTY\nUNBEATABLE BASS",
  },
  {
    name: 'Studio Wireless Headphones Campaign',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    ocr: "APEX ACOUSTICS\nPRECISION SOUND FOR AUDIOPHILES",
  },
];

const SubmitPage: React.FC<SubmitPageProps> = ({
  brand,
  onCreateSubmission,
  onSelectSubmission,
}) => {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [showOcr, setShowOcr] = useState(false);
  const [loading, setLoading] = useState(false);

  const maxCaption = 1000;

  const handleLoadDemo = () => {
    setTitle(DEMO_SUBMISSION_INITIAL.title);
    setCaption(DEMO_SUBMISSION_INITIAL.caption);
    setImageUrl(DEMO_SUBMISSION_INITIAL.image_url);
    setOcrText(DEMO_SUBMISSION_INITIAL.ocr_text);
    setShowOcr(true);
  };

  const handleSelectPosterPreset = (preset: typeof PRESET_POSTERS[0]) => {
    setImageUrl(preset.url);
    setOcrText(preset.ocr);
    setShowOcr(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !caption.trim() || loading) return;

    setLoading(true);
    try {
      const submission = await onCreateSubmission({
        title: title.trim(),
        caption: caption.trim(),
        image_url: imageUrl.trim() || PRESET_POSTERS[0].url,
        ocr_text: ocrText.trim() || undefined,
      });
      onSelectSubmission(submission.id);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const isValid = title.trim().length > 0 && caption.trim().length > 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-bold text-slate-900">New Content Brand Check</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit social caption and poster graphic for OCR text extraction and multi-rule brand governance (PRD FR-6.1 - FR-8.10).
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadDemo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Load Demo Violation Copy (PRD §17.2)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Campaign or Post Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Diwali Festive Launch Campaign — Wireless Earbuds Promo"
            className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Caption */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Social Media Caption &amp; Copy Text (PRD FR-6.1)
            </label>
            <span className="text-[11px] text-slate-400">
              {caption.length}/{maxCaption} chars
            </span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, maxCaption))}
            placeholder="Paste caption copy, promotional claims, hashtag text, and disclaimers..."
            rows={5}
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
            required
          />
        </div>

        {/* Poster Image URL & Gallery */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Poster / Campaign Graphic Image URL (PRD FR-6.1)
          </label>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="relative">
                <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {imageUrl && (
              <div className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100">
                <img
                  src={imageUrl}
                  alt="Poster preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Quick preset selector */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Or pick preset poster:</span>
            {PRESET_POSTERS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPosterPreset(p)}
                className="text-[11px] text-blue-600 hover:underline bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-medium"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* OCR Section (PRD FR-7.1, FR-7.2) */}
        <div className="border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowOcr(!showOcr)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-blue-600 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ScanText className="w-3.5 h-3.5 text-blue-600" />
              OCR Text Provenance Layer (PRD FR-7.1 - FR-7.3)
            </span>
            {showOcr ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showOcr && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-slate-500">
                Text detected inside poster graphic typography via OCR. This text is combined with the caption to verify claims and superlatives across both visual and textual layers.
              </p>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="OCR text extracted from graphic..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none font-mono text-[11px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Deterministic &amp; AI Check Engine (PRD FR-8)...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Run Brand Lint Engine &amp; Generate Cited Report</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitPage;
