'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import { 
  Palette, Sparkles, Check, RefreshCw, Sun, Moon, 
  ShoppingBag, Star, ShieldCheck, Heart, ArrowRight, Save, Eye, Plus, Trash2, X, Bookmark, Edit3, Image as ImageIcon
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import AuthBannerConfig from '@/components/dashboard/AuthBannerConfig';
import BrandLogoConfig from '@/components/dashboard/BrandLogoConfig';
import DashboardThemeConfig from '@/components/dashboard/DashboardThemeConfig';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';

const PRESETS = [
  {
    id: 'current',
    name: 'Luxury Obsidian & Gold (Current Default)',
    desc: 'The current dark grey, pure white, and warm gold luxury aesthetic.',
    primaryColor: '#111111',
    secondaryColor: '#1e293b',
    accentColor: '#c59b27',
    defaultThemeMode: 'light',
    lightMode: {
      bg: '#ffffff',
      surface: '#ffffff',
      text: '#111111',
      muted: '#64748b',
      border: '#e2e8f0'
    },
    darkMode: {
      bg: '#0b0f19',
      surface: '#111827',
      text: '#f8fafc',
      muted: '#94a3b8',
      border: 'rgba(255, 255, 255, 0.12)'
    }
  },
  {
    id: 'emerald',
    name: 'Emerald Flora & Gold (Botanical)',
    desc: 'Deep forest green with warm cream surfaces and golden accents.',
    primaryColor: '#064e3b',
    secondaryColor: '#0f766e',
    accentColor: '#d97706',
    defaultThemeMode: 'light',
    lightMode: {
      bg: '#fafaf9',
      surface: '#ffffff',
      text: '#1c1917',
      muted: '#78716c',
      border: '#e7e5e4'
    },
    darkMode: {
      bg: '#022c22',
      surface: '#064e3b',
      text: '#f0fdf4',
      muted: '#86efac',
      border: 'rgba(52, 211, 153, 0.2)'
    }
  },
  {
    id: 'sapphire',
    name: 'Sapphire Modern & Cyan',
    desc: 'Contemporary royal cobalt with high-tech slate and cyan accents.',
    primaryColor: '#1e3a8a',
    secondaryColor: '#0f172a',
    accentColor: '#06b6d4',
    defaultThemeMode: 'light',
    lightMode: {
      bg: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0'
    },
    darkMode: {
      bg: '#030712',
      surface: '#0f172a',
      text: '#f8fafc',
      muted: '#94a3b8',
      border: 'rgba(56, 189, 248, 0.2)'
    }
  },
  {
    id: 'crimson',
    name: 'Royal Velvet & Rose Gold',
    desc: 'Passionate burgundy and rose gold for premium gifts and luxury hampers.',
    primaryColor: '#881337',
    secondaryColor: '#4c0519',
    accentColor: '#f59e0b',
    defaultThemeMode: 'light',
    lightMode: {
      bg: '#fff1f2',
      surface: '#ffffff',
      text: '#4c0519',
      muted: '#9f1239',
      border: '#fecdd3'
    },
    darkMode: {
      bg: '#1a050b',
      surface: '#4c0519',
      text: '#ffe4e6',
      muted: '#f43f5e',
      border: 'rgba(244, 63, 94, 0.25)'
    }
  },
  {
    id: 'midnight_cyber',
    name: 'Midnight Indigo & Cyber Violet',
    desc: 'Sleek neon violet & indigo night mode for high-end modern retail.',
    primaryColor: '#4c1d95',
    secondaryColor: '#1e1b4b',
    accentColor: '#8b5cf6',
    defaultThemeMode: 'dark',
    lightMode: {
      bg: '#faf5ff',
      surface: '#ffffff',
      text: '#3b0764',
      muted: '#7e22ce',
      border: '#e9d5ff'
    },
    darkMode: {
      bg: '#090514',
      surface: '#180d2e',
      text: '#f3e8ff',
      muted: '#c084fc',
      border: 'rgba(168, 85, 247, 0.25)'
    }
  }
];

