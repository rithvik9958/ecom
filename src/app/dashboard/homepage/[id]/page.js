'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import DataTable from '@/components/dashboard/DataTable';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import {
  Save, Plus, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Eye, EyeOff, ChevronDown as ExpandIcon, Image as ImageIcon, X,
  Layers, LayoutTemplate, Pencil, Edit2, Search,
  Gift, Sparkles, ShoppingBag, Video, ShieldCheck, TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import Toast from '@/components/dashboard/Toast';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import CategoryCarouselConfig from '@/components/dashboard/CategoryCarouselConfig';
import ProductShowcaseConfig from '@/components/dashboard/ProductShowcaseConfig';
import VideoStoriesConfig from '@/components/dashboard/VideoStoriesConfig';
import TrustBadgesConfig from '@/components/dashboard/TrustBadgesConfig';
import StatsCounterConfig from '@/components/dashboard/StatsCounterConfig';
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
    desc: 'Row of feature highlights with icons and subtext',
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

function getImgSrc(img) {
  if (!img) return '';
  if (img.startsWith('http') || img.startsWith('blob:')) return img;
  return `/uploads/${img}`;
}

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
  if (type === 'trust_badges' && c.badges) {
    c.badges = c.badges.map(({ _file, _preview, ...rest }) => rest);
  }
  return c;
}

