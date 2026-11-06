import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Building2, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
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
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--rule)',
          padding: '32px 36px',
          boxShadow: '3px 3px 0px var(--btn-shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 20, marginBottom: 24, borderBottom: '1px solid var(--rule)' }}>
            <div style={{
              width: 38,
              height: 38,
              background: 'var(--ink)',
              color: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Building2 style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                Organisation Details
              </h2>
              <p style={{ fontSize: 12, color: 'var(--ink-mid)', margin: '2px 0 0' }}>
                You will automatically become the Admin of this brand organisation.
              </p>
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: 20,
              padding: '12px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="kicker" style={{ marginBottom: 6 }}>
                Organisation Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Global Brands, Acme Media Group"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  border: '1px solid var(--rule-dark)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              <p style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4, margin: '4px 0 0' }}>
                The public title of your organisation displayed across teams and dashboards.
              </p>
            </div>

            <div>
              <label className="kicker" style={{ marginBottom: 6 }}>
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Brief description of the brand assets, division, or business unit governed within this container..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 13,
                  border: '1px solid var(--rule-dark)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div style={{
              padding: '14px 16px',
              background: 'var(--paper-mid)',
              border: '1px solid var(--rule)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 12,
              color: 'var(--ink-mid)',
              lineHeight: 1.5,
            }}>
              <ShieldCheck style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong style={{ color: 'var(--ink)' }}>Role Notice:</strong> As creator, you will hold the <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--paper-dark)', padding: '1px 5px', color: 'var(--ink)' }}>admin</code> role. You can invite Creators and Reviewers with custom token expiration and usage limits.
              </div>
            </div>

            <div style={{
              paddingTop: 20,
              marginTop: 10,
              borderTop: '1px solid var(--rule)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
            }}>
              <Link
                href="/orgs"
                className="btn-plain"
                style={{
                  padding: '9px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--ink-mid)',
                  textDecoration: 'none',
                }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !name.trim()}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 22px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !name.trim() ? 0.6 : 1,
                  boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
                }}
              >
                {submitting && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                <span>Create Organisation</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </OrgLayout>
  );
}
