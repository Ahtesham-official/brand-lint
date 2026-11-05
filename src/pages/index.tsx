import React, { useEffect, useState } from 'react';
import { store } from '@/lib/store';
import { User, Brand, Guideline, Rule, Fact, Submission, Issue, AuditLog, UserRole } from '@/types';
import { Sidebar, Page } from '@/components/layout/Sidebar';
import GuidelinesPage from '@/components/admin/GuidelinesPage';
import RulesPage from '@/components/admin/RulesPage';
import FactsPage from '@/components/admin/FactsPage';
import BrandPage from '@/components/admin/BrandPage';
import SubmitPage from '@/components/creator/SubmitPage';
import SubmissionsPage from '@/components/creator/SubmissionsPage';
import CitedIssueReport from '@/components/report/CitedIssueReport';
import { ReviewPage } from '@/components/reviewer/ReviewPage';
import { AuditPage } from '@/components/reviewer/AuditPage';
import { DemoGuideModal } from '@/components/demo/DemoGuideModal';
import { DEMO_SUBMISSION_INITIAL } from '@/data/seedData';
import { extractRulesFromGuidelineText } from '@/lib/ruleExtractor';

const DEFAULT_PAGE: Record<UserRole, Page> = {
  admin: 'guidelines',
  creator: 'submit',
  reviewer: 'review',
};

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [brand, setBrand] = useState<Brand>(store.getBrand());
  const [guidelines, setGuidelines] = useState<Guideline[]>(store.getGuidelines());
  const [rules, setRules] = useState<Rule[]>(store.getRules());
  const [facts, setFacts] = useState<Fact[]>(store.getFacts());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getSubmissions());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(store.getAuditLogs());

  const [activePage, setActivePage] = useState<Page>('guidelines');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    store.initStore();

    const sync = () => {
      setCurrentUser(store.getCurrentUser());
      setBrand(store.getBrand());
      setGuidelines(store.getGuidelines());
      setRules(store.getRules());
      setFacts(store.getFacts());
      setSubmissions(store.getSubmissions());
      setAuditLogs(store.getAuditLogs());
    };

    sync();
    return store.subscribe(sync);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-400">
        Loading...
      </div>
    );
  }

  const activeRulesCount = rules.filter((r) => r.status === 'confirmed').length;

  const handleRoleChange = (role: UserRole) => {
    store.setRole(role);
    setActivePage(DEFAULT_PAGE[role]);
    setSelectedSubmissionId(null);
  };

  const handleResetSeed = () => {
    store.resetToDemoSeed();
    setSelectedSubmissionId(null);
    setActivePage(DEFAULT_PAGE[store.getCurrentUser().role]);
  };

  const handleExtractRules = async (guidelineId: string) => {
    const gl = guidelines.find((g) => g.id === guidelineId);
    if (!gl) return;
    const extracted = await extractRulesFromGuidelineText(gl.raw_text, gl.id);
    store.setRulesForGuideline(gl.id, extracted);
  };

  const handleCreateSubmission = (data: {
    title: string;
    caption: string;
    image_url: string;
    ocr_text?: string;
  }) => {
    return store.createSubmission(data);
  };

  const handleSelectSubmission = (id: string) => {
    setSelectedSubmissionId(id);
  };

  const handleLoadDemoSubmission = () => {
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

  const activeSubmission = selectedSubmissionId
    ? submissions.find((s) => s.id === selectedSubmissionId) || null
    : null;
  const activeSubmissionIssues = selectedSubmissionId
    ? store.getIssuesForSubmission(selectedSubmissionId)
    : [];

  const renderPage = () => {
    // Issue report takes over the whole content area
    if (activeSubmission) {
      return (
        <CitedIssueReport
          submission={activeSubmission}
          issues={activeSubmissionIssues}
          brand={brand}
          currentUser={currentUser}
          onApplyFix={(issueId, text) => store.applyFix(issueId, text)}
          onBack={() => setSelectedSubmissionId(null)}
          onSubmitForReview={() => {
            handleRoleChange('reviewer');
          }}
          onSubmitReview={(subId, decision, comment) => {
            store.submitReview(subId, decision, comment);
          }}
        />
      );
    }

    switch (activePage) {
      case 'guidelines':
        return (
          <GuidelinesPage
            guidelines={guidelines}
            rules={rules}
            onAddGuideline={(f, t) => store.addGuideline(f, t)}
            onExtractRules={handleExtractRules}
            onConfirmGuideline={(id) => store.confirmGuideline(id)}
          />
        );
      case 'rules':
        return (
          <RulesPage
            rules={rules}
            guidelines={guidelines}
            onAddRule={(r) => store.addRule(r)}
            onUpdateRule={(id, u) => store.updateRule(id, u)}
            onDeleteRule={(id) => store.deleteRule(id)}
            onConfirmGuideline={(id) => store.confirmGuideline(id)}
          />
        );
      case 'facts':
        return (
          <FactsPage
            facts={facts}
            onAddFact={(f) => store.addFact(f)}
            onUpdateFact={(id, u) => store.updateFact(id, u)}
            onDeleteFact={(id) => store.deleteFact(id)}
          />
        );
      case 'brand':
        return (
          <BrandPage
            brand={brand}
            onUpdateBrand={(u) => store.updateBrand(u)}
          />
        );
      case 'submit':
        return (
          <SubmitPage
            brand={brand}
            onCreateSubmission={handleCreateSubmission}
            onSelectSubmission={handleSelectSubmission}
          />
        );
      case 'submissions':
        return (
          <SubmissionsPage
            submissions={submissions}
            onSelectSubmission={handleSelectSubmission}
          />
        );
      case 'review':
        return (
          <ReviewPage
            brand={brand}
            currentUser={currentUser}
            submissions={submissions}
            onSelectSubmission={handleSelectSubmission}
            onSubmitReview={(subId, decision, comment) =>
              store.submitReview(subId, decision, comment)
            }
          />
        );
      case 'audit':
        return <AuditPage auditLogs={auditLogs} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        brand={brand}
        currentUser={currentUser}
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          setSelectedSubmissionId(null);
        }}
        onRoleChange={handleRoleChange}
        onResetSeed={handleResetSeed}
        onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
        activeRulesCount={activeRulesCount}
        factsCount={facts.length}
      />

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {renderPage()}
        </div>
      </main>

      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onSwitchRole={handleRoleChange}
        onLoadDemoSubmission={handleLoadDemoSubmission}
      />
    </div>
  );
}
