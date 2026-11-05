import {
  Brand,
  Guideline,
  Rule,
  Fact,
  User,
  Submission,
  Issue,
  Review,
  AuditLog,
  UserRole,
} from '@/types';

class ApiClient {
  private baseUrl = '';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      let errorMsg = `API Error ${res.status}: ${res.statusText}`;
      try {
        const body = await res.json();
        if (body.error) errorMsg = body.error;
      } catch {}
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // --- Auth ---
  public async getMe(userId?: string): Promise<{ user: User; users: User[]; demoMode: boolean }> {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request<{ user: User; users: User[]; demoMode: boolean }>(`/api/auth/me${query}`);
  }

  public async demoLogin(roleOrUserId: { role?: UserRole; userId?: string }): Promise<{ success: boolean; user: User }> {
    return this.request<{ success: boolean; user: User }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify(roleOrUserId),
    });
  }

  public async requestMagicLink(email: string): Promise<{ success: boolean; message: string; user?: User }> {
    return this.request<{ success: boolean; message: string; user?: User }>('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // --- Brand ---
  public async getBrand(brandId = 'brand-apex-01'): Promise<Brand> {
    return this.request<Brand>(`/api/brands/${brandId}`);
  }

  public async updateBrand(brandId: string, updates: Partial<Brand>): Promise<Brand> {
    return this.request<Brand>(`/api/brands/${brandId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // --- Guidelines ---
  public async getGuidelines(): Promise<Guideline[]> {
    return this.request<Guideline[]>('/api/guidelines');
  }

  public async uploadGuideline(filename: string, raw_text: string, brand_id?: string): Promise<Guideline> {
    return this.request<Guideline>('/api/guidelines', {
      method: 'POST',
      body: JSON.stringify({ filename, raw_text, brand_id }),
    });
  }

  public async extractRules(guidelineId: string): Promise<{ success: boolean; rules: Rule[]; extractedCount: number }> {
    return this.request<{ success: boolean; rules: Rule[]; extractedCount: number }>(
      `/api/guidelines/${guidelineId}/extract`,
      { method: 'POST' }
    );
  }

  public async confirmGuideline(guidelineId: string): Promise<{ success: boolean; activeRulesCount: number; guideline: Guideline }> {
    return this.request<{ success: boolean; activeRulesCount: number; guideline: Guideline }>(
      `/api/guidelines/${guidelineId}/confirm`,
      { method: 'POST' }
    );
  }

  // --- Rules ---
  public async getRules(guidelineId?: string): Promise<Rule[]> {
    const query = guidelineId ? `?guideline_id=${encodeURIComponent(guidelineId)}` : '';
    return this.request<Rule[]>(`/api/rules${query}`);
  }

  public async addRule(rule: Omit<Rule, 'id'>): Promise<Rule> {
    return this.request<Rule>('/api/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  }

  public async updateRule(id: string, updates: Partial<Rule>): Promise<Rule> {
    return this.request<Rule>(`/api/rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async deleteRule(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/rules/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Facts ---
  public async getFacts(): Promise<Fact[]> {
    return this.request<Fact[]>('/api/facts');
  }

  public async addFact(fact: Omit<Fact, 'id' | 'brand_id'>, brand_id?: string): Promise<Fact> {
    return this.request<Fact>('/api/facts', {
      method: 'POST',
      body: JSON.stringify({ ...fact, brand_id }),
    });
  }

  public async updateFact(id: string, updates: Partial<Fact>): Promise<Fact> {
    return this.request<Fact>(`/api/facts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async deleteFact(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/facts/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Submissions ---
  public async getSubmissions(): Promise<Submission[]> {
    return this.request<Submission[]>('/api/submissions');
  }

  public async getSubmission(id: string): Promise<{ submission: Submission; issues: Issue[]; reviews: Review[] }> {
    return this.request<{ submission: Submission; issues: Issue[]; reviews: Review[] }>(`/api/submissions/${id}`);
  }

  public async createSubmission(data: {
    title: string;
    caption: string;
    image_url: string;
    ocr_text?: string;
    creator_id?: string;
    brand_id?: string;
  }): Promise<{ submission: Submission; issues: Issue[] }> {
    return this.request<{ submission: Submission; issues: Issue[] }>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async analyzeSubmission(id: string, ocr_text?: string): Promise<{ submission: Submission; issues: Issue[] }> {
    return this.request<{ submission: Submission; issues: Issue[] }>(`/api/submissions/${id}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ ocr_text }),
    });
  }

  public async getIssues(submissionId: string): Promise<Issue[]> {
    return this.request<Issue[]>(`/api/submissions/${submissionId}/issues`);
  }

  public async applyFix(issueId: string, updatedCaption: string, actorId?: string): Promise<{ success: boolean; issue: Issue; submission: Submission }> {
    return this.request<{ success: boolean; issue: Issue; submission: Submission }>(`/api/issues/${issueId}/apply-fix`, {
      method: 'POST',
      body: JSON.stringify({ updatedCaption, actorId }),
    });
  }

  public async submitReview(
    submissionId: string,
    decision: 'approve' | 'request_changes',
    comment: string,
    reviewer_id?: string
  ): Promise<{ success: boolean; review: Review; submission: Submission }> {
    return this.request<{ success: boolean; review: Review; submission: Submission }>(
      `/api/submissions/${submissionId}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, comment, reviewer_id }),
      }
    );
  }

  // --- Audit Logs ---
  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/api/audit-logs');
  }

  // --- Reset Seed ---
  public async resetSeed(): Promise<void> {
    await this.request('/api/reset', { method: 'POST' });
  }
}

export const api = new ApiClient();