function OccasionCardsConfig({ config, onChange }) {
  const title = config.title ?? 'Gift Categories';
  const subtitle = config.subtitle ?? '';
  const cards = config.cards ?? [];

  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteCardIndex, setDeleteCardIndex] = useState(null);
  const [togglingIndex, setTogglingIndex] = useState(null);
  const isEditing = editingIndex !== null;
  const currentCard = isEditing ? cards[editingIndex] : null;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('order');

  const filteredCards = cards
    .filter(c => (c.title || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });

  const update = (field, val) => onChange({ ...config, [field]: val });

  const addCard = () => {
    onChange({
      ...config,
      cards: [
        ...cards,
        { title: '', badge: '', bgColor: '#e0f2fe', image: '', link: '/products', textAlign: 'left', imageAlign: 'right', isVisible: true },
      ],
    });
    setEditingIndex(cards.length);
  };

  const removeCard = (i) => {
    onChange({ ...config, cards: cards.filter((_, idx) => idx !== i) });
    setDeleteCardIndex(null);
  };

  const toggleCardStatus = (idx) => {
    setTogglingIndex(idx);
    const next = [...cards];
    const cur = next[idx]?.isVisible !== false;
    next[idx] = { ...next[idx], isVisible: !cur };
    onChange({ ...config, cards: next });
    setTimeout(() => setTogglingIndex(null), 400);
  };

  const handleBulkDelete = async (selectedIndices) => {
    const next = cards.filter((_, idx) => !selectedIndices.includes(String(idx)));
    onChange({ ...config, cards: next });
  };

  const updateCurrentCard = (field, val) => {
    if (editingIndex === null) return;
    const next = [...cards];
    next[editingIndex] = { ...next[editingIndex], [field]: val };
    onChange({ ...config, cards: next });
  };

  const handleFile = (e) => {
    if (editingIndex === null) return;
    const file = e.target.files[0];
    if (!file) return;
    const next = [...cards];
    next[editingIndex] = { ...next[editingIndex], _file: file, _preview: URL.createObjectURL(file) };
    onChange({ ...config, cards: next });
  };

  return (
    <div className="space-y-6">
      {/* Section Fields */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Section Title</label>
          <Input value={title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Gift Categories" className="h-10 text-sm" />
        </div>
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Subtitle (Optional)</label>
          <Input value={subtitle} onChange={(e) => update('subtitle', e.target.value)} placeholder="e.g. Handpicked for your loved ones" className="h-10 text-sm" />
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Title Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={config.titleColor || '#111827'}
              onChange={(e) => update('titleColor', e.target.value)}
              className="h-10 w-12 rounded-lg border border-border p-1 cursor-pointer bg-background shrink-0"
            />
            <Input
              value={config.titleColor || '#111827'}
              onChange={(e) => update('titleColor', e.target.value)}
              className="font-mono uppercase text-xs h-10 flex-1"
            />
          </div>
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Background Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={config.bgColor || 'transparent'}
              onChange={(e) => update('bgColor', e.target.value)}
              className="h-10 w-12 rounded-lg border border-border p-1 cursor-pointer bg-background shrink-0"
            />
            <Input
              value={config.bgColor || 'transparent'}
              onChange={(e) => update('bgColor', e.target.value)}
              className="font-mono uppercase text-xs h-10 flex-1"
            />
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Gift size={18} className="text-primary" />
              Mini Cards ({cards.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag to reorder horizontal scrollable cards with customizable badge and palette.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search cards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
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
            <Button size="sm" onClick={addCard} className="w-full sm:w-auto h-9 gap-1.5">
              <Plus size={15} /> Add Card
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            columns={[
              {
                key: 'image',
                label: 'Image',
                render: (row) => (
                  <div className="w-12 h-12 rounded-lg border border-border shadow-xs flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: row.bgColor || '#e0f2fe' }}>
                    {row._preview || row.image ? (
                      <img src={row._preview || getImgSrc(row.image)} alt="thumbnail" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon size={18} className="text-muted-foreground opacity-50" />
                    )}
                  </div>
                )
              },
              {
                key: 'title',
                label: 'Card Details',
                render: (row) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm text-foreground">{row.title || 'Image Only Card'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{row.link || 'No link'}</span>
                      {row.badge && (
                        <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {row.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (row) => {
                  const i = cards.indexOf(row);
                  const isActive = row.isVisible !== false;
                  return (
                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusSwitch
                        checked={isActive}
                        loading={togglingIndex === i}
                        onCheckedChange={() => toggleCardStatus(i)}
                        label={isActive ? 'Active' : 'Inactive'}
                      />
                    </div>
                  );
                }
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (row) => {
                  const i = cards.indexOf(row);
                  return (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingIndex(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                        title="Edit Card"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCardIndex(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
                        title="Delete Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }
              }
            ]}
            data={filteredCards}
            loading={false}
            actions={false}
            pagination={false}
            onBulkDelete={handleBulkDelete}
            onRowClick={(row) => setEditingIndex(cards.indexOf(row))}
            onReorder={(newOrder) => onChange({ ...config, cards: newOrder }, true)}
          />
        </div>
      </div>

      {/* Edit Card Modal */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Gift size={20} className="text-primary" />
                {currentCard?.title ? `Edit "${currentCard.title}"` : 'Edit Card'}
              </DialogTitle>
              {currentCard && (
                <StatusSwitch
                  checked={currentCard.isVisible !== false}
                  onCheckedChange={(val) => updateCurrentCard('isVisible', val)}
                  label={currentCard.isVisible !== false ? 'Active' : 'Hidden'}
                />
              )}
            </div>
          </DialogHeader>
          
          {currentCard && (
            <div className="flex gap-6 py-4">
              {/* Image side */}
              <div className="shrink-0 w-1/3 space-y-4">
                <label className="text-sm font-medium mb-1 block">Card Image</label>
                <div
                  className="relative aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer group w-full"
                  style={{ backgroundColor: currentCard.bgColor || '#e0f2fe' }}
                >
                  {currentCard._preview || currentCard.image ? (
                    <img
                      src={currentCard._preview || getImgSrc(currentCard.image)}
                      alt="preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                      <ImageIcon size={24} />
                      <span className="text-xs">Upload Image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/webp,image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleFile}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded">Change Image</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Tip:</strong> If you leave the Title and Badge empty, this image will fill the entire card (ideal for custom graphics).
                </p>
              </div>

              {/* Fields side */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold mb-1 block text-muted-foreground">Title (Leave empty for image-only)</label>
                    <Input value={currentCard.title || ''} onChange={(e) => updateCurrentCard('title', e.target.value)} placeholder="e.g. Anniversary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-muted-foreground">Badge (Optional)</label>
                    <Input value={currentCard.badge || ''} onChange={(e) => updateCurrentCard('badge', e.target.value)} placeholder="e.g. 28TH AUG" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-muted-foreground">Link URL</label>
                    <Input value={currentCard.link || ''} onChange={(e) => updateCurrentCard('link', e.target.value)} placeholder="/category/anniversary" />
                  </div>
                  
                  <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <label className="text-xs font-semibold mb-1 block text-muted-foreground">Background Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={currentCard.bgColor || '#e0f2fe'} onChange={(e) => updateCurrentCard('bgColor', e.target.value)} className="h-9 w-10 rounded cursor-pointer" />
                        <Input value={currentCard.bgColor || '#e0f2fe'} onChange={(e) => updateCurrentCard('bgColor', e.target.value)} className="font-mono text-sm uppercase flex-1" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block text-muted-foreground">Text Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={currentCard.textColor || '#333333'} onChange={(e) => updateCurrentCard('textColor', e.target.value)} className="h-9 w-10 rounded cursor-pointer" />
                        <Input value={currentCard.textColor || '#333333'} onChange={(e) => updateCurrentCard('textColor', e.target.value)} className="font-mono text-sm uppercase flex-1" />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <label className="text-xs font-semibold mb-1 block text-muted-foreground">Text Position</label>
                      <CustomSelect
                        value={currentCard.textAlign || 'left'}
                        onChange={(val) => updateCurrentCard('textAlign', val)}
                        size="sm"
                        options={[
                          { value: 'left', label: 'Left' },
                          { value: 'right', label: 'Right' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block text-muted-foreground">Image Position</label>
                      <CustomSelect
                        value={currentCard.imageAlign || 'right'}
                        onChange={(val) => updateCurrentCard('imageAlign', val)}
                        size="sm"
                        options={[
                          { value: 'right', label: 'Right' },
                          { value: 'left', label: 'Left' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="default" onClick={() => setEditingIndex(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={deleteCardIndex !== null}
        onClose={() => setDeleteCardIndex(null)}
        onConfirm={() => removeCard(deleteCardIndex)}
        title="Delete Card"
        description="Are you sure you want to delete this card? This action cannot be undone."
      />
    </div>
  );
}

/* ────────────────────────────────────────────
   Sub-component: Banner Slider Config
───────────────────────────────────────────── */
function BannerSliderConfig({ config, onChange }) {
  const autoPlay = config.autoPlay ?? true;
  const autoPlayDelay = config.autoPlayDelay ?? 4000;
  const slidesPerView = config.slidesPerView ?? 1.1;
  const slides = config.slides ?? [];

  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteSlideIndex, setDeleteSlideIndex] = useState(null);
  const [togglingIndex, setTogglingIndex] = useState(null);
  const isEditing = editingIndex !== null;
  const currentSlide = isEditing ? slides[editingIndex] : null;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('order');

  const filteredSlides = slides
    .filter(s => (s.title || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });

  const update = (field, val) => onChange({ ...config, [field]: val });

  const addSlide = () => {
    onChange({
      ...config,
      slides: [
        ...slides,
        {
          overtitle: '',
          title: '',
          description: '',
          buttonText: 'Order Now',
          link: '/products',
          bgColor: '#f5f0e8',
          image: '',
          textColor: '#333333',
          isVisible: true,
        },
      ],
    });
    setEditingIndex(slides.length);
  };

  const removeSlide = (i) => {
    onChange({ ...config, slides: slides.filter((_, idx) => idx !== i) });
    setDeleteSlideIndex(null);
  };

  const toggleSlideStatus = (idx) => {
    setTogglingIndex(idx);
    const next = [...slides];
    const cur = next[idx]?.isVisible !== false;
    next[idx] = { ...next[idx], isVisible: !cur };
    onChange({ ...config, slides: next });
    setTimeout(() => setTogglingIndex(null), 400);
  };

  const handleBulkDelete = async (selectedIndices) => {
    const next = slides.filter((_, idx) => !selectedIndices.includes(String(idx)));
    onChange({ ...config, slides: next });
  };

  const updateCurrentSlide = (field, val) => {
    if (editingIndex === null) return;
    const next = [...slides];
    next[editingIndex] = { ...next[editingIndex], [field]: val };
    onChange({ ...config, slides: next });
  };

  const handleFile = (e) => {
    if (editingIndex === null) return;
    const file = e.target.files[0];
    if (!file) return;
    const next = [...slides];
    next[editingIndex] = { ...next[editingIndex], _file: file, _preview: URL.createObjectURL(file) };
    onChange({ ...config, slides: next });
  };

  return (
    <div className="space-y-6">
      {/* Section Fields */}
      <div className="flex gap-4 items-end">
        <div className="w-full sm:w-56 shrink-0">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Background Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={config.bgColor || 'transparent'}
              onChange={(e) => update('bgColor', e.target.value)}
              className="h-10 w-12 rounded-lg border border-border p-1 cursor-pointer bg-background shrink-0"
            />
            <Input
              value={config.bgColor || 'transparent'}
              onChange={(e) => update('bgColor', e.target.value)}
              className="font-mono uppercase text-xs h-10 flex-1"
            />
          </div>
        </div>
      </div>

      {/* Auto-play + slides settings */}
      <div className="flex flex-wrap gap-4 items-center p-3.5 bg-muted/30 border border-border rounded-xl">
        <div className="flex items-center gap-2.5">
          <Switch checked={autoPlay} onCheckedChange={(v) => update('autoPlay', v)} />
          <label className="text-sm font-semibold text-foreground">Auto Play</label>
        </div>
        {autoPlay && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Delay</label>
            <Input
              type="number"
              step={500}
              min={1000}
              max={10000}
              value={autoPlayDelay}
              onChange={(e) => update('autoPlayDelay', Number(e.target.value))}
              className="h-8 w-24 text-xs font-mono"
            />
            <span className="text-xs text-muted-foreground">ms</span>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Visible slides</label>
          <CustomSelect
            value={String(slidesPerView)}
            onChange={(val) => update('slidesPerView', Number(val))}
            size="sm"
            fullWidth={false}
            className="w-44"
            options={[
              { value: '1', label: '1 — Full width' },
              ...(slides.length > 1 ? [
                { value: '1.1', label: '1 + peek (default)' },
                { value: '1.2', label: '1 + wide peek' },
                { value: '1.5', label: '1.5 — Half visible' },
              ] : []),
              ...(slides.length >= 2 ? [{ value: '2', label: '2 — Two at once' }] : []),
              ...(slides.length > 2 ? [{ value: '2.1', label: '2 + peek' }] : []),
              ...(slides.length >= 3 ? [{ value: '3', label: '3 — Three at once' }] : []),
              ...(slides.length >= 4 ? [{ value: '4', label: '4 — Four at once' }] : []),
              ...(slides.length >= 5 ? [{ value: '5', label: '5 — Five at once' }] : []),
            ]}
          />
        </div>
      </div>

      {/* Slides List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <ImageIcon size={18} className="text-primary" />
              Banner Slides ({slides.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag to reorder hero banners, customize titles, actions, and slide backgrounds.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search slides..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
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
            <Button size="sm" onClick={addSlide} className="w-full sm:w-auto h-9 gap-1.5">
              <Plus size={15} /> Add Slide
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            columns={[
              {
                key: 'image',
                label: 'Image',
                render: (row) => (
                  <div className="w-20 h-12 rounded-lg border border-border shadow-xs flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: row.bgColor || '#f5f0e8' }}>
                    {row._preview || row.image ? (
                      <img src={row._preview || getImgSrc(row.image)} alt="thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={18} className="text-muted-foreground opacity-50" />
                    )}
                  </div>
                )
              },
              {
                key: 'title',
                label: 'Banner Details',
                render: (row) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm text-foreground">{row.title || row.overtitle || 'Untitled Slide'}</span>
                    <div className="flex items-center gap-2">
                      {row.overtitle && (
                        <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {row.overtitle}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">{row.link || '/products'}</span>
                    </div>
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (row) => {
                  const i = slides.indexOf(row);
                  const isActive = row.isVisible !== false;
                  return (
                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusSwitch
                        checked={isActive}
                        loading={togglingIndex === i}
                        onCheckedChange={() => toggleSlideStatus(i)}
                        label={isActive ? 'Active' : 'Inactive'}
                      />
                    </div>
                  );
                }
              },
              {
                key: 'actions',
                label: 'Actions',
                align: 'right',
                render: (row) => {
                  const i = slides.indexOf(row);
                  return (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingIndex(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                        title="Edit Slide"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteSlideIndex(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
                        title="Delete Slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }
              }
            ]}
            data={filteredSlides}
            loading={false}
            actions={false}
            pagination={false}
            onBulkDelete={handleBulkDelete}
            onRowClick={(row) => setEditingIndex(slides.indexOf(row))}
            onReorder={(newOrder) => onChange({ ...config, slides: newOrder }, true)}
          />
        </div>
      </div>

      {/* Edit Slide Modal */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <ImageIcon size={20} className="text-primary" />
                Edit Slide {editingIndex !== null ? `#${editingIndex + 1}` : ''}
              </DialogTitle>
              {currentSlide && (
                <StatusSwitch
                  checked={currentSlide.isVisible !== false}
                  onCheckedChange={(val) => updateCurrentSlide('isVisible', val)}
                  label={currentSlide.isVisible !== false ? 'Active' : 'Hidden'}
                />
              )}
            </div>
          </DialogHeader>
          
          {currentSlide && (
            <div className="flex gap-6 py-4">
              {/* Image & Preview side */}
              <div className="shrink-0 w-2/5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Slide Image (goes on right side)</label>
                  <div
                    className="relative aspect-video rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer group w-full"
                    style={{ backgroundColor: currentSlide.bgColor || '#f5f0e8' }}
                  >
                    {currentSlide._preview || currentSlide.image ? (
                      <img
                        src={currentSlide._preview || getImgSrc(currentSlide.image)}
                        alt="preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                        <ImageIcon size={24} />
                        <span className="text-xs">Upload Image</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/webp,image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      onChange={handleFile}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xs font-medium bg-black/40 px-2 py-1 rounded">Change Image</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <label className="text-xs text-muted-foreground mb-2 block font-semibold uppercase tracking-wide">Mini Layout Preview</label>
                  <div className="relative w-full h-32 rounded-lg border border-border overflow-hidden" style={{ backgroundColor: currentSlide.bgColor || '#f5f0e8' }}>
                    <div className="absolute left-3 bottom-0 top-0 flex flex-col justify-center gap-1 text-left max-w-[50%] z-10">
                      {currentSlide.overtitle && <span className="text-[9px] font-semibold opacity-80" style={{ color: currentSlide.overtitleColor || currentSlide.textColor || '#333' }}>{currentSlide.overtitle}</span>}
                      {currentSlide.title && <span className="text-xs font-bold leading-tight" style={{ color: currentSlide.titleColor || currentSlide.textColor || '#333' }}>{currentSlide.title}</span>}
                      {currentSlide.description && <span className="text-[9px] opacity-80" style={{ color: currentSlide.descColor || currentSlide.textColor || '#333' }}>{currentSlide.description}</span>}
                      {currentSlide.buttonText && (
                        <span className="mt-1 inline-block text-[9px] font-semibold bg-white/90 text-gray-800 px-2 py-0.5 rounded-full w-fit shadow-sm">
                          {currentSlide.buttonText} →
                        </span>
                      )}
                    </div>
                    {/* Mock image position */}
                    <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-black/5 flex items-center justify-center">
                      <ImageIcon size={24} className="text-black/10" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Fields side */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold mb-1 block text-muted-foreground">Main Title (large bold text)</label>
                    <Input value={currentSlide.title || ''} onChange={(e) => updateCurrentSlide('title', e.target.value)} placeholder="e.g. up to 80% OFF" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-muted-foreground">Over-Title (small text above)</label>
                    <Input value={currentSlide.overtitle || ''} onChange={(e) => updateCurrentSlide('overtitle', e.target.value)} placeholder="e.g. Celebrate Independence" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-muted-foreground">Description</label>
                    <Input value={currentSlide.description || ''} onChange={(e) => updateCurrentSlide('description', e.target.value)} placeholder="e.g. Find thoughtful gifts" />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-muted-foreground">Button Text</label>
                    <Input value={currentSlide.buttonText || ''} onChange={(e) => updateCurrentSlide('buttonText', e.target.value)} placeholder="Order Now" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-muted-foreground">Button Link</label>
                    <Input value={currentSlide.link || ''} onChange={(e) => updateCurrentSlide('link', e.target.value)} placeholder="/products" />
                  </div>
                  
                  <div className="col-span-2 grid grid-cols-4 gap-3 pt-4 border-t border-border mt-2">
                    <div>
                      <label className="text-xs font-semibold mb-1 block text-muted-foreground">Background</label>
                      <div className="flex gap-2">
                        <input type="color" value={currentSlide.bgColor || '#f5f0e8'} onChange={(e) => updateCurrentSlide('bgColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer shrink-0" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block text-muted-foreground">Tag Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={currentSlide.overtitleColor || currentSlide.textColor || '#333333'} onChange={(e) => updateCurrentSlide('overtitleColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer shrink-0" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block text-muted-foreground">Title Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={currentSlide.titleColor || currentSlide.textColor || '#333333'} onChange={(e) => updateCurrentSlide('titleColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer shrink-0" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block text-muted-foreground">Subtext Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={currentSlide.descColor || currentSlide.textColor || '#555555'} onChange={(e) => updateCurrentSlide('descColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="default" onClick={() => setEditingIndex(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={deleteSlideIndex !== null}
        onClose={() => setDeleteSlideIndex(null)}
        onConfirm={() => removeSlide(deleteSlideIndex)}
        title="Delete Slide"
        description="Are you sure you want to delete this slide? This action cannot be undone."
      />
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Single Section Editor Component
───────────────────────────────────────────── */

export default function SingleSectionEditor({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);
  
  const sectionId = unwrappedParams.id;

  /* Load */
  useEffect(() => {
    fetch('/api/store-homepage')
      .then((r) => r.json())
      .then((data) => {
        const sorted = (data.sections || []).sort((a, b) => a.order - b.order);
        setSections(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sectionIndex = sections.findIndex(s => s.id === sectionId);
  const section = sections[sectionIndex];

  const updateConfig = (cfg, autoSave = false) => {
    let nextSections;
    setSections((prev) => {
      const arr = [...prev];
      arr[sectionIndex] = { ...arr[sectionIndex], config: cfg };
      nextSections = arr;
      return arr;
    });
    
    if (autoSave) {
      setTimeout(() => handleSave(nextSections), 0);
    } else {
      setIsDirty(true);
    }
  };

  /* Save */
  const handleSave = async (sectionsToSave = sections) => {
    setSaving(true);
    try {
      const currentSectionToSave = sectionsToSave[sectionIndex];
      const fd = new FormData();

      const cleanedSections = sectionsToSave.map((s) => ({
        ...s,
        config: cleanConfig(s.type, s.config),
      }));

      fd.append('sections', JSON.stringify(cleanedSections));

      // Append pending image files ONLY for this section (optimization)
      if (currentSectionToSave.type === 'occasion_cards') {
        (currentSectionToSave.config.cards || []).forEach((card, i) => {
          if (card._file) fd.append(`img_${currentSectionToSave.id}_cards_${i}_image`, card._file);
        });
      }
      if (currentSectionToSave.type === 'banner_slider') {
        (currentSectionToSave.config.slides || []).forEach((slide, i) => {
          if (slide._file) fd.append(`img_${currentSectionToSave.id}_slides_${i}_image`, slide._file);
        });
      }
      if (currentSectionToSave.type === 'category_carousel') {
        (currentSectionToSave.config.categories || []).forEach((cat, i) => {
          if (cat._file) fd.append(`img_${currentSectionToSave.id}_categories_${i}_image`, cat._file);
        });
      }
      if (currentSectionToSave.type === 'product_showcase') {
        (currentSectionToSave.config.products || []).forEach((prod, i) => {
          if (prod._file) fd.append(`img_${currentSectionToSave.id}_products_${i}_image`, prod._file);
        });
      }
      if (currentSectionToSave.type === 'video_stories') {
        (currentSectionToSave.config.slides || []).forEach((slide, i) => {
          if (slide._file) fd.append(`img_${currentSectionToSave.id}_slides_${i}_video`, slide._file);
          (slide.products || []).forEach((prod, j) => {
            if (prod._file) fd.append(`img_${currentSectionToSave.id}_slides_${i}_products_${j}_image`, prod._file);
          });
        });
      }
      if (currentSectionToSave.type === 'trust_badges') {
        (currentSectionToSave.config.badges || []).forEach((badge, i) => {
          if (badge._file) fd.append(`img_${currentSectionToSave.id}_badges_${i}_image`, badge._file);
        });
      }

      const res = await fetch('/api/admin/store-homepage', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setSections(data.sections || []);
      addToast('Section saved!');
      setIsDirty(false);
      
      // Notify sidebar to refresh titles if they changed
      window.dispatchEvent(new Event('homepageUpdated'));
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-muted-foreground">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        Loading section...
      </div>
    );
  }

  if (!section) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <div className="text-lg font-semibold">Section not found</div>
        <Button variant="outline" onClick={() => router.push('/dashboard/homepage')}>Return to Layout</Button>
      </div>
    );
  }

  const typeInfo = SECTION_TYPES.find((t) => t.type === section.type);
  return (
    <div className="p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-start gap-4">
          {/* Back Navigation */}
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 shrink-0 bg-muted/50 hover:bg-muted border border-transparent hover:border-border"
            onClick={() => router.push('/dashboard/homepage')}
            title="Go Back"
          >
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {(() => {
                const Icon = typeInfo?.icon || LayoutTemplate;
                return (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon size={22} />
                  </div>
                );
              })()}
              {typeInfo?.label}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {typeInfo?.desc}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/homepage')}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleSave()} 
            disabled={saving}
            className={`min-w-[140px] transition-all duration-300 ${isDirty ? 'bg-amber-600 hover:bg-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.5)] animate-pulse text-white' : ''}`}
          >
            <Save size={15} className="mr-2" />
            {saving ? 'Saving…' : (isDirty ? 'Save Changes *' : 'Save Changes')}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        {(() => {
          switch (section.type) {
            case 'occasion_cards':
              return <OccasionCardsConfig config={section.config} onChange={updateConfig} />;
            case 'banner_slider':
              return <BannerSliderConfig config={section.config} onChange={updateConfig} />;
            case 'category_carousel':
              return <CategoryCarouselConfig config={section.config} onChange={updateConfig} />;
            case 'product_showcase':
              return <ProductShowcaseConfig config={section.config} onChange={updateConfig} />;
            case 'video_stories':
              return <VideoStoriesConfig config={section.config} onChange={updateConfig} />;
            case 'trust_badges':
              return <TrustBadgesConfig config={section.config} onChange={updateConfig} />;
            case 'stats_counter':
              return <StatsCounterConfig config={section.config} onChange={updateConfig} />;
            default:
              return <div>Unknown component type: {section.type}</div>;
          }
        })()}
      </div>

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