export default function StorefrontThemePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState('light'); // 'light' | 'dark'
  const [customPresets, setCustomPresets] = useState([]);
  
  const [selectedPresetId, setSelectedPresetId] = useState(PRESETS[0].id);
  const [editingPreset, setEditingPreset] = useState(null); // For renaming preset
  
  // Custom Preset Modal State
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [confirmPresetModal, setConfirmPresetModal] = useState({ isOpen: false, id: null });

  const [activeCustomizerTab, setActiveCustomizerTab] = useState('theme');
  const [themeState, setThemeState] = useState(PRESETS[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/theme');
      const data = await res.json();
      if (data.success && data.theme) {
        setThemeState({
          presetName: data.theme.presetName || 'Custom Palette',
          primaryColor: data.theme.primaryColor || '#111111',
          secondaryColor: data.theme.secondaryColor || '#1e293b',
          accentColor: data.theme.accentColor || '#c59b27',
          defaultThemeMode: data.theme.defaultThemeMode || 'light',
          lightMode: {
            bg: data.theme.lightMode?.bg || '#ffffff',
            surface: data.theme.lightMode?.surface || '#ffffff',
            text: data.theme.lightMode?.text || '#111111',
            muted: data.theme.lightMode?.muted || '#64748b',
            border: data.theme.lightMode?.border || '#e2e8f0'
          },
          darkMode: {
            bg: data.theme.darkMode?.bg || '#0b0f19',
            surface: data.theme.darkMode?.surface || '#111827',
            text: data.theme.darkMode?.text || '#f8fafc',
            muted: data.theme.darkMode?.muted || '#94a3b8',
            border: data.theme.darkMode?.border || 'rgba(255, 255, 255, 0.12)'
          }
        });
        if (Array.isArray(data.theme.customPresets)) {
          setCustomPresets(data.theme.customPresets);
        }
        setPreviewMode(data.theme.defaultThemeMode || 'light');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Failed to load theme configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setThemeState(prev => ({
      ...prev,
      presetName: preset.name,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      defaultThemeMode: preset.defaultThemeMode || prev.defaultThemeMode,
      lightMode: { ...preset.lightMode },
      darkMode: { ...preset.darkMode }
    }));
    setPreviewMode(preset.defaultThemeMode || 'light');
    showToast.success(`Applied "${preset.name}"! Click "Save Theme" to make it live.`);
  };

  const handleCreateCustomPreset = async (e) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      showToast.error('Please enter a name for your custom preset');
      return;
    }

    // If editing/renaming an existing preset
    if (editingPreset) {
      const updated = customPresets.map(p => {
        if (p.id === editingPreset.id) {
          return {
            ...p,
            name: newPresetName.trim(),
            desc: newPresetDesc.trim() || p.desc
          };
        }
        return p;
      });
      setCustomPresets(updated);
      setShowSavePresetModal(false);
      setEditingPreset(null);
      setNewPresetName('');
      setNewPresetDesc('');

      try {
        await fetch('/api/admin/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...themeState, customPresets: updated })
        });
        showToast.success(`Preset updated successfully!`);
      } catch (err) {
        showToast.error('Failed to update preset');
      }
      return;
    }

    const newPreset = {
      id: 'custom_' + Date.now(),
      name: newPresetName.trim(),
      desc: newPresetDesc.trim() || 'Custom brand palette created in theme customizer.',
      isCustom: true,
      primaryColor: themeState.primaryColor,
      secondaryColor: themeState.secondaryColor,
      accentColor: themeState.accentColor,
      defaultThemeMode: previewMode,
      lightMode: { ...themeState.lightMode },
      darkMode: { ...themeState.darkMode }
    };

    const updated = [newPreset, ...customPresets];
    setCustomPresets(updated);
    setSelectedPresetId(newPreset.id);
    setShowSavePresetModal(false);
    setNewPresetName('');
    setNewPresetDesc('');

    try {
      await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...themeState, presetName: newPreset.name, customPresets: updated })
      });
      showToast.success(`🎉 Custom Preset "${newPreset.name}" saved successfully!`);
    } catch (err) {
      console.error(err);
      showToast.error('Failed to persist custom preset to database');
    }
  };

  const handleUpdateCurrentCustomPreset = async (presetId) => {
    const target = customPresets.find(p => p.id === presetId);
    if (!target) return;

    const updated = customPresets.map(p => {
      if (p.id === presetId) {
        return {
          ...p,
          primaryColor: themeState.primaryColor,
          secondaryColor: themeState.secondaryColor,
          accentColor: themeState.accentColor,
          defaultThemeMode: previewMode,
          lightMode: { ...themeState.lightMode },
          darkMode: { ...themeState.darkMode }
        };
      }
      return p;
    });

    setCustomPresets(updated);

    try {
      await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...themeState, customPresets: updated })
      });
      showToast.success(`Updated saved palette for "${target.name}"!`);
    } catch (err) {
      showToast.error('Failed to update preset');
    }
  };

  const handleDeleteCustomPreset = (presetId, e) => {
    e.stopPropagation();
    setConfirmPresetModal({ isOpen: true, id: presetId });
  };

  const handleConfirmDeletePreset = async () => {
    const presetId = confirmPresetModal.id;
    if (!presetId) return;

    const updated = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updated);
    if (selectedPresetId === presetId) {
      setSelectedPresetId(PRESETS[0].id);
    }
    setConfirmPresetModal({ isOpen: false, id: null });

    try {
      await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...themeState, customPresets: updated })
      });
      showToast.success('Custom preset removed.');
    } catch (err) {
      console.error(err);
      showToast.error('Failed to update presets');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // Also update currently selected custom preset if any
      let updatedCustom = [...customPresets];
      if (selectedPresetId && selectedPresetId.startsWith('custom_')) {
        updatedCustom = customPresets.map(p => {
          if (p.id === selectedPresetId) {
            return {
              ...p,
              primaryColor: themeState.primaryColor,
              secondaryColor: themeState.secondaryColor,
              accentColor: themeState.accentColor,
              defaultThemeMode: previewMode,
              lightMode: { ...themeState.lightMode },
              darkMode: { ...themeState.darkMode }
            };
          }
          return p;
        });
        setCustomPresets(updatedCustom);
      }

      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...themeState, customPresets: updatedCustom })
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('✨ Storefront theme updated successfully! Live across all pages.');
      } else {
        showToast.error(data.message || 'Failed to update theme');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error updating theme');
    } finally {
      setSaving(false);
    }
  };

  const allPresets = [...customPresets, ...PRESETS];
  const activePreviewColors = previewMode === 'dark' ? themeState.darkMode : themeState.lightMode;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb
        title="Storefront Brand & Theme Customizer"
        subtitle="Manage website color palettes, primary branding, and customer Light/Dark mode transitions."
        crumbs={[
          { label: 'Storefront Management', href: '/dashboard/ecommerce' },
          { label: 'Brand & Theme Customizer' }
        ]}
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted/40 rounded-xl border border-border w-fit">
        <button
          type="button"
          onClick={() => setActiveCustomizerTab('theme')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeCustomizerTab === 'theme'
              ? 'bg-background text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="w-4 h-4 text-primary" /> Storefront Brand Colors
        </button>
        <button
          type="button"
          onClick={() => setActiveCustomizerTab('dashboard-theme')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeCustomizerTab === 'dashboard-theme'
              ? 'bg-background text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-primary" /> Dashboard Admin Theme
        </button>
        <button
          type="button"
          onClick={() => setActiveCustomizerTab('logos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeCustomizerTab === 'logos'
              ? 'bg-background text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-primary" /> Brand Logos & Identity
        </button>
        <button
          type="button"
          onClick={() => setActiveCustomizerTab('auth-banner')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeCustomizerTab === 'auth-banner'
              ? 'bg-background text-foreground shadow-xs border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4 text-primary" /> Auth & Sign-In Page Showcase
        </button>
      </div>

      {activeCustomizerTab === 'dashboard-theme' ? (
        <DashboardThemeConfig />
      ) : activeCustomizerTab === 'logos' ? (
        <BrandLogoConfig />
      ) : activeCustomizerTab === 'auth-banner' ? (
        <AuthBannerConfig />
      ) : loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Dynamic Brand System</h2>
                <p className="text-xs text-muted-foreground">Changes automatically update all headers, buttons, cards, tags, and storefront pages.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(PRESETS[0])}
                className="px-3.5 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Current
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Theme
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Preset Selector & Color Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1-Click Designer & Custom Presets */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-foreground">1-Click Theme Presets</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Select a curated palette, customize your brand colors, or save custom presets.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewPresetName(themeState.presetName ? `${themeState.presetName} (Copy)` : 'My Custom Palette');
                  setShowSavePresetModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Save As New Preset
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {allPresets.map((preset) => {
                const isSelected = themeState.primaryColor === preset.primaryColor && themeState.secondaryColor === preset.secondaryColor && themeState.accentColor === preset.accentColor;
                const isCustom = Boolean(preset.isCustom);

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all relative group ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs' 
                        : 'border-border hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">{preset.name}</span>
                        {isCustom ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            Custom
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-muted text-muted-foreground">
                            Built-in
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {isCustom && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPreset(preset);
                                setNewPresetName(preset.name);
                                setNewPresetDesc(preset.desc || '');
                                setShowSavePresetModal(true);
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit preset name & description"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete custom preset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                      {preset.desc}
                    </p>

                    {/* Quick Overwrite Preset Button if custom & selected */}
                    {isCustom && isSelected && (
                      <div className="mb-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateCurrentCustomPreset(preset.id);
                          }}
                          className="w-full py-1 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 flex items-center justify-center gap-1 transition-colors"
                        >
                          <Save className="w-3 h-3" /> Save Changes to This Preset
                        </button>
                      </div>
                    )}

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Palette:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full border shadow-2xs" style={{ backgroundColor: preset.primaryColor }} title={`Primary: ${preset.primaryColor}`} />
                        <span className="w-4 h-4 rounded-full border shadow-2xs" style={{ backgroundColor: preset.secondaryColor }} title={`Secondary: ${preset.secondaryColor}`} />
                        <span className="w-4 h-4 rounded-full border shadow-2xs" style={{ backgroundColor: preset.accentColor }} title={`Accent: ${preset.accentColor}`} />
                        <span className="w-4 h-4 rounded-full border shadow-2xs" style={{ backgroundColor: preset.lightMode?.bg || '#fff' }} title={`Light Bg: ${preset.lightMode?.bg}`} />
                        <span className="w-4 h-4 rounded-full border shadow-2xs" style={{ backgroundColor: preset.darkMode?.bg || '#000' }} title={`Dark Bg: ${preset.darkMode?.bg}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Primary Brand Color Controls */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-xs p-6 space-y-5">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> Core Brand Colors
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Primary Color */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Primary Brand</span>
                  <span className="font-mono text-[11px]">{themeState.primaryColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeState.primaryColor}
                    onChange={e => setThemeState({ ...themeState, primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5 bg-background"
                  />
                  <input
                    type="text"
                    value={themeState.primaryColor}
                    onChange={e => setThemeState({ ...themeState, primaryColor: e.target.value })}
                    className="flex-1 h-10 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Main buttons, badges, and headers.</p>
              </div>

              {/* Secondary Color */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Secondary Color</span>
                  <span className="font-mono text-[11px]">{themeState.secondaryColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeState.secondaryColor}
                    onChange={e => setThemeState({ ...themeState, secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5 bg-background"
                  />
                  <input
                    type="text"
                    value={themeState.secondaryColor}
                    onChange={e => setThemeState({ ...themeState, secondaryColor: e.target.value })}
                    className="flex-1 h-10 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Gradients &amp; darker contrast trims.</p>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Accent Gold / Highlight</span>
                  <span className="font-mono text-[11px]">{themeState.accentColor}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeState.accentColor}
                    onChange={e => setThemeState({ ...themeState, accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5 bg-background"
                  />
                  <input
                    type="text"
                    value={themeState.accentColor}
                    onChange={e => setThemeState({ ...themeState, accentColor: e.target.value })}
                    className="flex-1 h-10 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Star ratings, discount chips, &amp; gold pills.</p>
              </div>
            </div>

            {/* Default Mode Selector */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">Default Visitor Theme</span>
                <p className="text-[11px] text-muted-foreground">Initial display mode for first-time website visitors.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setThemeState({ ...themeState, defaultThemeMode: 'light' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    themeState.defaultThemeMode === 'light' 
                      ? 'bg-background text-foreground shadow-xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setThemeState({ ...themeState, defaultThemeMode: 'dark' })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    themeState.defaultThemeMode === 'dark' 
                      ? 'bg-background text-foreground shadow-xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark
                </button>
              </div>
            </div>
          </div>

          {/* Light Mode Specific Fine-Tuning */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" /> Light Mode Palette Customizer
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Page Background</label>
                <input
                  type="color"
                  value={themeState.lightMode?.bg || '#ffffff'}
                  onChange={e => setThemeState({
                    ...themeState,
                    lightMode: { ...themeState.lightMode, bg: e.target.value }
                  })}
                  className="w-full h-8 rounded border border-input cursor-pointer bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Card Surface</label>
                <input
                  type="color"
                  value={themeState.lightMode?.surface || '#ffffff'}
                  onChange={e => setThemeState({
                    ...themeState,
                    lightMode: { ...themeState.lightMode, surface: e.target.value }
                  })}
                  className="w-full h-8 rounded border border-input cursor-pointer bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Primary Text</label>
                <input
                  type="color"
                  value={themeState.lightMode?.text || '#111111'}
                  onChange={e => setThemeState({
                    ...themeState,
                    lightMode: { ...themeState.lightMode, text: e.target.value }
                  })}
                  className="w-full h-8 rounded border border-input cursor-pointer bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Border Outline</label>
                <input
                  type="color"
                  value={themeState.lightMode?.border || '#e2e8f0'}
                  onChange={e => setThemeState({
                    ...themeState,
                    lightMode: { ...themeState.lightMode, border: e.target.value }
                  })}
                  className="w-full h-8 rounded border border-input cursor-pointer bg-background"
                />
              </div>
            </div>
          </div>

          {/* Dark Mode Specific Fine-Tuning */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" /> Dark Mode Palette Customizer
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Page Background</label>
                <input
                  type="color"
                  value={themeState.darkMode?.bg || '#0b0f19'}
                  onChange={e => setThemeState({
                    ...themeState,
                    darkMode: { ...themeState.darkMode, bg: e.target.value }
                  })}
                  className="w-full h-8 rounded border border-input cursor-pointer bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Card Surface</label>
                <input
                  type="color"
                  value={themeState.darkMode?.surface || '#111827'}
                  onChange={e => setThemeState({
                    ...themeState,
                    darkMode: { ...themeState.darkMode, surface: e.target.value }
                  })}
                  className="w-full h-8 rounded border border-input cursor-pointer bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Primary Text</label>
                <input
                  type="color"
                  value={themeState.darkMode?.text || '#f8fafc'}
                  onChange={e => setThemeState({
                    ...themeState,
                    darkMode: { ...themeState.darkMode, text: e.target.value }
                  })}
                  className="w-full h-8 rounded border border-input cursor-pointer bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Muted Subtext</label>
                <input
                  type="color"
                  value={themeState.darkMode?.muted || '#94a3b8'}
                  onChange={e => setThemeState({
                    ...themeState,
                    darkMode: { ...themeState.darkMode, muted: e.target.value }
                  })}
                  className="w-full h-8 rounded border border-input cursor-pointer bg-background"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Storefront Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 rounded-2xl border bg-card shadow-lg p-5 space-y-4">
            
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground">Live Interactive Preview</span>
              </div>

              {/* Preview Toggle (Light / Dark) */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setPreviewMode('light')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    previewMode === 'light' 
                      ? 'bg-background text-foreground shadow-2xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sun className="w-3 h-3 text-amber-500" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('dark')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    previewMode === 'dark' 
                      ? 'bg-background text-foreground shadow-2xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon className="w-3 h-3 text-indigo-400" /> Dark
                </button>
              </div>
            </div>

            {/* Virtual Device Frame */}
            <div 
              className="rounded-2xl border p-4 transition-all duration-300 shadow-md"
              style={{
                backgroundColor: activePreviewColors.bg,
                color: activePreviewColors.text,
                borderColor: activePreviewColors.border
              }}
            >
              {/* Virtual Header */}
              <div 
                className="flex items-center justify-between pb-3 border-b mb-4"
                style={{ borderColor: activePreviewColors.border }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm tracking-tight" style={{ color: themeState.primaryColor }}>
                    JINDAL
                  </span>
                  <span 
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${themeState.accentColor}20`, color: themeState.accentColor }}
                  >
                    PREMIUM
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="p-1 rounded-full border" style={{ borderColor: activePreviewColors.border }}>
                    {previewMode === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                  </span>
                  <span className="p-1 rounded-full border" style={{ borderColor: activePreviewColors.border }}>
                    <ShoppingBag size={12} />
                  </span>
                </div>
              </div>

              {/* Virtual Promo Banner */}
              <div 
                className="p-2.5 rounded-xl mb-4 text-xs font-bold flex items-center justify-between"
                style={{
                  background: `linear-gradient(135deg, ${themeState.primaryColor}, ${themeState.secondaryColor})`,
                  color: '#ffffff'
                }}
              >
                <span>✨ Festive Season Sale • Up to 40% OFF</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">USE: GOLD40</span>
              </div>

              {/* Virtual Product Card */}
              <div 
                className="rounded-xl border p-3 transition-all"
                style={{
                  backgroundColor: activePreviewColors.surface,
                  borderColor: activePreviewColors.border
                }}
              >
                <div className="relative w-full h-32 rounded-lg bg-muted/40 mb-3 flex items-center justify-center overflow-hidden border" style={{ borderColor: activePreviewColors.border }}>
                  <img 
                    src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop" 
                    alt="Preview Product"
                    className="w-full h-full object-cover"
                  />
                  <span 
                    className="absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: themeState.accentColor }}
                  >
                    25% OFF
                  </span>
                  <span className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white backdrop-blur-xs">
                    <Heart size={12} />
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: themeState.accentColor }}>
                    <Star size={11} fill={themeState.accentColor} />
                    <span className="font-bold">4.9</span>
                    <span style={{ color: activePreviewColors.muted }}>(128 reviews)</span>
                  </div>

                  <h4 className="font-bold text-xs leading-tight truncate" style={{ color: activePreviewColors.text }}>
                    Luxury Velvet Midnight Hamper
                  </h4>

                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-sm" style={{ color: themeState.primaryColor }}>
                      ₹1,499
                    </span>
                    <span className="text-xs line-through" style={{ color: activePreviewColors.muted }}>
                      ₹1,999
                    </span>
                  </div>

                  <button
                    type="button"
                    className="w-full mt-2 py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-xs transition-opacity hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${themeState.primaryColor}, ${themeState.secondaryColor})`
                    }}
                  >
                    <ShoppingBag size={12} /> Add to Cart
                  </button>
                </div>
              </div>

              {/* Virtual Footer / Badge */}
              <div 
                className="mt-4 pt-3 border-t flex items-center justify-between text-[10px]"
                style={{ borderColor: activePreviewColors.border, color: activePreviewColors.muted }}
              >
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} color={themeState.accentColor} /> 100% Guaranteed Fresh
                </span>
                <span>Fast Dispatch</span>
              </div>
            </div>

            {/* Hint */}
            <p className="text-[11px] text-muted-foreground text-center">
              Preview updates live as you adjust colors or switch presets above.
            </p>
          </div>
        </div>

      </div>
      </>
      )}

      {/* Save / Edit Custom Preset Modal Dialog */}
      {showSavePresetModal && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSavePresetModal(false);
              setEditingPreset(null);
            }
          }}
        >
          <div 
            className="relative w-full max-w-lg bg-[#12111a] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-xs shrink-0">
                  {editingPreset ? <Edit3 className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPreset ? `Edit "${editingPreset.name}" Preset` : 'Save As New Preset'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingPreset ? 'Update name, notes, and fine-tune palette colors below.' : 'Save your customized palette as a reusable theme preset.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSavePresetModal(false);
                  setEditingPreset(null);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomPreset} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Preset Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali Festive Gold, Summer Pastel, Minimal Luxe"
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl border border-white/10 bg-[#0d0c14] text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Short note about when to use this theme..."
                    value={newPresetDesc}
                    onChange={e => setNewPresetDesc(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl border border-white/10 bg-[#0d0c14] text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Interactive Color Palette Picker in Modal */}
              <div className="p-4 rounded-2xl bg-[#0b0a12]/90 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Preset Palette Colors
                  </span>
                  <span className="text-[10px] text-slate-400">Click circles to customize</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {/* Primary */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#13121d] border border-white/10 hover:border-primary/50 cursor-pointer group transition-all">
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-primary transition-colors">Primary</span>
                    <div className="relative w-7 h-7 rounded-full border border-white/20 group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      <input
                        type="color"
                        value={themeState.primaryColor}
                        onChange={e => setThemeState({ ...themeState, primaryColor: e.target.value })}
                        className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                        title="Click to change Primary Brand Color"
                      />
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: themeState.primaryColor }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{themeState.primaryColor}</span>
                  </label>

                  {/* Secondary */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#13121d] border border-white/10 hover:border-primary/50 cursor-pointer group transition-all">
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-primary transition-colors">Secondary</span>
                    <div className="relative w-7 h-7 rounded-full border border-white/20 group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      <input
                        type="color"
                        value={themeState.secondaryColor}
                        onChange={e => setThemeState({ ...themeState, secondaryColor: e.target.value })}
                        className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                        title="Click to change Secondary Color"
                      />
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: themeState.secondaryColor }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{themeState.secondaryColor}</span>
                  </label>

                  {/* Accent */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#13121d] border border-white/10 hover:border-primary/50 cursor-pointer group transition-all">
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-primary transition-colors">Accent</span>
                    <div className="relative w-7 h-7 rounded-full border border-white/20 group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      <input
                        type="color"
                        value={themeState.accentColor}
                        onChange={e => setThemeState({ ...themeState, accentColor: e.target.value })}
                        className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                        title="Click to change Accent / Gold Color"
                      />
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: themeState.accentColor }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{themeState.accentColor}</span>
                  </label>

                  {/* Light BG */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#13121d] border border-white/10 hover:border-primary/50 cursor-pointer group transition-all">
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-primary transition-colors">Light BG</span>
                    <div className="relative w-7 h-7 rounded-full border border-white/20 group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      <input
                        type="color"
                        value={themeState.lightMode.bg}
                        onChange={e => setThemeState({
                          ...themeState,
                          lightMode: { ...themeState.lightMode, bg: e.target.value }
                        })}
                        className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                        title="Click to change Light Mode Background"
                      />
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: themeState.lightMode.bg }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{themeState.lightMode.bg}</span>
                  </label>

                  {/* Dark BG */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#13121d] border border-white/10 hover:border-primary/50 cursor-pointer group transition-all">
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-primary transition-colors">Dark BG</span>
                    <div className="relative w-7 h-7 rounded-full border border-white/20 group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      <input
                        type="color"
                        value={themeState.darkMode.bg}
                        onChange={e => setThemeState({
                          ...themeState,
                          darkMode: { ...themeState.darkMode, bg: e.target.value }
                        })}
                        className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                        title="Click to change Dark Mode Background"
                      />
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: themeState.darkMode.bg }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{themeState.darkMode.bg}</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowSavePresetModal(false);
                    setEditingPreset(null);
                  }}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/30 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {editingPreset ? 'Update Preset' : 'Save Preset'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {mounted && createPortal(
        <ConfirmDeleteModal
          isOpen={confirmPresetModal.isOpen}
          onClose={() => setConfirmPresetModal({ isOpen: false, id: null })}
          onConfirm={handleConfirmDeletePreset}
          title="Delete Custom Preset"
          message="Are you sure you want to delete this custom palette preset? This action cannot be undone."
        />,
        document.body
      )}
    </div>
  );
}
