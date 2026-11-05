import React, { useState, useEffect } from 'react';
import { Palette, Save } from 'lucide-react';
import { Brand } from '@/types';

interface BrandPageProps {
  brand: Brand;
  onUpdateBrand: (updates: Partial<Brand>) => void;
}

const BrandPage: React.FC<BrandPageProps> = ({ brand, onUpdateBrand }) => {
  const [name, setName] = useState(brand.name);
  const [tagline, setTagline] = useState(brand.tagline ?? '');
  const [logoUrl, setLogoUrl] = useState(brand.logo_url);
  const [wcagRatio, setWcagRatio] = useState(brand.palette.wcag_min_contrast);

  useEffect(() => {
    setName(brand.name);
    setTagline(brand.tagline ?? '');
    setLogoUrl(brand.logo_url);
    setWcagRatio(brand.palette.wcag_min_contrast);
  }, [brand]);

  const handleSave = () => {
    onUpdateBrand({
      name: name.trim(),
      tagline: tagline.trim(),
      logo_url: logoUrl.trim(),
      palette: { ...brand.palette, wcag_min_contrast: wcagRatio },
    });
  };

  const approvedColors = [
    { hex: brand.palette.primary, name: brand.palette.primary_name ?? 'Primary' },
    { hex: brand.palette.secondary, name: brand.palette.secondary_name ?? 'Secondary' },
    { hex: brand.palette.accent, name: brand.palette.accent_name ?? 'Accent' },
  ];

  const forbiddenColors = brand.palette.forbidden_colors;

  return (
    <div className="min-h-full bg-slate-50/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Brand Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage identity, palette, and accessibility settings.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Brand Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Logo URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              WCAG Min Contrast Ratio
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={wcagRatio}
              onChange={(e) => setWcagRatio(parseFloat(e.target.value) || 4.5)}
              className="w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>

        {/* Right column — Palette */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">Color Palette</h2>
          </div>

          {/* Approved colors */}
          <p className="text-xs text-slate-500 mb-2">Approved</p>
          <div className="flex gap-3 mb-5">
            {approvedColors.map((c) => (
              <div key={c.hex} className="text-center">
                <div
                  className="w-14 h-14 rounded-lg border border-slate-200"
                  style={{ backgroundColor: c.hex }}
                />
                <p className="text-xs text-slate-600 mt-1.5 font-medium">{c.name}</p>
                <p className="text-xs text-slate-400 font-mono">{c.hex}</p>
              </div>
            ))}
          </div>

          {/* Forbidden colors */}
          <p className="text-xs text-slate-500 mb-2">Forbidden</p>
          <div className="flex gap-3 mb-5">
            {forbiddenColors.map((hex) => (
              <div key={hex} className="text-center">
                <div
                  className="w-14 h-14 rounded-lg border-2 border-red-400"
                  style={{ backgroundColor: hex }}
                />
                <p className="text-xs text-slate-400 font-mono mt-1.5">{hex}</p>
              </div>
            ))}
          </div>

          {/* Palette JSON */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Palette JSON</p>
            <pre className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto max-h-40">
              {JSON.stringify(brand.palette, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPage;
