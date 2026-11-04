import React, { useState } from 'react';
import { Play, CheckCircle2, ChevronRight, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { UserRole } from '@/types';

interface DemoStep {
  time: string;
  duration: number; // in seconds
  beat: string;
  actionText: string;
  roleToSwitch?: UserRole;
  instructions: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    time: '0:00 - 0:15',
    duration: 15,
    beat: 'Problem Framing',
    actionText: 'Framing Narrative',
    instructions: 'Explain problem: Brands publish fast across teams and agencies; PDF guidelines are ignored; unsupported and outdated claims slip through without citations.',
  },
  {
    time: '0:15 - 0:40',
    duration: 25,
    beat: 'Admin: Guideline Ingestion & Rule Extraction',
    actionText: 'Switch to Admin & Inspect Rules',
    roleToSwitch: 'admin',
    instructions: 'Show uploaded Apex Audio guideline. LLM extracts atomic rules with verbatim quotes and confidence scores. Notice the "< 0.6 Needs Confirmation" visual flag. Click "Confirm All Rules".',
  },
  {
    time: '0:40 - 0:55',
    duration: 15,
    beat: 'Fact Vault Inspection',
    actionText: 'View Fact Vault',
    roleToSwitch: 'admin',
    instructions: 'Show Fact Vault: Notice the approved fact "12-month warranty" with source document and expiry date. Notice expired facts highlighted in bold red.',
  },
  {
    time: '0:55 - 1:25',
    duration: 30,
    beat: 'Creator Submits Content',
    actionText: 'Switch to Creator & Load PRD Demo Case',
    roleToSwitch: 'creator',
    instructions: 'Click "Load PRD Demo Case" to populate caption: "India\'s #1 — 24-month warranty!" with off-palette poster. Click "Run BrandLint Check".',
  },
  {
    time: '1:25 - 2:10',
    duration: 45,
    beat: 'Cited Issue Report & Wow Factor',
    actionText: 'Inspect Cited Report & Brand Risk Score',
    instructions: 'Cited Report appears: Risk score 88/100 (Critical). Highlights 4+ issues: #1 unsupported claim, 24-month contradicted by Fact Vault, tone hype, off-palette #E11D48 color, and WCAG contrast failure.',
  },
  {
    time: '2:10 - 2:30',
    duration: 20,
    beat: '“Why this flag?” Evidence Panel',
    actionText: 'Expand Evidence Panel',
    instructions: 'Open "Why this flag?": Point to the verbatim guideline quote citation, 98% confidence score, and exact Fact Vault cross-reference.',
  },
  {
    time: '2:30 - 2:45',
    duration: 15,
    beat: 'One-Click Fix Diff',
    actionText: 'Click Apply Fix & Mutate Text',
    instructions: 'Click "Apply Fix" on warranty or tone issue. Show visual diff (deletions vs additions). Click "Accept Fix": Caption updates immediately and Brand Risk Score drops live!',
  },
  {
    time: '2:45 - 3:00',
    duration: 15,
    beat: 'Reviewer Approval & Event Logging',
    actionText: 'Switch to Reviewer & Approve',
    roleToSwitch: 'reviewer',
    instructions: 'Open Reviewer Queue. Click "Decide" -> leave comment and click "Approve Submission". Inspect minimal event log with timestamps.',
  },
  {
    time: '3:00 - 3:05',
    duration: 5,
    beat: 'Punchy Close',
    actionText: 'Closing Statement',
    instructions: '“AI detects and explains. Humans decide and approve. This is the compiler for brand content.”',
  },
];

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchRole: (role: UserRole) => void;
  onLoadDemoSubmission: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({
  isOpen,
  onClose,
  onSwitchRole,
  onLoadDemoSubmission,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[currentStepIndex];

  const handleStepAction = () => {
    if (currentStep.roleToSwitch) {
      onSwitchRole(currentStep.roleToSwitch);
    }
    if (currentStep.beat.includes('Creator Submits')) {
      onLoadDemoSubmission();
    }
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                BrandLint Hackathon Demo Script (2m 45s)
              </h3>
              <p className="text-xs text-slate-500">
                Official Pitch &amp; Live Verification Walkthrough Guide (Section 17.2)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
            ✕
          </button>
        </div>

        {/* Current Beat Highlight Card */}
        <div className="mt-4 p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
              Beat {currentStepIndex + 1} of {DEMO_STEPS.length}
            </span>
            <span className="flex items-center gap-1 text-xs font-mono font-semibold text-indigo-900">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentStep.time}</span>
            </span>
          </div>

          <h4 className="text-lg font-bold text-slate-900 mt-2">{currentStep.beat}</h4>
          <p className="text-sm text-slate-700 mt-1 leading-relaxed">{currentStep.instructions}</p>

          <div className="mt-4 pt-3 border-t border-indigo-200/60 flex items-center justify-between">
            <button
              onClick={handleStepAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <span>{currentStep.actionText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {DEMO_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentStepIndex ? 'w-6 bg-indigo-600' : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Jump to step ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* All Beats Quick List */}
        <div className="mt-4 max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {DEMO_STEPS.map((step, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`p-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                idx === currentStepIndex
                  ? 'bg-indigo-100/70 border border-indigo-300 font-bold text-indigo-900'
                  : 'hover:bg-slate-50 text-slate-600 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-slate-400 font-mono text-[11px]">{idx + 1}.</span>
                <span>{step.beat}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">{step.time}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 italic">
            “AI detects and explains. Humans decide and approve.”
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

