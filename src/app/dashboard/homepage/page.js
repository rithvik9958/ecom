'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import DataTable from '@/components/dashboard/DataTable';
import {
  Save, Plus, Trash2, Pencil, Edit2, Search, LayoutTemplate,
  Gift, Image as ImageIcon, Sparkles, ShoppingBag, Video, ShieldCheck, TrendingUp
} from 'lucide-react';
import Toast from '@/components/dashboard/Toast';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import CustomSelect from '@/components/ui/CustomSelect';

/* ────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const genId = () => Math.random().toString(36).slice(2, 10);

const SECTION_TYPES = [
  {
    type: 'occasion_cards',
    label: 'Mini Cards',
    icon: Gift,
    desc: 'Horizontal scrollable colored cards with image, title & badge',
  },
  {
    type: 'banner_slider',
    label: 'Banner Slider',
    icon: ImageIcon,
    desc: 'Full-width centre-peek auto-playing banner carousel',
  },
  {
    type: 'category_carousel',
    label: 'Category Carousel',
    icon: Sparkles,
    desc: 'Carousel of clean categories with rounded images and titles underneath',
  },
  {
    type: 'product_showcase',
    label: 'Product Showcase',
    icon: ShoppingBag,
    desc: 'Premium carousel of product cards with pricing and badges',
  },
  {
    type: 'video_stories',
    label: 'Video Stories',
    icon: Video,
    desc: 'Hover-to-play video carousel with related products',
  },
  {
    type: 'trust_badges',
    label: 'Trust Badges',
    icon: ShieldCheck,
    desc: 'Row of feature highlights with icons, titles and subtext',
  },
  {
    type: 'stats_counter',
    label: 'Stats Counter',
    icon: TrendingUp,
    desc: 'Big bold numbers with labels — years of trust, deliveries, countries etc.',
  },
];

const DEFAULT_CONFIGS = {
  occasion_cards: {
    title: 'Gift Categories',
    titleColor: '#111827',
    subtitle: '',
    cards: [],
  },
  banner_slider: {
    autoPlay: true,
    autoPlayDelay: 4000,
    slides: [],
  },
  category_carousel: {
    title: 'Pick their favourite Flower',
    slidesPerView: 4,
    autoPlay: false,
    autoPlayDelay: 4000,
    categories: [],
  },
  product_showcase: {
    title: 'Newly Launched',
    slidesPerView: 4,
    autoPlay: false,
    autoPlayDelay: 4000,
    products: [],
  },
  video_stories: {
    title: 'Joyful Gifting Stories',
    bgColor: 'transparent',
    slides: [],
  },
  trust_badges: {
    badges: [],
  },
  stats_counter: {
    bgColor: '#f0f2ec',
    accentColor: '#6a8f4b',
    stats: [],
  },
};

/** Strip client-only _file/_preview fields before JSON stringify */
function cleanConfig(type, config) {
  const c = { ...config };
  if (type === 'occasion_cards' && c.cards) {
    c.cards = c.cards.map(({ _file, _preview, ...rest }) => rest);
  }
  if (type === 'banner_slider' && c.slides) {
    c.slides = c.slides.map(({ _file, _preview, ...rest }) => rest);
  }
  if (type === 'category_carousel' && c.categories) {
    c.categories = c.categories.map(({ _file, _preview, ...rest }) => rest);
  }
  if (type === 'product_showcase' && c.products) {
    c.products = c.products.map(({ _file, _preview, ...rest }) => rest);
  }
  if (type === 'video_stories' && c.slides) {
    c.slides = c.slides.map(({ _file, _preview, products, ...rest }) => ({
      ...rest,
      products: products ? products.map(({ _file: pf, _preview: pp, ...pRest }) => pRest) : []
    }));
  }
  return c;
}

/* ────────────────────────────────────────────
   Main Page Component
───────────────────────────────────────────── */


