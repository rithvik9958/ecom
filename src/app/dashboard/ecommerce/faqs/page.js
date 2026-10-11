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
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Save,
  MessageSquare,
  Search,
  Headphones,
  FolderKanban,
  Sparkles,
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Clock,
  ThumbsUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const TABS = [
  { id: 'questions', label: 'All Questions & Answers', icon: MessageSquare },
  { id: 'categories', label: 'FAQ Categories', icon: FolderKanban },
  { id: 'header_support', label: 'Page Header & Support Desk', icon: Headphones },
  { id: 'seo', label: 'SEO & Metadata', icon: Search }
];

const DEFAULT_CONFIG = {
  hero: {
    title: 'How Can We Assist You Today?',
    subtitle:
      'Search questions below or choose a topic to find fast answers regarding orders, delivery, slots, and refunds.',
    bannerImage: ''
  },
  supportDesk: {
    isVisible: true,
    title: 'Still Need Assistance?',
    subtitle: 'Our customer care specialists are available 24/7 to resolve your inquiries right away.',
    phone: '+91 11-26802680',
    email: 'support@cityshop.com',
    hours: 'Mon–Sun, 24 Hours Available'
  },
  categories: [
    { id: 'ordering', label: 'Orders & Tracking', icon: 'Package', order: 1 },
    { id: 'delivery', label: 'Delivery & Slots', icon: 'Truck', order: 2 },
    { id: 'refunds', label: 'Returns & Refunds', icon: 'RotateCcw', order: 3 },
    { id: 'payments', label: 'Payments & Offers', icon: 'CreditCard', order: 4 },
    { id: 'corporate', label: 'Corporate & Bulk', icon: 'Building2', order: 5 }
  ],
  seo: {
    metaTitle: 'Help Center & Frequently Asked Questions | City Shop',
    metaDescription: 'Find instant answers about delivery slots, tracking orders, refunds, and corporate gifting.',
    metaKeywords: 'faqs, helpdesk, customer support, delivery questions, refunds'
  }
};

