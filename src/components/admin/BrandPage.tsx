import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Brand, BrandPaletteItem } from '@/types';

interface BrandPageProps {
  brand: Brand;
  onUpdateBrand: (updates: Partial<Brand>) => void;
}

interface ColorEntry {
  id: string;
  name: string;
  hex: string;
  role?: 'primary' | 'secondary' | 'accent' | 'custom';
}

const BrandPage: React.FC<BrandPageProps> = ({ brand, onUpdateBrand }) => {
  const [name, setName] = useState(brand.name);
  const [tagline, setTagline] = useState(brand.tagline ?? '');
  const [logoUrl, setLogoUrl] = useState(brand.logo_url);
  const [wcagRatio, setWcagRatio] = useState(brand.palette.wcag_min_contrast);
  const [savedToast, setSavedToast] = useState(false);

  const [approvedColors, setApprovedColors] = useState<ColorEntry[]>([]);
  const [forbiddenColors, setForbiddenColors] = useState<string[]>([]);

  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563EB');
  const [showAddColor, setShowAddColor] = useState(false);

  const [newForbiddenHex, setNewForbiddenHex] = useState('#EF4444');
  const [showAddForbidden, setShowAddForbidden] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHex, setEditHex] = useState('');

  useEffect(() => {
    setName(brand.name);
    setTagline(brand.tagline ?? '');
    setLogoUrl(brand.logo_url);
    setWcagRatio(brand.palette.wcag_min_contrast);

    const list: ColorEntry[] = [];
    if (brand.palette.primary) {
      list.push({ id: 'primary', name: brand.palette.primary_name || 'Primary', hex: brand.palette.primary, role: 'primary' });
    }
    if (brand.palette.secondary) {
      list.push({ id: 'secondary', name: brand.palette.secondary_name || 'Secondary', hex: brand.palette.secondary, role: 'secondary' });
    }
    if (brand.palette.accent) {
      list.push({ id: 'accent', name: brand.palette.accent_name || 'Accent', hex: brand.palette.accent, role: 'accent' });
    }
    if (brand.palette.additional_approved) {
      brand.palette.additional_approved.forEach((c, idx) => {
        list.push({ id: `custom-${idx}-${c.hex}`, name: c.name || `Color ${idx + 1}`, hex: c.hex, role: 'custom' });
      });
    }
    setApprovedColors(list);
    setForbiddenColors(brand.palette.forbidden_colors || []);
  }, [brand]);

  const handleSave = () => {
    const primaryEntry = approvedColors.find((c) => c.role === 'primary') || approvedColors[0];
    const secondaryEntry = approvedColors.find((c) => c.role === 'secondary') || approvedColors[1];
    const accentEntry = approvedColors.find((c) => c.role === 'accent') || approvedColors[2];

    const additionalApproved: BrandPaletteItem[] = approvedColors
      .filter((c) => c !== primaryEntry && c !== secondaryEntry && c !== accentEntry)
      .map((c) => ({ hex: c.hex, name: c.name }));

    onUpdateBrand({
      name: name.trim(),
      tagline: tagline.trim(),
      logo_url: logoUrl.trim(),
      palette: {
        ...brand.palette,
        primary: primaryEntry ? primaryEntry.hex : brand.palette.primary,
        primary_name: primaryEntry ? primaryEntry.name : brand.palette.primary_name,
        secondary: secondaryEntry ? secondaryEntry.hex : brand.palette.secondary,
        secondary_name: secondaryEntry ? secondaryEntry.name : brand.palette.secondary_name,
        accent: accentEntry ? accentEntry.hex : brand.palette.accent,
        accent_name: accentEntry ? accentEntry.name : brand.palette.accent_name,
        additional_approved: additionalApproved,
        forbidden_colors: forbiddenColors,
        wcag_min_contrast: wcagRatio,
      },
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleAddApprovedColor = () => {
    if (!newColorHex.trim()) return;
    const cleanHex = newColorHex.trim().toUpperCase();
    const cleanName = newColorName.trim() || `Color ${approvedColors.length + 1}`;
    setApprovedColors([
      ...approvedColors,
      { id: `color-${Date.now()}`, name: cleanName, hex: cleanHex, role: 'custom' },
    ]);
    setNewColorName('');
    setNewColorHex('#2563EB');
    setShowAddColor(false);
  };

  const handleDeleteApprovedColor = (id: string) => {
    if (approvedColors.length <= 1) {
      alert('Brand must retain at least one approved color.');
      return;
    }
    setApprovedColors(approvedColors.filter((c) => c.id !== id));
  };

  const startEditColor = (color: ColorEntry) => {
    setEditingId(color.id);
    setEditName(color.name);
    setEditHex(color.hex);
  };

  const saveEditColor = () => {
    if (!editHex.trim()) return;
    setApprovedColors(
      approvedColors.map((c) =>
        c.id === editingId ? { ...c, name: editName.trim() || c.name, hex: editHex.trim().toUpperCase() } : c
      )
    );
    setEditingId(null);
  };

  const handleAddForbiddenColor = () => {
    if (!newForbiddenHex.trim()) return;
    const cleanHex = newForbiddenHex.trim().toUpperCase();
    if (!forbiddenColors.includes(cleanHex)) {
      setForbiddenColors([...forbiddenColors, cleanHex]);
    }
    setNewForbiddenHex('#EF4444');
    setShowAddForbidden(false);
  };

  const handleDeleteForbiddenColor = (hex: string) => {
    setForbiddenColors(forbiddenColors.filter((c) => c !== hex));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 font-sans text-slate-900">
      {/* ── Page Header ── */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="kicker-accent mb-1.5">Identity Settings</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            Brand Profile &amp; Colours
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage brand metadata, approved palette swatches, and WCAG contrast thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          {savedToast ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Save className="h-3.5 w-3.5" />}
          {savedToast ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Identity Metadata */}
        <div className="saas-card space-y-4 p-6">
          <h2 className="text-sm font-semibold text-slate-900">Brand Identity</h2>

          <div>
            <label className="kicker mb-1.5">Brand Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="kicker mb-1.5">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="kicker mb-1.5">Logo URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="kicker mb-1.5">Minimum WCAG Contrast Ratio ({wcagRatio}:1)</label>
            <input
              type="range"
              min={3}
              max={7}
              step={0.5}
              value={wcagRatio}
              onChange={(e) => setWcagRatio(parseFloat(e.target.value))}
              className="w-full accent-slate-900"
            />
          </div>
        </div>

        {/* Right: Colour Governance */}
        <div className="space-y-6">
          {/* Approved Colours */}
          <div className="saas-card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Approved Palette</h2>
              <button
                type="button"
                onClick={() => setShowAddColor(!showAddColor)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-3 w-3" /> Add Colour
              </button>
            </div>

            {showAddColor && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                />
                <input
                  type="text"
                  placeholder="Name (e.g. Electric Cyan)"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddApprovedColor}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Add
                </button>
              </div>
            )}

            <div className="space-y-2">
              {approvedColors.map((color) => (
                <div
                  key={color.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5"
                >
                  {editingId === color.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="color"
                        value={editHex}
                        onChange={(e) => setEditHex(e.target.value)}
                        className="h-7 w-7 cursor-pointer rounded border border-slate-200"
                      />
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={saveEditColor}
                        className="rounded bg-emerald-600 p-1 text-white"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded border border-slate-200 bg-white p-1 text-slate-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span
                          className="h-6 w-6 rounded-md border border-slate-300 shadow-xs"
                          style={{ background: color.hex }}
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{color.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{color.hex}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditColor(color)}
                          className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteApprovedColor(color.id)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Forbidden Colours */}
          <div className="saas-card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Forbidden Hues</h2>
              <button
                type="button"
                onClick={() => setShowAddForbidden(!showAddForbidden)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-3 w-3" /> Restrict Hue
              </button>
            </div>

            {showAddForbidden && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="color"
                  value={newForbiddenHex}
                  onChange={(e) => setNewForbiddenHex(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-slate-200"
                />
                <span className="flex-1 font-mono text-xs text-slate-600">{newForbiddenHex}</span>
                <button
                  type="button"
                  onClick={handleAddForbiddenColor}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {forbiddenColors.map((hex) => (
                <div
                  key={hex}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50/60 py-1 pl-1.5 pr-2.5"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-rose-300"
                    style={{ background: hex }}
                  />
                  <span className="font-mono text-[11px] text-rose-800">{hex}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteForbiddenColor(hex)}
                    className="btn-plain text-rose-500 hover:text-rose-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPage;
