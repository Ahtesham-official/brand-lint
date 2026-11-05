import React, { useState } from 'react';
import { FileText, Image, ChevronDown, ChevronUp, Sparkles, Send } from 'lucide-react';
import type { Brand, Submission } from '@/types';
import { DEMO_SUBMISSION_INITIAL } from '@/data/seedData';

interface SubmitPageProps {
  brand: Brand;
  onCreateSubmission: (data: {
    title: string;
    caption: string;
    image_url: string;
    ocr_text?: string;
  }) => Submission;
  onSelectSubmission: (id: string) => void;
}

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

  const maxCaption = 1000;

  const handleLoadDemo = () => {
    setTitle(DEMO_SUBMISSION_INITIAL.title);
    setCaption(DEMO_SUBMISSION_INITIAL.caption);
    setImageUrl(DEMO_SUBMISSION_INITIAL.image_url);
    setOcrText(DEMO_SUBMISSION_INITIAL.ocr_text);
    setShowOcr(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !caption.trim()) return;
    const submission = onCreateSubmission({
      title: title.trim(),
      caption: caption.trim(),
      image_url: imageUrl.trim(),
      ocr_text: ocrText.trim() || undefined,
    });
    onSelectSubmission(submission.id);
  };

  const isValid = title.trim().length > 0 && caption.trim().length > 0;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-base font-semibold text-slate-900">New Check</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit content for brand compliance review against {brand.name} guidelines.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Summer Campaign — Instagram Post"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300"
          />
        </div>

        {/* Caption */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, maxCaption))}
            placeholder="Paste the post caption or ad copy…"
            rows={4}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300"
          />
          <p className="text-xs text-slate-400 text-right mt-1">
            {caption.length}/{maxCaption}
          </p>
        </div>

        {/* Image URL + Preview */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Image URL
          </label>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="relative">
                <Image className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300"
                />
              </div>
            </div>
            {imageUrl && (
              <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-50">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* OCR Text Toggle */}
        <div className="border border-slate-200 rounded-lg">
          <button
            type="button"
            onClick={() => setShowOcr(!showOcr)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              OCR / On-Image Text
            </span>
            {showOcr ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showOcr && (
            <div className="px-3 pb-3">
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Paste text extracted from the image…"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-300"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            <Sparkles className="w-3 h-3" />
            Load Demo Case
          </button>

          <button
            type="submit"
            disabled={!isValid}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Run Check
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitPage;
