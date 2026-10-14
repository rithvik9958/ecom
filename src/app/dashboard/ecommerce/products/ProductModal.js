'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import CustomSelect from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/input';
import {
  ImageIcon, X, Settings2, Plus, Trash2, Package, Truck, Tag,
  Star, Gift, FileText, Layers, Loader2, Sparkles, Check, AlertCircle
} from 'lucide-react';

const TAG_PRESETS = [
  { label: 'Indigo', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  { label: 'Gold', bg: '#fefce8', color: '#a16207', border: '#fef08a' },
  { label: 'Green', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  { label: 'Coral', bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  { label: 'Violet', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
  { label: 'Peach', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
  { label: 'Teal', bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  { label: 'Dark', bg: '#18181b', color: '#ffffff', border: '#27272a' },
];

function normalizeTag(tag) {
  if (typeof tag === 'object' && tag !== null) {
    return {
      name: tag.name || tag.label || '',
      bg: tag.bg || '#eff6ff',
      color: tag.color || '#1d4ed8',
      border: tag.border || '#bfdbfe'
    };
  }
  const str = String(tag || '').trim();
  if (str.includes('|')) {
    const [name, bg, color, border] = str.split('|');
    return { name: name?.trim() || '', bg: bg?.trim() || '#eff6ff', color: color?.trim() || '#1d4ed8', border: border?.trim() || '#bfdbfe' };
  }
  const lower = str.toLowerCase();
  let preset = TAG_PRESETS[0];
  if (lower.includes('same day')) preset = TAG_PRESETS[5];
  else if (lower.includes('best seller') || lower.includes('bestseller')) preset = TAG_PRESETS[1];
  else if (lower.includes('trending')) preset = TAG_PRESETS[0];
  else if (lower.includes('fresh') || lower.includes('organic')) preset = TAG_PRESETS[2];
  else if (lower.includes('sale') || lower.includes('offer')) preset = TAG_PRESETS[3];
  else {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    preset = TAG_PRESETS[Math.abs(hash) % TAG_PRESETS.length];
  }
  return { name: str, bg: preset.bg, color: preset.color, border: preset.border };
}

export default function ProductModal({ product, categories = [], onClose, onSave }) {
  const isEdit = product && product !== 'new';
  const [activeTab, setActiveTab] = useState('general');
  
  const [form, setForm] = useState({
    title: isEdit ? product.title : '',
    description: isEdit ? product.description : '',
    category: isEdit ? product.category : '',
    unit: isEdit ? (product.unit || 'pcs') : 'pcs',
    price: isEdit ? product.price : '',
    mrp: isEdit ? product.mrp : '',
    stock: isEdit ? product.stock : '',
    maxQuantityPerOrder: isEdit ? (product.maxQuantityPerOrder ?? '') : '',
    rating: isEdit ? (product.rating ?? '') : '',
    reviewsCount: isEdit ? (product.reviewsCount ?? '') : '',
    // Manual/display rating override
    useManualRating: isEdit ? (product.useManualRating || false) : false,
    manualRating: isEdit ? (product.manualRating ?? '') : '',
    manualReviewsCount: isEdit ? (product.manualReviewsCount ?? '') : '',
    homepageSection: isEdit ? product.homepageSection : 'none',
    deliveryMode: isEdit ? (product.deliveryMode || 'courier') : 'courier',
    courierDays: isEdit ? (product.courierDays || '2-3') : '2-3',
    allowExpressUpgrade: isEdit ? (product.allowExpressUpgrade || false) : false,
    expressDeliveryMode: isEdit ? (product.expressDeliveryMode || 'slot') : 'slot',
    isActive: isEdit ? product.isActive : true
  });
  
  const [tagsList, setTagsList] = useState(() => {
    if (!isEdit || !product.tags || product.tags.length === 0) {
      return [
        { name: 'Same Day', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' },
        { name: 'Best Seller', bg: '#fefce8', color: '#a16207', border: '#fef08a' },
        { name: 'Trending', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
      ];
    }
    return product.tags.map(normalizeTag).filter(t => t.name);
  });
  const [newTagName, setNewTagName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(TAG_PRESETS[0]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customBg, setCustomBg] = useState('#eff6ff');
  const [customTextColor, setCustomTextColor] = useState('#1d4ed8');

  const [attributes, setAttributes] = useState(isEdit ? (product.attributes || []) : []);
  const [addOns, setAddOns] = useState(isEdit ? (product.addOns || []) : []);
  const [productDetails, setProductDetails] = useState(isEdit ? (product.productDetails || []) : []);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [addonSearch, setAddonSearch] = useState('');

  // Dynamic attribute template system
  const [attributeTemplateSlug, setAttributeTemplateSlug] = useState(isEdit ? (product.attributeTemplateSlug || '') : '');
  const [allTemplates, setAllTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);

  const normalizeAttrs = (raw) => {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    if (raw instanceof Map) return Object.fromEntries(raw);
    if (typeof raw.toJSON === 'function') return raw.toJSON();
    if (typeof raw === 'object') return { ...raw };
    return {};
  };

  const [dynAttrs, setDynAttrs] = useState(() => {
    if (!isEdit || !product.attrs) return {};
    return normalizeAttrs(product.attrs);
  });

  const [variants, setVariants] = useState(() => {
    if (!isEdit) return [];
    return (product.variants || []).map(v => ({
      ...v,
      price: v.price ?? '',
      mrp: v.mrp ?? '',
      stock: v.stock ?? '',
      sku: v.sku || '',
      isActive: v.isActive !== false,
      attrs: normalizeAttrs(v.attrs),
    }));
  });

  useEffect(() => {
    fetch('/api/store-addons')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailableAddons(data.addons.filter(a => a.isActive));
        }
      })
      .catch(() => {});

    fetch('/api/admin/attribute-templates')
      .then(r => r.json())
      .then(data => setAllTemplates(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!attributeTemplateSlug) { setActiveTemplate(null); return; }
    const found = allTemplates.find(t => t.slug === attributeTemplateSlug || t._id === attributeTemplateSlug);
    setActiveTemplate(found || null);
  }, [attributeTemplateSlug, allTemplates]);
  
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(isEdit ? product.thumbnail : null);
  
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [existingImages, setExistingImages] = useState(isEdit ? (product.images || []) : []);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    setGalleryFiles(prev => [...prev, ...files]);
  };

  const removeGalleryFile = (index) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.title.trim() || !form.category || !form.price) {
      setError('Title, Category, and Price are required');
      setActiveTab('general');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('unit', form.unit || 'pcs');
      fd.append('price', form.price);
      fd.append('mrp', form.mrp);
      fd.append('stock', form.stock);
      fd.append('maxQuantityPerOrder', form.maxQuantityPerOrder);
      fd.append('rating', form.rating);
      fd.append('reviewsCount', form.reviewsCount);
      fd.append('useManualRating', form.useManualRating);
      fd.append('manualRating', form.manualRating);
      fd.append('manualReviewsCount', form.manualReviewsCount);
      fd.append('homepageSection', form.homepageSection);
      fd.append('deliveryMode', form.deliveryMode);
      fd.append('courierDays', form.courierDays);
      fd.append('allowExpressUpgrade', form.allowExpressUpgrade);
      fd.append('expressDeliveryMode', form.expressDeliveryMode);
      fd.append('isActive', form.isActive);
      fd.append('tags', JSON.stringify(tagsList));
      fd.append('attributes', JSON.stringify(attributes));
      fd.append('addOns', JSON.stringify(addOns));
      fd.append('productDetails', JSON.stringify(productDetails));

      fd.append('attributeTemplateSlug', attributeTemplateSlug || '');
      fd.append('attrs', JSON.stringify(dynAttrs));
      fd.append('variants', JSON.stringify(variants));
      
      if (file) {
        fd.append('thumbnail', file);
      }
      
      fd.append('existingImages', JSON.stringify(existingImages));
      galleryFiles.forEach((f, idx) => {
        fd.append(`gallery_${idx}`, f);
      });
      fd.append('newGalleryCount', galleryFiles.length);

      const url = isEdit ? `/api/admin/store-products/${product._id || product.id}` : '/api/admin/store-products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: fd
      });

      if (!res.ok) {
        let errMsg = 'Failed to save product';
        try {
          const data = await res.json();
          errMsg = data.error || data.message || errMsg;
        } catch {
          const text = await res.text();
          errMsg = text.slice(0, 150) || errMsg;
        }
        throw new Error(errMsg);
      }

      const savedData = await res.json();
      onSave(savedData);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General & Pricing', icon: Package },
    { id: 'media', label: 'Media & Gallery', icon: ImageIcon, count: (existingImages.length + galleryFiles.length) + (preview ? 1 : 0) },
    { id: 'variants', label: 'Variants & Attributes', icon: Layers, count: variants.length },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'badges_specs', label: 'Badges, Specs & Ratings', icon: Tag },
    { id: 'addons', label: 'Add-ons & Cross-Sells', icon: Gift, count: addOns.length },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Sticky Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Package size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {isEdit ? `Edit "${form.title || 'Product'}"` : 'Add New Product'}
                  </DialogTitle>
                  {form.category && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                      {form.category}
                    </span>
                  )}
                  {form.price && (
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-muted text-foreground border border-border">
                      ₹{Number(form.price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEdit ? 'Update product pricing, images, variants, attributes and delivery modes.' : 'Configure a new storefront product with pricing, media and attributes.'}
                </p>
              </div>
            </div>

            {/* Header Status Toggle */}
            <div className="flex items-center gap-3">
              <StatusSwitch
                checked={form.isActive}
                onCheckedChange={v => setForm({ ...form, isActive: v })}
                label={form.isActive ? 'Active' : 'Draft / Inactive'}
              />
            </div>
          </div>

          {/* Sub-Header Tab Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-border mt-3 -mb-4 pb-3 px-1 overflow-x-auto no-scrollbar">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                  {t.count !== undefined && t.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 text-xs text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 1: GENERAL & PRICING
             ────────────────────────────────────────────────────────── */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                  <Package size={14} className="text-primary" /> Basic Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                      Product Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Red Roses Bouquet with Luxury Box"
                      className="h-10 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                      Category <span className="text-destructive">*</span>
                    </label>
                    <CustomSelect
                      value={form.category}
                      onChange={val => setForm({ ...form, category: val })}
                      options={categories.map(c => ({ value: c.slug, label: c.title }))}
                      placeholder="Select Category..."
                      searchable={true}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                      Homepage Showcase Section
                    </label>
                    <CustomSelect
                      value={form.homepageSection}
                      onChange={val => setForm({ ...form, homepageSection: val })}
                      options={[
                        { value: 'none', label: 'None (Regular Catalog)' },
                        { value: 'flashSale', label: 'Flash Sale Section' },
                        { value: 'recommendations', label: "Editor's Recommendations" }
                      ]}
                      placeholder="Select Homepage Section..."
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Inventory Card */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Tag size={14} className="text-primary" /> Pricing & Inventory
                  </h4>
                  {variants.length > 0 && (() => {
                    const validPrices = variants.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0);
                    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
                    if (minPrice !== null && minPrice !== Number(form.price)) {
                      return (
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, price: minPrice }))}
                          className="text-xs text-primary font-semibold hover:underline"
                        >
                          Auto-fill Min Variant Price (₹{minPrice})
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                      {variants.length > 0 ? 'Starting Price (₹)' : 'Selling Price (₹)'} <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={e => setForm({ ...form, price: e.target.value })}
                      className="h-10 text-sm font-mono"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                      MRP Strike (₹) <span className="text-[10px] font-normal lowercase">(optional)</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={form.mrp}
                      onChange={e => setForm({ ...form, mrp: e.target.value })}
                      className="h-10 text-sm font-mono"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                      Product Unit
                    </label>
                    <Input
                      value={form.unit}
                      onChange={e => setForm({ ...form, unit: e.target.value })}
                      className="h-10 text-sm"
                      placeholder="e.g. pcs, pack, gm, kg"
                      list="unit-presets-list"
                    />
                    <datalist id="unit-presets-list">
                      <option value="pcs" />
                      <option value="pack" />
                      <option value="box" />
                      <option value="bottle" />
                      <option value="jar" />
                      <option value="gm" />
                      <option value="kg" />
                      <option value="ml" />
                      <option value="L" />
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                      Total Stock Quantity
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={e => setForm({ ...form, stock: e.target.value })}
                      className="h-10 text-sm font-mono"
                      placeholder="e.g. 50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                      Max Per Order Limit
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={form.maxQuantityPerOrder}
                      onChange={e => setForm({ ...form, maxQuantityPerOrder: e.target.value })}
                      className="h-10 text-sm font-mono"
                      placeholder="0 = Unlimited"
                    />
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                  <FileText size={14} className="text-primary" /> Product Overview & Description
                </h4>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Provide detailed description of flowers, cake ingredients, care guidelines..."
                  rows={5}
                  className="flex w-full rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 2: MEDIA & GALLERY
             ────────────────────────────────────────────────────────── */}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Main Featured Thumbnail */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                  <ImageIcon size={14} className="text-primary" /> Featured Main Thumbnail
                </h4>

                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border bg-white dark:bg-zinc-900 flex items-center justify-center relative overflow-hidden group shrink-0 shadow-xs">
                    {preview ? (
                      <>
                        <img
                          src={preview.startsWith('blob:') || preview.startsWith('http') ? preview : `/uploads/${preview}`}
                          alt="Main Preview"
                          className="w-full h-full object-contain p-1.5"
                        />
                        <button
                          type="button"
                          onClick={() => { setFile(null); setPreview(null); }}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={22} />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold text-foreground block">Upload Primary Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs file:border-0 file:bg-transparent file:text-xs file:font-semibold file:text-primary cursor-pointer"
                    />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">
                        📐 Standard Size: <strong>1000 × 1000 px (1:1 Square)</strong>
                      </p>
                      <p className="text-[11px]">
                        Leave 10% breathing space around the product so edges never touch container borders. Transparent PNG or solid white JPEG recommended.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Best Practice Guideline Banner */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Sparkles size={14} /> E-Commerce Image Size Cheat-Sheet (Never Cut Off)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-muted-foreground">
                  <div className="p-2.5 rounded-lg bg-card border border-border">
                    <div className="font-bold text-foreground">Product Cards & PDP</div>
                    <div className="font-mono text-primary font-semibold mt-0.5">1000 × 1000 px (1:1)</div>
                    <div className="mt-1 text-[10px]">Centered on white canvas with 10% margin</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border">
                    <div className="font-bold text-foreground">Home Banners (Hero)</div>
                    <div className="font-mono text-primary font-semibold mt-0.5">1920 × 600 px (16:5)</div>
                    <div className="mt-1 text-[10px]">Mobile: 800 × 1000 px (4:5 portrait)</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-card border border-border">
                    <div className="font-bold text-foreground">Category Thumbnails</div>
                    <div className="font-mono text-primary font-semibold mt-0.5">500 × 500 px (1:1)</div>
                    <div className="mt-1 text-[10px]">Square icon / photo with transparent bg</div>
                  </div>
                </div>
              </div>

              {/* Multi-Image Gallery */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ImageIcon size={14} className="text-primary" /> Product Gallery Photos
                  </h4>
                  <span className="text-xs text-muted-foreground font-mono">
                    {existingImages.length + galleryFiles.length} photos
                  </span>
                </div>

                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                    className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs file:border-0 file:bg-transparent file:text-xs file:font-semibold file:text-primary cursor-pointer"
                  />
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 -mt-2">
                    <span>📐 Recommended Gallery Photos:</span>
                    <strong className="font-mono text-primary font-semibold">1000 × 1000 px (1:1 Square)</strong>
                    <span className="text-[11px]">— Consistent square aspect ratio ensures smooth slideshow and zoom.</span>
                  </div>

                  {(existingImages.length > 0 || galleryFiles.length > 0) ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3 pt-2">
                      {existingImages.map((img, idx) => (
                        <div key={`ext-${idx}`} className="relative aspect-square rounded-xl border border-border bg-white dark:bg-zinc-900 overflow-hidden group shadow-xs">
                          <img
                            src={img.startsWith('http') ? img : `/uploads/${img}`}
                            alt={`Gallery ${idx}`}
                            className="w-full h-full object-contain p-1"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeExistingImage(idx)}
                              className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:scale-110 transition-transform"
                              title="Delete Photo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {galleryFiles.map((f, idx) => (
                        <div key={`new-${idx}`} className="relative aspect-square rounded-xl border-2 border-dashed border-primary bg-white dark:bg-zinc-900 overflow-hidden group shadow-xs">
                          <img
                            src={URL.createObjectURL(f)}
                            alt={`New Upload ${idx}`}
                            className="w-full h-full object-contain p-1"
                          />
                          <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                            NEW
                          </span>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeGalleryFile(idx)}
                              className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:scale-110 transition-transform"
                              title="Remove"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      No additional gallery images uploaded yet. Select files above to add extra angles.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 3: ATTRIBUTES & VARIANTS
             ────────────────────────────────────────────────────────── */}
          {activeTab === 'variants' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Attribute Template Selector */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Settings2 size={14} className="text-primary" /> Attribute Template
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Assign pre-configured attribute schemas (e.g. Cake Weights, Flower Colors, T-Shirt Sizes).
                    </p>
                  </div>

                  <div className="w-full sm:w-64">
                    <CustomSelect
                      value={attributeTemplateSlug}
                      onChange={val => setAttributeTemplateSlug(val)}
                      options={[
                        { value: '', label: 'None (Standard Product)' },
                        ...allTemplates.filter(t => t.isActive !== false).map(t => ({ value: t.slug, label: t.name }))
                      ]}
                      placeholder="Choose Template..."
                      searchable={true}
                    />
                  </div>
                </div>

                {/* Template Fields */}
                {activeTemplate && (activeTemplate.attributes || []).length > 0 && (
                  <div className="pt-2 space-y-3">
                    <h5 className="text-xs font-bold text-foreground">
                      {activeTemplate.name} Specifications
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {activeTemplate.attributes.map(attrDef => (
                        <div key={attrDef.key || attrDef._id} className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block">
                            {attrDef.label || attrDef.key}{attrDef.unit ? ` (${attrDef.unit})` : ''}
                          </label>

                          {attrDef.type === 'select' ? (
                            <CustomSelect
                              size="sm"
                              placeholder={`— Select ${attrDef.label} —`}
                              value={dynAttrs[attrDef.key] ?? ''}
                              onChange={val => setDynAttrs(prev => ({ ...prev, [attrDef.key]: val }))}
                              options={(attrDef.options || []).map(o => ({ value: o, label: o }))}
                            />
                          ) : attrDef.type === 'boolean' ? (
                            <div className="flex items-center gap-2 h-9">
                              <Switch
                                checked={!!dynAttrs[attrDef.key]}
                                onCheckedChange={v => setDynAttrs(prev => ({ ...prev, [attrDef.key]: v }))}
                              />
                              <span className="text-xs font-medium">{dynAttrs[attrDef.key] ? 'Yes' : 'No'}</span>
                            </div>
                          ) : (
                            <Input
                              type={attrDef.type === 'number' ? 'number' : 'text'}
                              placeholder={`Enter ${attrDef.label}`}
                              value={dynAttrs[attrDef.key] ?? ''}
                              onChange={e => setDynAttrs(prev => ({ ...prev, [attrDef.key]: attrDef.type === 'number' ? Number(e.target.value) : e.target.value }))}
                              className="h-9 text-xs"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Matrix Variants List */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Layers size={14} className="text-primary" /> Product SKU Variants ({variants.length})
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure SKUs with individual weights, units, pricing, MRP strikethrough, and stock levels.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {variants.length > 0 && form.price && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setVariants(prev => prev.map(v => ({
                            ...v,
                            price: v.price || form.price,
                            mrp: v.mrp || form.mrp,
                            stock: v.stock || form.stock
                          })));
                        }}
                        title="Copy base price and stock to variants that have empty fields"
                      >
                        Copy Base Price &amp; Stock
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => {
                        const templateDims = activeTemplate?.variantDimensions || [];
                        const existingKeys = [...new Set(variants.flatMap(v => Object.keys(v.attrs || {})))];
                        const dims = templateDims.length > 0 ? templateDims : (existingKeys.length > 0 ? existingKeys : ['weight']);

                        const initialAttrs = {};
                        dims.forEach(d => { initialAttrs[d] = ''; });

                        const blank = {
                          sku: '',
                          price: form.price || '',
                          mrp: form.mrp || '',
                          stock: form.stock || '',
                          isActive: true,
                          attrs: initialAttrs
                        };
                        setVariants(prev => [...prev, blank]);
                      }}
                    >
                      <Plus size={13} /> Add Variant
                    </Button>
                  </div>
                </div>

                {variants.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    No variants added. This product uses single base price and stock. Click &quot;Add Variant&quot; if this product has weights, sizes, or flavors.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {variants.map((variant, vi) => {
                      const templateDims = activeTemplate?.variantDimensions || [];
                      const existingKeys = Object.keys(variant.attrs || {});
                      const dims = templateDims.length > 0
                        ? templateDims
                        : (existingKeys.length > 0 ? existingKeys : ['weight']);

                      const mrpNum = Number(variant.mrp || 0);
                      const priceNum = Number(variant.price || 0);
                      const hasDiscount = mrpNum > priceNum && priceNum > 0;
                      const discountPercent = hasDiscount ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;

                      return (
                        <div key={vi} className="border border-border rounded-xl p-4 bg-muted/20 space-y-3 shadow-xs">
                          {/* Variant Card Top Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-border/60">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                Variant #{vi + 1}
                              </span>
                              {priceNum > 0 && (
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  ₹{priceNum.toLocaleString('en-IN')}
                                </span>
                              )}
                              {hasDiscount && (
                                <span className="text-[10px] font-semibold text-emerald-600">
                                  ({discountPercent}% OFF)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer font-medium">
                                <Switch
                                  checked={variant.isActive !== false}
                                  onCheckedChange={v => setVariants(prev => prev.map((x, i) => i === vi ? { ...x, isActive: v } : x))}
                                />
                                <span className="text-[11px]">{variant.isActive !== false ? 'Active SKU' : 'Disabled'}</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => setVariants(prev => prev.filter((_, i) => i !== vi))}
                                className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                                title="Delete Variant"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Variant Form Fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                            {/* Dynamic Dimensions with Hybrid Input (Template options + Freeform Custom typing) */}
                            {dims.map(dim => {
                              const attrDef = (activeTemplate?.attributes || []).find(a => a.key === dim);
                              const val = variant.attrs?.[dim] ?? '';
                              const options = attrDef?.options || [];
                              const label = attrDef?.label || dim.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                              const datalistId = `variant-opts-${dim}-${vi}`;

                              return (
                                <div key={dim} className="space-y-1">
                                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                                    <span>{label}{attrDef?.unit ? ` (${attrDef.unit})` : ''}</span>
                                    {options.length > 0 && (
                                      <span className="text-[9px] font-normal text-primary">Presets Available</span>
                                    )}
                                  </label>
                                  <Input
                                    className="h-9 text-xs"
                                    placeholder={options[0] || `e.g. 250g, 500g`}
                                    value={val}
                                    list={options.length > 0 ? datalistId : undefined}
                                    onChange={e => setVariants(prev => prev.map((v, i) => i === vi ? { ...v, attrs: { ...(v.attrs || {}), [dim]: e.target.value } } : v))}
                                  />
                                  {options.length > 0 && (
                                    <datalist id={datalistId}>
                                      {options.map(opt => (
                                        <option key={opt} value={opt} />
                                      ))}
                                    </datalist>
                                  )}
                                </div>
                              );
                            })}

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">SKU Code</label>
                              <Input
                                className="h-9 font-mono text-xs"
                                placeholder="e.g. SKU-101"
                                value={variant.sku || ''}
                                onChange={e => setVariants(prev => prev.map((v, i) => i === vi ? { ...v, sku: e.target.value } : v))}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block">
                                Price (₹) <span className="text-destructive">*</span>
                              </label>
                              <Input
                                className="h-9 font-mono text-xs font-bold border-emerald-300 dark:border-emerald-800 focus:border-emerald-500"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={variant.price ?? ''}
                                onChange={e => setVariants(prev => prev.map((v, i) => i === vi ? { ...v, price: Number(e.target.value) } : v))}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">MRP (₹)</label>
                              <Input
                                className="h-9 font-mono text-xs"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={variant.mrp ?? ''}
                                onChange={e => setVariants(prev => prev.map((v, i) => i === vi ? { ...v, mrp: Number(e.target.value) } : v))}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Stock Quantity</label>
                              <Input
                                className="h-9 font-mono text-xs"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={variant.stock ?? ''}
                                onChange={e => setVariants(prev => prev.map((v, i) => i === vi ? { ...v, stock: Number(e.target.value) } : v))}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom Key-Value Attributes */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Tag size={14} className="text-primary" /> Filter Attributes
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Key-value pairs for storefront facet filtering (e.g. Color: Red, Type: Eggless).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => setAttributes([...attributes, { key: '', value: '' }])}
                  >
                    <Plus size={13} /> Add Attribute
                  </Button>
                </div>

                <div className="space-y-2">
                  {attributes.map((attr, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Key (e.g. Color)"
                        value={attr.key}
                        onChange={e => {
                          const next = [...attributes];
                          next[idx].key = e.target.value;
                          setAttributes(next);
                        }}
                        className="h-9 text-xs"
                      />
                      <Input
                        placeholder="Value (e.g. Red)"
                        value={attr.value}
                        onChange={e => {
                          const next = [...attributes];
                          next[idx].value = e.target.value;
                          setAttributes(next);
                        }}
                        className="h-9 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => {
                          const next = [...attributes];
                          next.splice(idx, 1);
                          setAttributes(next);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 4: SHIPPING & DELIVERY
             ────────────────────────────────────────────────────────── */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                  <Truck size={14} className="text-primary" /> Delivery & Fulfillment Mode
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                      Delivery Mode
                    </label>
                    <CustomSelect
                      value={form.deliveryMode}
                      onChange={val => setForm({ ...form, deliveryMode: val })}
                      options={[
                        { value: 'courier', label: 'Courier (X-Y days estimate)' },
                        { value: 'slot', label: 'Time Slot (Date + specific time window)' },
                        { value: 'date_only', label: 'Date Only (Fast delivery on date)' }
                      ]}
                      placeholder="Select Delivery Mode..."
                    />
                  </div>

                  {form.deliveryMode === 'courier' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                        Estimated Delivery Days
                      </label>
                      <Input
                        value={form.courierDays}
                        onChange={e => setForm({ ...form, courierDays: e.target.value })}
                        placeholder="e.g. 2-3"
                        className="h-10 text-sm"
                      />
                    </div>
                  )}
                </div>

                {form.deliveryMode === 'courier' && (
                  <div className="pt-3 border-t border-border space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/20 border border-border">
                      <Switch
                        checked={form.allowExpressUpgrade}
                        onCheckedChange={checked => setForm({ ...form, allowExpressUpgrade: checked })}
                      />
                      <div>
                        <label className="text-xs font-bold text-foreground block">Allow Express Upgrade</label>
                        <p className="text-xs text-muted-foreground">
                          Allows customers to upgrade standard courier delivery to a guaranteed same-day or chosen time slot.
                        </p>
                      </div>
                    </div>

                    {form.allowExpressUpgrade && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground block">Express Upgrade Type</label>
                          <CustomSelect
                            value={form.expressDeliveryMode}
                            onChange={val => setForm({ ...form, expressDeliveryMode: val })}
                            options={[
                              { value: 'slot', label: 'Time Slot (Specific delivery hours)' },
                              { value: 'date_only', label: 'Date Only (Priority delivery on date)' }
                            ]}
                            placeholder="Select Express Type..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 5: BADGES, SPECS & RATINGS
             ────────────────────────────────────────────────────────── */}
          {activeTab === 'badges_specs' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Card Badges Builder */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" /> Rotating Card Badges & Tags ({tagsList.length})
                  </h4>
                  <span className="text-xs text-muted-foreground">Animated chips on cards</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 min-h-[38px] p-3 rounded-xl border border-dashed border-border bg-muted/20">
                  {tagsList.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No badges added yet. Add one below.</p>
                  ) : (
                    tagsList.map((tag, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold shadow-xs transition-all"
                        style={{
                          backgroundColor: tag.bg || '#eff6ff',
                          color: tag.color || '#1d4ed8',
                          border: tag.border ? `1px solid ${tag.border}` : '1px solid transparent'
                        }}
                      >
                        <span>{tag.name}</span>
                        <button
                          type="button"
                          onClick={() => setTagsList(tagsList.filter((_, i) => i !== idx))}
                          className="hover:opacity-75"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Tag Tool */}
                <div className="p-4 rounded-xl border border-border bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Create New Badge</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomMode(!isCustomMode)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      {isCustomMode ? '← Use Standard Presets' : '🎨 Custom Hex Palette'}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Tag text (e.g. 50% OFF, Handcrafted, Bestseller)"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      className="h-9 text-xs flex-1"
                    />

                    <div
                      className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold shadow-xs min-w-[70px] justify-center shrink-0"
                      style={{
                        backgroundColor: isCustomMode ? customBg : selectedPreset.bg,
                        color: isCustomMode ? customTextColor : selectedPreset.color,
                        border: isCustomMode ? '1px solid #d4d4d4' : `1px solid ${selectedPreset.border}`
                      }}
                    >
                      {newTagName.trim() || 'Preview'}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (!newTagName.trim()) return;
                        const bg = isCustomMode ? customBg : selectedPreset.bg;
                        const color = isCustomMode ? customTextColor : selectedPreset.color;
                        const border = isCustomMode ? 'transparent' : selectedPreset.border;
                        setTagsList([...tagsList, { name: newTagName.trim(), bg, color, border }]);
                        setNewTagName('');
                      }}
                      className="h-9 gap-1 text-xs"
                    >
                      <Plus size={13} /> Add
                    </Button>
                  </div>

                  {/* Preset Pills */}
                  {!isCustomMode ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {TAG_PRESETS.map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setSelectedPreset(preset)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                            selectedPreset.label === preset.label ? 'ring-2 ring-primary scale-105' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: preset.bg,
                            color: preset.color,
                            border: `1px solid ${preset.border}`
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Background Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={customBg} onChange={e => setCustomBg(e.target.value)} className="w-8 h-8 rounded border cursor-pointer shrink-0" />
                          <Input value={customBg} onChange={e => setCustomBg(e.target.value)} className="h-8 text-xs font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Text Color</label>
                        <div className="flex items-center gap-2">
                          <input type="color" value={customTextColor} onChange={e => setCustomTextColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer shrink-0" />
                          <Input value={customTextColor} onChange={e => setCustomTextColor(e.target.value)} className="h-8 text-xs font-mono" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Accordion Specifications */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText size={14} className="text-primary" /> Product Specifications Accordion ({productDetails.length})
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => setProductDetails([...productDetails, { icon: 'info', title: '', content: '' }])}
                  >
                    <Plus size={13} /> Add Accordion Section
                  </Button>
                </div>

                <div className="space-y-3">
                  {productDetails.map((pd, idx) => (
                    <div key={idx} className="p-4 border border-border rounded-xl bg-muted/20 space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => setProductDetails(productDetails.filter((_, i) => i !== idx))}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={16} />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                            Lucide Icon Name
                          </label>
                          <Input
                            placeholder="e.g. info, truck, star, heart"
                            value={pd.icon}
                            onChange={e => {
                              const next = [...productDetails];
                              next[idx].icon = e.target.value;
                              setProductDetails(next);
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                            Section Title
                          </label>
                          <Input
                            placeholder="e.g. Delivery Guidelines"
                            value={pd.title}
                            onChange={e => {
                              const next = [...productDetails];
                              next[idx].title = e.target.value;
                              setProductDetails(next);
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>

                      <textarea
                        placeholder="Accordion content (HTML allowed)..."
                        rows={2}
                        value={pd.content}
                        onChange={e => {
                          const next = [...productDetails];
                          next[idx].content = e.target.value;
                          setProductDetails(next);
                        }}
                        className="flex w-full rounded-lg border border-border bg-background p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Rating & Reviews Overrides */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 border-b border-border pb-2">
                  <Star size={14} className="text-amber-500" /> Customer Ratings & Display Overrides
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Organic Rating (0 to 5)</label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={form.rating}
                      onChange={e => setForm({ ...form, rating: e.target.value })}
                      placeholder="e.g. 4.8"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Reviews Count</label>
                    <Input
                      type="number"
                      min="0"
                      value={form.reviewsCount}
                      onChange={e => setForm({ ...form, reviewsCount: e.target.value })}
                      placeholder="e.g. 1500"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Display Rating Override */}
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
                    <div>
                      <span className="text-xs font-bold text-foreground block">⭐ Override Public Display Rating</span>
                      <p className="text-xs text-muted-foreground">Force-show curated ratings and review counts on storefront cards.</p>
                    </div>
                    <Switch
                      checked={form.useManualRating}
                      onCheckedChange={checked => setForm({ ...form, useManualRating: checked })}
                    />
                  </div>

                  {form.useManualRating && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground block">Forced Rating (0-5)</label>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={form.manualRating}
                          onChange={e => setForm({ ...form, manualRating: e.target.value })}
                          placeholder="e.g. 4.9"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground block">Forced Reviews Count</label>
                        <Input
                          type="number"
                          min="0"
                          value={form.manualReviewsCount}
                          onChange={e => setForm({ ...form, manualReviewsCount: e.target.value })}
                          placeholder="e.g. 2480"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ──────────────────────────────────────────────────────────
              TAB 6: ADD-ONS & CROSS-SELLS
             ────────────────────────────────────────────────────────── */}
          {activeTab === 'addons' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Gift size={14} className="text-primary" /> Curated Add-ons & Cross-Sells ({addOns.length} selected)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select chocolates, greeting cards, or candles to recommend when a customer adds this product to cart.
                    </p>
                  </div>

                  <Input
                    placeholder="Search add-ons..."
                    value={addonSearch}
                    onChange={e => setAddonSearch(e.target.value)}
                    className="h-8 text-xs sm:w-48"
                  />
                </div>

                {availableAddons.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
                    No active add-ons found in store inventory. Create add-ons in the Add-ons manager first.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {(() => {
                      const filtered = availableAddons.filter(a => 
                        a.name?.toLowerCase().includes(addonSearch.toLowerCase()) ||
                        a.category?.name?.toLowerCase().includes(addonSearch.toLowerCase())
                      );

                      const grouped = {};
                      filtered.forEach(addon => {
                        const catName = addon.category?.name || 'General Add-ons';
                        if (!grouped[catName]) grouped[catName] = [];
                        grouped[catName].push(addon);
                      });

                      if (Object.keys(grouped).length === 0) {
                        return <p className="text-xs text-muted-foreground text-center py-6">No add-ons match your search.</p>;
                      }

                      return Object.entries(grouped).map(([categoryName, items]) => (
                        <div key={categoryName} className="space-y-2.5">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {categoryName} ({items.length})
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {items.map(addon => {
                              const isChecked = addOns.includes(addon._id);
                              return (
                                <label
                                  key={addon._id}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-primary/10 border-primary shadow-xs'
                                      : 'bg-muted/10 border-border hover:bg-muted/30'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={e => {
                                      if (e.target.checked) setAddOns([...addOns, addon._id]);
                                      else setAddOns(addOns.filter(id => id !== addon._id));
                                    }}
                                    className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
                                  />
                                  <div className="w-10 h-10 rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                                    {addon.image ? (
                                      <img
                                        src={addon.image.startsWith('http') ? addon.image : `/uploads/${addon.image}`}
                                        alt={addon.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Gift size={16} className="text-muted-foreground/40" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold truncate text-foreground">{addon.name}</div>
                                    <div className="text-[11px] text-muted-foreground font-mono">₹{addon.price}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Sticky Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-card shrink-0 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="font-semibold text-foreground">Active Tab:</span>
            <span className="capitalize">{tabs.find(t => t.id === activeTab)?.label}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="h-9 text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              form="product-form"
              disabled={saving}
              className="h-9 gap-1.5 text-xs min-w-[120px]"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Saving Product...' : isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
