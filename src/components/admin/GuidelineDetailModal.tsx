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
} from 'lucide-react';
import { Guideline, Rule } from '@/types';

interface GuidelineDetailModalProps {
  guideline: Guideline;
  rules: Rule[];
  isOpen: boolean;
  onClose: () => void;
  onSelectVersion: (guidelineId: string, version: 'original' | 'enhanced') => Promise<void>;
  onConfirmGuideline: (guidelineId: string) => void;
}

export const GuidelineDetailModal: React.FC<GuidelineDetailModalProps> = ({
  guideline,
  rules,
  isOpen,
  onClose,
  onSelectVersion,
  onConfirmGuideline,
}) => {
  const [activeTab, setActiveTab] = useState<'comprehension' | 'comparison' | 'rules'>('comprehension');
  const [selectingVersion, setSelectingVersion] = useState(false);

  if (!isOpen) return null;

  const currentVersion = guideline.selected_version || 'original';
  const analysis = guideline.ai_analysis;
  const enhancedText = guideline.enhanced_version || guideline.raw_text;

  const handleSelect = async (version: 'original' | 'enhanced') => {
    setSelectingVersion(true);
    try {
      await onSelectVersion(guideline.id, version);
    } finally {
      setSelectingVersion(false);
    }
  };

  const associatedRules = rules.filter((r) => r.guideline_id === guideline.id);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(28,25,23,0.6)', padding: 24 }}>
      <div
        className="animate-in"
        style={{
          background: 'var(--white)',
          border: '1px solid var(--rule)',
          width: '100%',
          maxWidth: 960,
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
              <FileText style={{ width: 18, height: 18, color: '#fef3c7' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 22, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em' }}>
                  {guideline.filename}
                </h3>
                <span className="badge" style={{ background: currentVersion === 'enhanced' ? '#fef3c7' : 'var(--paper-mid)', color: currentVersion === 'enhanced' ? '#92400e' : 'var(--ink-mid)', borderColor: currentVersion === 'enhanced' ? '#fcd34d' : 'var(--rule)' }}>
                  Active Version: {currentVersion.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 4, fontWeight: 300 }}>
                AI Comprehension Analysis &amp; Version Comparison
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {guideline.status !== 'confirmed' && (
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

        {/* ── Tab Navigation ── */}
        <div style={{ padding: '0 28px', borderBottom: '1px solid var(--rule)', background: 'var(--white)', display: 'flex', gap: 24, fontSize: 13 }}>
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
            }}
          >
            <Sparkles style={{ width: 14, height: 14, color: activeTab === 'comprehension' ? 'var(--accent)' : 'var(--ink-light)' }} />
            AI Comprehension &amp; Enforced Rules
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
            }}
          >
            <Split style={{ width: 14, height: 14, color: activeTab === 'comparison' ? 'var(--accent)' : 'var(--ink-light)' }} />
            Side-by-Side Version Review (Original vs AI Enhanced)
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
            }}
          >
            <ShieldCheck style={{ width: 14, height: 14, color: activeTab === 'rules' ? 'var(--accent)' : 'var(--ink-light)' }} />
            Extracted Rulebook ({associatedRules.length})
          </button>
        </div>

        {/* ── Tab Content Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* TAB 1: AI Comprehension */}
          {activeTab === 'comprehension' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Executive Summary Card */}
              <div style={{ background: 'var(--paper)', border: '1px solid var(--rule)', padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="kicker-accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles style={{ width: 14, height: 14 }} /> What the AI Understood from this Document
                  </span>
                  {analysis?.strictness_level && (
                    <span className="badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
                      Strictness: {analysis.strictness_level}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
                  {analysis?.summary ||
                    'The AI parsed the uploaded guidelines and identified atomic constraints covering prohibited superlatives, Fact Vault warranty validation, mandatory terms disclaimers, brand hex color bounds, and WCAG AA contrast standards.'}
                </p>
              </div>

              {/* Core Constraints */}
              <div>
                <div className="kicker" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target style={{ width: 13, height: 13, color: 'var(--accent)' }} />
                  Core Constraints Being Enforced by the Engine
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {(analysis?.key_takeaways || [
                    'Superlatives like "India\'s #1" or "unbeatable" are strictly forbidden without independent audit proof.',
                    'Hardware warranty commitments must be verified against current Fact Vault records (12-month limit).',
                    'Promotional copy must prominently include statutory disclaimer: "Terms & conditions apply. See website for details."',
                    'Visual graphics must strictly use approved Navy/Cyan colors and maintain WCAG AA 4.5:1 text contrast.',
                  ]).map((point, idx) => (
                    <div
                      key={idx}
                      style={{ padding: '16px 18px', background: 'var(--paper)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                    >
                      <Check style={{ width: 14, height: 14, color: '#15803d', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voice & Audience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ padding: '18px 20px', background: 'var(--white)', border: '1px solid var(--rule)' }}>
                  <span className="kicker" style={{ marginBottom: 6 }}>Detected Voice &amp; Tone</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    {analysis?.tone_profile || 'Calm, technical, understated acoustic authority without urgency hype.'}
                  </p>
                </div>
                <div style={{ padding: '18px 20px', background: 'var(--white)', border: '1px solid var(--rule)' }}>
                  <span className="kicker" style={{ marginBottom: 6 }}>Target Creator &amp; Consumer Context</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
                    {analysis?.target_audience || 'Acoustic engineers, premium audio consumers, and campaign copywriters.'}
                  </p>
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <div className="kicker" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lightbulb style={{ width: 13, height: 13, color: 'var(--accent)' }} />
                  Recommended System Actions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(analysis?.recommended_actions || [
                    'Extract atomic rules into confirmed rulebook for automated creator linting.',
                    'Review the AI Enhanced Guideline version below for clearer wording.',
                    'Confirm guideline to flip rules into active check engine status.',
                  ]).map((action, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--paper)', border: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink)' }}>
                      <ArrowRight style={{ width: 13, height: 13, color: 'var(--accent)', flexShrink: 0 }} />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
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
                    disabled={selectingVersion}
                    style={{
                      padding: '9px 18px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
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
                  <div style={{ padding: '12px 18px', background: '#fef3c7', borderBottom: '1px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles style={{ width: 13, height: 13 }} /> AI Enhanced Version (Groq Llama 3.3)
                    </span>
                    <span className="badge" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}>
                      Optimized Structure
                    </span>
                  </div>
                  <div style={{ padding: '18px', fontSize: 12, lineHeight: 1.7, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap', maxHeight: '48vh', overflowY: 'auto' }}>
                    {enhancedText}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Rules List */}
          {activeTab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="kicker">
                {associatedRules.length} rules active from this document
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {associatedRules.map((rule) => (
                  <div key={rule.id} style={{ padding: '16px 20px', background: 'var(--white)', border: '1px solid var(--rule)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{rule.title}</span>
                      <span className="badge" style={{ background: 'var(--paper-mid)', color: 'var(--ink-mid)', borderColor: 'var(--rule)' }}>
                        {rule.category}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink-light)', margin: '0 0 10px', lineHeight: 1.6 }}>{rule.description}</p>
                    <div style={{ background: 'var(--paper)', padding: '10px 14px', borderLeft: '3px solid var(--accent)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink)' }}>
                      "{rule.source_citation}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
