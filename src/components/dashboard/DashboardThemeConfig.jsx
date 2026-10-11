'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Palette, Sparkles, Check, RefreshCw, Sun, Moon, 
  Layout, ShieldCheck, CheckCircle2, Sliders, Eye, Save, RotateCcw,
  Square, Circle, Bell, Search, DollarSign, ShoppingBag, Users, ArrowUpRight,
  Plus, Trash2, Bookmark, X, Edit3, Paintbrush, Layers
} from 'lucide-react';
import showToast from '@/lib/storeToast';

export const DASHBOARD_PRESETS = [
  {
    id: 'midnight-indigo',
    name: 'Midnight Indigo (Modern Default)',
    desc: 'Deep slate background with electric indigo highlights and refined glass cards.',
    primaryColor: '#3b82f6',
    accentColor: '#6366f1',
    sidebarBg: '#0f172a',
    background: '#0b0f19',
    cardBg: '#1e293b',
    borderRadius: '0.75rem',
    glassmorphism: true,
  },
  {
    id: 'obsidian-gold',
    name: 'Obsidian Gold (Ultra Luxury)',
    desc: 'Pure matte black with metallic gold accents and warm luxury contrasts.',
    primaryColor: '#f59e0b',
    accentColor: '#d97706',
    sidebarBg: '#09090b',
    background: '#000000',
    cardBg: '#121212',
    borderRadius: '0.5rem',
    glassmorphism: false,
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix (Botanical & Clean)',
    desc: 'Deep evergreen canvas with bright mint badges and organic calm surfaces.',
    primaryColor: '#10b981',
    accentColor: '#059669',
    sidebarBg: '#022c22',
    background: '#031f18',
    cardBg: '#064e3b',
    borderRadius: '0.75rem',
    glassmorphism: true,
  },
  {
    id: 'sapphire-cyan',
    name: 'Sapphire Cyan (Tech & High-Speed)',
    desc: 'Deep ocean navy backdrop with vibrant sky cyan highlights.',
    primaryColor: '#0ea5e9',
    accentColor: '#38bdf8',
    sidebarBg: '#020c1b',
    background: '#0a192f',
    cardBg: '#112240',
    borderRadius: '1rem',
    glassmorphism: true,
  },
  {
    id: 'cyberpunk-violet',
    name: 'Cyberpunk Violet (Vibrant Neon)',
    desc: 'Deep futuristic purple night with neon violet & magenta neon accents.',
    primaryColor: '#a855f7',
    accentColor: '#ec4899',
    sidebarBg: '#1a0933',
    background: '#130b24',
    cardBg: '#241442',
    borderRadius: '0.875rem',
    glassmorphism: true,
  },
  {
    id: 'clean-daylight',
    name: 'Clean Daylight (Minimal Light Mode)',
    desc: 'Crisp light slate background with high-contrast royal blue controls.',
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    sidebarBg: '#1e293b',
    background: '#f8fafc',
    cardBg: '#ffffff',
    borderRadius: '0.75rem',
    glassmorphism: false,
  }
];