export default function AdminFaqsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [toasts, setToasts] = useState([]);

  const [faqs, setFaqs] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [togglingId, setTogglingId] = useState(null);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Deletion States
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteCatIdx, setConfirmDeleteCatIdx] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Question Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    question: '',
    answer: '',
    category: 'ordering',
    order: 0,
    isActive: true
  });

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatIdx, setEditingCatIdx] = useState(null);
  const [catFormData, setCatFormData] = useState({
    id: '',
    label: '',
    icon: 'HelpCircle',
    order: 0
  });

  const addToast = (msg, type = 'success') =>
    setToasts((t) => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/faqs', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setFaqs(data.faqs || []);
        if (data.config) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
            hero: { ...prev.hero, ...(data.config.hero || {}) },
            supportDesk: { ...prev.supportDesk, ...(data.config.supportDesk || {}) },
            categories: data.config.categories?.length > 0 ? data.config.categories : prev.categories,
            seo: { ...prev.seo, ...(data.config.seo || {}) }
          }));
        }
      } else {
        addToast(data.message || 'Failed to load FAQs', 'danger');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error loading FAQs', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Save Page Settings (Hero, Support Desk, SEO)
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_settings', config })
      });
      const data = await res.json();
      if (data.success) {
        addToast('FAQ page settings saved successfully!');
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

  // Toggle FAQ Active Status
  const handleToggleActive = async (id, currentVal) => {
    const newVal = !currentVal;
    try {
      setTogglingId(id);
      setFaqs((prev) =>
        prev.map((f) => (f._id === id ? { ...f, isActive: newVal } : f))
      );
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: newVal })
      });
      const data = await res.json();
      if (!data.success) {
        setFaqs((prev) =>
          prev.map((f) => (f._id === id ? { ...f, isActive: currentVal } : f))
        );
        addToast(data.message || 'Failed to update status', 'danger');
      } else {
        addToast(newVal ? 'Question is now live on storefront' : 'Question hidden from storefront');
      }
    } catch (err) {
      console.error(err);
      setFaqs((prev) =>
        prev.map((f) => (f._id === id ? { ...f, isActive: currentVal } : f))
      );
      addToast('Error updating status', 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  // Open Create Question Modal
  const handleOpenCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionFormData({
      question: '',
      answer: '',
      category: config.categories[0]?.id || 'ordering',
      order: faqs.length + 1,
      isActive: true
    });
    setIsQuestionModalOpen(true);
  };

  // Open Edit Question Modal
  const handleOpenEditQuestion = (item) => {
    setEditingQuestion(item);
    setQuestionFormData({
      question: item.question || '',
      answer: item.answer || '',
      category: item.category || 'ordering',
      order: item.order || 0,
      isActive: item.isActive !== false
    });
    setIsQuestionModalOpen(true);
  };

  // Save Question Form
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionFormData.question.trim() || !questionFormData.answer.trim()) {
      addToast('Please complete all required fields', 'danger');
      return;
    }

    try {
      if (editingQuestion) {
        const res = await fetch('/api/admin/faqs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingQuestion._id, ...questionFormData })
        });
        const data = await res.json();
        if (data.success && data.faq) {
          setFaqs((prev) =>
            prev.map((f) => (f._id === editingQuestion._id ? data.faq : f))
          );
          setIsQuestionModalOpen(false);
          addToast('FAQ question updated successfully');
        } else {
          addToast(data.message || 'Failed to update question', 'danger');
        }
      } else {
        const res = await fetch('/api/admin/faqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionFormData)
        });
        const data = await res.json();
        if (data.success && data.faq) {
          setFaqs([...faqs, data.faq]);
          setIsQuestionModalOpen(false);
          addToast('New FAQ question created successfully');
        } else {
          addToast(data.message || 'Failed to create question', 'danger');
        }
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving question', 'danger');
    }
  };

  // Delete Single FAQ
  const handleDeleteQuestion = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/faqs?id=${confirmDeleteId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setFaqs((prev) => prev.filter((f) => f._id !== confirmDeleteId));
        addToast('FAQ question deleted successfully', 'warning');
      } else {
        addToast(data.message || 'Failed to delete FAQ', 'danger');
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting question', 'danger');
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  // Bulk Delete FAQs
  const handleBulkDelete = async (selectedIds) => {
    setBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' })
        )
      );
      setFaqs((prev) => prev.filter((f) => !selectedIds.includes(f._id)));
      addToast(`${selectedIds.length} FAQ questions deleted`, 'warning');
    } catch (e) {
      addToast('Error during bulk delete', 'danger');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Category Manager
  const handleOpenAddCat = () => {
    setEditingCatIdx(null);
    setCatFormData({
      id: '',
      label: '',
      icon: 'HelpCircle',
      order: config.categories.length + 1
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat, idx) => {
    setEditingCatIdx(idx);
    setCatFormData({
      id: cat.id || '',
      label: cat.label || '',
      icon: cat.icon || 'HelpCircle',
      order: cat.order || idx + 1
    });
    setIsCatModalOpen(true);
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    if (!catFormData.label.trim()) {
      addToast('Category label is required', 'danger');
      return;
    }

    const catId =
      catFormData.id.trim() ||
      catFormData.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newCat = {
      id: catId,
      label: catFormData.label.trim(),
      icon: catFormData.icon || 'HelpCircle',
      order: Number(catFormData.order) || 0
    };

    let updatedCats = [...config.categories];
    if (editingCatIdx !== null) {
      updatedCats[editingCatIdx] = newCat;
    } else {
      updatedCats.push(newCat);
    }

    setConfig({ ...config, categories: updatedCats });
    setIsCatModalOpen(false);

    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_categories', categories: updatedCats })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Categories updated successfully');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to save categories', 'danger');
    }
  };

  const handleDeleteCat = (idx) => {
    setConfirmDeleteCatIdx(idx);
  };

  const handleConfirmDeleteCat = async () => {
    if (confirmDeleteCatIdx === null) return;
    const idx = confirmDeleteCatIdx;
    const updatedCats = config.categories.filter((_, i) => i !== idx);
    setConfig({ ...config, categories: updatedCats });
    setConfirmDeleteCatIdx(null);
    try {
      await fetch('/api/admin/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_categories', categories: updatedCats })
      });
      addToast('Category removed successfully');
    } catch (err) {
      console.error(err);
      addToast('Failed to delete category', 'danger');
    }
  };

  // Filtered Questions
  const filteredData = useMemo(() => {
    return faqs.filter((f) => {
      if (statusFilter === 'active' && !f.isActive) return false;
      if (statusFilter === 'inactive' && f.isActive) return false;

      if (categoryFilter !== 'all') {
        const c = (f.category || '').toLowerCase();
        if (c !== categoryFilter.toLowerCase()) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          (f.question || '').toLowerCase().includes(q) ||
          (f.answer || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [faqs, statusFilter, categoryFilter, search]);

  const getCategoryLabel = (catId) => {
    const found = config.categories.find((c) => c.id === catId);
    return found?.label || catId || 'General';
  };

  // Symmetrical DataTable Columns matching Dashboard Standard
  const columns = [
    {
      key: 'question',
      label: 'Question & Answer',
      render: (row) => (
        <div className="flex flex-col max-w-lg py-1">
          <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
            <HelpCircle size={14} className="text-primary/70 shrink-0" />
            <span>{row.question}</span>
          </span>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {row.answer}
          </p>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <Badge variant="outline" className="font-semibold text-xs bg-muted/40 whitespace-nowrap">
          {getCategoryLabel(row.category)}
        </Badge>
      )
    },
    {
      key: 'helpful',
      label: 'Helpful Votes',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <ThumbsUp size={12} className="text-emerald-500" />
          <span>{row.helpfulCount || 0}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusSwitch
          checked={row.isActive}
          loading={togglingId === row._id}
          onCheckedChange={() => handleToggleActive(row._id, row.isActive)}
          label={row.isActive ? 'Live' : 'Hidden'}
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
            onClick={() => handleOpenEditQuestion(row)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Question"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(row._id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleReorderFaqs = (reorderedList) => {
    setFaqs(reorderedList);
    addToast('FAQ order updated');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Toast toasts={toasts} removeToast={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Symmetrical Breadcrumb Standard */}
      <Breadcrumb
        title="Help & FAQs Desk"
        subtitle={`Manage customer knowledge base, question accordions, and support desk (${faqs.length} total)`}
        crumbs={[{ label: 'Storefront Management' }, { label: 'Help & FAQs' }]}
      />

      {/* Navigation Tabs (Symmetric Standard) */}
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
              {tab.id === 'questions' && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-background text-foreground'
                  }`}
                >
                  {faqs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: ALL QUESTIONS & ANSWERS (DataTable Standard) ── */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            onAdd={handleOpenCreateQuestion}
            addLabel="Add Question"
            hideSort={true}
            extraActions={
              <Link
                href="/faqs"
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
                  className="min-w-[130px]"
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Live & Active' },
                    { value: 'inactive', label: 'Hidden' },
                  ]}
                />
                <CustomSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  size="sm"
                  fullWidth={false}
                  className="min-w-[150px]"
                  options={[
                    { value: 'all', label: 'All Categories' },
                    ...config.categories.map((c) => ({ value: c.id, label: c.label }))
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
            onReorder={handleReorderFaqs}
          />
        </div>
      )}

      {/* ── TAB 2: FAQ CATEGORIES MANAGER ── */}
      {activeTab === 'categories' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">FAQ Categories</h3>
              <p className="text-xs text-muted-foreground">
                Manage the category pills displayed on the top of the FAQs page.
              </p>
            </div>
            <Button
              onClick={handleOpenAddCat}
              size="sm"
              className="gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              <Plus size={14} />
              <span>Add Category</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.categories.map((cat, idx) => (
              <Card key={cat.id || idx} className="p-4 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    <FolderKanban size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{cat.label}</h4>
                    <p className="text-[11px] text-muted-foreground">ID: <code className="text-primary font-semibold">{cat.id}</code></p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleOpenEditCat(cat, idx)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteCat(idx)}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: HERO HEADER & SUPPORT DESK SETTINGS ── */}
      {activeTab === 'header_support' && (
        <div className="space-y-6 max-w-4xl">
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  Hero Header Banner Settings
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customize the headline and intro story on the FAQs knowledge base page.
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
                  <Headphones size={16} className="text-blue-500" />
                  Still Need Assistance? Support Concierge Sidebar
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure the 24/7 customer support contact card shown alongside FAQs.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="Support Card Title"
                  value={config.supportDesk.title}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      supportDesk: { ...config.supportDesk, title: e.target.value }
                    })
                  }
                />
                <FloatingInput
                  label="Support Phone Hotline"
                  value={config.supportDesk.phone}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      supportDesk: { ...config.supportDesk, phone: e.target.value }
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FloatingInput
                  label="Support Email Address"
                  value={config.supportDesk.email}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      supportDesk: { ...config.supportDesk, email: e.target.value }
                    })
                  }
                />
                <FloatingInput
                  label="Operating Hours (e.g. Mon–Sun, 24 Hours Available)"
                  value={config.supportDesk.hours}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      supportDesk: { ...config.supportDesk, hours: e.target.value }
                    })
                  }
                />
              </div>

              <FloatingTextarea
                rows={2}
                label="Support Narrative Subtitle"
                value={config.supportDesk.subtitle}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    supportDesk: { ...config.supportDesk, subtitle: e.target.value }
                  })
                }
              />

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Display Support Concierge Card</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Show the right-side customer support assistance card on the FAQs page.
                  </p>
                </div>
                <Switch
                  checked={config.supportDesk.isVisible}
                  onCheckedChange={(val) =>
                    setConfig({
                      ...config,
                      supportDesk: { ...config.supportDesk, isVisible: val }
                    })
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
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB 4: SEO & METADATA ── */}
      {activeTab === 'seo' && (
        <div className="space-y-6 max-w-4xl">
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold">Search Engine Optimization (SEO)</CardTitle>
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

      {/* ── Add / Edit Question Dialog ── */}
      <Dialog open={isQuestionModalOpen} onOpenChange={setIsQuestionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <HelpCircle size={16} className="text-primary" />
              {editingQuestion ? 'Edit FAQ Question' : 'Add New FAQ Question'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveQuestion} className="space-y-3.5 pt-2">
            <FloatingInput
              label="Question Title *"
              required
              value={questionFormData.question}
              onChange={(e) =>
                setQuestionFormData({ ...questionFormData, question: e.target.value })
              }
            />

            <FloatingCustomSelect
              label="Category *"
              required
              value={questionFormData.category}
              onChange={(val) => setQuestionFormData({ ...questionFormData, category: val })}
              options={config.categories.map((c) => ({ value: c.id, label: c.label }))}
            />

            <FloatingTextarea
              rows={4}
              required
              label="Detailed Answer Body *"
              value={questionFormData.answer}
              onChange={(e) =>
                setQuestionFormData({ ...questionFormData, answer: e.target.value })
              }
            />

            <div className="flex items-center gap-2 cursor-pointer text-xs font-medium border border-border p-2.5 rounded-xl bg-muted/20">
              <Switch
                checked={questionFormData.isActive}
                onCheckedChange={(val) =>
                  setQuestionFormData({ ...questionFormData, isActive: val })
                }
              />
              <span>Publish Live on Storefront</span>
            </div>

            <DialogFooter className="pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="text-xs font-bold">
                {editingQuestion ? 'Update Question' : 'Create Question'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Category Dialog ── */}
      <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderKanban size={16} className="text-primary" />
              {editingCatIdx !== null ? 'Edit FAQ Category' : 'Add FAQ Category'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCat} className="space-y-3.5 pt-2">
            <FloatingInput
              label="Category Label (e.g. Orders & Tracking) *"
              required
              value={catFormData.label}
              onChange={(e) => setCatFormData({ ...catFormData, label: e.target.value })}
            />

            <FloatingInput
              label="Category ID (slug, e.g. ordering)"
              value={catFormData.id}
              placeholder="auto-generated if blank"
              onChange={(e) => setCatFormData({ ...catFormData, id: e.target.value })}
            />

            <DialogFooter className="pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCatModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="text-xs font-bold">
                {editingCatIdx !== null ? 'Save Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Symmetrical Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteQuestion}
        loading={deleting}
        title="Delete FAQ Question"
        message="Are you sure you want to permanently delete this question? This action cannot be undone."
      />

      <ConfirmDeleteModal
        isOpen={confirmDeleteCatIdx !== null}
        onClose={() => setConfirmDeleteCatIdx(null)}
        onConfirm={handleConfirmDeleteCat}
        title="Delete FAQ Category"
        message="Are you sure you want to delete this FAQ category? This action cannot be undone."
      />
    </div>
  );
}
