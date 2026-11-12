import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Upload,
  ScanSearch,
  AlertTriangle,
  Wrench,
  ArrowRight,
  Play,
  Pause,
} from 'lucide-react';
import {
  EASE_OUT_EXPO,
  AnimatedCounter,
  AnimatedProgressBar,
} from '@/components/motion/MotionPrimitives';

const STAGES = [
  { id: 0, label: '1. Upload Guidelines',   icon: Upload },
  { id: 1, label: '2. Extract Rules',       icon: Sparkles },
  { id: 2, label: '3. Submit Content',      icon: FileText },
  { id: 3, label: '4. AI Compliance Scan',  icon: ScanSearch },
  { id: 4, label: '5. Cited Fix & Review',  icon: Wrench },
];

const EXTRACTED_RULES = [
  { id: 'R-01', title: 'No Uncertified Superlatives', citation: '§ 3.1', severity: 'HIGH' },
  { id: 'R-02', title: 'Standard 12-Month Warranty',  citation: '§ 4.2', severity: 'MED' },
  { id: 'R-03', title: 'WCAG AA Contrast >= 4.5:1',   citation: '§ 2.1', severity: 'MED' },
];

export const AnimatedWorkflowDemo: React.FC = () => {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % STAGES.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)]">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="ml-2 font-mono text-[11px] text-slate-500">
            BrandLint Live Pipeline Simulation
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {playing ? 'Pause Demo' : 'Auto-Play'}
        </button>
      </div>

      {/* Stage Stepper Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-white px-5 py-3">
        {STAGES.map((s) => {
          const Icon = s.icon;
          const active = stage === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setStage(s.id);
                setPlaying(false);
              }}
              className={`btn-plain relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? 'text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="workflow-stage-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-lg bg-slate-900"
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Viewport */}
      <div className="min-h-[290px] bg-slate-50/40 p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div
              key="stage-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              className="mx-auto max-w-xl space-y-4"
            >
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Apex_Brand_Guidelines_v2.4.pdf
                    </div>
                    <div className="text-xs text-slate-500">
                      Ingesting policy sections, tone rules &amp; legal disclaimers…
                    </div>
                  </div>
                </div>
                <span className="badge border-emerald-200 bg-emerald-50 text-emerald-700">
                  Uploaded
                </span>
              </div>
              <div className="space-y-1.5 px-1">
                <div className="flex justify-between font-mono text-[11px] text-slate-500">
                  <span>Parsing document structure</span>
                  <span>100%</span>
                </div>
                <AnimatedProgressBar value={100} barClassName="bg-sky-600" />
              </div>
            </motion.div>
          )}

          {stage === 1 && (
            <motion.div
              key="stage-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              className="mx-auto max-w-2xl space-y-2.5"
            >
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-sky-700">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Groq LLM extracting enforceable rules sequentially…
              </div>
              {EXTRACTED_RULES.map((rule, idx) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.22, duration: 0.35, ease: EASE_OUT_EXPO }}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-mono text-xs font-semibold text-slate-400">{rule.id}</span>
                    <span className="text-sm font-medium text-slate-900">{rule.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">{rule.citation}</span>
                    <span className="badge border-slate-200 bg-slate-50 text-slate-700">
                      {rule.severity}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div
              key="stage-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Creator Submission
                </span>
                <span className="badge border-sky-200 bg-sky-50 text-sky-700">Queued for Audit</span>
              </div>
              <h4 className="font-serif text-lg font-bold text-slate-900">
                Festive Wireless Earbuds Campaign
              </h4>
              <p className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-sm text-slate-700">
                &ldquo;Experience India&apos;s #1 Sound with our studio earbuds. Now backed by an industry-leading 24-month warranty.&rdquo;
              </p>
            </motion.div>
          )}

          {stage === 3 && (
            <motion.div
              key="stage-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-12"
            >
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:col-span-7">
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-sky-500 to-transparent"
                />
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-sky-700">
                  <ScanSearch className="h-4 w-4" /> Scanning Copy &amp; Fact Vault…
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  Experience{' '}
                  <motion.span
                    initial={{ backgroundColor: 'transparent' }}
                    animate={{ backgroundColor: '#FFE4E6' }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="rounded px-1 font-medium text-rose-900"
                  >
                    India&apos;s #1 Sound
                  </motion.span>{' '}
                  with our studio earbuds. Now backed by an industry-leading{' '}
                  <motion.span
                    initial={{ backgroundColor: 'transparent' }}
                    animate={{ backgroundColor: '#FEF3C7' }}
                    transition={{ delay: 0.7, duration: 0.4 }}
                    className="rounded px-1 font-medium text-amber-900"
                  >
                    24-month warranty
                  </motion.span>
                  .
                </p>
              </div>

              <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:col-span-5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Computed Risk Score
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <AnimatedCounter value={74} className="font-serif text-4xl font-bold text-rose-600" />
                  <span className="font-mono text-xs text-slate-400">/ 100</span>
                </div>
                <div className="mt-3">
                  <AnimatedProgressBar value={74} barClassName="bg-rose-500" />
                </div>
                <span className="mt-2 text-xs font-medium text-rose-700">2 Violations Flagged</span>
              </div>
            </motion.div>
          )}

          {stage === 4 && (
            <motion.div
              key="stage-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
              className="mx-auto max-w-2xl space-y-3"
            >
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="badge border-rose-200 bg-rose-50 text-rose-700">
                      <AlertTriangle className="h-3 w-3" /> High
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      Uncertified Superlative Claim (§ 3.1)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700">Fix Ready</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                  <span className="diff-deleted">India&apos;s #1 Sound</span>
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="diff-added">Signature Studio Sound</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs font-medium text-emerald-800">
                <span>AI detects and explains. Humans decide and approve.</span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready for Reviewer Sign-Off
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

