import React, { useState } from 'react';
import { ShieldCheck, Mail, ArrowRight, X, User as UserIcon, Lock, Sparkles, Building2 } from 'lucide-react';
import { User, UserRole } from '@/types';

interface ActualAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const ActualAuthModal: React.FC<ActualAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (tab === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), name: name.trim() || email.split('@')[0], role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create account');
        onSuccess(data.user);
        onClose();
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'User not found. Please sign up first.');
        onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck style={{ width: 18, height: 18, color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>BrandLint Actual Project</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Production Workspace Authentication</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: tab === 'signin' ? '#ffffff' : 'transparent',
              borderBottom: tab === 'signin' ? '2px solid #2563eb' : '2px solid transparent',
              fontWeight: tab === 'signin' ? 700 : 500,
              color: tab === 'signin' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              background: tab === 'signup' ? '#ffffff' : 'transparent',
              borderBottom: tab === 'signup' ? '2px solid #2563eb' : '2px solid transparent',
              fontWeight: tab === 'signup' ? 700 : 500,
              color: tab === 'signup' ? '#2563eb' : '#64748b',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Create New Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: 12,
                borderRadius: 4,
              }}
            >
              {error}
            </div>
          )}

          {tab === 'signup' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Full Name
                </label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 4, padding: '8px 12px', background: '#ffffff' }}>
                  <UserIcon style={{ width: 14, height: 14, color: '#94a3b8', marginRight: 8 }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rachel Adams"
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Assign Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {(['admin', 'creator', 'reviewer'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        padding: '8px 4px',
                        border: `1px solid ${role === r ? '#2563eb' : '#e2e8f0'}`,
                        background: role === r ? '#eff6ff' : '#ffffff',
                        color: role === r ? '#1e40af' : '#64748b',
                        fontWeight: role === r ? 700 : 500,
                        fontSize: 11,
                        borderRadius: 4,
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Work Email Address
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 4, padding: '8px 12px', background: '#ffffff' }}>
              <Mail style={{ width: 14, height: 14, color: '#94a3b8', marginRight: 8 }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13 }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontWeight: 600,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Authenticating…' : tab === 'signin' ? 'Sign In & Enter Dashboard' : 'Create Account & Continue'}
            <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </form>
      </div>
    </div>
  );
};
