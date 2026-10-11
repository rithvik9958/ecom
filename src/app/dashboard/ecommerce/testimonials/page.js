'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import Toast from '@/components/dashboard/Toast';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input';
import CustomSelect from '@/components/ui/CustomSelect';
import FloatingCustomSelect from '@/components/ui/FloatingCustomSelect';
import {
  Star,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Save,
  MessageSquare,
  ShieldCheck,
  Award,
  Search,
  CheckCircle2,
  MapPin,
  ShoppingBag,
  Sparkles,
  User,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const TABS = [
  { id: 'list', label: 'All Testimonials & Reviews', icon: MessageSquare },
  { id: 'hero_metrics', label: 'Page Header & Trust Metrics', icon: Award },
  { id: 'seo', label: 'SEO & Metadata', icon: Search }
];

const DEFAULT_CONFIG = {
  hero: {
    title: 'Over 8 Million+ Celebrations Delivered',
    subtitle:
      'Read authentic, heartfelt experiences from delighted customers across 19,000+ PIN codes who trust City Shop for their most cherished moments.',
    bannerImage: ''
  },
  metrics: {
    overallScore: '4.9',
    scoreSubtext: 'Based on 12,450+ Verified Orders',
    metric1Value: '99.4%',
    metric1Label: 'On-Time Delivery Rate',
    metric2Value: '100%',
    metric2Label: 'Freshness & Quality Guarantee',
    allowSubmissions: true
  },
  seo: {
    metaTitle: 'Customer Reviews & Real Gifting Stories | City Shop',
    metaDescription: 'Read 100% verified reviews and experiences from thousands of happy customers across India.',
    metaKeywords: 'customer reviews, flower delivery reviews, cake delivery reviews'
  }
};

export default function AdminTestimonialsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [toasts, setToasts] = useState([]);

  const [testimonials, setTestimonials] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [categories, setCategories] = useState([]);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Deletion States
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    rating: 5,
    category: 'Flowers',
    item: '',
    text: '',
    likes: 0,
    isVerified: true,
    isApproved: true
  });

  const addToast = (msg, type = 'success') =>
    setToasts((t) => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/testimonials', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setTestimonials(data.testimonials || []);
        if (data.config) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
            hero: { ...prev.hero, ...(data.config.hero || {}) },
            metrics: { ...prev.metrics, ...(data.config.metrics || {}) },
            seo: { ...prev.seo, ...(data.config.seo || {}) }
          }));
        }
        if (data.categories) {
          setCategories(data.categories);
        }
      } else {
        addToast(data.message || 'Failed to load testimonials', 'danger');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error loading testimonials', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Save Page Settings
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_settings', config })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Testimonials page configuration saved successfully!');
      } else {
        addToast(data.message || 'Failed to save configuration', 'danger');
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving settings', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Live Approval Status
  const handleToggleApproved = async (id, currentVal) => {
    const newVal = !currentVal;
    try {
      setTogglingId(id);
      const res = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: newVal })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update status');
      } else {
        setTestimonials((prev) =>
          prev.map((t) => (t._id === id ? { ...t, isApproved: newVal } : t))
        );
        addToast(newVal ? 'Testimonial is now live on storefront' : 'Testimonial hidden from storefront');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error updating status', 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  // Toggle Verified Buyer Status
  const handleToggleVerified = async (id, currentVal) => {
    const newVal = !currentVal;
    setTestimonials((prev) =>
      prev.map((t) => (t._id === id ? { ...t, isVerified: newVal } : t))
    );
    try {
      await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isVerified: newVal })
      });
      addToast(`Verified buyer status ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      city: '',
      rating: 5,
      category: categories[0]?.label || categories[0]?.id || 'Flowers',
      item: '',
      text: '',
      likes: 0,
      isVerified: true,
      isApproved: true
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      city: item.city || '',
      rating: item.rating || 5,
      category: item.category || 'Flowers',
      item: item.item || '',
      text: item.text || '',
      likes: item.likes || 0,
      isVerified: item.isVerified !== false,
      isApproved: item.isApproved !== false
    });
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim() || !formData.text.trim()) {
      addToast('Please complete all required fields', 'danger');
      return;
    }

    try {
      if (editingItem) {
        const res = await fetch('/api/admin/testimonials', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem._id, ...formData })
        });
        const data = await res.json();
        if (data.success && data.testimonial) {
          setTestimonials((prev) =>
            prev.map((t) => (t._id === editingItem._id ? data.testimonial : t))
          );
          setIsModalOpen(false);
          addToast('Testimonial updated successfully');
        } else {
          addToast(data.message || 'Failed to update testimonial', 'danger');
        }
      } else {
        const res = await fetch('/api/admin/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (data.success && data.testimonial) {
          setTestimonials([data.testimonial, ...testimonials]);
          setIsModalOpen(false);
          addToast('New testimonial published successfully');
        } else {
          addToast(data.message || 'Failed to create testimonial', 'danger');
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving testimonial', 'danger');
    }
  };

  // Delete Single Testimonial
  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/testimonials?id=${confirmDeleteId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setTestimonials((prev) => prev.filter((t) => t._id !== confirmDeleteId));
        addToast('Testimonial deleted successfully', 'warning');
      } else {
        addToast(data.message || 'Failed to delete testimonial', 'danger');
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting testimonial', 'danger');
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async (selectedIds) => {
    setBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' })
        )
      );
      setTestimonials((prev) => prev.filter((t) => !selectedIds.includes(t._id)));
      addToast(`${selectedIds.length} testimonials deleted`, 'warning');
    } catch (e) {
      addToast('Error during bulk delete', 'danger');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Filtered List
  const filteredData = useMemo(() => {
    return testimonials.filter((t) => {
      if (statusFilter === 'approved' && !t.isApproved) return false;
      if (statusFilter === 'pending' && t.isApproved) return false;

      if (selectedCategory !== 'all') {
        const cat = (t.category || '').toLowerCase();
        if (cat !== selectedCategory.toLowerCase()) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          (t.name || '').toLowerCase().includes(q) ||
          (t.city || '').toLowerCase().includes(q) ||
          (t.text || '').toLowerCase().includes(q) ||
          (t.item || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [testimonials, statusFilter, selectedCategory, search]);

  // Symmetrical DataTable Columns matching Dashboard Standard
  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
            {(row.name || 'CS').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-foreground">{row.name}</span>
              {row.isVerified && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                  Verified
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-muted-foreground/70" /> {row.city}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (row) => (
        <div className="flex items-center gap-0.5">
          {[...Array(row.rating || 5)].map((_, i) => (
            <Star key={i} size={14} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
          ))}
          <span className="text-xs font-bold text-muted-foreground ml-1.5">({row.rating})</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <Badge variant="outline" className="font-semibold text-xs bg-muted/40">
          {row.category || 'General'}
        </Badge>
      )
    },
    {
      key: 'review',
      label: 'Story / Review',
      render: (row) => (
        <div className="flex flex-col max-w-md">
          <p className="text-xs text-foreground/90 line-clamp-2 italic">
            “{row.text}”
          </p>
          {row.item && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
              <ShoppingBag size={10} className="text-amber-500 shrink-0" />
              <span>{row.item}</span>
            </span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusSwitch
          checked={row.isApproved}
          loading={togglingId === row._id}
          onCheckedChange={() => handleToggleApproved(row._id, row.isApproved)}
          label={row.isApproved ? 'Live' : 'Hidden'}
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Testimonial"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(row._id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Delete Testimonial"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleReorder = (reorderedList) => {
    setTestimonials(reorderedList);
    addToast('Testimonials order updated');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Toast toasts={toasts} removeToast={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Symmetrical Breadcrumb Standard */}
      <Breadcrumb
        title="Customer Testimonials"
        subtitle={`Manage verified customer reviews, ratings, trust metrics, and hero banner (${testimonials.length} total)`}
        crumbs={[{ label: 'Storefront Management' }, { label: 'Customer Testimonials' }]}
      />

      {/* Navigation Tabs (Symmetric with About Page & CMS) */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.id === 'list' && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'}`}>
                  {testimonials.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: ALL TESTIMONIALS (DataTable Standard) ── */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            onAdd={handleOpenCreate}
            addLabel="Add Testimonial"
            hideSort={true}
            extraActions={
              <Link
                href="/testimonials"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full border border-border text-xs font-semibold hover:bg-muted text-foreground transition"
              >
                <ExternalLink size={14} />
                <span>View Live Page</span>
              </Link>
            }
            extraFilters={
              <div className="flex items-center gap-2">
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  size="sm"
                  fullWidth={false}
                  className="min-w-[150px]"
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'approved', label: 'Live & Approved' },
                    { value: 'pending', label: 'Pending Moderation' },
                  ]}
                />
                <CustomSelect
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  size="sm"
                  fullWidth={false}
                  className="min-w-[150px]"
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...categories.map((c) => ({ value: c.label || c.id, label: c.label || c.id }))
                  ]}
                />
              </div>
            }
          />

          <DataTable
            columns={columns}
            data={filteredData}
            loading={loading}
            actions={false}
            onBulkDelete={handleBulkDelete}
            isBulkDeleting={bulkDeleting}
            onReorder={handleReorder}
          />
        </div>
      )}

      {/* ── TAB 2: PAGE HEADER & TRUST METRICS SETTINGS ── */}
      {activeTab === 'hero_metrics' && (
        <div className="space-y-6 max-w-4xl">
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  Hero Header Banner Settings
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customize the headline and intro story on the customer reviews page.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <FloatingInput
                label="Headline Title"
                value={config.hero.title}
                onChange={(e) =>
                  setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })
                }
              />
              <FloatingTextarea
                rows={3}
                label="Introductory Subtitle Narrative"
                value={config.hero.subtitle}
                onChange={(e) =>
                  setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })
                }
              />
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Award size={16} className="text-blue-500" />
                  Ratings Spotlight & Trust Guarantee Strip
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure the overall verified score card and the 2 key delivery trust metrics.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="Overall Rating Score (e.g. 4.9)"
                  value={config.metrics.overallScore}
                  onChange={(e) =>
                    setConfig({ ...config, metrics: { ...config.metrics, overallScore: e.target.value } })
                  }
                />
                <FloatingInput
                  label="Score Subtext Label"
                  value={config.metrics.scoreSubtext}
                  onChange={(e) =>
                    setConfig({ ...config, metrics: { ...config.metrics, scoreSubtext: e.target.value } })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="Trust Metric 1 Value (e.g. 99.4%)"
                  value={config.metrics.metric1Value}
                  onChange={(e) =>
                    setConfig({ ...config, metrics: { ...config.metrics, metric1Value: e.target.value } })
                  }
                />
                <FloatingInput
                  label="Trust Metric 1 Label"
                  value={config.metrics.metric1Label}
                  onChange={(e) =>
                    setConfig({ ...config, metrics: { ...config.metrics, metric1Label: e.target.value } })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="Trust Metric 2 Value (e.g. 100%)"
                  value={config.metrics.metric2Value}
                  onChange={(e) =>
                    setConfig({ ...config, metrics: { ...config.metrics, metric2Value: e.target.value } })
                  }
                />
                <FloatingInput
                  label="Trust Metric 2 Label"
                  value={config.metrics.metric2Label}
                  onChange={(e) =>
                    setConfig({ ...config, metrics: { ...config.metrics, metric2Label: e.target.value } })
                  }
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Allow Customer Submissions</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Display the "+ Write a Customer Review" button on the storefront page.
                  </p>
                </div>
                <Switch
                  checked={config.metrics.allowSubmissions}
                  onCheckedChange={(val) =>
                    setConfig({ ...config, metrics: { ...config.metrics, allowSubmissions: val } })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="gap-2 bg-primary text-primary-foreground font-bold px-6"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB 3: SEO & METADATA ── */}
      {activeTab === 'seo' && (
        <div className="space-y-6 max-w-4xl">
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Search size={16} className="text-purple-500" />
                  Search Engine Optimization (SEO)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure meta tags and indexing settings for the customer testimonials page.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <FloatingInput
                label="Meta Title Tag"
                value={config.seo.metaTitle}
                onChange={(e) =>
                  setConfig({ ...config, seo: { ...config.seo, metaTitle: e.target.value } })
                }
              />
              <FloatingTextarea
                rows={3}
                label="Meta Description"
                value={config.seo.metaDescription}
                onChange={(e) =>
                  setConfig({ ...config, seo: { ...config.seo, metaDescription: e.target.value } })
                }
              />
              <FloatingInput
                label="Meta Keywords (comma separated)"
                value={config.seo.metaKeywords}
                onChange={(e) =>
                  setConfig({ ...config, seo: { ...config.seo, metaKeywords: e.target.value } })
                }
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveConfig}
              disabled={saving}
              className="gap-2 bg-primary text-primary-foreground font-bold px-6"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save SEO Tags'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Add / Edit Testimonial Dialog ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Star size={16} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
              {editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveModal} className="space-y-3.5 pt-2">
            
            {/* Rating */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Overall Rating (1 - 5 Stars) *
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: num })}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      size={24}
                      style={{
                        fill: num <= formData.rating ? '#f59e0b' : 'none',
                        color: num <= formData.rating ? '#f59e0b' : '#94a3b8'
                      }}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-muted-foreground ml-2">
                  {formData.rating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Name & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FloatingInput
                label="Customer Full Name *"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <FloatingInput
                label="City & State *"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            {/* Category & Purchased Item */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FloatingCustomSelect
                label="Store Category *"
                required
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={categories.length > 0
                  ? categories.map((c) => ({ value: c.label || c.id, label: c.label || c.id }))
                  : [
                      { value: 'Flowers', label: 'Fresh Flowers' },
                      { value: 'Cakes', label: 'Artisan Cakes' },
                      { value: 'Hampers', label: 'Luxury Hampers' },
                      { value: 'Express Delivery', label: 'Midnight & Express' },
                      { value: 'Corporate Gifting', label: 'Corporate Gifting' },
                    ]
                }
              />

              <FloatingInput
                label="Purchased Item Name"
                placeholder="e.g. 50 Red Rose Bouquet"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              />
            </div>

            {/* Review Story Text */}
            <FloatingTextarea
              rows={4}
              required
              label="Review Story / Testimonial Body *"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            />

            {/* Switches */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium border border-border p-2.5 rounded-xl bg-muted/20">
                <Switch
                  checked={formData.isApproved}
                  onCheckedChange={(val) => setFormData({ ...formData, isApproved: val })}
                />
                <span>Publish Live</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium border border-border p-2.5 rounded-xl bg-muted/20">
                <Switch
                  checked={formData.isVerified}
                  onCheckedChange={(val) => setFormData({ ...formData, isVerified: val })}
                />
                <span>Verified Buyer</span>
              </label>
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="text-xs font-bold">
                {editingItem ? 'Update Testimonial' : 'Create Testimonial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Symmetrical Confirm Delete Modal Standard */}
      <ConfirmDeleteModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Testimonial"
        message="Are you sure you want to permanently delete this customer testimonial? This action cannot be undone."
      />
    </div>
  );
}
