import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  Loader2,
  ScanText,
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
    name: 'Festive Wireless Earbuds Campaign',
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
    <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div className="kicker-accent" style={{ marginBottom: 8 }}>Creator Workspace</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 34, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', lineHeight: 1 }}>
            New Content Check
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 8, fontWeight: 300 }}>
            Submit social caption and poster graphic for multi-rule compliance review.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadDemo}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--white)', color: 'var(--accent)', border: '1px solid var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
        >
          <Sparkles style={{ width: 14, height: 14 }} /> Load Demo Violation
        </button>
      </div>

      {/* ── Form Card ── */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--white)', border: '1px solid var(--rule)', padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Title */}
        <div>
          <label className="kicker" style={{ marginBottom: 8 }}>Campaign / Post Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Diwali Festive Launch Campaign — Wireless Earbuds Promo"
            required
            autoFocus
            style={iStyle()}
          />
        </div>

        {/* Caption */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label className="kicker">Marketing Caption *</label>
            <span className="kicker" style={{ color: caption.length > maxCaption ? '#b91c1c' : 'var(--ink-faint)' }}>
              {caption.length} / {maxCaption}
            </span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write or paste your social media caption copy here..."
            rows={6}
            required
            style={{ ...iStyle(), resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {/* Poster selection */}
        <div>
          <label className="kicker" style={{ marginBottom: 8 }}>Poster Artwork Image</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
            {PRESET_POSTERS.map((preset) => {
              const isSelected = imageUrl === preset.url;
              return (
                <div
                  key={preset.name}
                  onClick={() => handleSelectPosterPreset(preset)}
                  style={{
                    padding: '12px 14px',
                    background: isSelected ? 'var(--paper)' : 'var(--white)',
                    border: `1px solid ${isSelected ? 'var(--ink)' : 'var(--rule)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <img src={preset.url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', border: '1px solid var(--rule)' }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {preset.name}
                    </div>
                    <div className="kicker" style={{ marginTop: 2 }}>Sample Artwork</div>
                  </div>
                </div>
              );
            })}
          </div>

          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Or paste external image URL (https://...)"
            style={{ ...iStyle(), fontFamily: 'var(--font-mono)', fontSize: 11 }}
          />
        </div>

        {/* OCR text drawer toggle */}
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
          <button
            type="button"
            onClick={() => setShowOcr(!showOcr)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--ink-mid)', fontSize: 13 }}
          >
            <ScanText style={{ width: 14, height: 14, color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600 }}>OCR Text Extracted From Poster Graphic</span>
            {showOcr ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
          </button>

          {showOcr && (
            <div style={{ marginTop: 12 }}>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Simulated or extracted text from poster image..."
                rows={3}
                style={{ ...iStyle(), fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical' }}
              />
              <span className="kicker" style={{ marginTop: 6 }}>
                Simulates Google Cloud Vision OCR detection for graphic text governance.
              </span>
            </div>
          )}
        </div>

        {/* Submit action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
          <button
            type="submit"
            disabled={!isValid || loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 32px',
              background: 'var(--btn-primary)',
              color: 'var(--white)',
              border: '1px solid var(--rule-dark)',
              cursor: !isValid || loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              opacity: !isValid || loading ? 0.4 : 1,
            }}
          >
            {loading ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Send style={{ width: 15, height: 15 }} />}
            <span>{loading ? 'Analyzing Content...' : 'Run Brand Governance Check'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

function iStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    fontSize: 13,
    border: '1px solid var(--rule)',
    background: 'var(--paper)',
    color: 'var(--ink)',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  };
}

export default SubmitPage;
