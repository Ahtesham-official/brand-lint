import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Check,
  Target,
  ArrowRight,
  Split,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import { Fact, Guideline, Rule } from '@/types';

interface GuidelineDetailModalProps {
  guideline: Guideline;
  rules: Rule[];
  facts?: Fact[];
  isOpen: boolean;
  onClose: () => void;
  onSelectVersion: (guidelineId: string, version: 'original' | 'enhanced') => Promise<void>;
  onConfirmGuideline: (guidelineId: string) => void;
  extracting?: boolean;
  extractionBanner?: {
    status: 'loading' | 'success' | 'partial' | 'failed' | 'empty';
    message: string;
  } | null;
  onRetryExtract?: (guidelineId: string) => void;
}

const NOT_SPECIFIED = 'Not specified in document';

export const GuidelineDetailModal: React.FC<GuidelineDetailModalProps> = ({
  guideline,
  rules,
  facts = [],
  isOpen,
  onClose,
  onSelectVersion,
  onConfirmGuideline,
  extracting = false,
  extractionBanner = null,
  onRetryExtract,
}) => {
  const [activeTab, setActiveTab] = useState<'comprehension' | 'comparison' | 'rules' | 'facts'>('comprehension');
  const [selectingVersion, setSelectingVersion] = useState(false);

  if (!isOpen) return null;

  const currentVersion = guideline.selected_version || 'original';
  const analysis = guideline.ai_analysis;
  const enhancedText = guideline.enhanced_version;

  const handleSelect = async (version: 'original' | 'enhanced') => {
    setSelectingVersion(true);
    try {
      await onSelectVersion(guideline.id, version);
    } finally {
      setSelectingVersion(false);
    }
  };

  const associatedRules = rules.filter((r) => r.guideline_id === guideline.id);

  const guidelineOrg = guideline.org_id || guideline.brand_id;
  const associatedFacts = facts.filter((f) => {
    if (f.source_guideline_id) {
      return f.source_guideline_id === guideline.id;
    }
    const factOrg = f.org_id || f.brand_id;
    return f.source_document === guideline.filename && (!guidelineOrg || !factOrg || factOrg === guidelineOrg);
  });

  const isFailed =
    !extracting &&
    (extractionBanner?.status === 'failed' || guideline.extraction_status === 'failed');

  const bannerToShow = extracting
    ? { status: 'loading' as const, message: 'Analysing brand guidelines...' }
    : extractionBanner
    ? extractionBanner
    : guideline.extraction_status === 'failed'
    ? { status: 'failed' as const, message: 'Extraction failed. Please retry.' }
    : guideline.extraction_status === 'partial'
    ? { status: 'partial' as const, message: 'Extraction completed with warnings.' }
    : null;

  const bannerStyles: Record<string, { bg: string; border: string; color: string }> = {
    loading: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
    success: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    partial: { bg: '#fffbeb', border: '#fde68a', color: '#b45309' },
    failed: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
    empty: { bg: 'var(--paper)', border: 'var(--rule)', color: 'var(--ink-mid)' },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.6)', padding: 24 }}>
      <div
        className="animate-in"
        style={{
          background: 'var(--white)',
          border: '1px solid var(--rule)',
          width: '100%',
          maxWidth: 980,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
          fontFamily: 'var(--font-sans)',
          color: 'var(--ink)',
        }}
      >
        {/* ── Modal Header ── */}
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--paper)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText style={{ width: 18, height: 18, color: '#e0f2fe' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 22, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>
                  {guideline.filename}
                </h3>
                <span className="badge" style={{ background: currentVersion === 'enhanced' ? '#e0f2fe' : 'var(--paper-mid)', color: currentVersion === 'enhanced' ? '#075985' : 'var(--ink-mid)', borderColor: currentVersion === 'enhanced' ? '#7dd3fc' : 'var(--rule)' }}>
                  Active Version: {currentVersion.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 4, fontWeight: 300 }}>
                AI Comprehension Analysis, Extracted Rulebook &amp; Fact Vault
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {guideline.status !== 'confirmed' && !isFailed && (
              <button
                onClick={() => onConfirmGuideline(guideline.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <CheckCircle2 style={{ width: 14, height: 14 }} /> Confirm Rules
              </button>
            )}
            <button
              onClick={onClose}
              style={{ padding: '9px 18px', background: 'transparent', border: '1px solid var(--rule)', color: 'var(--ink-mid)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>

        {/* ── Status / Error Banner ── */}
        {bannerToShow && (
          <div
            style={{
              padding: '10px 28px',
              background: bannerStyles[bannerToShow.status].bg,
              borderBottom: `1px solid ${bannerStyles[bannerToShow.status].border}`,
              color: bannerStyles[bannerToShow.status].color,
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {bannerToShow.status === 'loading' && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
              {(bannerToShow.status === 'failed' || bannerToShow.status === 'partial') && <AlertTriangle style={{ width: 14, height: 14 }} />}
              {bannerToShow.status === 'success' && <CheckCircle2 style={{ width: 14, height: 14 }} />}
              <span>{bannerToShow.message}</span>
            </div>
            {bannerToShow.status === 'failed' && onRetryExtract && (
              <button
                onClick={() => onRetryExtract(guideline.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  background: '#ffffff',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw style={{ width: 12, height: 12 }} /> Retry Extraction
              </button>
            )}
          </div>
        )}

        {/* ── Tab Navigation ── */}
        <div style={{ padding: '0 28px', borderBottom: '1px solid var(--rule)', background: 'var(--white)', display: 'flex', gap: 24, fontSize: 13, overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('comprehension')}
            className="btn-plain"
            style={{
              padding: '14px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              borderBottom: activeTab === 'comprehension' ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'comprehension' ? 'var(--ink)' : 'var(--ink-light)',
              fontWeight: activeTab === 'comprehension' ? 700 : 500,
              whiteSpace: 'nowrap',
            }}
          >
            <Sparkles style={{ width: 14, height: 14, color: activeTab === 'comprehension' ? 'var(--accent)' : 'var(--ink-light)' }} />
            AI Comprehension
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className="btn-plain"
            style={{
              padding: '14px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              borderBottom: activeTab === 'comparison' ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'comparison' ? 'var(--ink)' : 'var(--ink-light)',
              fontWeight: activeTab === 'comparison' ? 700 : 500,
              whiteSpace: 'nowrap',
            }}
          >
            <Split style={{ width: 14, height: 14, color: activeTab === 'comparison' ? 'var(--accent)' : 'var(--ink-light)' }} />
            Original vs AI Enhanced
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className="btn-plain"
            style={{
              padding: '14px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              borderBottom: activeTab === 'rules' ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'rules' ? 'var(--ink)' : 'var(--ink-light)',
              fontWeight: activeTab === 'rules' ? 700 : 500,
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldCheck style={{ width: 14, height: 14, color: activeTab === 'rules' ? 'var(--accent)' : 'var(--ink-light)' }} />
            Extracted Rulebook ({associatedRules.length})
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className="btn-plain"
            style={{
              padding: '14px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              borderBottom: activeTab === 'facts' ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'facts' ? 'var(--ink)' : 'var(--ink-light)',
              fontWeight: activeTab === 'facts' ? 700 : 500,
              whiteSpace: 'nowrap',
            }}
          >
            <BookOpen style={{ width: 14, height: 14, color: activeTab === 'facts' ? 'var(--accent)' : 'var(--ink-light)' }} />
            Fact Vault ({associatedFacts.length})
          </button>
        </div>

        {/* ── Tab Content Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* TAB 1: AI Comprehension */}
          {activeTab === 'comprehension' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {isFailed ? (
                <div style={{ padding: '28px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Extraction failed. Please retry.</div>
                  <div style={{ fontSize: 13, color: '#b91c1c' }}>
                    {guideline.extraction_error || 'The AI service could not process this document. No placeholder or fallback data is shown.'}
                  </div>
                </div>
              ) : !analysis ? (
                <div style={{ padding: '28px', background: 'var(--paper)', border: '1px solid var(--rule)', color: 'var(--ink-light)', fontSize: 13 }}>
                  {extracting
                    ? 'Analysing brand guidelines...'
                    : 'No AI comprehension has been extracted for this document yet. Run extraction to analyse this document.'}
                </div>
              ) : (
                <>
                  {/* Brand Name & Overview Card */}
                  <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', padding: '22px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span className="kicker-accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles style={{ width: 14, height: 14 }} /> Brand Overview — {analysis.brand_name || NOT_SPECIFIED}
                      </span>
                      {analysis.strictness_level && (
                        <span className="badge" style={{ background: '#e0f2fe', color: '#075985', borderColor: '#7dd3fc' }}>
                          Strictness: {analysis.strictness_level}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                      {analysis.summary || NOT_SPECIFIED}
                    </p>
                  </div>

                  {/* Brand Identity */}
                  <div style={{ padding: '18px 20px', background: 'var(--white)', border: '1px solid var(--rule)' }}>
                    <span className="kicker" style={{ marginBottom: 6 }}>Brand Identity</span>
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.6 }}>
                      {analysis.brand_identity || NOT_SPECIFIED}
                    </p>
                  </div>

                  {/* Voice & Audience */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: '18px 20px', background: 'var(--white)', border: '1px solid var(--rule)' }}>
                      <span className="kicker" style={{ marginBottom: 6 }}>Detected Voice &amp; Tone</span>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                        {analysis.tone_profile || NOT_SPECIFIED}
                      </p>
                    </div>
                    <div style={{ padding: '18px 20px', background: 'var(--white)', border: '1px solid var(--rule)' }}>
                      <span className="kicker" style={{ marginBottom: 6 }}>Target Audience</span>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                        {analysis.target_audience || NOT_SPECIFIED}
                      </p>
                    </div>
                  </div>

                  {/* Core Constraints */}
                  <div>
                    <div className="kicker" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Target style={{ width: 13, height: 13, color: 'var(--accent)' }} />
                      Core Constraints Extracted from Document
                    </div>
                    {analysis.key_takeaways && analysis.key_takeaways.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {analysis.key_takeaways.map((point, idx) => (
                          <div
                            key={idx}
                            style={{ padding: '16px 18px', background: 'var(--paper)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                          >
                            <Check style={{ width: 14, height: 14, color: '#15803d', marginTop: 2, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{point}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '14px 18px', background: 'var(--paper)', border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink-light)' }}>
                        {NOT_SPECIFIED}
                      </div>
                    )}
                  </div>

                  {/* Document-Specific Requirements */}
                  <div>
                    <div className="kicker" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ClipboardList style={{ width: 13, height: 13, color: 'var(--accent)' }} />
                      Document-Specific Requirements
                    </div>
                    {analysis.document_requirements && analysis.document_requirements.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {analysis.document_requirements.map((reqItem, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--white)', border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink)' }}>
                            <Check style={{ width: 13, height: 13, color: 'var(--accent)', flexShrink: 0 }} />
                            <span>{reqItem}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '14px 18px', background: 'var(--paper)', border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink-light)' }}>
                        {NOT_SPECIFIED}
                      </div>
                    )}
                  </div>

                  {/* Recommended Actions */}
                  <div>
                    <div className="kicker" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lightbulb style={{ width: 13, height: 13, color: 'var(--accent)' }} />
                      Recommended System Actions
                    </div>
                    {analysis.recommended_actions && analysis.recommended_actions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {analysis.recommended_actions.map((action, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--paper)', border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink)' }}>
                            <ArrowRight style={{ width: 13, height: 13, color: 'var(--accent)', flexShrink: 0 }} />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '14px 18px', background: 'var(--paper)', border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink-light)' }}>
                        {NOT_SPECIFIED}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Side-by-Side Comparison */}
          {activeTab === 'comparison' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Decision Bar */}
              <div style={{ padding: '18px 24px', background: 'var(--paper)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <span className="kicker-accent" style={{ marginBottom: 4 }}>Reviewer Selection</span>
                  <div style={{ fontSize: 13, color: 'var(--ink-light)' }}>
                    Review both versions side by side. Choose which version BrandLint enforces across creative checks.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleSelect('original')}
                    disabled={selectingVersion}
                    style={{
                      padding: '9px 18px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: currentVersion === 'original' ? 'var(--ink)' : 'var(--white)',
                      color: currentVersion === 'original' ? 'var(--white)' : 'var(--ink)',
                      border: `1px solid ${currentVersion === 'original' ? 'var(--ink)' : 'var(--rule)'}`,
                    }}
                  >
                    {currentVersion === 'original' ? '✓ Selected: Original' : 'Select Original'}
                  </button>
                  <button
                    onClick={() => handleSelect('enhanced')}
                    disabled={selectingVersion || !enhancedText}
                    style={{
                      padding: '9px 18px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: enhancedText ? 'pointer' : 'not-allowed',
                      opacity: enhancedText ? 1 : 0.5,
                      background: currentVersion === 'enhanced' ? 'var(--ink)' : 'var(--white)',
                      color: currentVersion === 'enhanced' ? 'var(--white)' : 'var(--accent)',
                      border: `1px solid ${currentVersion === 'enhanced' ? 'var(--ink)' : 'var(--accent)'}`,
                    }}
                  >
                    {currentVersion === 'enhanced' ? '✓ Selected: AI Enhanced' : 'Select AI Enhanced'}
                  </button>
                </div>
              </div>

              {/* Side-by-side columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {/* Original */}
                <div style={{ border: '1px solid var(--rule)', background: 'var(--white)' }}>
                  <div style={{ padding: '12px 18px', background: 'var(--paper)', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Original Uploaded Text</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{guideline.raw_text.length} chars</span>
                  </div>
                  <pre style={{ padding: '18px', margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.6, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap', maxHeight: '48vh', overflowY: 'auto' }}>
                    {guideline.raw_text}
                  </pre>
                </div>

                {/* AI Enhanced */}
                <div style={{ border: '1px solid var(--rule)', background: 'var(--white)' }}>
                  <div style={{ padding: '12px 18px', background: '#e0f2fe', borderBottom: '1px solid #7dd3fc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#075985', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles style={{ width: 13, height: 13 }} /> AI Enhanced Version
                    </span>
                    <span className="badge" style={{ background: '#e0f2fe', color: '#075985', borderColor: '#7dd3fc' }}>
                      {enhancedText ? 'Document-Derived' : 'Pending'}
                    </span>
                  </div>
                  <div style={{ padding: '18px', fontSize: 12, lineHeight: 1.7, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap', maxHeight: '48vh', overflowY: 'auto' }}>
                    {enhancedText || 'AI enhanced version has not been generated for this document yet.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Rules List */}
          {activeTab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="kicker">
                {associatedRules.length} rules extracted from this document
              </div>

              {associatedRules.length === 0 ? (
                <div style={{ padding: '28px', background: 'var(--paper)', border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink-light)' }}>
                  No rules or facts were identified.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {associatedRules.map((rule) => (
                    <div key={rule.id} style={{ padding: '16px 20px', background: 'var(--white)', border: '1px solid var(--rule)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{rule.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          {rule.enforcement_type && (
                            <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                              {rule.enforcement_type}
                            </span>
                          )}
                          <span className="badge" style={{ background: rule.severity === 'high' ? '#fef2f2' : '#fffbeb', color: rule.severity === 'high' ? '#b91c1c' : '#b45309', borderColor: rule.severity === 'high' ? '#fecaca' : '#fde68a' }}>
                            {rule.severity}
                          </span>
                          <span className="badge" style={{ background: 'var(--paper-mid)', color: 'var(--ink-mid)', borderColor: 'var(--rule)' }}>
                            {rule.category}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--ink-light)', margin: '0 0 10px', lineHeight: 1.6 }}>{rule.description}</p>
                      <div style={{ background: 'var(--paper)', padding: '10px 14px', borderLeft: '3px solid var(--accent)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink)' }}>
                        &ldquo;{rule.source_citation || NOT_SPECIFIED}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Fact Vault */}
          {activeTab === 'facts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="kicker">
                {associatedFacts.length} approved facts extracted from this document
              </div>

              {associatedFacts.length === 0 ? (
                <div style={{ padding: '28px', background: 'var(--paper)', border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink-light)' }}>
                  No approved facts have been extracted from this document yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {associatedFacts.map((fact) => (
                    <div key={fact.id} style={{ padding: '16px 20px', background: 'var(--white)', border: '1px solid var(--rule)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 12 }}>
                        <div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginRight: 8 }}>
                            {fact.id}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                            {fact.fact_title || fact.claim}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#86efac' }}>
                            {fact.status}
                          </span>
                          <span className="badge" style={{ background: 'var(--paper-mid)', color: 'var(--ink-mid)', borderColor: 'var(--rule)' }}>
                            {fact.category || 'general'}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 8px', lineHeight: 1.6 }}>
                        {fact.fact_value || fact.claim}
                      </p>
                      <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontFamily: 'var(--font-mono)' }}>
                        Source: {fact.source_document} · Status: {fact.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
