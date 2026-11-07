import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  AlertTriangle,
  X,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { VideoSegmentViolation, Severity } from '@/types';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  violations: VideoSegmentViolation[];
  onSelectViolation?: (violation: VideoSegmentViolation) => void;
  selectedViolationId?: string | null;
}

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; dot: string; border: string }> = {
  high: { bg: '#fef2f2', text: '#b91c1c', dot: '#dc2626', border: '#fca5a5' },
  med:  { bg: '#fffbeb', text: '#92400e', dot: '#d97706', border: '#fcd34d' },
  low:  { bg: '#f0fdf4', text: '#15803d', dot: '#16a34a', border: '#86efac' },
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  violations,
  onSelectViolation,
  selectedViolationId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active AI popup popup state
  const [activePopupViolation, setActivePopupViolation] = useState<VideoSegmentViolation | null>(null);
  const [dismissedViolationIds, setDismissedViolationIds] = useState<Set<string>>(new Set());

  // Track the most recently triggered violation to prevent repeated spamming
  const lastTriggeredIdRef = useRef<string | null>(null);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  // Jump directly to a given timestamp
  const jumpToTime = useCallback((targetSec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(targetSec, duration || 9999));
    videoRef.current.play().catch(() => {});
  }, [duration]);

  // Video timeupdate listener: syncs progress and handles automatic AI comment popups
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Find any violation within a 1.25s detection window of the current playback timestamp
    const matching = violations.find(
      (v) => Math.abs(cur - v.timestamp) < 1.25 && !dismissedViolationIds.has(v.id)
    );

    if (matching) {
      if (lastTriggeredIdRef.current !== matching.id) {
        lastTriggeredIdRef.current = matching.id;
        setActivePopupViolation(matching);
      }
    } else {
      // If playback has progressed past the violation window, close popup
      if (
        activePopupViolation &&
        Math.abs(cur - activePopupViolation.timestamp) >= 3.5
      ) {
        setActivePopupViolation(null);
        lastTriggeredIdRef.current = null;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * duration;
    jumpToTime(targetTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Sync external selection with playback
  useEffect(() => {
    if (selectedViolationId) {
      const match = violations.find((v) => v.id === selectedViolationId);
      if (match) {
        setActivePopupViolation(match);
        jumpToTime(match.timestamp);
      }
    }
  }, [selectedViolationId, violations, jumpToTime]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        background: '#0c0a09',
        border: '1px solid var(--rule-dark)',
        boxShadow: '3.5px 3.5px 0px var(--btn-shadow)',
        borderRadius: 'var(--radius-btn)',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Main Video Display ── */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000000' }}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
        />

        {/* ── Automatic AI Comment Popup overlay ── */}
        {activePopupViolation && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              maxWidth: 360,
              width: 'calc(100% - 40px)',
              background: 'var(--white)',
              border: `1.5px solid ${SEVERITY_COLORS[activePopupViolation.severity].border}`,
              borderLeft: `5px solid ${SEVERITY_COLORS[activePopupViolation.severity].dot}`,
              boxShadow: '4px 4px 0px rgba(0,0,0,0.6)',
              borderRadius: 'var(--radius-btn)',
              padding: '16px',
              zIndex: 30,
              color: 'var(--ink)',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 6px',
                    background: SEVERITY_COLORS[activePopupViolation.severity].bg,
                    color: SEVERITY_COLORS[activePopupViolation.severity].text,
                    border: `1px solid ${SEVERITY_COLORS[activePopupViolation.severity].border}`,
                    borderRadius: 2,
                  }}
                >
                  <AlertTriangle style={{ width: 10, height: 10 }} />
                  {activePopupViolation.severity} Violation
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>
                  @{formatSeconds(activePopupViolation.timestamp)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDismissedViolationIds((prev) => new Set(prev).add(activePopupViolation.id));
                  setActivePopupViolation(null);
                }}
                className="btn-plain"
                title="Dismiss flag popup"
                style={{
                  cursor: 'pointer',
                  color: 'var(--ink-faint)',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)', lineHeight: 1.3 }}>
              {activePopupViolation.explanation}
            </p>

            <div style={{
              background: 'var(--paper)',
              border: '1px solid var(--rule)',
              padding: '8px 10px',
              fontSize: 11,
              color: 'var(--ink-mid)',
              marginBottom: 10,
              borderRadius: 2,
            }}>
              <span style={{ fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 2 }}>Flagged Evidence:</span>
              <code style={{ fontFamily: 'var(--font-mono)', color: '#b91c1c', fontWeight: 600 }}>
                "{activePopupViolation.evidence}"
              </code>
            </div>

            <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 12 }}>
              <CheckCircle2 style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
              <span>Fix: {activePopupViolation.suggested_correction}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--rule)', paddingTop: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                {activePopupViolation.category.replace(/_/g, ' ')}
              </span>
              <button
                onClick={() => {
                  if (onSelectViolation) onSelectViolation(activePopupViolation);
                }}
                className="btn-primary"
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <span>View Full Citation</span>
                <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Interactive Custom AI Review Timeline ── */}
      <div style={{ padding: '16px 20px 20px', background: 'var(--paper-mid)', borderTop: '1px solid var(--rule)' }}>
        {/* Scrubber Bar Container */}
        <div
          onClick={handleTimelineClick}
          style={{
            position: 'relative',
            height: 24,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title="Click timeline or violation marker to inspect"
        >
          {/* Base Track */}
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 6,
            background: 'var(--paper-dark)',
            border: '1px solid var(--rule)',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            {/* Playhead Progress Fill */}
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'var(--btn-primary)',
              transition: isPlaying ? 'none' : 'width 0.1s ease',
            }} />
          </div>

          {/* Interactive Violation Red Markers */}
          {duration > 0 &&
            violations.map((v) => {
              const markerPercent = Math.max(0, Math.min(100, (v.timestamp / duration) * 100));
              const isSelected = selectedViolationId === v.id || activePopupViolation?.id === v.id;
              const col = SEVERITY_COLORS[v.severity] || SEVERITY_COLORS.high;

              return (
                <div
                  key={v.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToTime(v.timestamp);
                    setActivePopupViolation(v);
                    if (onSelectViolation) onSelectViolation(v);
                  }}
                  title={`[${v.severity.toUpperCase()} VIOLATION] @${formatSeconds(v.timestamp)}: ${v.explanation}`}
                  style={{
                    position: 'absolute',
                    left: `${markerPercent}%`,
                    transform: 'translateX(-50%)',
                    width: isSelected ? 16 : 12,
                    height: isSelected ? 16 : 12,
                    background: col.dot,
                    border: '2px solid #ffffff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    zIndex: isSelected ? 20 : 10,
                    transition: 'transform 0.1s ease, width 0.1s ease, height 0.1s ease',
                  }}
                />
              );
            })}
        </div>

        {/* ── Playback Controls & Time ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="btn-primary"
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                cursor: 'pointer',
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14, marginLeft: 2 }} />}
            </button>

            {/* Restart */}
            <button
              onClick={() => jumpToTime(0)}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--white)',
                border: '1px solid var(--rule-dark)',
                borderRadius: 'var(--radius-btn)',
                cursor: 'pointer',
                color: 'var(--ink)',
                padding: 0,
                boxShadow: '2px 2px 0px var(--btn-shadow)',
              }}
              title="Restart Video"
            >
              <RotateCcw style={{ width: 13, height: 13 }} />
            </button>

            {/* Audio Mute/Unmute */}
            <button
              onClick={toggleMute}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--white)',
                border: '1px solid var(--rule-dark)',
                borderRadius: 'var(--radius-btn)',
                cursor: 'pointer',
                color: 'var(--ink)',
                padding: 0,
                boxShadow: '2px 2px 0px var(--btn-shadow)',
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX style={{ width: 14, height: 14 }} /> : <Volume2 style={{ width: 14, height: 14 }} />}
            </button>

            {/* Timestamp text */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-mid)', fontWeight: 600, marginLeft: 6 }}>
              <span>{formatSeconds(currentTime)}</span>
              <span style={{ color: 'var(--ink-faint)', margin: '0 4px' }}>/</span>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Total flags count badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--white)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--radius-btn)',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--ink)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
              <span>{violations.length} AI Timeline Flags</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              style={{
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--white)',
                border: '1px solid var(--rule-dark)',
                borderRadius: 'var(--radius-btn)',
                cursor: 'pointer',
                color: 'var(--ink)',
                padding: 0,
                boxShadow: '2px 2px 0px var(--btn-shadow)',
              }}
              title="Fullscreen"
            >
              <Maximize2 style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

