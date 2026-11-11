import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { store } from '@/lib/store';
import {
  User,
  Brand,
  Guideline,
  Rule,
  Fact,
  Submission,
  Issue,
  AuditLog,
  UserRole,
} from '@/types';
import { Sidebar, Page } from '@/components/layout/Sidebar';
import GuidelinesPage from '@/components/admin/GuidelinesPage';
import RulesPage from '@/components/admin/RulesPage';
import FactsPage from '@/components/admin/FactsPage';
import BrandPage from '@/components/admin/BrandPage';
import SubmitPage from '@/components/creator/SubmitPage';
import SubmissionsPage from '@/components/creator/SubmissionsPage';
import CitedIssueReport from '@/components/report/CitedIssueReport';
import { VideoAuditReport } from '@/components/video/VideoAuditReport';
import { ReviewPage } from '@/components/reviewer/ReviewPage';
import { AuditPage } from '@/components/reviewer/AuditPage';
import { DemoGuideModal } from '@/components/demo/DemoGuideModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { GroqKeyModal } from '@/components/demo/GroqKeyModal';
import { LandingPage } from '@/components/landing/LandingPage';
import { DEMO_SUBMISSION_INITIAL, SEEDED_USERS } from '@/data/seedData';
import { AppMode } from '@/components/navigation/ModeToggle';

const DEFAULT_PAGE: Record<UserRole, Page> = {
  admin: 'guidelines',
  creator: 'submit',
  reviewer: 'review',
};

