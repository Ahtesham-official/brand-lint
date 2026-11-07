import React, { useState, useEffect } from 'react';
import { Key, Sparkles, Check, ExternalLink, X, ShieldCheck } from 'lucide-react';

interface GroqKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const GroqKeyModal: React.FC<GroqKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<{ configured: boolean }>({ configured: false });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/config/groq')
        .then((res) => res.json())
        .then((data) => setStatus(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/config/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus({ configured: true });
        setSuccessMsg('Groq API Key configured! GenAI Llama-3.3-70B engine is now active.');
        setApiKey('');
        onSaved();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Configure Groq GenAI</h3>
              <p className="text-[11px] text-slate-500">Llama-3.3-70B Compliance Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-[2px_2px_0px_#1c1917]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Current GenAI Engine:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider ${
                  status.configured
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {status.configured ? 'Active (Groq Llama 3.3)' : 'Deterministic Fallback'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              With Groq enabled, compliance checks evaluate submissions against the Admin&apos;s active rules and Fact Vault in real-time.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Enter Groq API Key (<code className="font-mono text-[10px] text-orange-700">gsk_...</code>)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[11px]">
              <span className="text-slate-400">Never shared or sent to third parties.</span>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-orange-600 hover:underline flex items-center gap-0.5 font-medium"
              >
                Get Groq Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 text-xs font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !apiKey.trim()}
              className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Validating...' : 'Activate Groq GenAI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

