'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import Toast from '@/components/dashboard/Toast';
import RichEditor from '@/components/dashboard/RichEditor';
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
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Save,
  Search,
  FolderKanban,
  Sparkles,
  Calendar,
  User,
  Clock,
  Eye,
  ThumbsUp,
  Image as ImageIcon,
  Star,
  Globe,
  UploadCloud
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const TABS = [
  { id: 'articles', label: 'All Blog Articles', icon: BookOpen },
  { id: 'categories', label: 'Blog Categories', icon: FolderKanban },
  { id: 'hero', label: 'Page Hero & Banner', icon: Sparkles },
  { id: 'seo', label: 'SEO & Metadata', icon: Search }
];

const DEFAULT_CONFIG = {
  hero: {
    title: 'Celebration Ideas, Floral Guides & Gifting Trends',
    subtitle:
      'Expert advice on selecting the perfect blooms, gourmet confection trends, and celebration inspiration from master florists and pastry chefs.',
    bannerImage: ''
  },
  categories: [
    { id: 'floral-guides', label: 'Floral Guides', order: 1 },
    { id: 'gourmet-bakery', label: 'Gourmet Bakery', order: 2 },
    { id: 'gifting-logistics', label: 'Gifting Logistics', order: 3 },
    { id: 'milestones', label: 'Anniversary & Milestones', order: 4 },
    { id: 'festive-trends', label: 'Festive Trends', order: 5 }
  ],
  seo: {
    metaTitle: 'The Gifting Journal & Celebration Blog | City Shop',
    metaDescription:
      'Discover expert flower care advice, cake trends, and thoughtful gifting tips from City Shop.',
    metaKeywords: 'gifting blog, flower care tips, cake trends, celebration guides'
  }
};

const EMPTY_ARTICLE = {
  title: '',
  slug: '',
  category: 'Floral Guides',
  author: 'City Shop Editorial Desk',
  readTime: '4 min read',
  excerpt: '',
  content: '',
  publishedAt: new Date().toISOString().split('T')[0],
  isPublished: true,
  featured: false,
  coverImage: '',
  alt: '',
  metatag: '',
  metaDescription: '',
  metakeywords: '',
  canonicalUrl: ''
};