export default function Home() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  // Active organisation context (null = landing page)
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  // Core state synced with server database
  const [currentUser, setCurrentUser] = useState<User>(SEEDED_USERS[0]);
  const [brand, setBrand] = useState<Brand>(store.getBrand());
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [activePage, setActivePage] = useState<Page>('guidelines');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGroqModalOpen, setIsGroqModalOpen] = useState(false);
  const [groqActive, setGroqActive] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('demo');

  // Load appMode from localStorage or query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brandlint_app_mode') as AppMode | null;
      if (saved === 'actual' || saved === 'demo') {
        setAppMode(saved);
      }
    }
  }, []);

  const handleToggleAppMode = (mode: AppMode) => {
    setAppMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brandlint_app_mode', mode);
    }
  };

  // Sync activeOrgId from URL query param (?org=...)
  useEffect(() => {
    if (router.isReady) {
      const orgParam = router.query.org;
      if (typeof orgParam === 'string' && orgParam.trim()) {
        setActiveOrgId(orgParam.trim());
      } else {
        setActiveOrgId(null);
      }
    }
  }, [router.isReady, router.query.org]);

  // Sync brand and user role when entering an organisation
  useEffect(() => {
    if (activeOrgId) {
      fetch(`/api/orgs/${activeOrgId}?userId=${encodeURIComponent(currentUser.id)}`, {
        headers: { 'x-user-id': currentUser.id },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.organization) {
            setBrand((prev) => ({
              ...prev,
              name: data.organization.name,
              tagline: data.organization.description || prev.tagline,
            }));
            if (data.organization.user_role) {
              setCurrentUser((prev) => ({
                ...prev,
                role: data.organization.user_role,
              }));
              setActivePage(DEFAULT_PAGE[data.organization.user_role as UserRole] || 'guidelines');
            }
          }
        })
        .catch(() => {});
    }
  }, [activeOrgId, currentUser.id]);

  const handleEnterOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    setActivePage(DEFAULT_PAGE[currentUser.role] || 'guidelines');
    router.push(`/?org=${encodeURIComponent(orgId)}`, undefined, { shallow: true });
  };

  const handleExitOrg = () => {
    setActiveOrgId(null);
    router.push('/?view=workspaces', undefined, { shallow: true });
  };

  // Check Groq status
  const checkGroqStatus = useCallback(() => {
    fetch('/api/config/groq')
      .then((res) => res.json())
      .then((d) => setGroqActive(d.configured))
      .catch(() => {});
  }, []);

  // Sync state from server database
  const refreshFromServer = useCallback(async () => {
    checkGroqStatus();
    try {
      const [brandData, guidelinesData, rulesData, factsData, submissionsData, logsData] =
        await Promise.all([
          api.getBrand().catch(() => store.getBrand()),
          api.getGuidelines().catch(() => store.getGuidelines()),
          api.getRules().catch(() => store.getRules()),
          api.getFacts().catch(() => store.getFacts()),
          api.getSubmissions().catch(() => store.getSubmissions()),
          api.getAuditLogs().catch(() => store.getAuditLogs()),
        ]);

      setBrand(brandData);
      setGuidelines(guidelinesData);
      setRules(rulesData);
      setFacts(factsData);
      setSubmissions(submissionsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.warn('Falling back to local cache:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const savedUserId = localStorage.getItem('brandlint_demo_user_id');
      if (savedUserId) {
        const found = SEEDED_USERS.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
        }
      }
    }
    store.initStore();
    refreshFromServer();
  }, [refreshFromServer]);

  // Load issues when a submission is selected
  useEffect(() => {
    if (selectedSubmissionId) {
      api
        .getIssues(selectedSubmissionId)
        .then((data) => setIssues(data))
        .catch(() => {
          setIssues(store.getIssuesForSubmission(selectedSubmissionId));
        });
    }
  }, [selectedSubmissionId]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-400 bg-slate-50 font-sans">
        Initializing BrandLint Engine...
      </div>
    );
  }

  const activeRulesCount = rules.filter((r) => r.status === 'confirmed').length;

  const handleSelectDemoUser = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brandlint_demo_user_id', user.id);
    }
  };

  const handleSwitchDemoUser = async (userId: string) => {
    const targetUser = SEEDED_USERS.find((u) => u.id === userId);
    if (!targetUser) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem('brandlint_demo_user_id', targetUser.id);
    }

    if (activeOrgId) {
      try {
        const res = await fetch(`/api/orgs/${activeOrgId}?userId=${encodeURIComponent(targetUser.id)}`, {
          headers: { 'x-user-id': targetUser.id },
        });
        const data = await res.json();
        if (res.ok && data.organization) {
          const newRole = (data.userRole || data.organization.user_role || targetUser.role) as UserRole;
          setCurrentUser({
            ...targetUser,
            role: newRole,
          });
          setActivePage(DEFAULT_PAGE[newRole] || 'guidelines');
          setSelectedSubmissionId(null);
          await refreshFromServer();
          return;
        }
      } catch (err) {
        console.error('Error switching demo user membership:', err);
      }

      // If user is not a member of current org, return to workspace selection
      setCurrentUser(targetUser);
      setSelectedSubmissionId(null);
      handleExitOrg();
    } else {
      setCurrentUser(targetUser);
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    try {
      const res = await api.demoLogin({ role });
      if (res.user) {
        setCurrentUser(res.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('brandlint_demo_user_id', res.user.id);
        }
      }
    } catch {
      store.setRole(role);
      const user = store.getCurrentUser();
      setCurrentUser(user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('brandlint_demo_user_id', user.id);
      }
    }
    setActivePage(DEFAULT_PAGE[role]);
    setSelectedSubmissionId(null);
  };

  const handleLoginAsUser = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brandlint_demo_user_id', user.id);
    }
    setActivePage(DEFAULT_PAGE[user.role]);
    setSelectedSubmissionId(null);
  };

  const handleResetSeed = async () => {
    try {
      await api.resetSeed();
    } catch {
      store.resetToDemoSeed();
    }
    await refreshFromServer();
    setSelectedSubmissionId(null);
    setActivePage(DEFAULT_PAGE[currentUser.role]);
  };

  const handleAddGuideline = async (filename: string, raw_text: string) => {
    try {
      const newGl = await api.uploadGuideline(filename, raw_text, brand.id);
      await refreshFromServer();
      return newGl;
    } catch {
      const localGl = store.addGuideline(filename, raw_text);
      await refreshFromServer();
      return localGl;
    }
  };

  const handleExtractRules = async (guidelineId: string) => {
    try {
      await api.extractRules(guidelineId);
      await refreshFromServer();
    } catch {
      const gl = guidelines.find((g) => g.id === guidelineId);
      if (gl) {
        const { extractRulesFromGuidelineText } = await import('@/lib/ruleExtractor');
        const extracted = await extractRulesFromGuidelineText(gl.raw_text, gl.id);
        store.setRulesForGuideline(gl.id, extracted);
        await refreshFromServer();
      }
    }
  };

  const handleConfirmGuideline = async (guidelineId: string) => {
    try {
      await api.confirmGuideline(guidelineId);
      await refreshFromServer();
    } catch {
      store.confirmGuideline(guidelineId);
      await refreshFromServer();
    }
  };

  const handleDeleteGuideline = async (guidelineId: string) => {
    try {
      await api.deleteGuideline(guidelineId);
      await refreshFromServer();
    } catch (e) {
      console.error('Failed to delete guideline:', e);
    }
  };

  const handleToggleGuideline = async (guidelineId: string, enabled: boolean) => {
    try {
      await api.toggleGuideline(guidelineId, enabled);
      await refreshFromServer();
    } catch (e) {
      console.error('Failed to toggle guideline:', e);
    }
  };

  const handleAddRule = async (ruleData: Omit<Rule, 'id'>) => {
    try {
      await api.addRule(ruleData);
      await refreshFromServer();
    } catch {
      store.addRule(ruleData);
      await refreshFromServer();
    }
  };

  const handleUpdateRule = async (id: string, updates: Partial<Rule>) => {
    try {
      await api.updateRule(id, updates);
      await refreshFromServer();
    } catch {
      store.updateRule(id, updates);
      await refreshFromServer();
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await api.deleteRule(id);
      await refreshFromServer();
    } catch {
      store.deleteRule(id);
      await refreshFromServer();
    }
  };

  const handleAddFact = async (factData: Omit<Fact, 'id' | 'brand_id'>) => {
    try {
      await api.addFact(factData, brand.id);
      await refreshFromServer();
    } catch {
      store.addFact(factData);
      await refreshFromServer();
    }
  };

  const handleUpdateFact = async (id: string, updates: Partial<Fact>) => {
    try {
      await api.updateFact(id, updates);
      await refreshFromServer();
    } catch {
      store.updateFact(id, updates);
      await refreshFromServer();
    }
  };

  const handleDeleteFact = async (id: string) => {
    try {
      await api.deleteFact(id);
      await refreshFromServer();
    } catch {
      store.deleteFact(id);
      await refreshFromServer();
    }
  };

  const handleUpdateBrand = async (updates: Partial<Brand>) => {
    try {
      const updated = await api.updateBrand(brand.id, updates);
      setBrand(updated);
    } catch {
      store.updateBrand(updates);
      setBrand(store.getBrand());
    }
  };

  const handleCreateSubmission = async (data: {
    title: string;
    caption?: string;
    image_url: string;
    ocr_text?: string;
    video_url?: string;
    media_type?: 'image' | 'video';
  }) => {
    try {
      const res = await api.createSubmission({
        ...data,
        caption: data.caption || '',
        creator_id: currentUser.id,
        brand_id: brand.id,
      });
      await refreshFromServer();
      setIssues(res.issues);
      return res.submission;
    } catch {
      const sub = store.createSubmission({
        ...data,
        caption: data.caption || '',
      });
      await refreshFromServer();
      return sub;
    }
  };

  const handleApplyFix = async (issueId: string, updatedCaption: string) => {
    try {
      const res = await api.applyFix(issueId, updatedCaption, currentUser.id);
      if (res.submission) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === res.submission.id ? res.submission : s))
        );
      }
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: 'fixed' } : i))
      );
      await refreshFromServer();
    } catch {
      store.applyFix(issueId, updatedCaption);
      await refreshFromServer();
    }
  };

  const handleSubmitReview = async (
    submissionId: string,
    decision: 'approve' | 'request_changes',
    comment: string
  ) => {
    try {
      await api.submitReview(submissionId, decision, comment, currentUser.id);
      await refreshFromServer();
    } catch {
      store.submitReview(submissionId, decision, comment);
      await refreshFromServer();
    }
  };

  const handleSelectSubmission = (id: string) => {
    setSelectedSubmissionId(id);
  };

  const handleLoadDemoSubmission = async () => {
    let existing = submissions.find((s) => s.caption.includes("India's #1"));
    if (!existing) {
      try {
        const res = await api.createSubmission({
          title: DEMO_SUBMISSION_INITIAL.title,
          caption: DEMO_SUBMISSION_INITIAL.caption,
          image_url: DEMO_SUBMISSION_INITIAL.image_url,
          ocr_text: DEMO_SUBMISSION_INITIAL.ocr_text,
          creator_id: currentUser.id,
          brand_id: brand.id,
        });
        existing = res.submission;
        setIssues(res.issues);
        await refreshFromServer();
      } catch {
        existing = store.createSubmission({
          title: DEMO_SUBMISSION_INITIAL.title,
          caption: DEMO_SUBMISSION_INITIAL.caption,
          image_url: DEMO_SUBMISSION_INITIAL.image_url,
          ocr_text: DEMO_SUBMISSION_INITIAL.ocr_text,
        });
        await refreshFromServer();
      }
    }
    if (existing) {
      setSelectedSubmissionId(existing.id);
    }
  };

  const activeSubmission = selectedSubmissionId
    ? submissions.find((s) => s.id === selectedSubmissionId) || null
    : null;

  const renderPage = () => {
    // If active submission is a video, render VideoAuditReport with interactive timeline & AI popups
    if (activeSubmission) {
      if (activeSubmission.media_type === 'video' || activeSubmission.video_url || (activeSubmission.video_violations && activeSubmission.video_violations.length > 0)) {
        return (
          <VideoAuditReport
            submission={activeSubmission}
            violations={activeSubmission.video_violations || []}
            brand={brand}
            currentUser={currentUser}
            onBack={() => setSelectedSubmissionId(null)}
            onSubmitReview={handleSubmitReview}
            onApplyCorrection={(vId) => {
              // mark violation corrected locally
              setSubmissions((prev) =>
                prev.map((s) => {
                  if (s.id !== activeSubmission.id) return s;
                  const updatedViolations = (s.video_violations || []).map((v) =>
                    v.id === vId ? { ...v, dismissed: true } : v
                  );
                  return { ...s, video_violations: updatedViolations };
                })
              );
            }}
          />
        );
      }

      // Default static poster cited issue report
      return (
        <CitedIssueReport
          submission={activeSubmission}
          issues={issues}
          brand={brand}
          currentUser={currentUser}
          onApplyFix={handleApplyFix}
          onBack={() => setSelectedSubmissionId(null)}
          onSubmitForReview={() => {
            handleRoleChange('reviewer');
          }}
          onSubmitReview={handleSubmitReview}
        />
      );
    }

    switch (activePage) {
      case 'guidelines':
        return (
          <GuidelinesPage
            guidelines={guidelines}
            rules={rules}
            onAddGuideline={handleAddGuideline}
            onExtractRules={handleExtractRules}
            onConfirmGuideline={handleConfirmGuideline}
            onSelectVersion={async (glId, ver) => {
              try {
                await api.selectGuidelineVersion(glId, ver);
                await refreshFromServer();
              } catch (e) {
                console.error(e);
              }
            }}
            onDeleteGuideline={handleDeleteGuideline}
            onToggleGuideline={handleToggleGuideline}
          />
        );
      case 'rules':
        return (
          <RulesPage
            rules={rules}
            guidelines={guidelines}
            onAddRule={handleAddRule}
            onUpdateRule={handleUpdateRule}
            onDeleteRule={handleDeleteRule}
            onConfirmGuideline={handleConfirmGuideline}
          />
        );
      case 'facts':
        return (
          <FactsPage
            facts={facts}
            onAddFact={handleAddFact}
            onUpdateFact={handleUpdateFact}
            onDeleteFact={handleDeleteFact}
          />
        );
      case 'brand':
        return <BrandPage brand={brand} onUpdateBrand={handleUpdateBrand} />;
      case 'submit':
        return (
          <SubmitPage
            brand={brand}
            onCreateSubmission={handleCreateSubmission}
            onSelectSubmission={handleSelectSubmission}
            onLoadDemoData={async () => {
              try {
                await api.loadDemoViolation();
              } catch {
                store.loadDemoViolationSeed();
              }
              await refreshFromServer();
            }}
          />
        );
      case 'submissions':
        return (
          <SubmissionsPage
            submissions={submissions}
            currentUser={currentUser}
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
            onSubmitReview={handleSubmitReview}
          />
        );
      case 'audit':
        return <AuditPage auditLogs={auditLogs} />;
      default:
        return null;
    }
  };

  // Initial landing page: Sidebar is completely HIDDEN, full screen width
  if (!activeOrgId) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <LandingPage
          currentUser={currentUser}
          onSelectUser={handleSelectDemoUser}
          onEnterOrg={handleEnterOrg}
          appMode={appMode}
          onToggleAppMode={handleToggleAppMode}
        />
      </div>
    );
  }

  // Inside an organisation: Sidebar is VISIBLE
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--paper)', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      <Sidebar
        brand={brand}
        currentUser={currentUser}
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          setSelectedSubmissionId(null);
        }}
        onRoleChange={handleRoleChange}
        onSelectDemoUser={handleSwitchDemoUser}
        onResetSeed={handleResetSeed}
        onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
        onOpenGroqModal={() => setIsGroqModalOpen(true)}
        groqActive={groqActive}
        activeRulesCount={activeRulesCount}
        factsCount={facts.length}
        onExitOrg={handleExitOrg}
        appMode={appMode}
        onToggleAppMode={handleToggleAppMode}
      />

      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: 'var(--paper)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px' }}>{renderPage()}</div>
      </main>

      {/* Demo Guide Modal */}
      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onSwitchRole={handleRoleChange}
        onLoadDemoSubmission={handleLoadDemoSubmission}
      />

      {/* Auth / Fast 1-Click Login Modal (FR-1.1, FR-1.2) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginAsRole={handleRoleChange}
        onLoginAsUser={handleLoginAsUser}
      />

      {/* Groq GenAI Key Modal */}
      <GroqKeyModal
        isOpen={isGroqModalOpen}
        onClose={() => setIsGroqModalOpen(false)}
        onSaved={checkGroqStatus}
      />
    </div>
  );
}
