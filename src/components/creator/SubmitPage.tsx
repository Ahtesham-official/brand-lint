import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  ScanText,
  Video,
  Image as ImageIcon,
  Upload,
  Play,
  CheckCircle,
} from 'lucide-react';
import type { Brand, Submission } from '@/types';
import { DEMO_SUBMISSION_INITIAL } from '@/data/seedData';
import { api } from '@/lib/api';

interface SubmitPageProps {
  brand: Brand;
  onCreateSubmission: (data: {
    title: string;
    caption?: string;
    image_url: string;
    ocr_text?: string;
    video_url?: string;
    media_type?: 'image' | 'video';
  }) => Promise<Submission> | Submission;
  onSelectSubmission: (id: string) => void;
  onLoadDemoData?: () => Promise<void> | void;
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

const PRESET_VIDEOS = [
  {
    name: 'Apex Earbuds Launch Commercial (Flagged: #1 Superlative & 24M Warranty)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    ocr: "INDIA'S #1 AUDIO EXPERIENCE\n24-MONTH FULL REPLACEMENT WARRANTY\nUNBEATABLE ACOUSTICS",
  },
  {
    name: 'Apex Studio Headphones Showcase (Flagged: Uncertified Best Claim)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    poster: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    ocr: "APEX STUDIO PRO\nTHE BEST ACOUSTICS EVER ENGINEERED\nGUARANTEED LOWEST DISTORTION",
  },
  {
    name: 'Apex Brand Clean Anthem (Fully Brand Compliant Video)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    ocr: "APEX ACOUSTICS\nPRECISION SOUND DESIGN\nAUTHENTIC CRAFTSMANSHIP",
  },
];

const SubmitPage: React.FC<SubmitPageProps> = ({
  brand,
  onCreateSubmission,
  onSelectSubmission,
  onLoadDemoData,
}) => {
  const [mediaType, setMediaType] = useState<'image' | 'video'>('video');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [showOcr, setShowOcr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);

  const maxCaption = 1000;

  const [extractingVideo, setExtractingVideo] = useState(false);

  const performVideoExtraction = async (url: string, videoTitle: string, hint?: string) => {
    setExtractingVideo(true);
    try {
      const res = await api.extractVideo(url, videoTitle, hint);
      if (res && res.success) {
        const combined = `${res.ocr_summary}\n\n${res.audio_summary}`;
        setOcrText(combined);
      }
    } catch (e) {
      console.warn('Auto video extraction fallback:', e);
    } finally {
      setExtractingVideo(false);
    }
  };

  const handleLoadDemo = async () => {
    setUploadedImageName(null);
    setShowOcr(true);
    if (mediaType === 'video') {
      setTitle(PRESET_VIDEOS[0].name);
      setVideoUrl(PRESET_VIDEOS[0].url);
      setImageUrl(PRESET_VIDEOS[0].poster);
      performVideoExtraction(PRESET_VIDEOS[0].url, PRESET_VIDEOS[0].name, PRESET_VIDEOS[0].ocr);
    } else {
      setTitle(DEMO_SUBMISSION_INITIAL.title);
      setCaption(DEMO_SUBMISSION_INITIAL.caption);
      setImageUrl(DEMO_SUBMISSION_INITIAL.image_url);
      setOcrText(DEMO_SUBMISSION_INITIAL.ocr_text);
    }
    if (onLoadDemoData) {
      try {
        await onLoadDemoData();
      } catch (err) {
        console.warn('Error loading demo violation seed:', err);
      }
    }
  };

  const handleSelectPosterPreset = (preset: (typeof PRESET_POSTERS)[0]) => {
    setImageUrl(preset.url);
    setUploadedImageName(null);
    if (!ocrText) setOcrText(preset.ocr);
  };

  const handleSelectVideoPreset = (preset: (typeof PRESET_VIDEOS)[0]) => {
    setTitle(preset.name);
    setVideoUrl(preset.url);
    setImageUrl(preset.poster);
    performVideoExtraction(preset.url, preset.name, preset.ocr);
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setVideoUrl(localUrl);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
      setOcrText(''); // Clear existing demo preset text immediately so user sees real-time progress
      performVideoExtraction(localUrl, cleanName, undefined);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);

      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadedImageName(file.name);
      if (!title || PRESET_POSTERS.some((p) => p.name === title) || PRESET_VIDEOS.some((p) => p.name === title)) {
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaType === 'image' && !caption.trim()) return;
    if (mediaType === 'image' && !imageUrl.trim()) return;
    if (mediaType === 'video' && !videoUrl.trim() && !imageUrl.trim()) return;

    setLoading(true);
    try {
      const finalImage = imageUrl.trim() || 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80';
      const result = await onCreateSubmission({
        title: title.trim() || (mediaType === 'video' ? 'Video Campaign Submission' : 'Campaign Submission'),
        caption: mediaType === 'video' ? '' : caption.trim(),
        image_url: finalImage,
        video_url: mediaType === 'video' ? videoUrl.trim() : undefined,
        media_type: mediaType,
        ocr_text: ocrText.trim() || undefined,
      });

      if (result && result.id) {
        onSelectSubmission(result.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const iStyle = () => ({
    width: '100%',
    padding: '11px 14px',
    fontSize: 13,
    border: '1px solid var(--rule-dark)',
    background: 'var(--paper)',
    color: 'var(--ink)',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    borderRadius: 'var(--radius-btn)',
  });

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div className="kicker-accent" style={{ marginBottom: 6 }}>Creator Workspace</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 32, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', lineHeight: 1.15 }}>
            New Content Check
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 8, fontWeight: 300 }}>
            Submit video commercials or social posters for multi-modal AI brand compliance review.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLoadDemo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            background: 'var(--white)',
            color: 'var(--accent)',
            border: '1px solid var(--accent)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 'var(--radius-btn)',
            boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
          }}
        >
          <Sparkles style={{ width: 14, height: 14 }} /> Load Demo Violation
        </button>
      </div>

