import React, { useState } from 'react';
import {
  VideoSegmentViolation,
  Submission,
  Brand,
  User,
  Severity,
} from '@/types';
import { VideoPlayer } from './VideoPlayer';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  Quote,
  Wrench,
  Check,
  Send,
  ScanText,
  Volume2,
  FileText,
  Play,
} from 'lucide-react';

interface VideoAuditReportProps {
  submission: Submission;
  violations: VideoSegmentViolation[];
  brand: Brand;
  currentUser: User;
  onBack: () => void;
  onSubmitReview?: (submissionId: string, decision: 'approve' | 'request_changes', comment: string) => void;
  onApplyCorrection?: (violationId: string) => void;
}

const SEVERITY_BADGE: Record<Severity, { bg: string; color: string; border: string }> = {
  high: { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  med:  { bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
  low:  { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
};

export const VideoAuditReport: React.FC<VideoAuditReportProps> = ({
  submission,
  violations,
  brand,
  currentUser,
  onBack,
  onSubmitReview,
  onApplyCorrection,
}) => {
  const [selectedViolationId, setSelectedViolationId] = useState<string | null>(
    violations[0]?.id || null
  );
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');
  const [reviewComment, setReviewComment] = useState('');
  const [appliedCorrections, setAppliedCorrections] = useState<Set<string>>(new Set());

  const selectedViolation = violations.find((v) => v.id === selectedViolationId) || violations[0];

  const filteredViolations = violations.filter(
    (v) => severityFilter === 'all' || v.severity === severityFilter
  );

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleApplyFix = (vId: string) => {
    setAppliedCorrections((prev) => new Set(prev).add(vId));
    if (onApplyCorrection) onApplyCorrection(vId);
  };

  const isReviewer = currentUser.role === 'reviewer' || currentUser.role === 'admin';

  /**
   * Parse `ocr_text` field (format: "[@Xs Whisper Audio] "..."") into transcript segments
   * as a fallback when video_metadata.transcript is not available.
   */
  const parsedOcrTranscript = React.useMemo(() => {
    const ocrText = submission.ocr_text || '';
    if (!ocrText) return [];
    const lines = ocrText.split('\n').filter(Boolean);
    const segments: { timestamp: number; text: string; ocr: string }[] = [];
    for (const line of lines) {
      const timeMatch = line.match(/\[@([\d.]+)s/);
      const time = timeMatch ? parseFloat(timeMatch[1]) : 0;
      const isAudio = line.includes('Whisper Audio');
      const isOcr = line.includes('Frame OCR');
      const textMatch = line.match(/"([^"]+)"/) || line.match(/"([^"]+)"/);
      const text = textMatch ? textMatch[1] : '';
      if (text && (isAudio || isOcr)) {
        segments.push({
          timestamp: time,
          text: isAudio ? text : '',
          ocr: isOcr ? text : '',
        });
      }
    }
    return segments;
  }, [submission.ocr_text]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Header Bar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 20,
        marginBottom: 24,
        borderBottom: '1px solid var(--rule)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBack}
            className="btn-plain"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--ink-mid)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Submissions
          </button>
          <span style={{ color: 'var(--rule)' }}>|</span>
          <div>
            <div className="kicker-accent" style={{ marginBottom: 2 }}>AI Video Compliance Analysis</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 900, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
              {submission.title}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              background: submission.risk_score >= 60 ? '#fef2f2' : '#f0fdf4',
              color: submission.risk_score >= 60 ? '#b91c1c' : '#15803d',
              border: `1px solid ${submission.risk_score >= 60 ? '#fca5a5' : '#86efac'}`,
              borderRadius: 'var(--radius-btn)',
            }}
          >
            Video Risk Score: {submission.risk_score} / 100
          </span>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 28, alignItems: 'start' }}>
        {/* Left Column: Integrated Video Player & Interactive Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <VideoPlayer
            src={submission.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
            poster={submission.image_url}
            violations={violations}
            selectedViolationId={selectedViolationId}
            onSelectViolation={(v) => setSelectedViolationId(v.id)}
          />

          {/* Video Metadata / Extracted Specs Card */}
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--rule)',
            borderRadius: 'var(--radius-btn)',
            padding: '16px 20px',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <span className="kicker" style={{ marginBottom: 4 }}>Ingested Video Engine Specs</span>
              <p style={{ margin: 0, color: 'var(--ink-mid)' }}>
                Processed via <strong>FFmpeg</strong> (keyframes &amp; audio extraction), <strong>OpenCV</strong> (visual sampling), <strong>Tesseract</strong> (on-screen text), and <strong>Whisper</strong> (voiceover transcription).
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span className="kicker" style={{ marginBottom: 2 }}>Violations</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: '#dc2626' }}>
                {violations.length} Flags
              </span>
            </div>
          </div>

          {/* Extracted Video Text & Voiceover Audio Transcript (OCR & Whisper) */}
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--rule)',
            borderRadius: 'var(--radius-btn)',
            padding: '20px',
            boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--rule)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ScanText style={{ width: 16, height: 16, color: 'var(--accent)' }} />
                <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
                  Extracted On-Screen Text &amp; Audio Transcription
                </span>
              </div>
              <span className="kicker" style={{ color: 'var(--ink-faint)' }}>
                OCR &amp; Whisper Pipeline
              </span>
            </div>

            {(() => {
              const displaySegments =
                (submission.video_metadata?.transcript && submission.video_metadata.transcript.length > 0)
                  ? submission.video_metadata.transcript
                  : parsedOcrTranscript.length > 0
                  ? parsedOcrTranscript
                  : null;
              return displaySegments ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displaySegments.map((seg, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--paper)',
                      border: '1px solid var(--rule)',
                      borderRadius: 'var(--radius-btn)',
                      padding: '10px 14px',
                      fontSize: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        background: '#eff6ff',
                        padding: '2px 6px',
                        borderRadius: 4,
                        border: '1px solid #bfdbfe',
                      }}>
                        <Clock style={{ width: 11, height: 11 }} /> {formatSeconds(seg.timestamp)}
                      </span>
                      <span className="kicker" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
                        Segment #{idx + 1}
                      </span>
                    </div>

                    {seg.ocr && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <ScanText style={{ width: 13, height: 13, color: 'var(--ink-mid)', marginTop: 2, flexShrink: 0 }} />
                        <span style={{ color: 'var(--ink)' }}>
                          <strong style={{ fontWeight: 600, color: 'var(--ink-soft)' }}>OCR: </strong>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(0,0,0,0.04)', padding: '1px 4px', borderRadius: 2 }}>
                            {seg.ocr}
                          </span>
                        </span>
                      </div>
                    )}

                    {seg.text && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <Volume2 style={{ width: 13, height: 13, color: '#2563eb', marginTop: 2, flexShrink: 0 }} />
                        <span style={{ color: 'var(--ink-soft)' }}>
                          <strong style={{ fontWeight: 600, color: '#1d4ed8' }}>Audio: </strong>
                          <em>"{seg.text}"</em>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              ) : (
              <div style={{
                background: 'var(--paper)',
                border: '1px dashed var(--rule-dark)',
                borderRadius: 'var(--radius-btn)',
                padding: '16px',
                textAlign: 'center',
                color: 'var(--ink-faint)',
                fontSize: 12,
              }}>
                No text or speech detected in keyframes.
              </div>
              );
            })()}
          </div>

          {/* Reviewer Action Bar (if Reviewer) */}
          {isReviewer && onSubmitReview && (
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius-btn)',
              padding: '20px',
              boxShadow: '3px 3px 0px var(--btn-shadow)',
            }}>
              <div className="kicker-accent" style={{ marginBottom: 8 }}>Human Review Decision</div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Enter compliance decision comments for creator..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 12,
                  border: '1px solid var(--rule-dark)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  outline: 'none',
                  resize: 'none',
                  marginBottom: 12,
                  borderRadius: 'var(--radius-btn)',
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => onSubmitReview(submission.id, 'approve', reviewComment)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    background: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #86efac',
                    borderRadius: 'var(--radius-btn)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 style={{ width: 14, height: 14 }} /> Approve Video
                </button>
                <button
                  onClick={() => onSubmitReview(submission.id, 'request_changes', reviewComment)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fca5a5',
                    borderRadius: 'var(--radius-btn)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangle style={{ width: 14, height: 14 }} /> Request Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Violation Cards & Selected Flag Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="kicker">Detected Violations ({filteredViolations.length})</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'high', 'med', 'low'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                    background: severityFilter === sev ? 'var(--ink)' : 'var(--white)',
                    color: severityFilter === sev ? 'var(--white)' : 'var(--ink-faint)',
                    border: `1px solid ${severityFilter === sev ? 'var(--ink)' : 'var(--rule)'}`,
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* List of Flagged Timeline Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 560, overflowY: 'auto' }}>
            {filteredViolations.map((v) => {
              const isSelected = selectedViolation?.id === v.id;
              const isFixed = appliedCorrections.has(v.id);
              const badge = SEVERITY_BADGE[v.severity] || SEVERITY_BADGE.med;

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedViolationId(v.id)}
                  style={{
                    background: isSelected ? 'var(--paper)' : 'var(--white)',
                    border: `1px solid ${isSelected ? 'var(--rule-dark)' : 'var(--rule)'}`,
                    borderLeft: `4px solid ${badge.color}`,
                    borderRadius: 'var(--radius-btn)',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '2.5px 2.5px 0px var(--btn-shadow)' : 'none',
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--accent)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Clock style={{ width: 12, height: 12 }} />
                        {formatSeconds(v.timestamp)}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '1px 6px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          borderRadius: 2,
                        }}
                      >
                        {v.severity}
                      </span>
                    </div>

                    {isFixed && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Check style={{ width: 12, height: 12 }} /> Fixed
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.3 }}>
                    {v.explanation}
                  </p>

                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Evidence:</span>
                    <code style={{ fontFamily: 'var(--font-mono)', color: '#b91c1c', fontWeight: 600 }}>
                      "{v.evidence}"
                    </code>
                  </div>

                  {/* Expanded detail when card is selected */}
                  {isSelected && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {v.source_citation && (
                        <div style={{ background: 'var(--paper-mid)', padding: '8px 10px', fontSize: 11, color: 'var(--ink-mid)', borderLeft: '2px solid var(--accent)' }}>
                          <Quote style={{ width: 10, height: 10, display: 'inline', marginRight: 4, color: 'var(--accent)' }} />
                          <em>"{v.source_citation}"</em>
                        </div>
                      )}

                      <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>
                        Correction: {v.suggested_correction}
                      </div>

                      {!isFixed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyFix(v.id);
                          }}
                          className="btn-primary"
                          style={{
                            alignSelf: 'flex-start',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 12px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            marginTop: 4,
                          }}
                        >
                          <Wrench style={{ width: 12, height: 12 }} />
                          <span>Apply Suggested Fix</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

