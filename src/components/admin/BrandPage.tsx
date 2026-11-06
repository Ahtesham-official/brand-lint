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

  // Editable colors list
  const [approvedColors, setApprovedColors] = useState<ColorEntry[]>([]);
  const [forbiddenColors, setForbiddenColors] = useState<string[]>([]);

  // New color state
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#2563EB');
  const [showAddColor, setShowAddColor] = useState(false);

  // New forbidden color state
  const [newForbiddenHex, setNewForbiddenHex] = useState('#EF4444');
  const [showAddForbidden, setShowAddForbidden] = useState(false);

  // Editing color inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHex, setEditHex] = useState('');

  useEffect(() => {
    setName(brand.name);
    setTagline(brand.tagline ?? '');
    setLogoUrl(brand.logo_url);
    setWcagRatio(brand.palette.wcag_min_contrast);

    // Build editable list from primary, secondary, accent + additional_approved
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
    // Map list back to palette
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
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid var(--rule)' }}>
        <div>
          <div className="kicker-accent" style={{ marginBottom: 8 }}>Identity Settings</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 34, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)', lineHeight: 1 }}>
            Brand Profile &amp; Colors
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-light)', marginTop: 8, fontWeight: 300 }}>
            Manage identity metadata, customize approved brand palette, and restrict forbidden hues.
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'var(--btn-primary)', color: 'var(--white)', border: '1px solid var(--rule-dark)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >
          <Save style={{ width: 14, height: 14 }} /> Save Changes
        </button>
      </div>

      {/* ── Two Column Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
        {/* Left column — Identity Form */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--rule)', padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="kicker" style={{ marginBottom: -4 }}>Brand Metadata</div>

          <div>
            <label className="kicker" style={{ marginBottom: 6 }}>Brand Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={iStyle()}
            />
          </div>

          <div>
            <label className="kicker" style={{ marginBottom: 6 }}>Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              style={iStyle()}
            />
          </div>

          <div>
            <label className="kicker" style={{ marginBottom: 6 }}>Logo Asset URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              style={{ ...iStyle(), fontFamily: 'var(--font-mono)', fontSize: 12 }}
            />
          </div>

          <div>
            <label className="kicker" style={{ marginBottom: 6 }}>WCAG Minimum Contrast Ratio</label>
            <input
              type="number"
              step="0.1"
              min="1"
              value={wcagRatio}
              onChange={(e) => setWcagRatio(parseFloat(e.target.value) || 4.5)}
              style={{ ...iStyle(), width: 140 }}
            />
            <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
              Standard AA compliance mandates 4.5:1 minimum ratio for standard text copy.
            </span>
          </div>
        </div>

        {/* Right column — Palette management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Approved Palette */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--rule)', padding: '28px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div className="kicker">Approved Palette ({approvedColors.length})</div>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Colors allowed on creatives &amp; verified by AI</span>
              </div>
              <button
                onClick={() => setShowAddColor(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'var(--paper)', border: '1px solid var(--rule)', color: 'var(--ink)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus style={{ width: 13, height: 13 }} /> Add Color
              </button>
            </div>

            {/* Add color inline popup */}
            {showAddColor && (
              <div style={{ padding: '14px', background: 'var(--paper)', border: '1px solid var(--rule)', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="kicker">New Approved Color</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    style={{ width: 40, height: 36, padding: 2, background: 'transparent', border: '1px solid var(--rule)', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    placeholder="#HEX"
                    style={{ width: 100, ...iStyle(), fontFamily: 'var(--font-mono)' }}
                  />
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Color Name (e.g. Electric Cyan)"
                    style={{ flex: 1, ...iStyle() }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setShowAddColor(false)} style={ghostBtn()}>Cancel</button>
                  <button onClick={handleAddApprovedColor} style={solidBtn()}>Add to Palette</button>
                </div>
              </div>
            )}

            {/* Color list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {approvedColors.map((color) => {
                const isEditing = editingId === color.id;

                return (
                  <div
                    key={color.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--paper)',
                      border: '1px solid var(--rule)',
                      gap: 12,
                    }}
                  >
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        <input
                          type="color"
                          value={editHex}
                          onChange={(e) => setEditHex(e.target.value)}
                          style={{ width: 32, height: 32, padding: 1, border: '1px solid var(--rule)', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          value={editHex}
                          onChange={(e) => setEditHex(e.target.value)}
                          style={{ width: 90, ...iStyle(), fontFamily: 'var(--font-mono)', padding: '5px 8px', fontSize: 12 }}
                        />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ flex: 1, ...iStyle(), padding: '5px 8px', fontSize: 12 }}
                        />
                        <button onClick={saveEditColor} style={{ padding: '6px', background: 'var(--btn-primary)', color: '#fff', border: '1px solid var(--rule-dark)', cursor: 'pointer' }} title="Save">
                          <Check style={{ width: 14, height: 14 }} />
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '6px', background: 'transparent', border: '1px solid var(--rule)', cursor: 'pointer' }} title="Cancel">
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 28, height: 28, background: color.hex, border: '1px solid var(--rule)' }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{color.name}</div>
                            {color.role && color.role !== 'custom' && (
                              <span className="kicker" style={{ marginTop: 1, color: 'var(--accent)' }}>
                                {color.role}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-light)' }}>
                            {color.hex}
                          </span>
                          <button
                            onClick={() => startEditColor(color)}
                            style={{ padding: '4px 6px', background: 'transparent', border: '1px solid var(--rule)', cursor: 'pointer', color: 'var(--ink-mid)' }}
                            title="Edit color"
                          >
                            <Edit2 style={{ width: 11, height: 11 }} />
                          </button>
                          <button
                            onClick={() => handleDeleteApprovedColor(color.id)}
                            style={{ padding: '4px 6px', background: '#fef2f2', border: '1px solid #fca5a5', cursor: 'pointer', color: '#b91c1c' }}
                            title="Delete color"
                          >
                            <Trash2 style={{ width: 11, height: 11 }} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forbidden Colors */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--rule)', padding: '28px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div className="kicker" style={{ color: '#b91c1c' }}>Forbidden Tones ({forbiddenColors.length})</div>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Hues strictly flagged by Delta-E color distance</span>
              </div>
              <button
                onClick={() => setShowAddForbidden(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <Plus style={{ width: 13, height: 13 }} /> Add Forbidden
              </button>
            </div>

            {/* Add forbidden color inline popup */}
            {showAddForbidden && (
              <div style={{ padding: '14px', background: '#fef2f2', border: '1px solid #fca5a5', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span className="kicker" style={{ color: '#b91c1c' }}>Add Forbidden Color Hex</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="color"
                    value={newForbiddenHex}
                    onChange={(e) => setNewForbiddenHex(e.target.value)}
                    style={{ width: 40, height: 36, padding: 2, background: 'transparent', border: '1px solid #fca5a5', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={newForbiddenHex}
                    onChange={(e) => setNewForbiddenHex(e.target.value)}
                    placeholder="#HEX"
                    style={{ flex: 1, ...iStyle(), fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setShowAddForbidden(false)} style={ghostBtn()}>Cancel</button>
                  <button onClick={handleAddForbiddenColor} style={{ ...solidBtn(), background: '#b91c1c' }}>Add Forbidden</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {forbiddenColors.map((hex, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 26, height: 26, background: hex, border: '1px solid #fca5a5' }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#b91c1c' }}>Prohibited #{idx + 1}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#b91c1c' }}>{hex}</span>
                    <button
                      onClick={() => handleDeleteForbiddenColor(hex)}
                      style={{ padding: '4px 6px', background: 'transparent', border: '1px solid #fca5a5', cursor: 'pointer', color: '#b91c1c' }}
                      title="Remove forbidden"
                    >
                      <Trash2 style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function iStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    border: '1px solid var(--rule)',
    background: 'var(--paper)',
    color: 'var(--ink)',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  };
}

function ghostBtn(): React.CSSProperties {
  return {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--ink-mid)',
    border: '1px solid var(--rule)',
  };
}

function solidBtn(): React.CSSProperties {
  return {
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    background: 'var(--btn-primary)',
    color: 'var(--white)',
    border: '1px solid var(--rule-dark)',
  };
}

export default BrandPage;
