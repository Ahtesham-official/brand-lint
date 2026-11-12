import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export type AppMode = 'demo' | 'actual';

interface ModeToggleProps {
  mode: AppMode;
  onToggle: (mode: AppMode) => void;
  style?: React.CSSProperties;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onToggle, style }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#0f172a',
        padding: '3px',
        borderRadius: '9999px',
        border: '1px solid #334155',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => onToggle('demo')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          transition: 'all 0.18s ease-in-out',
          background: mode === 'demo' ? '#f59e0b' : 'transparent',
          color: mode === 'demo' ? '#78350f' : '#94a3b8',
          boxShadow: mode === 'demo' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
        }}
        title="Demo Mode: Fast evaluation with instant personas, preloaded guidelines, and demo violation scans"
      >
        <Sparkles style={{ width: 13, height: 13, color: mode === 'demo' ? '#78350f' : '#94a3b8' }} />
        <span>Demo Mode</span>
      </button>

      <button
        type="button"
        onClick={() => onToggle('actual')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          transition: 'all 0.18s ease-in-out',
          background: mode === 'actual' ? '#2563eb' : 'transparent',
          color: mode === 'actual' ? '#ffffff' : '#94a3b8',
          boxShadow: mode === 'actual' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
        }}
        title="Actual Project: Production environment with authenticated workspaces, custom guidelines & live database"
      >
        <ShieldCheck style={{ width: 13, height: 13, color: mode === 'actual' ? '#ffffff' : '#94a3b8' }} />
        <span>Actual Project</span>
      </button>
    </div>
  );
};

