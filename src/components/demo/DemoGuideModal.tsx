import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Play, X } from 'lucide-react';
import { UserRole } from '@/types';

interface DemoStep {
  time: string;
  duration: number;
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
    beat: '"Why this flag?" Evidence Panel',
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
    instructions: '"AI detects and explains. Humans decide and approve. This is the compiler for brand content."',
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
  };

  const goNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Demo Script</h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 2m 45s · {DEMO_STEPS.length} steps
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-[2px_2px_0px_#102142]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step list */}
        <div className="px-5 py-3 max-h-56 overflow-y-auto">
          <div className="space-y-1">
            {DEMO_STEPS.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                  idx === currentStepIndex
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span
                  className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    idx === currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </span>
                <span
                  className={`text-xs flex-1 truncate ${
                    idx === currentStepIndex ? 'font-medium text-blue-900' : 'text-slate-600'
                  }`}
                >
                  {step.beat}
                </span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">{step.time}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current step detail */}
        <div className="mx-5 mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-700">
              Step {currentStepIndex + 1}: {currentStep.beat}
            </span>
            <span className="text-[10px] font-mono text-blue-500">{currentStep.time}</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{currentStep.instructions}</p>

          <button
            onClick={handleStepAction}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors"
          >
            <Play className="w-3 h-3" />
            {currentStep.actionText}
          </button>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
          <button
            onClick={goPrev}
            disabled={currentStepIndex === 0}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>

          <span className="text-xs text-slate-400">
            {currentStepIndex + 1} / {DEMO_STEPS.length}
          </span>

          <button
            onClick={goNext}
            disabled={currentStepIndex === DEMO_STEPS.length - 1}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
