'use client';
import { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, Upload, Plus, Trash2, Save, Eye, Sparkles, 
  Check, RefreshCw, Sliders, Shield, Layers, HelpCircle
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import RichEditor from '@/components/dashboard/RichEditor';
import { DEFAULT_AUTH_CONFIG } from '@/lib/authConfigConstants';

export default function AuthBannerConfig() {
  const [config, setConfig] = useState({
    bgImage: DEFAULT_AUTH_CONFIG.bgImage,
    overlayOpacity: DEFAULT_AUTH_CONFIG.overlayOpacity,
    overlayColor: DEFAULT_AUTH_CONFIG.overlayColor,
    logoUrl: DEFAULT_AUTH_CONFIG.logoUrl,
    loginHeadline: DEFAULT_AUTH_CONFIG.loginHeadline,
    loginSubtitle: DEFAULT_AUTH_CONFIG.loginSubtitle,
    registerHeadline: DEFAULT_AUTH_CONFIG.registerHeadline,
    registerSubtitle: DEFAULT_AUTH_CONFIG.registerSubtitle,
    forgotHeadline: DEFAULT_AUTH_CONFIG.forgotHeadline,
    forgotSubtitle: DEFAULT_AUTH_CONFIG.forgotSubtitle,
    features: DEFAULT_AUTH_CONFIG.features,
    featuresHtml: DEFAULT_AUTH_CONFIG.featuresHtml,
    showFeatures: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [newFeatureText, setNewFeatureText] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/store-auth-config');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(prev => ({
          ...prev,
          ...data.config,
          featuresHtml: data.config.featuresHtml !== undefined
            ? data.config.featuresHtml
            : (data.config.features?.length ? '<ul>' + data.config.features.map(f => `<li>${f}</li>`).join('') + '</ul>' : prev.featuresHtml)
        }));
      }
    } catch (err) {
      console.error('Failed to fetch auth config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/store-auth-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Auth showcase banner updated successfully!');
      } else {
        showToast.error(data.message || 'Failed to save auth settings');
      }
    } catch (err) {
      showToast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload', file);

    try {
      setUploading(true);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if ((data.success || data.url) && data.url) {
        setConfig(c => ({ ...c, bgImage: data.url }));
        showToast.success('Background image uploaded!');
      } else {
        const errorMsg = typeof data.error === 'string'
          ? data.error
          : data.error?.message || data.message || 'Upload failed';
        showToast.error(errorMsg);
      }
    } catch (err) {
      showToast.error('Upload failed. Please check image size and network.');
    } finally {
      setUploading(false);
    }
  };

  const addFeature = () => {
    if (!newFeatureText.trim()) return;
    setConfig(c => ({
      ...c,
      features: [...(c.features || []), newFeatureText.trim()]
    }));
    setNewFeatureText('');
  };

  const removeFeature = (idx) => {
    setConfig(c => ({
      ...c,
      features: (c.features || []).filter((_, i) => i !== idx)
    }));
  };

  const updateFeature = (idx, text) => {
    const next = [...(config.features || [])];
    next[idx] = text;
    setConfig(c => ({ ...c, features: next }));
  };

  const currentHeadline = activePreviewTab === 'login' 
    ? config.loginHeadline 
    : activePreviewTab === 'register' 
    ? config.registerHeadline 
    : config.forgotHeadline;

  const currentSub = activePreviewTab === 'login' 
    ? config.loginSubtitle 
    : activePreviewTab === 'register' 
    ? config.registerSubtitle 
    : config.forgotSubtitle;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-muted-foreground">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        Loading Auth Showcase Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Auth & Sign-In Page Left Showcase</h3>
            <p className="text-xs text-muted-foreground">
              Customize the left-side background image, dark overlay, headlines, and bullet points for all auth pages.
            </p>
          </div>
        </div>

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
              <Save className="w-3.5 h-3.5" /> Save Showcase Settings
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Background Image & Overlay */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-xs p-6 space-y-5">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              1. Background Image & Dark Overlay
            </h4>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Background Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.bgImage || ''}
                    onChange={e => setConfig({ ...config, bgImage: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <label className="px-3.5 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Recommended: High-resolution horizontal landscape/lifestyle image (16:9 or 4:3).
                </p>
              </div>

              {/* Overlay Opacity Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Dark Overlay Opacity
                    </label>
                    <span className="text-xs font-mono font-bold text-primary">
                      {Math.round((config.overlayOpacity ?? 0.85) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.95"
                    step="0.05"
                    value={config.overlayOpacity ?? 0.85}
                    onChange={e => setConfig({ ...config, overlayOpacity: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Overlay Base Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.overlayColor || '#0b0f19'}
                      onChange={e => setConfig({ ...config, overlayColor: e.target.value })}
                      className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-transparent"
                    />
                    <input
                      type="text"
                      value={config.overlayColor || '#0b0f19'}
                      onChange={e => setConfig({ ...config, overlayColor: e.target.value })}
                      className="w-28 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-border bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Titles & Subtitles for Each Auth Page */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-xs p-6 space-y-5">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              2. Headlines & Subtitles (Per Page)
            </h4>

            {/* Page Tab Selector */}
            <div className="flex gap-2 p-1 bg-muted/40 rounded-lg border border-border">
              {[
                { id: 'login', label: 'Sign In Page' },
                { id: 'register', label: 'Register Page' },
                { id: 'forgot', label: 'Forgot Password' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    activePreviewTab === tab.id
                      ? 'bg-background text-foreground shadow-xs border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activePreviewTab === 'login' && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Sign In Headline
                  </label>
                  <input
                    type="text"
                    value={config.loginHeadline || ''}
                    onChange={e => setConfig({ ...config, loginHeadline: e.target.value })}
                    placeholder="Welcome Back!"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Sign In Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={config.loginSubtitle || ''}
                    onChange={e => setConfig({ ...config, loginSubtitle: e.target.value })}
                    placeholder="Sign in to access your orders..."
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground resize-none"
                  />
                </div>
              </div>
            )}

            {activePreviewTab === 'register' && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Register Headline
                  </label>
                  <input
                    type="text"
                    value={config.registerHeadline || ''}
                    onChange={e => setConfig({ ...config, registerHeadline: e.target.value })}
                    placeholder="Join Us Today!"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Register Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={config.registerSubtitle || ''}
                    onChange={e => setConfig({ ...config, registerSubtitle: e.target.value })}
                    placeholder="Create an account to start shopping..."
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground resize-none"
                  />
                </div>
              </div>
            )}

            {activePreviewTab === 'forgot' && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Forgot Password Headline
                  </label>
                  <input
                    type="text"
                    value={config.forgotHeadline || ''}
                    onChange={e => setConfig({ ...config, forgotHeadline: e.target.value })}
                    placeholder="Reset Your Password"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Forgot Password Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={config.forgotSubtitle || ''}
                    onChange={e => setConfig({ ...config, forgotSubtitle: e.target.value })}
                    placeholder="Enter the email linked to your account..."
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-border bg-background text-foreground resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Feature Content & Bullet Points (CKEditor) */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  3. Feature Bullet Points & Content (Rich Text Editor)
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Format bullet points, highlight badges, bold text, links, or custom text on the left brand panel.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={config.showFeatures !== false}
                  onChange={e => setConfig({ ...config, showFeatures: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-0"
                />
                Show Features
              </label>
            </div>

            {config.showFeatures !== false && (
              <div className="pt-2">
                <RichEditor
                  value={config.featuresHtml || ''}
                  onChange={(val) => setConfig(c => ({ ...c, featuresHtml: val }))}
                  placeholder="Create bullet points, highlights, or styled messages..."
                  minHeight={160}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Live Preview (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" /> Live Left-Panel Preview
              </span>
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                Viewing: {activePreviewTab}
              </span>
            </div>

            {/* Mock Viewport Card */}
            <div
              className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-border flex flex-col justify-center items-center text-center p-8 min-h-[460px]"
              style={{
                backgroundImage: `linear-gradient(${config.overlayColor || '#0b0f19'}${Math.round((config.overlayOpacity ?? 0.85) * 255).toString(16).padStart(2, '0')}, ${config.overlayColor || '#0b0f19'}${Math.round((config.overlayOpacity ?? 0.85) * 255).toString(16).padStart(2, '0')}), url(${config.bgImage || ''})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#ffffff'
              }}
            >
              {/* Logo */}
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2.5 mb-5 flex items-center justify-center shadow-md">
                <img
                  src={config.logoUrl || '/logo.png'}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Headline */}
              <h2 className="text-2xl font-black text-white tracking-tight mb-2 max-w-[280px]">
                {currentHeadline || 'Welcome Back!'}
              </h2>

              {/* Subtitle */}
              <p className="text-xs text-white/80 leading-relaxed max-w-[300px] mb-4">
                {currentSub || 'Sign in to access your orders...'}
              </p>

              {/* Feature Content (Rich Text) */}
              {config.showFeatures !== false && (config.featuresHtml || (config.features || []).length > 0) && (
                <div
                  className="auth-brand-rich-content text-left w-full max-w-[290px] text-xs text-white/90"
                  dangerouslySetInnerHTML={{
                    __html: config.featuresHtml || (config.features?.length ? '<ul>' + config.features.map(f => `<li>${f}</li>`).join('') + '</ul>' : '')
                  }}
                />
              )}
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Changes reflect live on <span className="font-mono">/login</span>, <span className="font-mono">/register</span>, and <span className="font-mono">/forgot-password</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