      {/* ── Media Type Switcher ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => {
            setMediaType('video');
            if (!videoUrl && PRESET_VIDEOS[0]) {
              setVideoUrl(PRESET_VIDEOS[0].url);
              setImageUrl(PRESET_VIDEOS[0].poster);
              setOcrText(PRESET_VIDEOS[0].ocr);
              if (!title) setTitle(PRESET_VIDEOS[0].name);
            }
          }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: mediaType === 'video' ? 'var(--paper-mid)' : 'var(--white)',
            color: mediaType === 'video' ? 'var(--accent)' : 'var(--ink)',
            border: `1.5px solid ${mediaType === 'video' ? 'var(--accent)' : 'var(--rule)'}`,
            borderRadius: 'var(--radius-btn)',
            boxShadow: mediaType === 'video' ? '3px 3px 0px var(--btn-shadow)' : 'none',
          }}
        >
          <Video style={{ width: 16, height: 16 }} />
          <span>Video Commercial (AI Frame &amp; Audio Audit)</span>
        </button>

        <button
          type="button"
          onClick={() => setMediaType('image')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: mediaType === 'image' ? 'var(--paper-mid)' : 'var(--white)',
            color: mediaType === 'image' ? 'var(--accent)' : 'var(--ink)',
            border: `1.5px solid ${mediaType === 'image' ? 'var(--accent)' : 'var(--rule)'}`,
            borderRadius: 'var(--radius-btn)',
            boxShadow: mediaType === 'image' ? '3px 3px 0px var(--btn-shadow)' : 'none',
          }}
        >
          <ImageIcon style={{ width: 16, height: 16 }} />
          <span>Poster Graphic (Static Image + Caption Copy)</span>
        </button>
      </div>

      {/* ── Form Card ── */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--white)', border: '1px solid var(--rule)', padding: '32px', display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '3px 3px 0px var(--btn-shadow)', borderRadius: 'var(--radius-btn)' }}>
        {/* Title */}
        <div>
          <label className="kicker" style={{ marginBottom: 6 }}>Campaign / Video Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mediaType === 'video' ? 'e.g. Apex Diwali Video Commercial Spot' : 'e.g. Diwali Festive Launch Campaign — Wireless Earbuds'}
            required
            autoFocus
            style={iStyle()}
          />
        </div>

        {/* Caption (Only for Static Posters) */}
        {mediaType === 'image' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="kicker">Marketing Caption *</label>
              <span className="kicker" style={{ color: caption.length > maxCaption ? '#b91c1c' : 'var(--ink-faint)' }}>
                {caption.length} / {maxCaption}
              </span>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write or paste your poster caption copy here..."
              rows={5}
              required
              style={{ ...iStyle(), resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
        )}

        {/* Media Asset Inputs */}
        {mediaType === 'video' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="kicker">Select Video Commercial to Analyze</label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                }}
              >
                <Upload style={{ width: 13, height: 13 }} />
                <span>Upload Custom Local Video</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {PRESET_VIDEOS.map((preset) => {
                const isSelected = !!videoUrl && videoUrl === preset.url;
                return (
                  <div
                    key={preset.name}
                    onClick={() => handleSelectVideoPreset(preset)}
                    style={{
                      padding: '12px 14px',
                      background: isSelected ? 'var(--paper)' : 'var(--white)',
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--rule)'}`,
                      borderRadius: 'var(--radius-btn)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ width: 44, height: 44, background: 'var(--ink)', borderRadius: 'var(--radius-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fef3c7', flexShrink: 0 }}>
                      <Play style={{ width: 16, height: 16, marginLeft: 2 }} />
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                        {preset.name}
                      </p>
                      <span className="kicker" style={{ marginTop: 2, color: 'var(--ink-faint)' }}>
                        Target: {preset.url.split('/').pop()}
                      </span>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>Selected</span>
                    )}
                  </div>
                );
              })}
            </div>

            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Or enter direct video stream URL (.mp4 / .webm)"
              style={iStyle()}
            />
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  padding: '9px 18px',
                  background: 'var(--white)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-btn)',
                  boxShadow: '2px 2px 0px var(--btn-shadow)',
                }}
              >
                <Upload style={{ width: 14, height: 14 }} />
                <span>Upload Custom Image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {uploadedImageName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--paper-mid)',
                  border: '1.5px solid var(--accent)',
                  borderRadius: 'var(--radius-btn)',
                  marginBottom: 12,
                }}
              >
                <img
                  src={imageUrl}
                  alt="Uploaded preview"
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 'var(--radius-btn)' }}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                    {uploadedImageName}
                  </p>
                  <span className="kicker" style={{ marginTop: 2, color: 'var(--accent)' }}>
                    Custom Uploaded Image (Selected)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedImageName(null);
                    setImageUrl('');
                  }}
                  className="btn-plain"
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>
            )}

            <input
              type="text"
              value={uploadedImageName ? `[Uploaded file: ${uploadedImageName}]` : imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setUploadedImageName(null);
              }}
              placeholder="Or enter image URL (https://...)"
              style={iStyle()}
              readOnly={!!uploadedImageName}
            />
          </div>
        )}

        {/* OCR / Video frame transcription drawer */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <button
              type="button"
              onClick={() => setShowOcr(!showOcr)}
              className="btn-plain"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--accent)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ScanText style={{ width: 14, height: 14 }} />
              <span>
                {showOcr ? 'Hide' : 'Show'}{' '}
                {mediaType === 'video'
                  ? 'Extracted Video Frame Text & Audio Transcription (OCR / Whisper)'
                  : 'On-Screen Poster Text (OCR / Visual Text)'}
              </span>
            </button>
            {extractingVideo && (
              <span style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                Extracting OCR &amp; Audio tracks...
              </span>
            )}
          </div>

          {showOcr && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '0 0 6px' }}>
                Extracted directly from keyframes and audio tracks (sent to AI multi-modal check engine):
              </p>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Extracted on-screen text or audio speech..."
                rows={5}
                style={{ ...iStyle(), fontFamily: 'var(--font-mono)', fontSize: 12 }}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                <span>Running Video AI Analysis...</span>
              </>
            ) : (
              <>
                <Send style={{ width: 14, height: 14 }} />
                <span>{mediaType === 'video' ? 'Run Video AI Compliance Check' : 'Run Brand Compliance Check'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitPage;
