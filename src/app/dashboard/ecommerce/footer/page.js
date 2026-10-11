'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input';
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Columns,
  Mail,
  Building,
  Share2,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Globe,
  ExternalLink,
  Eye,
  RotateCcw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SocialIcon, { SOCIAL_PLATFORMS_CATALOG } from '@/components/storefront/SocialIcons';

const RichEditor = dynamic(() => import('@/components/dashboard/RichEditor'), { ssr: false });

export default function AdminFooterPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState('about');

  const [footer, setFooter] = useState(null);

  // Modals
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [columnForm, setColumnForm] = useState({ title: '', isVisible: true });

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [currentColumnId, setCurrentColumnId] = useState(null);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [linkForm, setLinkForm] = useState({ label: '', url: '', badge: '', isExternal: false });

  // Compliance Links Modal State
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [editingComplianceIndex, setEditingComplianceIndex] = useState(null);
  const [complianceForm, setComplianceForm] = useState({ label: '', url: '' });

  // Confirm delete modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, colId: null });

  const addToast = (message, type = 'success') => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  useEffect(() => {
    fetchFooterConfig();
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoadingSubscribers(true);
      const res = await fetch('/api/store-newsletter', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.subscribers) {
        setSubscribers(data.subscribers);
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const fetchFooterConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/store-footer', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.footer) {
        setFooter(data.footer);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to fetch footer configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/store-footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(footer)
      });
      const data = await res.json();
      if (data.success) {
        setFooter(data.footer);
        addToast('Footer configuration updated successfully! 🎉');
      } else {
        addToast(data.message || 'Failed to update footer', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while saving footer', 'error');
    } finally {
      setSaving(false);
    }
  };

  // About Section Handlers
  const handleAboutChange = (field, val) => {
    setFooter((prev) => ({
      ...prev,
      aboutSection: {
        ...prev.aboutSection,
        [field]: val
      }
    }));
  };

  const handleStatChange = (idx, field, val) => {
    const newStats = [...(footer.aboutSection?.stats || [])];
    newStats[idx] = { ...newStats[idx], [field]: val };
    handleAboutChange('stats', newStats);
  };

  // Column Handlers
  const openAddColumn = () => {
    setEditingColumn(null);
    setColumnForm({ title: '', isVisible: true });
    setColumnModalOpen(true);
  };

  const openEditColumn = (col) => {
    setEditingColumn(col);
    setColumnForm({ title: col.title, isVisible: col.isVisible });
    setColumnModalOpen(true);
  };

  const saveColumn = () => {
    if (!columnForm.title.trim()) {
      addToast('Column Title is required', 'error');
      return;
    }

    const currentCols = [...(footer.columns || [])];
    if (editingColumn) {
      const idx = currentCols.findIndex((c) => c.id === editingColumn.id);
      if (idx !== -1) {
        currentCols[idx] = { ...currentCols[idx], title: columnForm.title, isVisible: columnForm.isVisible };
      }
    } else {
      currentCols.push({
        id: 'col_' + Date.now(),
        title: columnForm.title,
        isVisible: columnForm.isVisible,
        links: []
      });
    }

    setFooter((prev) => ({ ...prev, columns: currentCols }));
    setColumnModalOpen(false);
  };

  const handleDeleteColumnConfirm = () => {
    if (confirmModal.colId) {
      const newCols = (footer.columns || []).filter((c) => c.id !== confirmModal.colId);
      setFooter((prev) => ({ ...prev, columns: newCols }));
      setConfirmModal({ isOpen: false, colId: null });
      addToast('Footer column deleted', 'info');
    }
  };

  const deleteColumn = (colId) => {
    setConfirmModal({ isOpen: true, colId });
  };

  const moveColumn = (index, dir) => {
    const cols = [...(footer.columns || [])];
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= cols.length) return;
    const temp = cols[index];
    cols[index] = cols[targetIdx];
    cols[targetIdx] = temp;
    setFooter((prev) => ({ ...prev, columns: cols }));
  };

  // Link Handlers
  const openAddLink = (colId) => {
    setCurrentColumnId(colId);
    setEditingLinkIndex(null);
    setLinkForm({ label: '', url: '', badge: '', isExternal: false });
    setLinkModalOpen(true);
  };

  const openEditLink = (colId, linkIndex, link) => {
    setCurrentColumnId(colId);
    setEditingLinkIndex(linkIndex);
    setLinkForm({ ...link });
    setLinkModalOpen(true);
  };

  const saveLink = () => {
    if (!linkForm.label.trim() || !linkForm.url.trim()) {
      addToast('Link Label and URL are required', 'error');
      return;
    }

    const cols = [...(footer.columns || [])];
    const colIdx = cols.findIndex((c) => c.id === currentColumnId);
    if (colIdx === -1) return;

    const colLinks = [...(cols[colIdx].links || [])];
    if (editingLinkIndex !== null) {
      colLinks[editingLinkIndex] = { ...linkForm };
    } else {
      colLinks.push({ ...linkForm });
    }

    cols[colIdx] = { ...cols[colIdx], links: colLinks };
    setFooter((prev) => ({ ...prev, columns: cols }));
    setLinkModalOpen(false);
  };

  const deleteLink = (colId, linkIndex) => {
    const cols = [...(footer.columns || [])];
    const colIdx = cols.findIndex((c) => c.id === colId);
    if (colIdx === -1) return;

    const colLinks = (cols[colIdx].links || []).filter((_, idx) => idx !== linkIndex);
    cols[colIdx] = { ...cols[colIdx], links: colLinks };
    setFooter((prev) => ({ ...prev, columns: cols }));
  };

  // Social Links Handlers
  const [customSocialModalOpen, setCustomSocialModalOpen] = useState(false);
  const [customSocialForm, setCustomSocialForm] = useState({ platform: '', url: '', isActive: true });

  const addSocialPreset = (preset) => {
    const current = [...(footer.bottomBar?.socialLinks || [])];
    const exists = current.find((s) => (s.platform || '').trim().toLowerCase() === preset.label.toLowerCase());
    if (exists) {
      addToast(`${preset.label} is already added!`, 'info');
      return;
    }
    current.push({
      platform: preset.label,
      icon: preset.id,
      url: preset.defaultUrl,
      isActive: true
    });
    setFooter((prev) => ({ ...prev, bottomBar: { ...prev.bottomBar, socialLinks: current } }));
    addToast(`Added ${preset.label}! Remember to click "Save Footer Configuration".`);
  };

  const saveCustomSocial = () => {
    if (!customSocialForm.platform.trim() || !customSocialForm.url.trim()) {
      addToast('Platform name and URL are required', 'error');
      return;
    }
    const current = [...(footer.bottomBar?.socialLinks || [])];
    current.push({
      platform: customSocialForm.platform.trim(),
      icon: customSocialForm.platform.trim().toLowerCase(),
      url: customSocialForm.url.trim(),
      isActive: customSocialForm.isActive
    });
    setFooter((prev) => ({ ...prev, bottomBar: { ...prev.bottomBar, socialLinks: current } }));
    setCustomSocialForm({ platform: '', url: '', isActive: true });
    setCustomSocialModalOpen(false);
    addToast('Custom social platform added!');
  };

  const removeSocialLink = (idx) => {
    const current = [...(footer.bottomBar?.socialLinks || [])];
    current.splice(idx, 1);
    setFooter((prev) => ({ ...prev, bottomBar: { ...prev.bottomBar, socialLinks: current } }));
  };

  const moveSocialLink = (idx, dir) => {
    const current = [...(footer.bottomBar?.socialLinks || [])];
    const target = idx + dir;
    if (target < 0 || target >= current.length) return;
    const temp = current[idx];
    current[idx] = current[target];
    current[target] = temp;
    setFooter((prev) => ({ ...prev, bottomBar: { ...prev.bottomBar, socialLinks: current } }));
  };

  // Compliance Links Handlers
  const openAddComplianceModal = () => {
    setEditingComplianceIndex(null);
    setComplianceForm({ label: '', url: '' });
    setComplianceModalOpen(true);
  };

  const openEditComplianceModal = (idx) => {
    const link = footer.corporate?.complianceLinks?.[idx];
    if (!link) return;
    setEditingComplianceIndex(idx);
    setComplianceForm({ label: link.label || '', url: link.url || '' });
    setComplianceModalOpen(true);
  };

  const saveComplianceLink = () => {
    if (!complianceForm.label.trim() || !complianceForm.url.trim()) {
      addToast('Link label and URL are required', 'error');
      return;
    }
    const current = [...(footer.corporate?.complianceLinks || [])];
    if (editingComplianceIndex !== null) {
      current[editingComplianceIndex] = {
        label: complianceForm.label.trim(),
        url: complianceForm.url.trim()
      };
      addToast('Compliance link updated! Click "Save Footer Configuration" to persist.');
    } else {
      current.push({
        label: complianceForm.label.trim(),
        url: complianceForm.url.trim()
      });
      addToast('Compliance link added! Click "Save Footer Configuration" to persist.');
    }
    setFooter((prev) => ({
      ...prev,
      corporate: {
        ...prev.corporate,
        complianceLinks: current
      }
    }));
    setComplianceModalOpen(false);
  };

  const deleteComplianceLink = (idx) => {
    const current = [...(footer.corporate?.complianceLinks || [])];
    current.splice(idx, 1);
    setFooter((prev) => ({
      ...prev,
      corporate: {
        ...prev.corporate,
        complianceLinks: current
      }
    }));
    addToast('Compliance link removed!');
  };

  const moveComplianceLink = (idx, dir) => {
    const current = [...(footer.corporate?.complianceLinks || [])];
    const target = idx + dir;
    if (target < 0 || target >= current.length) return;
    const temp = current[idx];
    current[idx] = current[target];
    current[target] = temp;
    setFooter((prev) => ({
      ...prev,
      corporate: {
        ...prev.corporate,
        complianceLinks: current
      }
    }));
  };

  if (loading || !footer) {
    return (
      <div className="p-6">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'E-Commerce', href: '/dashboard/ecommerce' }, { label: 'Footer CMS' }]} />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Loading Footer CMS...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'E-Commerce', href: '/dashboard/ecommerce' },
          { label: 'Footer & Brand Story CMS' }
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Columns className="text-primary" size={24} /> Storefront Footer & Brand Story
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your storefront footer SEO narrative, CKEditor story, directory columns, newsletter, and compliance info.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={fetchFooterConfig}
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <RotateCcw size={14} /> Discard Changes
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 text-xs font-bold px-5 shadow-xs"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            Save Footer Configuration
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'about', label: '1. Brand Story (CKEditor)', icon: Sparkles },
          { id: 'columns', label: '2. Directory Columns & Links', icon: Columns },
          { id: 'newsletter', label: '3. Newsletter & Subscribers', icon: Mail },
          { id: 'corporate', label: '4. Corporate & Compliance', icon: Building },
          { id: 'social', label: '5. Social & Payment Badges', icon: Share2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Brand Story & SEO Narrative (CKEditor) ── */}
      {activeTab === 'about' && (
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" /> SEO Narrative & Brand Story Section
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Displays the expandable brand narrative with keywords at the top of the footer.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Visible on Store</span>
              <Switch
                checked={footer.aboutSection?.isVisible ?? true}
                onCheckedChange={(checked) => handleAboutChange('isVisible', checked)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Badge Text
                </label>
                <FloatingInput
                  placeholder="e.g. India's No. 1 Luxury Gifting Destination"
                  value={footer.aboutSection?.badge || ''}
                  onChange={(e) => handleAboutChange('badge', e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                  Main Headline
                </label>
                <FloatingInput
                  placeholder="e.g. City Shop: India's Premier Online Gift, Flower & Luxury Hamper Boutique"
                  value={footer.aboutSection?.title || ''}
                  onChange={(e) => handleAboutChange('title', e.target.value)}
                />
              </div>
            </div>

            {/* CKEditor / Rich Text for About Narrative */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-2">
                Brand Narrative Story Content (CKEditor Rich Text)
              </label>
              <div className="border border-border rounded-xl overflow-hidden min-h-[260px] bg-card">
                <RichEditor
                  value={footer.aboutSection?.content || ''}
                  onChange={(html) => handleAboutChange('content', html)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                💡 Tip: You can insert internal links to categories and search keywords directly in the editor for maximum SEO impact.
              </p>
            </div>

            {/* 4 Stats Counters */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">
                4 Live Brand Metrics & Stats
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(footer.aboutSection?.stats || []).map((stat, idx) => (
                  <div key={idx} className="p-3.5 bg-muted/30 rounded-xl border border-border space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Stat #{idx + 1} Number / Value</span>
                      <FloatingInput
                        placeholder="e.g. 19,000+"
                        value={stat.num}
                        onChange={(e) => handleStatChange(idx, 'num', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Label</span>
                      <FloatingInput
                        placeholder="e.g. PIN Codes Served"
                        value={stat.label}
                        onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: Footer Columns & Links Management ── */}
      {activeTab === 'columns' && (
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Columns size={18} className="text-primary" /> Multi-Column Directory Matrix
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add, re-order, and manage footer columns and individual child links.
              </p>
            </div>
            <Button
              type="button"
              onClick={openAddColumn}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} /> Add New Column
            </Button>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(footer.columns || []).map((col, colIdx) => (
                <div
                  key={col.id || colIdx}
                  className="bg-muted/30 border border-border rounded-2xl p-4 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center">
                          {colIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {col.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={colIdx === 0}
                          onClick={() => moveColumn(colIdx, -1)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move Left"
                        >
                          <ArrowUp size={13} className="rotate-[-90deg]" />
                        </button>
                        <button
                          type="button"
                          disabled={colIdx === (footer.columns?.length || 1) - 1}
                          onClick={() => moveColumn(colIdx, 1)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move Right"
                        >
                          <ArrowDown size={13} className="rotate-[-90deg]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditColumn(col)}
                          className="p-1 rounded hover:bg-primary/10 text-primary"
                          title="Edit Column"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteColumn(col.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-destructive"
                          title="Delete Column"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Links List */}
                    <div className="mt-3 space-y-1.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                      {(col.links || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 text-center italic">No links in this column.</p>
                      ) : (
                        col.links.map((link, linkIdx) => (
                          <div
                            key={linkIdx}
                            className="group flex items-center justify-between p-2.5 bg-background rounded-xl border border-border hover:border-primary/40 transition-all text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-semibold text-foreground truncate">
                                {link.label}
                              </span>
                              {link.badge && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-bold">
                                  {link.badge}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground truncate">({link.url})</span>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditLink(col.id, linkIdx, link)}
                                className="p-1 rounded text-muted-foreground hover:text-primary"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteLink(col.id, linkIdx)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openAddLink(col.id)}
                    className="w-full text-xs font-semibold flex items-center justify-center gap-1 border-dashed"
                  >
                    <Plus size={13} /> Add Link to {col.title}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 3: Newsletter & Subscribers ── */}
      {activeTab === 'newsletter' && (
        <div className="space-y-6">
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Mail size={18} className="text-primary" /> Newsletter Subscribe & Lead Capture
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure the VIP newsletter lead capture column displayed symmetrically in your storefront footer.
                </p>
              </div>
              <Switch
                checked={footer.newsletter?.isVisible ?? true}
                onCheckedChange={(checked) =>
                  setFooter((p) => ({ ...p, newsletter: { ...p.newsletter, isVisible: checked } }))
                }
              />
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                    Newsletter Title
                  </label>
                  <FloatingInput
                    placeholder="e.g. Subscribe & Save"
                    value={footer.newsletter?.title || ''}
                    onChange={(e) =>
                      setFooter((p) => ({ ...p, newsletter: { ...p.newsletter, title: e.target.value } }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                    Instant Discount Code
                  </label>
                  <FloatingInput
                    placeholder="e.g. WELCOME150"
                    value={footer.newsletter?.discountCode || ''}
                    onChange={(e) =>
                      setFooter((p) => ({ ...p, newsletter: { ...p.newsletter, discountCode: e.target.value } }))
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                    Subtitle / Offer Prompt
                  </label>
                  <FloatingInput
                    placeholder="e.g. Get instant ₹150 OFF on your first order, plus secret deals..."
                    value={footer.newsletter?.subtitle || ''}
                    onChange={(e) =>
                      setFooter((p) => ({ ...p, newsletter: { ...p.newsletter, subtitle: e.target.value } }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscribers Table Card */}
          <Card className="border border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" /> Newsletter Subscribers ({subscribers.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customers who joined your VIP gifting & newsletter club via the storefront footer.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSubscribers}
                disabled={loadingSubscribers}
                className="text-xs"
              >
                <RotateCcw size={13} className={`mr-1.5 ${loadingSubscribers ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {subscribers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  No subscribers yet. Once customers enter their email in the footer, they will appear here.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto no-scrollbar">
                  <table className="w-full text-xs text-left text-foreground">
                    <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold tracking-wider sticky top-0 border-b border-border">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Voucher Issued</th>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Subscribed On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {subscribers.map((sub, i) => (
                        <tr key={sub._id || i} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-2.5 font-semibold text-foreground">{sub.email}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant="warning" className="font-mono text-[11px]">
                              {sub.discountCode || 'WELCOME150'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground capitalize">{sub.source || 'Storefront'}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 4: Corporate & Compliance ── */}
      {activeTab === 'corporate' && (
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Building size={18} className="text-primary" /> Corporate & Statutory Compliance
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Statutory disclosures including CIN, registered address, and grievance resolution officer.
              </p>
            </div>
            <Switch
              checked={footer.corporate?.isVisible ?? true}
              onCheckedChange={(checked) =>
                setFooter((p) => ({ ...p, corporate: { ...p.corporate, isVisible: checked } }))
              }
            />
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                  Registered Company Name
                </label>
                <FloatingInput
                  placeholder="e.g. City Shop E-Retail Private Limited"
                  value={footer.corporate?.companyName || ''}
                  onChange={(e) =>
                    setFooter((p) => ({ ...p, corporate: { ...p.corporate, companyName: e.target.value } }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                  Corporate Identification Number (CIN)
                </label>
                <FloatingInput
                  placeholder="e.g. U52100HR2021PTC118882"
                  value={footer.corporate?.cin || ''}
                  onChange={(e) =>
                    setFooter((p) => ({ ...p, corporate: { ...p.corporate, cin: e.target.value } }))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                  Registered Office Address
                </label>
                <FloatingInput
                  placeholder="e.g. Plot No. 75P, Sector-44, Gurugram, Haryana, India - 122003"
                  value={footer.corporate?.regOffice || ''}
                  onChange={(e) =>
                    setFooter((p) => ({ ...p, corporate: { ...p.corporate, regOffice: e.target.value } }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                  Grievance Officer Info
                </label>
                <FloatingInput
                  placeholder="e.g. Mr. S. Karmakar (grievance@cityshop.com)"
                  value={footer.corporate?.grievanceOfficer || ''}
                  onChange={(e) =>
                    setFooter((p) => ({ ...p, corporate: { ...p.corporate, grievanceOfficer: e.target.value } }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                  Helpline Number(s)
                </label>
                <FloatingInput
                  placeholder="e.g. +91 11-26802680 / 9755-248-248"
                  value={footer.corporate?.helpline || ''}
                  onChange={(e) =>
                    setFooter((p) => ({ ...p, corporate: { ...p.corporate, helpline: e.target.value } }))
                  }
                />
              </div>
            </div>

            {/* Compliance & Policy Links Strip */}
            <div className="pt-5 border-t border-border space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Globe size={14} className="text-primary" /> Compliance & Statutory Policy Links ({footer.corporate?.complianceLinks?.length || 0})
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    These links appear in the bottom corporate strip of the storefront footer (e.g. Statutory Disclosures, CSR Policy, Investor Relations).
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openAddComplianceModal}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Plus size={13} /> Add Policy Link
                </Button>
              </div>

              {/* Notice linking to Custom Pages CMS */}
              <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs text-foreground flex items-start gap-2.5">
                <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Manage Full Page Content in Custom Pages CMS</p>
                  <p className="text-[11px] text-muted-foreground">
                    To write and edit the actual articles, disclosures, or rich text for any policy page, go to <a href="/dashboard/custom-pages" className="font-bold underline text-primary hover:opacity-80">Sidebar &rarr; Custom Pages</a>. Simply ensure the slug matches the URL path set here (e.g. <code className="bg-muted px-1 py-0.5 rounded text-[10px]">/csr-policy</code>, <code className="bg-muted px-1 py-0.5 rounded text-[10px]">/security</code>).
                  </p>
                </div>
              </div>

              {/* Links Grid */}
              {(!footer.corporate?.complianceLinks || footer.corporate.complianceLinks.length === 0) ? (
                <div className="p-6 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
                  No compliance links added yet. Click &quot;Add Policy Link&quot; to add links.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {footer.corporate.complianceLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-2 shadow-xs group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {link.label}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">
                          {link.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => moveComplianceLink(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move Left"
                        >
                          <ArrowUp size={12} className="-rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveComplianceLink(idx, 1)}
                          disabled={idx === footer.corporate.complianceLinks.length - 1}
                          className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Move Right"
                        >
                          <ArrowDown size={12} className="-rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditComplianceModal(idx)}
                          className="p-1 rounded text-primary hover:bg-primary/10"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteComplianceLink(idx)}
                          className="p-1 rounded text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 5: Social Profiles & Bottom Bar ── */}
      {activeTab === 'social' && (
        <Card className="border border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Share2 size={18} className="text-primary" /> Social Profiles & Storefront Bottom Bar
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your official brand social accounts with SVG icons, URLs, ordering, and copyright notice.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomSocialModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus size={14} /> Add Custom Channel
            </Button>
          </CardHeader>

          <CardContent className="p-6 space-y-6">

            {/* Live Storefront Preview */}
            <div className="p-4 rounded-xl bg-muted/40 text-foreground border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Eye size={13} className="text-primary" /> Live Footer Bottom Bar Preview
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {((footer.bottomBar?.socialLinks || []).filter(s => s.isActive !== false)).length} active channels
                </span>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {(footer.bottomBar?.socialLinks || [])
                    .filter(s => s.isActive !== false)
                    .map((social, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full bg-muted/80 hover:bg-primary hover:text-primary-foreground text-foreground flex items-center justify-center transition-all cursor-pointer shadow-xs"
                        title={`${social.platform}: ${social.url}`}
                      >
                        <SocialIcon platform={social.platform || social.icon} size={15} />
                      </div>
                    ))}
                  {((footer.bottomBar?.socialLinks || []).filter(s => s.isActive !== false)).length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No active social media channels enabled.</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {footer.bottomBar?.copyright || '© 2026 City Shop E-Retail Pvt. Ltd. All rights reserved.'}
                </div>
              </div>
            </div>

            {/* Quick Add Supported Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                Quick-Add Supported Channels (1-Click)
              </label>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS_CATALOG.map((preset) => {
                  const isAdded = (footer.bottomBar?.socialLinks || []).some(
                    (s) => (s.platform || '').trim().toLowerCase() === preset.label.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={isAdded}
                      onClick={() => addSocialPreset(preset)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isAdded
                          ? 'bg-muted text-muted-foreground/50 cursor-not-allowed border border-border'
                          : 'bg-card hover:bg-muted text-foreground border border-border hover:border-primary/40 shadow-xs'
                      }`}
                    >
                      <SocialIcon platform={preset.id} size={13} />
                      <span>{preset.label}</span>
                      {isAdded ? (
                        <CheckCircle2 size={12} className="text-emerald-500 ml-0.5" />
                      ) : (
                        <Plus size={12} className="text-muted-foreground ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Social Channels Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Configured Social Links ({(footer.bottomBar?.socialLinks || []).length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {(footer.bottomBar?.socialLinks || []).map((social, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      social.isActive !== false
                        ? 'bg-muted/30 border-border shadow-xs'
                        : 'bg-muted/10 border-border/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0 text-foreground">
                          <SocialIcon platform={social.platform || social.icon} size={16} />
                        </div>
                        <input
                          type="text"
                          value={social.platform || ''}
                          onChange={(e) => {
                            const links = [...(footer.bottomBar?.socialLinks || [])];
                            links[idx] = { ...links[idx], platform: e.target.value };
                            setFooter((p) => ({ ...p, bottomBar: { ...p.bottomBar, socialLinks: links } }));
                          }}
                          placeholder="Platform Name"
                          className="text-xs font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 truncate"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Switch
                          checked={social.isActive !== false}
                          onCheckedChange={(checked) => {
                            const links = [...(footer.bottomBar?.socialLinks || [])];
                            links[idx] = { ...links[idx], isActive: checked };
                            setFooter((p) => ({ ...p, bottomBar: { ...p.bottomBar, socialLinks: links } }));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => moveSocialLink(idx, -1)}
                          disabled={idx === 0}
                          title="Move Left"
                          className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp size={13} className="-rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSocialLink(idx, 1)}
                          disabled={idx === (footer.bottomBar?.socialLinks || []).length - 1}
                          title="Move Right"
                          className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown size={13} className="-rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSocialLink(idx)}
                          title="Delete Social Channel"
                          className="p-1 rounded text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="relative flex items-center">
                      <FloatingInput
                        placeholder="e.g. https://instagram.com/yourhandle"
                        value={social.url || ''}
                        onChange={(e) => {
                          const links = [...(footer.bottomBar?.socialLinks || [])];
                          links[idx] = { ...links[idx], url: e.target.value };
                          setFooter((p) => ({ ...p, bottomBar: { ...p.bottomBar, socialLinks: links } }));
                        }}
                      />
                      {social.url && (
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Link"
                          className="absolute right-2.5 text-muted-foreground hover:text-foreground p-1"
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {(footer.bottomBar?.socialLinks || []).length === 0 && (
                  <div className="col-span-full p-8 text-center border-2 border-dashed border-border rounded-xl">
                    <Share2 size={28} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs font-semibold text-foreground">
                      No social media links added yet.
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Click any of the quick-add buttons above to add your official social media channels.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Copyright Statement */}
            <div className="pt-4 border-t border-border">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
                Copyright Notice Statement
              </label>
              <FloatingInput
                placeholder="e.g. © 1994–2026 City Shop E-Retail Pvt. Ltd. All rights reserved."
                value={footer.bottomBar?.copyright || ''}
                onChange={(e) =>
                  setFooter((p) => ({ ...p, bottomBar: { ...p.bottomBar, copyright: e.target.value } }))
                }
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Displayed next to social media icons on desktop and centered on mobile devices.
              </p>
            </div>

          </CardContent>
        </Card>
      )}

      {/* Column Modal */}
      <Dialog open={columnModalOpen} onOpenChange={setColumnModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {editingColumn ? 'Edit Column' : 'Add New Column'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                Column Title
              </label>
              <FloatingInput
                placeholder="e.g. Quick Links, Corporate Services"
                value={columnForm.title}
                onChange={(e) => setColumnForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-foreground">Active & Visible</span>
              <Switch
                checked={columnForm.isVisible}
                onCheckedChange={(checked) => setColumnForm((p) => ({ ...p, isVisible: checked }))}
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border pt-3">
            <Button variant="outline" onClick={() => setColumnModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveColumn} className="bg-primary text-primary-foreground">
              Save Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {editingLinkIndex !== null ? 'Edit Link' : 'Add Link'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                Link Label
              </label>
              <FloatingInput
                placeholder="e.g. Terms & Conditions"
                value={linkForm.label}
                onChange={(e) => setLinkForm((p) => ({ ...p, label: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                URL / Route Path
              </label>
              <FloatingInput
                placeholder="e.g. /terms or https://..."
                value={linkForm.url}
                onChange={(e) => setLinkForm((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                Badge Tag (Optional)
              </label>
              <FloatingInput
                placeholder="e.g. HOT, NEW, HIRING"
                value={linkForm.badge}
                onChange={(e) => setLinkForm((p) => ({ ...p, badge: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-foreground">Open in New Tab</span>
              <Switch
                checked={linkForm.isExternal}
                onCheckedChange={(checked) => setLinkForm((p) => ({ ...p, isExternal: checked }))}
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border pt-3">
            <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveLink} className="bg-primary text-primary-foreground">
              Save Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Social Platform Modal */}
      <Dialog open={customSocialModalOpen} onOpenChange={setCustomSocialModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Share2 size={16} className="text-primary" /> Add Custom Social Channel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                Platform Name
              </label>
              <FloatingInput
                placeholder="e.g. Discord, Telegram, Bluesky"
                value={customSocialForm.platform}
                onChange={(e) => setCustomSocialForm((p) => ({ ...p, platform: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                Channel / Profile URL
              </label>
              <FloatingInput
                placeholder="https://..."
                value={customSocialForm.url}
                onChange={(e) => setCustomSocialForm((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-foreground">Active & Visible on Storefront</span>
              <Switch
                checked={customSocialForm.isActive}
                onCheckedChange={(checked) => setCustomSocialForm((p) => ({ ...p, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border pt-3">
            <Button variant="outline" onClick={() => setCustomSocialModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCustomSocial} className="bg-primary text-primary-foreground">
              Add Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compliance & Policy Link Modal */}
      <Dialog open={complianceModalOpen} onOpenChange={setComplianceModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe size={16} className="text-primary" /> {editingComplianceIndex !== null ? 'Edit Compliance Link' : 'Add Compliance Link'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                Link Label
              </label>
              <FloatingInput
                placeholder="e.g. CSR Policy, Whistleblower Policy, Statutory Disclosures"
                value={complianceForm.label}
                onChange={(e) => setComplianceForm((p) => ({ ...p, label: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                URL / Route Path
              </label>
              <FloatingInput
                placeholder="e.g. /csr-policy, /security, /contact, or https://..."
                value={complianceForm.url}
                onChange={(e) => setComplianceForm((p) => ({ ...p, url: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Tip: Create full rich articles and pages for internal routes under <strong>Dashboard &rarr; Custom Pages</strong>.
              </p>
            </div>
          </div>
          <DialogFooter className="border-t border-border pt-3">
            <Button variant="outline" onClick={() => setComplianceModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveComplianceLink} className="bg-primary text-primary-foreground">
              {editingComplianceIndex !== null ? 'Update Link' : 'Add Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, colId: null })}
        onConfirm={handleDeleteColumnConfirm}
        title="Delete Footer Column"
        message="Are you sure you want to delete this footer column and all its links? This action cannot be undone."
      />

      <Toast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}
