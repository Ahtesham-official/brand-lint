import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Building2, ArrowLeft, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { OrgLayout } from '@/components/layout/OrgLayout';
import { SEEDED_USERS } from '@/data/seedData';

export default function NewOrgPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Organisation name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let userId = SEEDED_USERS[0].id;
      const stored = localStorage.getItem('brandlint_current_user');
      if (stored) {
        try {
          userId = JSON.parse(stored).id || userId;
        } catch {}
      }

      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create organisation');
      }

      router.push(`/orgs/${data.organization.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while creating the organisation.');
      setSubmitting(false);
    }
  };

  return (
    <OrgLayout
      title="Create Organisation"
      subtitle="Establish a new brand governance boundary with isolated guidelines, assets, and roles."
      breadcrumbs={[{ label: 'New Organisation' }]}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Organisation Details</h2>
              <p className="text-xs text-slate-500">
                You will automatically become the Admin of this organisation.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Organisation Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Global Brands, Acme Media Group"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The public name of your organisation shown to team members.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Brief description of the brand assets, division, or business unit governed within this container..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 resize-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Role Notice:</span> As creator, you will hold the <code className="text-blue-700 font-semibold">admin</code> role. You can invite Creators and Reviewers with custom link expiration and usage limits.
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <Link
                href="/orgs"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors shadow-sm"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Organisation</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </OrgLayout>
  );
}

