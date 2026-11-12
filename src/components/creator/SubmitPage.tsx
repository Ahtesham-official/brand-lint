import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Send,
  Loader2,
  ScanText,
  Video,
  Image as ImageIcon,
  Upload,
  CheckCircle,
} from 'lucide-react';
import type { Brand, Submission } from '@/types';
import { DEMO_SUBMISSION_INITIAL } from '@/data/seedData';
import { api } from '@/lib/api';
import { SPRING_SNAPPY } from '@/components/motion/MotionPrimitives';

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
  const [extractingVideo, setExtractingVideo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const maxCaption = 1000;

    const performVideoExtraction = async (
      url: string,
      videoTitle: string,
      hint?: string,
      base64Data?: string,
      fileName?: string
    ) => {
      setExtractingVideo(true);
      setShowOcr(true);
      try {
        const res = await api.extractVideo(url, videoTitle, hint, base64Data, fileName);
        if (res && res.success) {
          const combined = [res.ocr_summary, res.audio_summary].filter(Boolean).join('\n\n');
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
        setOcrText('');
        setShowOcr(true);

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = typeof reader.result === 'string' ? reader.result : undefined;
          performVideoExtraction(localUrl, cleanName, undefined, base64, file.name);
        };
        reader.readAsDataURL(file);
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
        if (!title || PRESET_VIDEOS.some((p) => p.name === title)) {
          setTitle(cleanName);
        }
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (mediaType === 'image' && (!caption.trim() || !imageUrl.trim())) return;
      if (mediaType === 'video' && !videoUrl.trim() && !imageUrl.trim()) return;

      setLoading(true);
      try {
        const finalImage =
          imageUrl.trim() ||
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80';
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

    return (
      <div className="mx-auto max-w-5xl space-y-6 font-sans text-slate-900">
        {/* ── Header ── */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <span className="kicker-accent mb-1.5">Creator Studio</span>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
              New Compliance Check
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Submit marketing posters, captions, or video commercials for <strong className="font-medium text-slate-800">{brand.name}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-600" />
            Load Demo Violation
          </button>
        </div>

        {/* ── Media Type Switcher with Animated Pill ── */}
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setMediaType('video')}
            className={`btn-plain relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${mediaType === 'video' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            {mediaType === 'video' && (
              <motion.span
                layoutId="submit-media-tab"
                transition={SPRING_SNAPPY}
                className="absolute inset-0 rounded-lg bg-slate-900"
              />
            )}
            <Video className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10">Video Commercial</span>
          </button>
          <button
            type="button"
            onClick={() => setMediaType('image')}
            className={`btn-plain relative inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${mediaType === 'image' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            {mediaType === 'image' && (
              <motion.span
                layoutId="submit-media-tab"
                transition={SPRING_SNAPPY}
                className="absolute inset-0 rounded-lg bg-slate-900"
              />
            )}
            <ImageIcon className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10">Static Poster &amp; Copy</span>
          </button>
        </div>

        {/* ── Form & Preview Grid ── */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <div className="saas-card space-y-5 p-6">
              <div>
                <label className="kicker mb-1.5">Campaign Title</label>
                <input
                  type="text"
                  placeholder={mediaType === 'video' ? 'e.g. Apex Earbuds Launch Commercial' : 'e.g. Festive Wireless Earbuds Ad'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                />
              </div>

              {mediaType === 'image' ? (
                <>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="kicker">Marketing Caption *</label>
                      <span className="font-mono text-[10px] text-slate-400">
                        {caption.length} / {maxCaption}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={maxCaption}
                      placeholder="Enter social copy, ad headline, or product claims to verify against active rules..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      required
                      className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  {/* Centered Upload Image Button with Drag-and-Drop Feedback */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') setImageUrl(reader.result);
                        };
                        reader.readAsDataURL(file);
                        setUploadedImageName(file.name);
                        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
                      }
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-6 text-center transition-all ${isDragging
                        ? 'scale-[1.01] border-sky-500 bg-sky-50/70'
                        : 'border-slate-300 bg-slate-50/60'
                      }`}
                  >
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadedImageName ? 'Replace Poster Image' : 'Upload Poster Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                      {uploadedImageName ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                          <CheckCircle className="h-3.5 w-3.5" /> {uploadedImageName}
                        </span>
                      ) : (
                        'PNG, JPG, or WEBP up to 25MB'
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="kicker mb-2">Upload Video or Select Sample</label>
                    <div className="flex flex-col gap-3">
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-xs font-semibold text-slate-700 transition-colors hover:border-sky-400 hover:bg-sky-50/40">
                        <Upload className="h-4 w-4 text-sky-600" />
                        Upload Local Video (.mp4, .mov, .webm)
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          className="hidden"
                        />
                      </label>

                      <div className="space-y-2">
                        <span className="text-[11px] font-medium text-slate-400">Or select a preset demo commercial:</span>
                        {PRESET_VIDEOS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => handleSelectVideoPreset(preset)}
                            className={`btn-plain flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs transition-colors ${videoUrl === preset.url
                                ? 'border-sky-500 bg-sky-50/70 font-semibold text-slate-900'
                                : 'border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            <span className="truncate">{preset.name}</span>
                            {videoUrl === preset.url && (
                              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Optional OCR / Transcript */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOcr(!showOcr)}
                  className="btn-plain inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <ScanText className="h-3.5 w-3.5 text-sky-600" />
                  {showOcr ? 'Hide' : 'Show'} Extracted OCR / Audio Transcript
                  {extractingVideo && <Loader2 className="h-3 w-3 animate-spin text-sky-600" />}
                </button>

                {showOcr && (
                  <textarea
                    rows={4}
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    placeholder="On-screen poster text or extracted video audio transcript..."
                    className="mt-2.5 w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
                  />
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (mediaType === 'image' && (!caption.trim() || !imageUrl.trim())) ||
                    (mediaType === 'video' && !videoUrl.trim() && !imageUrl.trim())
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition-all hover:bg-slate-800"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running AI Brand Compliance Audit…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Run Compliance Check
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:col-span-5">
            <div className="saas-card overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Asset Preview
                </h2>
              </div>
              <div className="p-5">
                {mediaType === 'video' && videoUrl ? (
                  <video
                    src={videoUrl}
                    poster={imageUrl || undefined}
                    controls
                    className="aspect-video w-full rounded-xl border border-slate-200 bg-slate-950 object-cover"
                  />
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-80 w-full rounded-xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                    {mediaType === 'video' ? (
                      <Video className="mb-2 h-8 w-8 text-slate-300" />
                    ) : (
                      <ImageIcon className="mb-2 h-8 w-8 text-slate-300" />
                    )}
                    Upload an asset or load the demo violation to preview it here.
                  </div>
                )}

                {mediaType === 'image' && caption && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                    {caption}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  };

  export default SubmitPage;