export default function HomepageSettings() {
  const router = useRouter();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const [deleteSectionId, setDeleteSectionId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);
  
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('order');
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  /* Load */
  useEffect(() => {
    fetch('/api/store-homepage')
      .then((r) => r.json())
      .then((data) => {
        const sorted = (data.sections || []).slice().sort((a, b) => a.order - b.order);
        setSections(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* Section operations */
  const addSection = async (type) => {
    const id = genId();
    const newSection = { id, type, order: sections.length, isVisible: true, config: { ...DEFAULT_CONFIGS[type] } };
    const newSections = [...sections, newSection];
    
    setSections(newSections);
    setShowPicker(false);
    
    // Auto-save so the sidebar updates and the new route exists
    await handleSave(newSections);
    router.push(`/dashboard/homepage/${id}`);
  };

  const removeSection = (id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setDeleteSectionId(null);
    setIsDirty(true);
  };

  const moveSection = (id, dir) => {
    setSections((prev) => {
      const arr = [...prev];
      const i = arr.findIndex((s) => s.id === id);
      const swap = dir === 'up' ? i - 1 : i + 1;
      if (swap < 0 || swap >= arr.length) return arr;
      [arr[i], arr[swap]] = [arr[swap], arr[i]];
      return arr.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  const updateOrder = (id, newOrderVal) => {
    if (isNaN(newOrderVal) || newOrderVal < 1 || newOrderVal > sections.length) return;
    setSections((prev) => {
      const arr = [...prev];
      const currentIndex = arr.findIndex((s) => s.id === id);
      const targetIndex = newOrderVal - 1;
      if (currentIndex === targetIndex) return arr;
      
      const [item] = arr.splice(currentIndex, 1);
      arr.splice(targetIndex, 0, item);
      return arr.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  const toggleVisible = (id) => {
    setTogglingId(id);
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s)));
    setIsDirty(true);
    setTimeout(() => setTogglingId(null), 600);
  };

  const handleBulkDelete = async (selectedIds) => {
    setSections((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
    setIsDirty(true);
  };

  /* Drag and drop */
  const handleDragEnd = () => {
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setSections((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(dragOverIndex, 0, moved);
      return arr.map((s, idx) => ({ ...s, order: idx }));
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  /* Save */
  const handleSave = async (sectionsToSave = sections) => {
    setSaving(true);
    try {
      const fd = new FormData();

      const cleanedSections = sectionsToSave.map((s, idx) => ({
        ...s,
        order: idx,
        config: cleanConfig(s.type, s.config),
      }));

      fd.append('sections', JSON.stringify(cleanedSections));

      // Append pending image files (not needed for Layout but kept for API compatibility)
      sectionsToSave.forEach((section) => {
        if (section.type === 'occasion_cards') {
          (section.config.cards || []).forEach((card, i) => {
            if (card._file) fd.append(`img_${section.id}_cards_${i}_image`, card._file);
          });
        }
        if (section.type === 'banner_slider') {
          (section.config.slides || []).forEach((slide, i) => {
            if (slide._file) fd.append(`img_${section.id}_slides_${i}_image`, slide._file);
          });
        }
        if (section.type === 'category_carousel') {
          (section.config.categories || []).forEach((item, i) => {
            if (item._file) fd.append(`img_${section.id}_categories_${i}_image`, item._file);
          });
        }
        if (section.type === 'product_showcase') {
          (section.config.products || []).forEach((item, i) => {
            if (item._file) fd.append(`img_${section.id}_products_${i}_image`, item._file);
          });
        }
        if (section.type === 'video_stories') {
          (section.config.slides || []).forEach((slide, i) => {
            if (slide._file) fd.append(`img_${section.id}_slides_${i}_video`, slide._file);
            (slide.products || []).forEach((prod, j) => {
              if (prod._file) fd.append(`img_${section.id}_slides_${i}_products_${j}_image`, prod._file);
            });
          });
        }
      });

      const res = await fetch('/api/admin/store-homepage', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      // Update state with saved sections
      const sorted = (data.sections || []).slice().sort((a, b) => a.order - b.order);
      setSections(sorted);
      addToast('Homepage layout saved!');
      setIsDirty(false);
      
      // Dispatch event to update sidebar
      window.dispatchEvent(new Event('homepageUpdated'));
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredSections = sections
    .filter(s => {
      const title = s.config?.title?.toLowerCase() || '';
      const typeLabel = SECTION_TYPES.find(t => t.type === s.type)?.label?.toLowerCase() || '';
      return title.includes(search.toLowerCase()) || typeLabel.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sort === 'order') return a.order - b.order;
      if (sort === 'a-z') return (a.config?.title || '').localeCompare(b.config?.title || '');
      if (sort === 'z-a') return (b.config?.title || '').localeCompare(a.config?.title || '');
      return 0;
    });

  const getItemCount = (row) => {
    if (row.type === 'occasion_cards') return `${row.config?.cards?.length ?? 0} cards`;
    if (row.type === 'banner_slider') return `${row.config?.slides?.length ?? 0} slides`;
    if (row.type === 'category_carousel') return `${row.config?.categories?.length ?? 0} items`;
    if (row.type === 'product_showcase') return `${row.config?.products?.length ?? 0} products`;
    if (row.type === 'video_stories') return `${row.config?.slides?.length ?? 0} videos`;
    if (row.type === 'trust_badges') return `${row.config?.badges?.length ?? 0} badges`;
    if (row.type === 'stats_counter') return `${row.config?.stats?.length ?? 0} stats`;
    return '—';
  };

  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutTemplate size={22} className="text-primary" />
            Homepage Layout
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your storefront sections. Reorder, hide, or configure them using the table below.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Sort Dropdown */}
          <CustomSelect
            value={sort}
            onChange={setSort}
            size="sm"
            fullWidth={false}
            className="w-36"
            options={[
              { value: 'order', label: 'Default Order' },
              { value: 'a-z', label: 'Title (A-Z)' },
              { value: 'z-a', label: 'Title (Z-A)' },
            ]}
          />

          <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto" ref={pickerRef}>
              <Button variant="outline" onClick={() => setShowPicker((v) => !v)} className="gap-2 w-full cursor-pointer">
                <Plus size={16} />
                Add Section
              </Button>
              {showPicker && (
                <div className="absolute right-0 top-full mt-2 w-72 dropdown-menu-surface border border-border shadow-2xl z-[9999] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {SECTION_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.type}
                        onClick={() => addSection(t.type)}
                        className="w-full text-left px-4 py-3 hover:bg-muted/60 flex items-center gap-3 border-b border-border last:border-0 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{t.label}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => handleSave(sections)} 
              disabled={saving} 
              className={`min-w-[140px] w-full sm:w-auto transition-all duration-300 ${isDirty ? 'bg-amber-600 hover:bg-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.5)] animate-pulse text-white' : ''}`}
            >
              <Save size={15} className="mr-2" />
              {saving ? 'Saving…' : (isDirty ? 'Save Layout *' : 'Save Layout')}
            </Button>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <div className="mt-4">
        <DataTable
          columns={[
            {
              key: 'type',
              label: 'Type',
              render: (row) => {
                const typeInfo = SECTION_TYPES.find(t => t.type === row.type);
                const Icon = typeInfo?.icon || LayoutTemplate;
                return (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon size={15} />
                    </div>
                    <span className="font-semibold text-sm text-foreground">{typeInfo?.label ?? row.type}</span>
                  </div>
                );
              }
            },
            {
              key: 'title',
              label: 'Section Title',
              render: (row) => (
                <span className="text-sm font-semibold text-foreground">
                  {row.config?.title || <span className="text-muted-foreground">—</span>}
                </span>
              )
            },
            {
              key: 'content',
              label: 'Content',
              render: (row) => (
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {getItemCount(row)}
                </span>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => (
                <div onClick={e => e.stopPropagation()}>
                  <StatusSwitch
                    checked={row.isVisible}
                    loading={togglingId === row.id}
                    onCheckedChange={() => toggleVisible(row.id)}
                    label={row.isVisible ? 'Visible' : 'Hidden'}
                  />
                </div>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              align: 'right',
              render: (row) => (
                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => router.push(`/dashboard/homepage/${row.id}`)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                    title="Edit Section"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteSectionId(row.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
                    title="Delete Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            }
          ]}
          data={filteredSections}
          loading={loading}
          actions={false}
          pagination={false}
          onBulkDelete={handleBulkDelete}
          onRowClick={(row) => router.push(`/dashboard/homepage/${row.id}`)}
          onReorder={(newOrder) => { 
            setSections(newOrder); 
            handleSave(newOrder); 
          }}
        />
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteSectionId}
        onClose={() => setDeleteSectionId(null)}
        onConfirm={() => removeSection(deleteSectionId)}
        title="Delete Section"
        description="Are you sure you want to delete this section? This action cannot be undone."
      />

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
