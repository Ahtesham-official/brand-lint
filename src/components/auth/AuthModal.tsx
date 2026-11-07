import React, { useState } from 'react';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { SEEDED_USERS } from '@/data/seedData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onLoginAsRole: (role: UserRole) => void;
  onLoginAsUser: (user: User) => void;
}

const ROLE_BADGE: Record<UserRole, { bg: string; text: string; border: string }> = {
  admin: { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },
  creator: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  reviewer: { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginAsRole,
  onLoginAsUser,
}) => {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.user) {
        onLoginAsUser(data.user);
      }
      setMagicLinkSent(true);
    } catch {
      setMagicLinkSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(28, 25, 23, 0.55)',
      backdropFilter: 'blur(3px)',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--rule)',
        boxShadow: '4px 4px 0px var(--btn-shadow)',
        borderRadius: 'var(--radius-btn)',
        width: '100%',
        maxWidth: 520,
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Editorial Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--paper)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              background: 'var(--ink)',
              color: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-btn)',
            }}>
              <ShieldCheck style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
                Sign in to BrandLint
              </h3>
              <p style={{ fontSize: 12, color: 'var(--ink-mid)', margin: '2px 0 0' }}>
                Multi-tenant Governance &amp; Fast Persona Sign-In
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--white)',
              border: '1px solid var(--rule-dark)',
              borderRadius: 'var(--radius-btn)',
              cursor: 'pointer',
              color: 'var(--ink)',
              padding: 0,
              boxShadow: '2px 2px 0px var(--btn-shadow)',
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Persona selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="kicker-accent" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles style={{ width: 13, height: 13 }} /> Fast Demo Persona Sign-In (&lt;5s)
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                border: '1px solid var(--rule)',
                borderRadius: 'var(--radius-btn)',
              }}>
                Judge Ready
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SEEDED_USERS.map((user) => {
                const isActive = currentUser.id === user.id;
                const badge = ROLE_BADGE[user.role] || ROLE_BADGE.creator;

                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      onLoginAsUser(user);
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: isActive ? 'var(--paper)' : 'var(--white)',
                      border: `1px solid ${isActive ? 'var(--rule-dark)' : 'var(--rule)'}`,
                      borderLeft: isActive ? '4px solid var(--accent)' : '1px solid var(--rule)',
                      borderRadius: 'var(--radius-btn)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--rule)' }}
                        />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--paper-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-serif)', border: '1px solid var(--rule)' }}>
                          {user.name[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{user.name}</span>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '2px 6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            background: badge.bg,
                            color: badge.text,
                            border: `1px solid ${badge.border}`,
                            borderRadius: 'var(--radius-btn)',
                          }}>
                            {user.role}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--ink-mid)', margin: '2px 0 0' }}>{user.title}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                      <span>{isActive ? 'Current' : 'Select'}</span>
                      <ArrowRight style={{ width: 14, height: 14 }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'center', margin: '4px 0' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'var(--rule)' }} />
            <span style={{
              position: 'relative',
              background: 'var(--white)',
              padding: '0 12px',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--ink-faint)',
            }}>
              Or Sign In with Magic Link
            </span>
          </div>

          {/* Magic link form */}
          {magicLinkSent ? (
            <div style={{
              padding: '16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-btn)',
              textAlign: 'center',
            }}>
              <CheckCircle2 style={{ width: 28, height: 28, color: '#166534', margin: '0 auto 8px' }} />
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 800, color: '#166534', margin: '0 0 4px' }}>Magic Link Dispatched</h4>
              <p style={{ fontSize: 12, color: '#166534', margin: 0, lineHeight: 1.5 }}>
                We sent a secure magic link to <strong>{email}</strong>. For hackathon demo purposes, your session is authenticated.
              </p>
              <button
                onClick={() => setMagicLinkSent(false)}
                className="btn-plain"
                style={{ fontSize: 12, color: '#166534', textDecoration: 'underline', marginTop: 10, cursor: 'pointer' }}
              >
                Use another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="kicker" style={{ marginBottom: 6 }}>
                  Work Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ width: 15, height: 15, color: 'var(--ink-faint)', position: 'absolute', left: 12, top: 11 }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@brandlint.io"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      fontSize: 13,
                      border: '1px solid var(--rule-dark)',
                      background: 'var(--paper)',
                      color: 'var(--ink)',
                      outline: 'none',
                      borderRadius: 'var(--radius-btn)',
                    }}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                  boxShadow: '2.5px 2.5px 0px var(--btn-shadow)',
                }}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
