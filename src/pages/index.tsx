import React, { useEffect, useState } from 'react';
import { store } from '@/lib/store';
import { User, Brand, Guideline, Rule, Fact, Submission, Issue, AuditLog, UserRole } from '@/types';
import { Header } from '@/components/layout/Header';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { CreatorDashboard } from '@/components/creator/CreatorDashboard';
import { CitedIssueReport } from '@/components/report/CitedIssueReport';
import { ReviewerDashboard } from '@/components/reviewer/ReviewerDashboard';
import { DemoGuideModal } from '@/components/demo/DemoGuideModal';
import { DEMO_SUBMISSION_INITIAL } from '@/data/seedData';
import { extractRulesFromGuidelineText } from '@/lib/ruleExtractor';

export default function Home() {
  const [isClient, setIsClient] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [brand, setBrand] = useState<Brand>(store.getBrand());
  const [guidelines, setGuidelines] = useState<Guideline[]>(store.getGuidelines());
  const [rules, setRules] = useState<Rule[]>(store.getRules());
  const [facts, setFacts] = useState<Fact[]>(store.getFacts());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(store.getAuditLogs());
  const [demoMode, setDemoMode] = useState<boolean>(store.isDemoMode());

  // Navigation state
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    store.initStore();

    const updateState = () => {
      setCurrentUser(store.getCurrentUser());
      setBrand(store.getBrand());
      setGuidelines(store.getGuidelines());
      setRules(store.getRules());
      setFacts(store.getFacts());
      setSubmissions(store.getSubmissions());
      setAuditLogs(store.getAuditLogs());
      setDemoMode(store.isDemoMode());
    };

    updateState();
    const unsubscribe = store.subscribe(updateState);
    return () => unsubscribe();
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm font-mono">
        Initializing BrandLint Engine...
      </div>
    );
  }

  // Active rules count (FR-4.5: Only confirmed rules are active)
  const activeRulesCount = rules.filter((r) => r.status === 'confirmed').length;

  // Selected submission & its issues
  const activeSubmission = selectedSubmissionId
    ? submissions.find((s) => s.id === selectedSubmissionId) || null
    : null;
  const activeSubmissionIssues = selectedSubmissionId
    ? store.getIssuesForSubmission(selectedSubmissionId)
    : [];

  const handleRoleChange = (role: UserRole) => {
    store.setRole(role);
  };

  const handleResetSeed = () => {
    store.resetToDemoSeed();
    setSelectedSubmissionId(null);
  };

  const handleAddGuideline = (filename: string, raw_text: string) => {
    return store.addGuideline(filename, raw_text);
  };

  const handleExtractRules = async (guidelineId: string) => {
    const gl = guidelines.find((g) => g.id === guidelineId);
    if (!gl) return;
    const extracted = await extractRulesFromGuidelineText(gl.raw_text, gl.id);
    store.setRulesForGuideline(gl.id, extracted);
  };

  const handleConfirmGuideline = (guidelineId: string) => {
    store.confirmGuideline(guidelineId);
  };

  const handleCreateSubmission = (data: {
    title: string;
    caption: string;
    image_url: string;
    ocr_text?: string;
  }) => {
    return store.createSubmission(data);
  };

  const handleApplyFix = (issueId: string, updatedCaption: string) => {
    store.applyFix(issueId, updatedCaption);
  };

  const handleSubmitReview = (
    submissionId: string,
    decision: 'approve' | 'request_changes',
    comment: string
  ) => {
    store.submitReview(submissionId, decision, comment);
  };

  const handleLoadDemoSubmissionFromGuide = () => {
    // Check if demo submission already exists
    let existing = submissions.find((s) => s.caption.includes("India's #1"));
    if (!existing) {
      existing = store.createSubmission({
        title: DEMO_SUBMISSION_INITIAL.title,
        caption: DEMO_SUBMISSION_INITIAL.caption,
        image_url: DEMO_SUBMISSION_INITIAL.image_url,
        ocr_text: DEMO_SUBMISSION_INITIAL.ocr_text,
      });
    }
    setSelectedSubmissionId(existing.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        brand={brand}
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        activeRulesCount={activeRulesCount}
        factsCount={facts.length}
        onResetSeed={handleResetSeed}
        onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
        demoMode={demoMode}
        onToggleDemoMode={() => store.setDemoMode(!demoMode)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If a submission is currently selected, show the Cited Issue Report view */}
        {activeSubmission ? (
          <CitedIssueReport
            submission={activeSubmission}
            issues={activeSubmissionIssues}
            brand={brand}
            currentUser={currentUser}
            onApplyFix={handleApplyFix}
            onBack={() => setSelectedSubmissionId(null)}
            onSubmitForReview={() => {
              store.setRole('reviewer');
              setSelectedSubmissionId(null);
            }}
            onOpenReviewModal={() => {
              // Switch to reviewer queue view with modal
            }}
          />
        ) : (
          <>
            {/* Admin View */}
            {currentUser.role === 'admin' && (
              <AdminDashboard
                brand={brand}
                guidelines={guidelines}
                rules={rules}
                facts={facts}
                onUpdateBrand={(updates) => store.updateBrand(updates)}
                onAddGuideline={handleAddGuideline}
                onExtractRules={handleExtractRules}
                onConfirmGuideline={handleConfirmGuideline}
                onAddRule={(r) => store.addRule(r)}
                onUpdateRule={(id, updates) => store.updateRule(id, updates)}
                onDeleteRule={(id) => store.deleteRule(id)}
                onAddFact={(f) => store.addFact(f)}
                onUpdateFact={(id, updates) => store.updateFact(id, updates)}
                onDeleteFact={(id) => store.deleteFact(id)}
                onNavigateToCreator={() => store.setRole('creator')}
              />
            )}

            {/* Creator View */}
            {currentUser.role === 'creator' && (
              <CreatorDashboard
                brand={brand}
                submissions={submissions}
                onCreateSubmission={handleCreateSubmission}
                onSelectSubmission={(id) => setSelectedSubmissionId(id)}
              />
            )}

            {/* Reviewer View */}
            {currentUser.role === 'reviewer' && (
              <ReviewerDashboard
                brand={brand}
                currentUser={currentUser}
                submissions={submissions}
                auditLogs={auditLogs}
                onSelectSubmission={(id) => setSelectedSubmissionId(id)}
                onSubmitReview={handleSubmitReview}
              />
            )}
          </>
        )}
      </main>

      {/* Demo Script Walkthrough Modal */}
      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onSwitchRole={handleRoleChange}
        onLoadDemoSubmission={handleLoadDemoSubmissionFromGuide}
      />

      {/* Footer with v1 principle */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          <strong>BrandLint v1.0</strong> — “AI detects and explains. Humans decide and approve. This is the compiler for brand content.”
        </p>
      </footer>
    </div>
  );
}