function hexToHslValues(hex) {
  if (!hex || !hex.startsWith('#')) return '221.2 83.2% 53.3%';
  let c = hex.substring(1);
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) / 255;
  let g = ((num >> 8) & 255) / 255;
  let b = (num & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

function getContrastColor(hex) {
  if (!hex || !hex.startsWith('#')) return '#ffffff';
  let c = hex.substring(1);
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? '#0f172a' : '#ffffff';
}

export function applyDashboardCSSVariables(theme) {
  if (typeof document === 'undefined' || !theme) return;
  
  let styleEl = document.getElementById('dynamic-dashboard-theme-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-dashboard-theme-styles';
    document.head.appendChild(styleEl);
  }

  const { primaryColor, accentColor, sidebarBg, background, cardBg, borderRadius } = theme;
  const contrastColor = getContrastColor(primaryColor);
  const hslPrimary = hexToHslValues(primaryColor);

  styleEl.innerHTML = `
    :root, .dark {
      --primary: ${hslPrimary};
      --dash-primary: ${primaryColor || '#3b82f6'};
      --dash-primary-contrast: ${contrastColor};
      --dash-accent: ${accentColor || '#6366f1'};
      --dash-sidebar: ${sidebarBg || '#0f172a'};
      --dash-bg: ${background || '#0b0f19'};
      --dash-card: ${cardBg || '#1e293b'};
      --radius: ${borderRadius || '0.75rem'} !important;
    }

    aside.dashboard-sidebar-surface, aside[class*="border-r"] {
      background-color: var(--dash-sidebar, #0f172a) !important;
    }

    .dark body, .dark main, .dark .bg-background {
      background-color: var(--dash-bg, #0b0f19) !important;
    }

    .dark .bg-card {
      background-color: var(--dash-card, #1e293b) !important;
    }

    .dashboard-active-pill {
      background-color: var(--dash-primary, #3b82f6) !important;
      color: var(--dash-primary-contrast, #ffffff) !important;
    }

    .dashboard-active-child {
      background-color: var(--dash-primary, #3b82f6) !important;
      color: var(--dash-primary-contrast, #ffffff) !important;
    }

    .btn-dash-primary, .dashboard-primary-button {
      background-color: var(--dash-primary, #3b82f6) !important;
      color: var(--dash-primary-contrast, #ffffff) !important;
    }
  `;
}

export default function DashboardThemeConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('midnight-indigo');
  const [customPresets, setCustomPresets] = useState([]);
  
  // Modal State for Save / Edit Custom Preset
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null); // null when creating new, preset object when editing
  const [presetForm, setPresetForm] = useState({
    name: '',
    desc: '',
    primaryColor: '#3b82f6',
    accentColor: '#6366f1',
    sidebarBg: '#0f172a',
    cardBg: '#1e293b',
    background: '#0b0f19',
  });

  const [dashTheme, setDashTheme] = useState({
    presetName: 'Midnight Indigo',
    primaryColor: '#3b82f6',
    accentColor: '#6366f1',
    sidebarBg: '#0f172a',
    background: '#0b0f19',
    cardBg: '#1e293b',
    borderRadius: '0.75rem',
    glassmorphism: true,
  });
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
        if (Array.isArray(data.theme.customDashboardPresets)) {
          setCustomPresets(data.theme.customDashboardPresets);
        }
        if (data.theme.dashboardTheme) {
          const saved = data.theme.dashboardTheme;
          setDashTheme(saved);
          applyDashboardCSSVariables(saved);

          const allAvailable = [...(data.theme.customDashboardPresets || []), ...DASHBOARD_PRESETS];
          const matched = allAvailable.find(p => p.primaryColor === saved.primaryColor && p.background === saved.background);
          if (matched) setSelectedPresetId(matched.id);
          else setSelectedPresetId('custom');
        }
      }
    } catch (err) {
      console.error(err);
      showToast.error('Failed to load dashboard theme');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    const updated = {
      presetName: preset.name,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      sidebarBg: preset.sidebarBg,
      background: preset.background,
      cardBg: preset.cardBg,
      borderRadius: preset.borderRadius || '0.75rem',
      glassmorphism: preset.glassmorphism !== false,
    };
    setDashTheme(updated);
    applyDashboardCSSVariables(updated);
  };

  const handleCustomChange = (field, val) => {
    setSelectedPresetId('custom');
    const updated = { ...dashTheme, [field]: val, presetName: 'Custom Palette' };
    setDashTheme(updated);
    applyDashboardCSSVariables(updated);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardTheme: dashTheme, customDashboardPresets: customPresets })
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('🎨 Dashboard theme palette saved & applied live across admin panel!');
        applyDashboardCSSVariables(dashTheme);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dashboardThemeUpdated'));
        }
      } else {
        throw new Error(data.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      showToast.error(err.message || 'Error saving dashboard theme');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPreset(null);
    setPresetForm({
      name: dashTheme.presetName && dashTheme.presetName !== 'Custom Palette' ? `${dashTheme.presetName} (Copy)` : 'My Custom Palette',
      desc: 'Custom created dashboard theme palette.',
      primaryColor: dashTheme.primaryColor || '#3b82f6',
      accentColor: dashTheme.accentColor || '#6366f1',
      sidebarBg: dashTheme.sidebarBg || '#0f172a',
      cardBg: dashTheme.cardBg || '#1e293b',
      background: dashTheme.background || '#0b0f19',
    });
    setShowSaveModal(true);
  };

  const handleOpenEditModal = (preset, e) => {
    if (e) e.stopPropagation();
    setEditingPreset(preset);
    setPresetForm({
      name: preset.name || '',
      desc: preset.desc || '',
      primaryColor: preset.primaryColor || '#3b82f6',
      accentColor: preset.accentColor || '#6366f1',
      sidebarBg: preset.sidebarBg || '#0f172a',
      cardBg: preset.cardBg || '#1e293b',
      background: preset.background || '#0b0f19',
    });
    setShowSaveModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!presetForm.name.trim()) {
      showToast.error('Please enter a preset name');
      return;
    }

    if (editingPreset) {
      // Update existing preset
      const updatedPresets = customPresets.map(p => {
        if (p.id === editingPreset.id) {
          return {
            ...p,
            name: presetForm.name.trim(),
            desc: presetForm.desc.trim() || 'Custom created dashboard theme palette.',
            primaryColor: presetForm.primaryColor,
            accentColor: presetForm.accentColor,
            sidebarBg: presetForm.sidebarBg,
            cardBg: presetForm.cardBg,
            background: presetForm.background,
          };
        }
        return p;
      });

      setCustomPresets(updatedPresets);

      // If edited preset is currently active, update dashTheme too
      if (selectedPresetId === editingPreset.id) {
        const updatedTheme = {
          ...dashTheme,
          presetName: presetForm.name.trim(),
          primaryColor: presetForm.primaryColor,
          accentColor: presetForm.accentColor,
          sidebarBg: presetForm.sidebarBg,
          cardBg: presetForm.cardBg,
          background: presetForm.background,
        };
        setDashTheme(updatedTheme);
        applyDashboardCSSVariables(updatedTheme);
      }

      setShowSaveModal(false);
      setEditingPreset(null);

      try {
        await fetch('/api/admin/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            dashboardTheme: selectedPresetId === editingPreset.id ? {
              ...dashTheme,
              presetName: presetForm.name.trim(),
              primaryColor: presetForm.primaryColor,
              accentColor: presetForm.accentColor,
              sidebarBg: presetForm.sidebarBg,
              cardBg: presetForm.cardBg,
              background: presetForm.background,
            } : dashTheme,
            customDashboardPresets: updatedPresets 
          })
        });
        showToast.success(`✨ Custom preset "${presetForm.name.trim()}" updated successfully!`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dashboardThemeUpdated'));
        }
      } catch (err) {
        console.error(err);
        showToast.error('Failed to update preset in database');
      }
    } else {
      // Create new preset
      const newPreset = {
        id: 'custom_dash_' + Date.now(),
        name: presetForm.name.trim(),
        desc: presetForm.desc.trim() || 'Custom created dashboard theme palette.',
        isCustom: true,
        primaryColor: presetForm.primaryColor,
        accentColor: presetForm.accentColor,
        sidebarBg: presetForm.sidebarBg,
        cardBg: presetForm.cardBg,
        background: presetForm.background,
        borderRadius: dashTheme.borderRadius || '0.75rem',
        glassmorphism: dashTheme.glassmorphism !== false,
      };

      const updatedPresets = [newPreset, ...customPresets];
      setCustomPresets(updatedPresets);
      setSelectedPresetId(newPreset.id);
      
      const updatedTheme = {
        ...dashTheme,
        presetName: newPreset.name,
        primaryColor: newPreset.primaryColor,
        accentColor: newPreset.accentColor,
        sidebarBg: newPreset.sidebarBg,
        cardBg: newPreset.cardBg,
        background: newPreset.background,
      };
      setDashTheme(updatedTheme);
      applyDashboardCSSVariables(updatedTheme);
      
      setShowSaveModal(false);

      try {
        await fetch('/api/admin/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            dashboardTheme: updatedTheme,
            customDashboardPresets: updatedPresets 
          })
        });
        showToast.success(`🎉 Custom preset "${newPreset.name}" created & saved!`);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dashboardThemeUpdated'));
        }
      } catch (err) {
        console.error(err);
        showToast.error('Failed to persist custom preset to database');
      }
    }
  };

  const handleUpdateCurrentCustomPreset = async (presetId) => {
    const target = customPresets.find(p => p.id === presetId);
    if (!target) return;
    const updatedPresets = customPresets.map(p => {
      if (p.id === presetId) {
        return {
          ...p,
          primaryColor: dashTheme.primaryColor,
          accentColor: dashTheme.accentColor,
          sidebarBg: dashTheme.sidebarBg,
          cardBg: dashTheme.cardBg,
          background: dashTheme.background,
        };
      }
      return p;
    });
    setCustomPresets(updatedPresets);
    try {
      await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dashboardTheme: dashTheme,
          customDashboardPresets: updatedPresets 
        })
      });
      showToast.success(`💾 Changes saved to custom preset "${target.name}"!`);
    } catch (err) {
      showToast.error('Failed to update preset');
    }
  };

  const handleDeleteCustomPreset = async (presetId, e) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updated);

    if (selectedPresetId === presetId) {
      handleSelectPreset(DASHBOARD_PRESETS[0]);
    }

    try {
      await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDashboardPresets: updated })
      });
      showToast.success('Custom preset deleted');
    } catch (err) {
      console.error(err);
      showToast.error('Failed to delete preset');
    }
  };

  const handleResetDefaults = () => {
    handleSelectPreset(DASHBOARD_PRESETS[0]);
    showToast.success('Reset to Midnight Indigo default preset');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" /> Admin Dashboard Theme & Palettes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize the colors, sidebar surface, card styling, and border curvature of your staff admin panel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Default
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all flex items-center gap-1.5"
          >
            {saving ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Dashboard Theme
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Preset Catalog & Custom Controls */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 1. Curated & Custom Presets */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-foreground">Dashboard Color Presets</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pick a curated designer palette or save your own custom creations.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Save As New Preset
              </button>
            </div>

            {/* Custom Presets Section */}
            {customPresets.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Your Custom Saved Presets ({customPresets.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customPresets.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/20 bg-muted/30 shadow-xs'
                            : 'border-border/80 hover:border-border bg-background hover:bg-muted/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-foreground truncate block">
                                {preset.name}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
                                Custom
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                              {preset.desc}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(preset, e)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit preset details & swatches"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete preset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ml-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Overwrite Button if custom & currently active */}
                        {isSelected && (
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateCurrentCustomPreset(preset.id);
                              }}
                              className="w-full py-1 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 flex items-center justify-center gap-1 transition-colors"
                            >
                              <Save className="w-3 h-3" /> Save Current Changes to Preset
                            </button>
                          </div>
                        )}

                        {/* Color Swatch Pill */}
                        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                          <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0" style={{ backgroundColor: preset.primaryColor }} title="Primary" />
                          <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0" style={{ backgroundColor: preset.accentColor }} title="Accent" />
                          <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0" style={{ backgroundColor: preset.sidebarBg }} title="Sidebar" />
                          <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0" style={{ backgroundColor: preset.cardBg }} title="Card Surface" />
                          <span className="text-[10px] text-slate-400 ml-auto font-mono">{preset.primaryColor}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Built-in Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Curated Designer Presets
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DASHBOARD_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-muted/30 shadow-xs'
                          : 'border-border/80 hover:border-border bg-background hover:bg-muted/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs text-foreground block">
                            {preset.name}
                          </span>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {preset.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Color Swatch Pill */}
                      <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0" style={{ backgroundColor: preset.primaryColor }} title="Primary" />
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0" style={{ backgroundColor: preset.accentColor }} title="Accent" />
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0" style={{ backgroundColor: preset.sidebarBg }} title="Sidebar" />
                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-xs shrink-0" style={{ backgroundColor: preset.cardBg }} title="Card Surface" />
                        <span className="text-[10px] text-slate-400 ml-auto font-mono">{preset.primaryColor}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 2. Custom Color Studio */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" /> Custom Color Studio
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fine-tune each color channel individually. Any changes preview live immediately across your admin panel.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Primary / Active Accent */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Primary Accent</label>
                  <span className="font-mono text-xs text-muted-foreground uppercase">{dashTheme.primaryColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0 shadow-xs">
                    <input
                      type="color"
                      value={dashTheme.primaryColor}
                      onChange={e => handleCustomChange('primaryColor', e.target.value)}
                      className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: dashTheme.primaryColor }} />
                  </div>
                  <input
                    type="text"
                    value={dashTheme.primaryColor}
                    onChange={e => handleCustomChange('primaryColor', e.target.value)}
                    className="w-full text-xs font-mono h-9 px-3 rounded-lg border border-input bg-card text-foreground uppercase"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Active sidebar pills, primary buttons, badges</p>
              </div>

              {/* Secondary Accent */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Secondary Accent</label>
                  <span className="font-mono text-xs text-muted-foreground uppercase">{dashTheme.accentColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0 shadow-xs">
                    <input
                      type="color"
                      value={dashTheme.accentColor}
                      onChange={e => handleCustomChange('accentColor', e.target.value)}
                      className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: dashTheme.accentColor }} />
                  </div>
                  <input
                    type="text"
                    value={dashTheme.accentColor}
                    onChange={e => handleCustomChange('accentColor', e.target.value)}
                    className="w-full text-xs font-mono h-9 px-3 rounded-lg border border-input bg-card text-foreground uppercase"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Focus rings, secondary highlights, graph gradients</p>
              </div>

              {/* Sidebar Background */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Sidebar Background</label>
                  <span className="font-mono text-xs text-muted-foreground uppercase">{dashTheme.sidebarBg}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0 shadow-xs">
                    <input
                      type="color"
                      value={dashTheme.sidebarBg}
                      onChange={e => handleCustomChange('sidebarBg', e.target.value)}
                      className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: dashTheme.sidebarBg }} />
                  </div>
                  <input
                    type="text"
                    value={dashTheme.sidebarBg}
                    onChange={e => handleCustomChange('sidebarBg', e.target.value)}
                    className="w-full text-xs font-mono h-9 px-3 rounded-lg border border-input bg-card text-foreground uppercase"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Admin navigation menu background</p>
              </div>

              {/* Canvas Background */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">App Canvas BG</label>
                  <span className="font-mono text-xs text-muted-foreground uppercase">{dashTheme.background}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0 shadow-xs">
                    <input
                      type="color"
                      value={dashTheme.background}
                      onChange={e => handleCustomChange('background', e.target.value)}
                      className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: dashTheme.background }} />
                  </div>
                  <input
                    type="text"
                    value={dashTheme.background}
                    onChange={e => handleCustomChange('background', e.target.value)}
                    className="w-full text-xs font-mono h-9 px-3 rounded-lg border border-input bg-card text-foreground uppercase"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Main workspace page canvas</p>
              </div>

              {/* Card Surface Background */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-background space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">Card & Container Surface</label>
                  <span className="font-mono text-xs text-muted-foreground uppercase">{dashTheme.cardBg}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0 shadow-xs">
                    <input
                      type="color"
                      value={dashTheme.cardBg}
                      onChange={e => handleCustomChange('cardBg', e.target.value)}
                      className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: dashTheme.cardBg }} />
                  </div>
                  <input
                    type="text"
                    value={dashTheme.cardBg}
                    onChange={e => handleCustomChange('cardBg', e.target.value)}
                    className="w-full text-xs font-mono h-9 px-3 rounded-lg border border-input bg-card text-foreground uppercase"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Dashboard tables, forms, summary cards, and stats containers</p>
              </div>

            </div>

            {/* Geometry & Border Curvature */}
            <div className="pt-3 border-t border-border space-y-3">
              <label className="text-xs font-bold text-foreground block">
                Element Curvature / Border Radius
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Sharp', val: '0.25rem' },
                  { label: 'Standard', val: '0.5rem' },
                  { label: 'Modern', val: '0.75rem' },
                  { label: 'Curved', val: '1rem' },
                ].map((rad) => (
                  <button
                    key={rad.val}
                    type="button"
                    onClick={() => handleCustomChange('borderRadius', rad.val)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                      dashTheme.borderRadius === rad.val
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-background hover:bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {rad.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Live Interactive Dashboard Simulator */}
        <div className="lg:col-span-6">
          <div className="sticky top-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Live Admin Simulator
              </h3>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Dynamic Live Preview
              </span>
            </div>

            {/* Simulated Mini Dashboard Frame */}
            <div 
              className="rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl transition-all duration-300"
              style={{ backgroundColor: dashTheme.background, borderRadius: dashTheme.borderRadius }}
            >
              {/* Mini Topbar */}
              <div 
                className="h-12 border-b border-white/10 px-4 flex items-center justify-between"
                style={{ backgroundColor: dashTheme.cardBg }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: dashTheme.primaryColor, color: getContrastColor(dashTheme.primaryColor) }}>
                    E
                  </div>
                  <span className="font-bold text-xs text-white">EShop Admin Panel</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
                    <Search className="w-3 h-3" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
                    <Bell className="w-3 h-3" />
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: dashTheme.primaryColor, color: getContrastColor(dashTheme.primaryColor) }}>
                    A
                  </div>
                </div>
              </div>

              {/* Main Simulated Split View: Sidebar + Content Canvas */}
              <div className="flex h-[360px]">
                
                {/* Mini Sidebar */}
                <div 
                  className="w-44 border-r border-white/10 p-3 flex flex-col justify-between"
                  style={{ backgroundColor: dashTheme.sidebarBg }}
                >
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1">
                      Menu
                    </span>
                    
                    {/* Active Nav Item */}
                    <div 
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                      style={{ 
                        backgroundColor: dashTheme.primaryColor, 
                        color: getContrastColor(dashTheme.primaryColor),
                        borderRadius: `calc(${dashTheme.borderRadius} * 0.7)` 
                      }}
                    >
                      <Layout className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                    </div>

                    {/* Inactive Nav Items */}
                    <div className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Products</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Orders</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>Customers</span>
                    </div>
                  </div>

                  {/* Sidebar User Card */}
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: dashTheme.primaryColor, color: getContrastColor(dashTheme.primaryColor) }}>
                      SA
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">Super Admin</p>
                      <p className="text-[8px] text-slate-400">admin@eshop.com</p>
                    </div>
                  </div>
                </div>

                {/* Mini Content Canvas */}
                <div className="flex-1 p-4 overflow-hidden space-y-3.5">
                  
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    
                    {/* Card 1 */}
                    <div 
                      className="p-3 rounded-xl border border-white/10 shadow-xs space-y-1"
                      style={{ backgroundColor: dashTheme.cardBg, borderRadius: `calc(${dashTheme.borderRadius} * 0.8)` }}
                    >
                      <span className="text-[10px] text-slate-400 font-medium">Total Revenue</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">$48,290</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${dashTheme.primaryColor}25`, color: dashTheme.primaryColor }}>
                          +18.4%
                        </span>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div 
                      className="p-3 rounded-xl border border-white/10 shadow-xs space-y-1"
                      style={{ backgroundColor: dashTheme.cardBg, borderRadius: `calc(${dashTheme.borderRadius} * 0.8)` }}
                    >
                      <span className="text-[10px] text-slate-400 font-medium">Total Orders</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">1,420</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${dashTheme.accentColor}25`, color: dashTheme.accentColor }}>
                          +9.2%
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Simulated Table Box */}
                  <div 
                    className="p-3 rounded-xl border border-white/10 shadow-xs space-y-2"
                    style={{ backgroundColor: dashTheme.cardBg, borderRadius: `calc(${dashTheme.borderRadius} * 0.8)` }}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                      <span className="font-bold text-xs text-white">Recent Orders</span>
                      <button 
                        type="button"
                        className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-xs"
                        style={{ backgroundColor: dashTheme.primaryColor, color: getContrastColor(dashTheme.primaryColor) }}
                      >
                        <Plus className="w-2.5 h-2.5" /> Add Order
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] py-1 border-b border-white/5">
                        <span className="text-slate-200">#ORD-9821</span>
                        <span className="font-bold text-white">$189.00</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400">Completed</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] py-1">
                        <span className="text-slate-200">#ORD-9820</span>
                        <span className="font-bold text-white">$450.00</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: `${dashTheme.primaryColor}25`, color: dashTheme.primaryColor }}>Processing</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Note */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
              <span className="font-bold text-foreground block">💡 Instant Live Propagation</span>
              <p>
                Saving applies your palette live across the sidebar, cards, and buttons with smart high-contrast text calculation.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Symmetric Save / Edit Custom Preset Modal */}
      {showSaveModal && mounted && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSaveModal(false);
              setEditingPreset(null);
            }
          }}
        >
          <div 
            className="relative w-full max-w-lg bg-[#12111a] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Symmetric Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shadow-xs shrink-0">
                  {editingPreset ? <Edit3 className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPreset ? 'Edit Custom Preset' : 'Save As New Preset'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingPreset ? 'Update preset details and customize theme color swatches.' : 'Save your customized palette as a reusable dashboard preset.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSaveModal(false);
                  setEditingPreset(null);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-5">
              
              {/* Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Preset Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={presetForm.name}
                    onChange={e => setPresetForm({ ...presetForm, name: e.target.value })}
                    placeholder="e.g. Cyberpunk Violet, Warm Obsidian"
                    className="w-full h-11 px-4 text-xs font-medium rounded-2xl border border-white/10 bg-[#0d0c14] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={presetForm.desc}
                    onChange={e => setPresetForm({ ...presetForm, desc: e.target.value })}
                    placeholder="Short description of this palette aesthetic..."
                    className="w-full h-11 px-4 text-xs font-medium rounded-2xl border border-white/10 bg-[#0d0c14] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Symmetric 4-Color Swatches Selector */}
              <div className="p-4 rounded-2xl bg-[#0b0a12]/90 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Preset Palette Colors
                  </span>
                  <span className="text-[10px] text-slate-400">Click circles to customize</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {/* Primary */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#13121d] border border-white/10 hover:border-primary/50 cursor-pointer group transition-all">
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-primary transition-colors">Primary</span>
                    <div className="relative w-7 h-7 rounded-full border border-white/20 group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      <input
                        type="color"
                        value={presetForm.primaryColor}
                        onChange={e => setPresetForm({ ...presetForm, primaryColor: e.target.value })}
                        className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: presetForm.primaryColor }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{presetForm.primaryColor}</span>
                  </label>

                  {/* Accent */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#13121d] border border-white/10 hover:border-primary/50 cursor-pointer group transition-all">
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-primary transition-colors">Accent</span>
                    <div className="relative w-7 h-7 rounded-full border-2 border-white/20 group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      <input
                        type="color"
                        value={presetForm.accentColor}
                        onChange={e => setPresetForm({ ...presetForm, accentColor: e.target.value })}
                        className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: presetForm.accentColor }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{presetForm.accentColor}</span>
                  </label>

                  {/* Sidebar */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#13121d] border border-white/10 hover:border-primary/50 cursor-pointer group transition-all">
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-primary transition-colors">Sidebar</span>
                    <div className="relative w-7 h-7 rounded-full border-2 border-white/20 group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      <input
                        type="color"
                        value={presetForm.sidebarBg}
                        onChange={e => setPresetForm({ ...presetForm, sidebarBg: e.target.value })}
                        className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: presetForm.sidebarBg }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{presetForm.sidebarBg}</span>
                  </label>

                  {/* Card Surface */}
                  <label className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-[#13121d] border border-white/10 hover:border-primary/50 cursor-pointer group transition-all">
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-primary transition-colors">Card BG</span>
                    <div className="relative w-7 h-7 rounded-full border border-white/20 group-hover:scale-110 shadow-xs transition-transform overflow-hidden">
                      <input
                        type="color"
                        value={presetForm.cardBg}
                        onChange={e => setPresetForm({ ...presetForm, cardBg: e.target.value })}
                        className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: presetForm.cardBg }} />
                    </div>
                    <span className="font-mono text-[9px] text-slate-400 font-bold uppercase">{presetForm.cardBg}</span>
                  </label>
                </div>
              </div>

              {/* Symmetric Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveModal(false);
                    setEditingPreset(null);
                  }}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-md shadow-primary/30 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {editingPreset ? 'Update Preset' : 'Save Preset'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
