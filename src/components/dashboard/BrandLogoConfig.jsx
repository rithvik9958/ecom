'use client';
import { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, Upload, Save, Sun, Moon, Sparkles, RefreshCw, 
  Trash2, Sliders, CheckCircle2, Globe, Eye, ArrowRight, ShieldCheck, ShoppingCart, Heart, Search
} from 'lucide-react';
import showToast from '@/lib/storeToast';

export default function BrandLogoConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [previewTab, setPreviewTab] = useState('light'); // 'light' | 'dark'

  const [brandData, setBrandData] = useState({
    brandName: 'EShop',
    logo: '/logo.png',
    darkLogo: '',
    favicon: '/favicon.ico',
    adminLogo: '',
    adminTitle: 'EShop Admin',
    logoHeight: 48,
    primaryColor: '#111111',
    accentColor: '#c59b27',
  });

  const [useDarkLogo, setUseDarkLogo] = useState(false);

  useEffect(() => {
    fetchBrandTheme();
  }, []);

  const fetchBrandTheme = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/theme');
      const data = await res.json();
      if (data.success && data.theme) {
        setBrandData({
          brandName: data.theme.brandName || 'EShop',
          logo: data.theme.logo || '/logo.png',
          darkLogo: data.theme.darkLogo || '',
          favicon: data.theme.favicon || '/favicon.ico',
          adminLogo: data.theme.adminLogo || '',
          adminTitle: data.theme.adminTitle || 'EShop Admin',
          logoHeight: data.theme.logoHeight || 48,
          primaryColor: data.theme.primaryColor || '#111111',
          accentColor: data.theme.accentColor || '#c59b27',
        });
        setUseDarkLogo(Boolean(data.theme.darkLogo && data.theme.darkLogo.trim() !== ''));
      }
    } catch (err) {
      console.error(err);
      showToast.error('Failed to load brand configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, field) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success && json.url) {
        setBrandData(prev => ({ ...prev, [field]: json.url }));
        showToast.success(`Uploaded ${field} successfully!`);
      } else {
        throw new Error(json.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      showToast.error(err.message || 'Failed to upload file');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        brandName: brandData.brandName.trim() || 'EShop',
        logo: brandData.logo.trim() || '/logo.png',
        darkLogo: useDarkLogo ? brandData.darkLogo.trim() : '',
        favicon: brandData.favicon.trim() || '/favicon.ico',
        adminLogo: brandData.adminLogo.trim(),
        adminTitle: brandData.adminTitle.trim() || 'EShop Admin',
        logoHeight: Number(brandData.logoHeight) || 48,
      };

      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('🎉 Brand & Logos updated! Changes are live across storefront and admin sidebar.');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('themeUpdated'));
        }
      } else {
        throw new Error(data.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      showToast.error(err.message || 'Error saving brand settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentLogoSrc = previewTab === 'dark' && useDarkLogo && brandData.darkLogo
    ? brandData.darkLogo
    : (brandData.logo || '/logo.png');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Brand Logos & Visual Identity</h2>
            <p className="text-xs text-muted-foreground">Manage storefront header logos, dark mode variants, favicon, and brand name.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBrandTheme}
            className="px-3.5 py-2 rounded-xl border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Brand Logos
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Settings (Left 6 cols) + Live Header Preview (Right 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 1. Brand Name */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Storefront Brand Name / Site Title
              </label>
              <input
                type="text"
                value={brandData.brandName}
                onChange={e => setBrandData({ ...brandData, brandName: e.target.value })}
                placeholder="e.g. EShop or Jindal Metals"
                className="w-full h-11 px-4 text-sm font-medium rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Used in browser tab titles, header logo alt text, Schema.org SEO, invoices, and footer copyright.
              </p>
            </div>
          </div>

          {/* 2. Primary (Light Mode) Logo */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" /> Primary Storefront Logo (Light Mode)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Main logo displayed on white / light headers.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Preview Box */}
              <div className="h-28 rounded-xl border border-border bg-white p-3 flex items-center justify-center shadow-xs overflow-hidden">
                {brandData.logo ? (
                  <img
                    src={brandData.logo}
                    alt="Logo Light Preview"
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span className="text-xs text-slate-400">No logo uploaded</span>
                )}
              </div>

              {/* Upload & Actions */}
              <div className="space-y-2">
                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingField === 'logo' ? 'Uploading...' : 'Upload Logo Image'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={e => handleFileUpload(e.target.files[0], 'logo')}
                    disabled={uploadingField === 'logo'}
                  />
                </label>

                <input
                  type="text"
                  value={brandData.logo}
                  onChange={e => setBrandData({ ...brandData, logo: e.target.value })}
                  placeholder="Or paste direct image URL (/logo.png)"
                  className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          {/* 3. Dark Mode Logo */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" /> Dark Mode Logo (Optional)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Displayed when storefront is in dark mode (e.g. white text/transparent).</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  checked={useDarkLogo}
                  onChange={e => setUseDarkLogo(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <span>Separate Dark Logo</span>
              </label>
            </div>

            {useDarkLogo ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center animate-in fade-in duration-200">
                {/* Preview Box on Dark Slate */}
                <div className="h-28 rounded-xl border border-slate-700 bg-[#0f172a] p-3 flex items-center justify-center shadow-xs overflow-hidden">
                  {brandData.darkLogo ? (
                    <img
                      src={brandData.darkLogo}
                      alt="Logo Dark Preview"
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span className="text-xs text-slate-500">No dark logo uploaded</span>
                  )}
                </div>

                {/* Upload & Actions */}
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingField === 'darkLogo' ? 'Uploading...' : 'Upload Dark Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={e => handleFileUpload(e.target.files[0], 'darkLogo')}
                      disabled={uploadingField === 'darkLogo'}
                    />
                  </label>

                  <input
                    type="text"
                    value={brandData.darkLogo}
                    onChange={e => setBrandData({ ...brandData, darkLogo: e.target.value })}
                    placeholder="Or paste dark logo URL"
                    className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background text-foreground"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-muted/20 border border-dashed border-border rounded-xl text-xs text-muted-foreground text-center">
                Light mode logo will be automatically used in dark mode.
              </div>
            )}
          </div>

          {/* 4. Favicon & Height Slider */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
            {/* Favicon */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Browser Tab Favicon
              </label>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border border-border bg-background flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                  {brandData.favicon ? (
                    <img src={brandData.favicon} alt="Favicon" className="w-6 h-6 object-contain" />
                  ) : (
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 flex gap-2">
                  <label className="px-3.5 py-2 rounded-xl border border-input bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-all flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingField === 'favicon' ? 'Uploading...' : 'Upload Favicon'}</span>
                    <input
                      type="file"
                      accept=".ico,.png,.svg,.webp"
                      className="hidden"
                      onChange={e => handleFileUpload(e.target.files[0], 'favicon')}
                      disabled={uploadingField === 'favicon'}
                    />
                  </label>
                  <input
                    type="text"
                    value={brandData.favicon}
                    onChange={e => setBrandData({ ...brandData, favicon: e.target.value })}
                    placeholder="/favicon.ico"
                    className="flex-1 h-9 px-3 text-xs rounded-xl border border-input bg-background text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 pt-5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Header Logo Height: <span className="text-primary font-bold">{brandData.logoHeight}px</span>
                </label>
                <span className="text-[11px] text-muted-foreground">Range: 24px – 80px</span>
              </div>
              <input
                type="range"
                min="24"
                max="80"
                step="2"
                value={brandData.logoHeight}
                onChange={e => setBrandData({ ...brandData, logoHeight: Number(e.target.value) })}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* 5. Admin Dashboard Sidebar Branding */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Admin Dashboard Sidebar Branding
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize the icon and brand title displayed in the top-left corner of the staff admin panel.
              </p>
            </div>

            {/* Admin Title */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Dashboard Title
              </label>
              <input
                type="text"
                value={brandData.adminTitle}
                onChange={e => setBrandData({ ...brandData, adminTitle: e.target.value })}
                placeholder="e.g. EShop Admin"
                className="w-full h-10 px-3.5 text-xs font-medium rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
              />
            </div>

            {/* Admin Sidebar Logo Upload & Preview */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Sidebar Logo / Icon
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Preview Box on Dark Sidebar surface */}
                <div className="h-24 rounded-xl border border-slate-700 bg-[#0f172a] p-3 flex items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                    {brandData.adminLogo || brandData.logo ? (
                      <img
                        src={brandData.adminLogo || brandData.logo}
                        alt="Admin Logo Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="font-bold text-primary text-sm">
                        {(brandData.adminTitle || 'E').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-white block truncate">
                      {brandData.adminTitle || 'EShop Admin'}
                    </span>
                    <span className="text-[10px] text-slate-400">Sidebar Preview</span>
                  </div>
                </div>

                {/* Upload & Actions */}
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingField === 'adminLogo' ? 'Uploading...' : 'Upload Sidebar Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={e => handleFileUpload(e.target.files[0], 'adminLogo')}
                      disabled={uploadingField === 'adminLogo'}
                    />
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={brandData.adminLogo}
                      onChange={e => setBrandData({ ...brandData, adminLogo: e.target.value })}
                      placeholder="Paste image URL"
                      className="flex-1 h-9 px-3 text-xs rounded-lg border border-input bg-background text-foreground"
                    />
                    {brandData.logo && (
                      <button
                        type="button"
                        onClick={() => setBrandData(prev => ({ ...prev, adminLogo: prev.logo }))}
                        title="Use Storefront Logo"
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                      >
                        Use Store Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Live Header Simulator */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5 sticky top-24">
            
            {/* Live Header Header Controls */}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Live Storefront Header Simulation</h3>
              </div>

              {/* Light/Dark Toggle */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewTab('light')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    previewTab === 'light'
                      ? 'bg-background text-foreground shadow-xs border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('dark')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    previewTab === 'dark'
                      ? 'bg-background text-foreground shadow-xs border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark
                </button>
              </div>
            </div>

            {/* Simulated Browser Window */}
            <div className={`rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg ${
              previewTab === 'dark'
                ? 'border-slate-800 bg-[#0b0f19] text-white'
                : 'border-slate-200 bg-slate-50 text-slate-900'
            }`}>
              
              {/* Browser Window Bar */}
              <div className={`px-4 py-2.5 border-b flex items-center gap-3 text-xs ${
                previewTab === 'dark' ? 'border-slate-800 bg-[#111827]' : 'border-slate-200 bg-slate-200/70'
              }`}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                
                {/* Simulated Tab with Favicon and Brand Name */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-medium max-w-[220px] truncate ${
                  previewTab === 'dark' ? 'bg-[#1f2937] text-slate-200' : 'bg-white text-slate-800 shadow-xs'
                }`}>
                  {brandData.favicon ? (
                    <img src={brandData.favicon} alt="Tab icon" className="w-3.5 h-3.5 object-contain" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate">{brandData.brandName} — Premium Store</span>
                </div>
              </div>

              {/* Simulated Storefront Header Top Bar */}
              <div className={`p-4 border-b transition-colors flex items-center justify-between gap-4 ${
                previewTab === 'dark'
                  ? 'bg-[#111827] border-slate-800'
                  : 'bg-white border-slate-200'
              }`}>
                {/* Logo Area */}
                <div className="flex items-center gap-3 shrink-0">
                  <div style={{ height: `${brandData.logoHeight}px`, display: 'flex', alignItems: 'center' }}>
                    {currentLogoSrc ? (
                      <img
                        src={currentLogoSrc}
                        alt={brandData.brandName}
                        style={{ height: `${brandData.logoHeight}px`, width: 'auto', objectFit: 'contain' }}
                      />
                    ) : (
                      <span className="font-extrabold text-lg tracking-tight">{brandData.brandName}</span>
                    )}
                  </div>
                </div>

                {/* Simulated Search Bar */}
                <div className="hidden sm:flex flex-1 max-w-xs items-center gap-2 px-3 py-1.5 rounded-full border text-xs text-muted-foreground opacity-60">
                  <Search className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Search cakes, flowers, gifts...</span>
                </div>

                {/* Header Action Icons */}
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <div className="flex items-center gap-1 opacity-70">
                    <Heart className="w-4 h-4" />
                    <span className="hidden md:inline text-[11px]">Wishlist</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-70">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="hidden md:inline text-[11px]">Cart</span>
                  </div>
                </div>
              </div>

              {/* Simulated Sub-Nav */}
              <div className={`px-4 py-2 flex items-center gap-4 text-[11px] font-semibold overflow-x-auto ${
                previewTab === 'dark' ? 'bg-[#0f172a] text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}>
                <span className="text-primary font-bold">All Categories</span>
                <span>Birthday</span>
                <span>Anniversary</span>
                <span>Flowers</span>
                <span>Cakes</span>
                <span>Personalized</span>
              </div>

              {/* Hero Banner Preview */}
              <div className="p-6 flex flex-col items-center justify-center min-h-[140px] text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                  Welcome to {brandData.brandName}
                </span>
                <h4 className="text-base font-bold mb-2">Luxury Gifting & Premium Delivery</h4>
                <div className="flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                  <span>Shop Featured Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

            </div>

            {/* Helper Tips */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-1.5 text-foreground">
              <div className="font-bold flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="w-4 h-4" /> Instant Live Propagation
              </div>
              <p className="text-muted-foreground text-[11.5px] leading-relaxed">
                Saving updates the logo across desktop navbar, mobile drawer, email templates, invoices, and footer brand narratives immediately.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