export default function AdminBlogsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('articles');
  const [toasts, setToasts] = useState([]);

  const [blogs, setBlogs] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Deletion States
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteCatIdx, setConfirmDeleteCatIdx] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Article Modal State
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [articleModalTab, setArticleModalTab] = useState('content');
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState(EMPTY_ARTICLE);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [slugAuto, setSlugAuto] = useState(true);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatIdx, setEditingCatIdx] = useState(null);
  const [catFormData, setCatFormData] = useState({ id: '', label: '', order: 0 });

  const addToast = (msg, type = 'success') =>
    setToasts((t) => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/blogs', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs || []);
        if (data.config) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
            hero: { ...prev.hero, ...(data.config.hero || {}) },
            categories: data.config.categories?.length > 0 ? data.config.categories : prev.categories,
            seo: { ...prev.seo, ...(data.config.seo || {}) }
          }));
        }
      } else {
        addToast(data.message || 'Failed to load blog posts', 'danger');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error loading blogs', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Save Page Configuration
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_settings', config })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Blog page configuration saved successfully!');
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

  // Toggle Publish Status
  const handleTogglePublish = async (id, currentVal) => {
    const newVal = !currentVal;
    try {
      setTogglingId(id);
      const res = await fetch('/api/admin/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPublished: newVal })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update status');
      } else {
        setBlogs((prev) =>
          prev.map((b) => (b._id === id ? { ...b, isPublished: newVal } : b))
        );
        addToast(newVal ? 'Article published live' : 'Article hidden from storefront');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error updating status', 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  // Open Create Article Modal
  const handleOpenCreateArticle = () => {
    setEditingArticle(null);
    setArticleForm({
      ...EMPTY_ARTICLE,
      category: config.categories[0]?.label || 'Floral Guides',
      publishedAt: new Date().toISOString().split('T')[0]
    });
    setCoverFile(null);
    setCoverPreview('');
    setSlugAuto(true);
    setArticleModalTab('content');
    setIsArticleModalOpen(true);
  };

  // Open Edit Article Modal
  const handleOpenEditArticle = (item) => {
    setEditingArticle(item);
    setArticleForm({
      ...EMPTY_ARTICLE,
      ...item,
      metakeywords: Array.isArray(item.metakeywords)
        ? item.metakeywords.join(', ')
        : item.metakeywords || ''
    });
    setCoverFile(null);
    setCoverPreview(item.coverImage || '');
    setSlugAuto(false);
    setArticleModalTab('content');
    setIsArticleModalOpen(true);
  };

  // Auto-slug generator
  const handleTitleChange = (val) => {
    const nextForm = { ...articleForm, title: val };
    if (slugAuto && !editingArticle) {
      nextForm.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    setArticleForm(nextForm);
  };

  // Handle Cover File Upload Preview
  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  // Save Article Modal Form
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!articleForm.title.trim() || !articleForm.slug.trim()) {
      addToast('Please enter title and URL slug', 'danger');
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      if (editingArticle) fd.append('id', editingArticle._id);

      Object.keys(articleForm).forEach((key) => {
        if (key === 'metakeywords') {
          const kwArr = articleForm.metakeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
          fd.append('metakeywords', JSON.stringify(kwArr));
        } else {
          fd.append(key, articleForm[key]);
        }
      });

      if (coverFile) {
        fd.append('coverFile', coverFile);
      }

      const method = editingArticle ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/blogs', { method, body: fd });
      const data = await res.json();

      if (data.success && data.blog) {
        if (editingArticle) {
          setBlogs((prev) =>
            prev.map((b) => (b._id === editingArticle._id ? data.blog : b))
          );
          addToast('Article updated successfully!');
        } else {
          setBlogs([data.blog, ...blogs]);
          addToast('New article published successfully!');
        }
        setIsArticleModalOpen(false);
      } else {
        addToast(data.message || 'Failed to save article', 'danger');
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving article', 'danger');
    } finally {
      setSaving(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/blogs?id=${confirmDeleteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.filter((b) => b._id !== confirmDeleteId));
        addToast('Article deleted successfully', 'warning');
      } else {
        addToast(data.message || 'Failed to delete article', 'danger');
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting article', 'danger');
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
        selectedIds.map((id) => fetch(`/api/admin/blogs?id=${id}`, { method: 'DELETE' }))
      );
      setBlogs((prev) => prev.filter((b) => !selectedIds.includes(b._id)));
      addToast(`${selectedIds.length} articles deleted`, 'warning');
    } catch (e) {
      addToast('Error during bulk delete', 'danger');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Category Manager
  const handleOpenAddCat = () => {
    setEditingCatIdx(null);
    setCatFormData({ id: '', label: '', order: config.categories.length + 1 });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat, idx) => {
    setEditingCatIdx(idx);
    setCatFormData({ id: cat.id || '', label: cat.label || '', order: cat.order || idx + 1 });
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
      await fetch('/api/admin/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_categories', categories: updatedCats })
      });
      addToast('Blog categories updated successfully');
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
      await fetch('/api/admin/blogs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_categories', categories: updatedCats })
      });
      addToast('Category removed successfully');
    } catch (err) {
      console.error(err);
      addToast('Failed to remove category', 'danger');
    }
  };

  // Filtered Articles
  const filteredData = useMemo(() => {
    return blogs.filter((b) => {
      if (statusFilter === 'published' && !b.isPublished) return false;
      if (statusFilter === 'draft' && b.isPublished) return false;

      if (categoryFilter !== 'all') {
        const cat = (b.category || '').toLowerCase();
        if (cat !== categoryFilter.toLowerCase()) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          (b.title || '').toLowerCase().includes(q) ||
          (b.excerpt || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [blogs, statusFilter, categoryFilter, search]);

  // Symmetrical DataTable Columns
  const columns = [
    {
      key: 'article',
      label: 'Article Story',
      render: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-14 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
            {row.coverImage ? (
              <img
                src={row.coverImage}
                alt={row.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageIcon size={18} />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors">
              {row.title}
            </span>
            <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              {row.excerpt || 'No excerpt summary provided.'}
            </span>
            <span className="text-[10px] text-primary/80 font-mono mt-0.5">
              /blog/{row.slug}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <Badge variant="outline" className="font-semibold text-xs bg-muted/40 whitespace-nowrap">
          {row.category || 'General'}
        </Badge>
      )
    },
    {
      key: 'author_date',
      label: 'Author & Date',
      render: (row) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <User size={11} className="text-muted-foreground" /> {row.author || 'Editorial'}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar size={11} /> {row.publishedAt || new Date(row.createdAt).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      key: 'metrics',
      label: 'Views / Likes',
      render: (row) => (
        <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1" title="Views">
            <Eye size={12} className="text-blue-500" /> {row.views || 0}
          </span>
          <span className="flex items-center gap-1" title="Helpful Likes">
            <ThumbsUp size={12} className="text-emerald-500" /> {row.likes || 0}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusSwitch
          checked={row.isPublished}
          loading={togglingId === row._id}
          onCheckedChange={() => handleTogglePublish(row._id, row.isPublished)}
          label={row.isPublished ? 'Live' : 'Draft'}
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/blog/${row.slug}`}
            target="_blank"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
            title="Preview Live Post"
          >
            <Globe size={14} />
          </Link>
          <button
            onClick={() => handleOpenEditArticle(row)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Post"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(row._id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Delete Post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleReorder = (reorderedList) => {
    setBlogs(reorderedList);
    addToast('Blog articles order updated');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Toast toasts={toasts} removeToast={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Symmetrical Breadcrumb Standard */}
      <Breadcrumb
        title="Gifting Journal & Blog CMS"
        subtitle={`Manage celebration stories, flower guides, categories, and hero banner (${blogs.length} total)`}
        crumbs={[{ label: 'Storefront Management' }, { label: 'Gifting Blog CMS' }]}
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
              {tab.id === 'articles' && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-background text-foreground'
                  }`}
                >
                  {blogs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: ALL ARTICLES (DataTable Standard) ── */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            onAdd={handleOpenCreateArticle}
            addLabel="Write Article"
            hideSort={true}
            extraActions={
              <Link
                href="/blog"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full border border-border text-xs font-semibold hover:bg-muted text-foreground transition"
              >
                <ExternalLink size={14} />
                <span>View Live Blog</span>
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
                    { value: 'published', label: 'Live & Published' },
                    { value: 'draft', label: 'Drafts' },
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
                    ...config.categories.map((c) => ({ value: c.label || c.id, label: c.label || c.id }))
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

      {/* ── TAB 2: BLOG CATEGORIES MANAGER ── */}
      {activeTab === 'categories' && (
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Blog Categories</h3>
              <p className="text-xs text-muted-foreground">
                Manage the filter pills displayed on the top of the Gifting Journal.
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
                    <p className="text-[11px] text-muted-foreground">
                      Slug: <code className="text-primary font-semibold">{cat.id}</code>
                    </p>
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

      {/* ── TAB 3: PAGE HERO & HEADER SETTINGS ── */}
      {activeTab === 'hero' && (
        <div className="space-y-6 max-w-4xl">
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  Hero Header Banner Settings
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customize the headline and intro story on the blog articles page.
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
              <FloatingInput
                label="Background Banner Image URL (Optional)"
                placeholder="https://..."
                value={config.hero.bannerImage || ''}
                onChange={(e) =>
                  setConfig({ ...config, hero: { ...config.hero, bannerImage: e.target.value } })
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
              <span>{saving ? 'Saving...' : 'Save Hero Settings'}</span>
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

      {/* ── Add / Edit Article Dialog ── */}
      <Dialog open={isArticleModalOpen} onOpenChange={setIsArticleModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <BookOpen size={18} className="text-primary" />
              {editingArticle ? 'Edit Blog Article' : 'Write New Blog Article'}
            </DialogTitle>
          </DialogHeader>

          {/* Modal Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-2 pt-1">
            <button
              type="button"
              onClick={() => setArticleModalTab('content')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                articleModalTab === 'content'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground'
              }`}
            >
              1. Story Content & Media
            </button>
            <button
              type="button"
              onClick={() => setArticleModalTab('seo')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                articleModalTab === 'seo'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground'
              }`}
            >
              2. SEO & OpenGraph
            </button>
          </div>

          <form onSubmit={handleSaveArticle} className="space-y-4 pt-2">
            
            {articleModalTab === 'content' && (
              <>
                {/* Title & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FloatingInput
                    label="Article Title *"
                    required
                    value={articleForm.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                  <div className="relative">
                    <FloatingInput
                      label="URL Slug (/blog/...)"
                      required
                      value={articleForm.slug}
                      onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                    />
                  </div>
                </div>

                {/* Category, Author, Read Time, Date */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FloatingCustomSelect
                    label="Category *"
                    required
                    value={articleForm.category}
                    onChange={(val) => setArticleForm({ ...articleForm, category: val })}
                    options={config.categories.map((c) => ({ value: c.label || c.id, label: c.label || c.id }))}
                  />

                  <FloatingInput
                    label="Author Name"
                    value={articleForm.author}
                    onChange={(e) => setArticleForm({ ...articleForm, author: e.target.value })}
                  />

                  <FloatingInput
                    label="Reading Time"
                    placeholder="e.g. 4 min read"
                    value={articleForm.readTime}
                    onChange={(e) => setArticleForm({ ...articleForm, readTime: e.target.value })}
                  />

                  <FloatingInput
                    type="date"
                    label="Publish Date"
                    value={articleForm.publishedAt}
                    onChange={(e) => setArticleForm({ ...articleForm, publishedAt: e.target.value })}
                  />
                </div>

                {/* Cover Image Upload / URL */}
                <div className="border border-dashed border-border rounded-xl p-4 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-primary" /> Cover Image & Thumbnail
                      </h4>
                      <p className="text-[11px] text-muted-foreground">Upload from device or enter image URL</p>
                    </div>
                    {coverPreview && (
                      <img
                        src={coverPreview}
                        alt="Preview"
                        className="w-16 h-12 rounded-lg object-cover border border-border"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-border bg-background hover:bg-muted/40 cursor-pointer text-xs font-semibold">
                      <UploadCloud size={16} className="text-primary" />
                      <span>Choose Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileChange}
                        className="hidden"
                      />
                    </label>

                    <FloatingInput
                      label="Or Image Direct URL"
                      placeholder="https://images.unsplash.com/..."
                      value={articleForm.coverImage}
                      onChange={(e) => {
                        setArticleForm({ ...articleForm, coverImage: e.target.value });
                        setCoverPreview(e.target.value);
                      }}
                    />
                  </div>
                </div>

                {/* Excerpt Summary */}
                <FloatingTextarea
                  rows={2}
                  label="Short Excerpt Summary (Displayed on article cards)"
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                />

                {/* WYSIWYG Content Rich Editor */}
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Complete Article Body *
                  </label>
                  <div className="border border-border rounded-xl overflow-hidden bg-background">
                    <RichEditor
                      value={articleForm.content}
                      onChange={(val) => setArticleForm({ ...articleForm, content: val })}
                    />
                  </div>
                </div>

                {/* Switches */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium border border-border p-2.5 rounded-xl bg-muted/20">
                    <Switch
                      checked={articleForm.isPublished}
                      onCheckedChange={(val) => setArticleForm({ ...articleForm, isPublished: val })}
                    />
                    <span>Publish Live on Storefront</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium border border-border p-2.5 rounded-xl bg-muted/20">
                    <Switch
                      checked={articleForm.featured}
                      onCheckedChange={(val) => setArticleForm({ ...articleForm, featured: val })}
                    />
                    <span>Featured Spotlight Article</span>
                  </label>
                </div>
              </>
            )}

            {articleModalTab === 'seo' && (
              <div className="space-y-3.5">
                <FloatingInput
                  label="SEO Meta Title"
                  value={articleForm.metatag}
                  onChange={(e) => setArticleForm({ ...articleForm, metatag: e.target.value })}
                />
                <FloatingTextarea
                  rows={3}
                  label="SEO Meta Description"
                  value={articleForm.metaDescription}
                  onChange={(e) => setArticleForm({ ...articleForm, metaDescription: e.target.value })}
                />
                <FloatingInput
                  label="Meta Keywords (comma separated)"
                  value={articleForm.metakeywords}
                  onChange={(e) => setArticleForm({ ...articleForm, metakeywords: e.target.value })}
                />
                <FloatingInput
                  label="Canonical URL (optional)"
                  value={articleForm.canonicalUrl}
                  onChange={(e) => setArticleForm({ ...articleForm, canonicalUrl: e.target.value })}
                />
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsArticleModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="text-xs font-bold gap-1.5">
                <Save size={14} />
                <span>{saving ? 'Saving...' : editingArticle ? 'Update Article' : 'Publish Article'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Category Modal ── */}
      <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderKanban size={16} className="text-primary" />
              {editingCatIdx !== null ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCat} className="space-y-3.5 pt-2">
            <FloatingInput
              label="Category Label (e.g. Floral Guides) *"
              required
              value={catFormData.label}
              onChange={(e) => setCatFormData({ ...catFormData, label: e.target.value })}
            />

            <FloatingInput
              label="Slug ID (e.g. floral-guides)"
              value={catFormData.id}
              placeholder="auto-generated if empty"
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
        onConfirm={handleDeleteArticle}
        loading={deleting}
        title="Delete Blog Article"
        message="Are you sure you want to permanently delete this blog article? This action cannot be undone."
      />

      <ConfirmDeleteModal
        isOpen={confirmDeleteCatIdx !== null}
        onClose={() => setConfirmDeleteCatIdx(null)}
        onConfirm={handleConfirmDeleteCat}
        title="Delete Blog Category"
        message="Are you sure you want to delete this blog category? This action cannot be undone."
      />
    </div>
  );
}
