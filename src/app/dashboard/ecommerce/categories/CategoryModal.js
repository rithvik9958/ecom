'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Input } from '@/components/ui/input';
import { ImageIcon, X, Plus, Trash2, SlidersHorizontal, CheckCircle2, Sparkles, Filter, FolderKanban, Layers } from 'lucide-react';

export default function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState({
    title: category?.title || '',
    description: category?.description || '',
    isActive: category ? category.isActive : true
  });
  
  const [megaMenu, setMegaMenu] = useState(
    category?.megaMenu || { columns: [], promo: { image: '', url: '', buttonText: '' } }
  );
  const [plpCarouselSettings, setPlpCarouselSettings] = useState(
    category?.plpCarouselSettings || { 
      type: (category?.plpCarousel?.length > 0 && !category?.plpCarouselSettings) ? 'custom' : 'categories', 
      excludeCategories: [], 
      customSlides: category?.plpCarouselSettings?.customSlides || category?.plpCarousel || [] 
    }
  );
  
  const [filterType, setFilterType] = useState(category?.filterType || 'automatic');
  const [filters, setFilters] = useState(category?.filters || []);
  const [filterConfig, setFilterConfig] = useState(
    category?.filterConfig || {
      mode: 'inherit',
      showPriceFilter: true,
      showRatingFilter: true,
      showInStockFilter: true,
      showDiscountFilter: true,
      enabledGlobalFilters: []
    }
  );
  const [globalStoreFilters, setGlobalStoreFilters] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  
  const [file, setFile] = useState(null);
  const [slideFiles, setSlideFiles] = useState({});
  const [preview, setPreview] = useState(category?.image || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch active global store custom filters
  useEffect(() => {
    async function loadGlobalFilters() {
      try {
        const res = await fetch('/api/store-payment-settings');
        const data = await res.json();
        if (data.success && data.data?.catalogFilterSettings?.customFilters) {
          const list = data.data.catalogFilterSettings.customFilters.filter(f => f.isActive !== false);
          setGlobalStoreFilters(list);
          // If first time setting custom mode and enabledGlobalFilters is empty, default to all available IDs
          if (!category?.filterConfig?.enabledGlobalFilters || category.filterConfig.enabledGlobalFilters.length === 0) {
            setFilterConfig(prev => ({
              ...prev,
              enabledGlobalFilters: prev.enabledGlobalFilters?.length ? prev.enabledGlobalFilters : list.map(f => f.id || f.key)
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load global filters in CategoryModal:', err);
      }
    }
    loadGlobalFilters();
  }, [category]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const toggleGlobalFilterId = (id) => {
    setFilterConfig(prev => {
      const current = prev.enabledGlobalFilters || [];
      const updated = current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id];
      return { ...prev, enabledGlobalFilters: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('isActive', form.isActive);
      
      if (file) {
        fd.append('image', file);
      }
      
      Object.keys(slideFiles).forEach(idx => {
        if (slideFiles[idx]) {
          fd.append(`plpSlideImage_${idx}`, slideFiles[idx]);
        }
      });
      
      fd.append('megaMenu', JSON.stringify(megaMenu));
      fd.append('plpCarouselSettings', JSON.stringify(plpCarouselSettings));
      fd.append('filterType', filterType);
      fd.append('filters', JSON.stringify(filters));
      fd.append('filterConfig', JSON.stringify(filterConfig));

      const url = category ? `/api/admin/store-categories/${category._id || category.id}` : '/api/admin/store-categories';
      const method = category ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: fd
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save');
      }

      const savedData = await res.json();
      onSave(savedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: FolderKanban },
    { id: 'megamenu', label: 'Mega Menu', icon: Layers, count: megaMenu.columns?.length },
    { id: 'plp', label: 'PLP Carousel', icon: SlidersHorizontal },
    { id: 'filters', label: 'Filters & Attributes', icon: Filter, count: filters.length },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FolderKanban size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {category ? `Edit "${form.title || 'Category'}"` : 'Add New Category'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure storefront hierarchy, mega menu dropdowns, PLP carousels and facets.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusSwitch
                checked={form.isActive}
                onCheckedChange={val => setForm({ ...form, isActive: val })}
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

        <form id="category-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 text-xs text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-2">
              <X size={15} />
              <span>{error}</span>
            </div>
          )}
          
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                  Category Title <span className="text-destructive">*</span>
                </label>
                <Input 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  placeholder="e.g. Birthday Gifts, Exotic Orchids"
                  className="h-10 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                  Description &amp; SEO Summary
                </label>
                <textarea 
                  className="w-full min-h-[100px] p-3 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="Category description / SEO text..."
                  rows={4}
                />
              </div>

              <div className="space-y-2 p-4 rounded-xl border border-border bg-muted/20">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                  Category Header / Thumbnail Image
                </label>
                <div className="flex items-center gap-4">
                  {preview ? (
                    <div className="relative w-20 h-20 border border-border rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-center p-1">
                      <img src={preview.startsWith('http') || preview.startsWith('blob:') ? preview : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${preview}`} alt="Preview" className="w-full h-full object-contain" />
                      <button 
                        type="button" 
                        onClick={() => { setFile(null); setPreview(null); }}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                      <ImageIcon size={24} />
                      <span className="text-[10px] mt-1">No Image</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <Input type="file" accept="image/*" onChange={handleFileChange} className="text-xs h-9" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        📐 Standard Size: <span className="font-mono text-primary font-bold">500 × 500 px (1:1 Square)</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Transparent PNG or white background with 10% breathing space so circle badges and cards never cut off edges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'megamenu' && <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Mega Menu Columns</h3>
                <p className="text-sm text-muted-foreground">Configure the multi-column dropdown under this category in Header.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                setMegaMenu(prev => ({
                  ...prev,
                  columns: [...(prev.columns || []), { title: 'New Column', links: [] }]
                }));
              }}>
                <Plus size={16} className="mr-1" /> Add Column
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(megaMenu.columns || []).map((col, cIdx) => (
                <div key={cIdx} className="p-3 border rounded-md bg-muted/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Column Title (e.g. Cakes by Flavour)" 
                      value={col.title}
                      onChange={e => {
                        const nextCols = [...megaMenu.columns];
                        nextCols[cIdx].title = e.target.value;
                        setMegaMenu({ ...megaMenu, columns: nextCols });
                      }}
                      className="font-medium text-sm"
                    />
                    <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => {
                      const nextCols = [...megaMenu.columns];
                      nextCols.splice(cIdx, 1);
                      setMegaMenu({ ...megaMenu, columns: nextCols });
                    }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="space-y-2 pl-2 border-l-2 border-border/50">
                    {(col.links || []).map((lnk, lIdx) => (
                      <div key={lIdx} className="flex items-center gap-2">
                        <Input 
                          placeholder="Label (e.g. Chocolate)" 
                          className="h-8 text-xs"
                          value={lnk.label}
                          onChange={e => {
                            const nextCols = [...megaMenu.columns];
                            nextCols[cIdx].links[lIdx].label = e.target.value;
                            setMegaMenu({ ...megaMenu, columns: nextCols });
                          }}
                        />
                        <Input 
                          placeholder="URL (e.g. /products?tag=choco)" 
                          className="h-8 text-xs font-mono"
                          value={lnk.url}
                          onChange={e => {
                            const nextCols = [...megaMenu.columns];
                            nextCols[cIdx].links[lIdx].url = e.target.value;
                            setMegaMenu({ ...megaMenu, columns: nextCols });
                          }}
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => {
                          const nextCols = [...megaMenu.columns];
                          nextCols[cIdx].links.splice(lIdx, 1);
                          setMegaMenu({ ...megaMenu, columns: nextCols });
                        }}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" size="sm" className="w-full text-xs h-7 mt-1" onClick={() => {
                      const nextCols = [...megaMenu.columns];
                      if (!nextCols[cIdx].links) nextCols[cIdx].links = [];
                      nextCols[cIdx].links.push({ label: '', url: '', badge: '' });
                      setMegaMenu({ ...megaMenu, columns: nextCols });
                    }}>
                      <Plus size={12} className="mr-1" /> Add Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {activeTab === 'plp' && <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">PLP Sub-category Carousel</h3>
              <p className="text-sm text-muted-foreground">Display circular shortcut slides across the top of this category page.</p>
            </div>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="plpCarouselType" 
                  checked={plpCarouselSettings.type === 'categories'} 
                  onChange={() => setPlpCarouselSettings({ ...plpCarouselSettings, type: 'categories' })} 
                />
                <span className="text-sm font-medium">Automatic Other Categories</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="plpCarouselType" 
                  checked={plpCarouselSettings.type === 'custom'} 
                  onChange={() => setPlpCarouselSettings({ ...plpCarouselSettings, type: 'custom' })} 
                />
                <span className="text-sm font-medium">Custom Slides</span>
              </label>
            </div>

            {plpCarouselSettings.type === 'custom' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setPlpCarouselSettings(prev => ({
                      ...prev,
                      customSlides: [...(prev.customSlides || []), { title: '', image: '', link: '' }]
                    }));
                  }}>
                    <Plus size={14} className="mr-1" /> Add Slide
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  📐 Recommended Slide Image: <span className="font-mono text-primary font-semibold">600 × 600 px (1:1)</span> or <span className="font-mono text-primary font-semibold">800 × 600 px (4:3)</span>
                </p>
                {(plpCarouselSettings.customSlides || []).map((slide, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2 p-2 border rounded-md bg-muted/10">
                    <Input 
                      placeholder="Title (e.g. Roses)" 
                      value={slide.title} 
                      onChange={e => {
                        const nextSlides = [...plpCarouselSettings.customSlides];
                        nextSlides[sIdx].title = e.target.value;
                        setPlpCarouselSettings({ ...plpCarouselSettings, customSlides: nextSlides });
                      }}
                      className="text-xs h-8"
                    />
                    <Input 
                      placeholder="Link (e.g. /category/roses)" 
                      value={slide.link} 
                      onChange={e => {
                        const nextSlides = [...plpCarouselSettings.customSlides];
                        nextSlides[sIdx].link = e.target.value;
                        setPlpCarouselSettings({ ...plpCarouselSettings, customSlides: nextSlides });
                      }}
                      className="text-xs h-8 font-mono"
                    />
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => {
                        const f = e.target.files[0];
                        if (f) {
                          setSlideFiles(prev => ({ ...prev, [sIdx]: f }));
                        }
                      }}
                      className="text-xs h-8 max-w-[150px]"
                    />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => {
                      const nextSlides = [...plpCarouselSettings.customSlides];
                      nextSlides.splice(sIdx, 1);
                      setPlpCarouselSettings({ ...plpCarouselSettings, customSlides: nextSlides });
                    }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>}

          {activeTab === 'filters' && <div className="space-y-6">
            
            {/* Header & Filter Mode Selector */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold">Category Filter Behavior &amp; Mixing</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Control which pre-built filter modules and custom dynamic filters appear when shoppers view this category.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label 
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                    filterConfig.mode !== 'custom' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-background'
                  }`}
                  onClick={() => setFilterConfig({ ...filterConfig, mode: 'inherit' })}
                >
                  <input 
                    type="radio" 
                    name="catFilterMode" 
                    checked={filterConfig.mode !== 'custom'} 
                    onChange={() => setFilterConfig({ ...filterConfig, mode: 'inherit' })} 
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Inherit Global Store Filters</span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Automatically uses all standard modules &amp; global filters enabled in Ecommerce Settings.
                    </span>
                  </div>
                </label>

                <label 
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                    filterConfig.mode === 'custom' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-background'
                  }`}
                  onClick={() => setFilterConfig({ ...filterConfig, mode: 'custom' })}
                >
                  <input 
                    type="radio" 
                    name="catFilterMode" 
                    checked={filterConfig.mode === 'custom'} 
                    onChange={() => setFilterConfig({ ...filterConfig, mode: 'custom' })} 
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Custom Filter Mix for this Category</span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Pick and choose specific pre-built modules and select which custom filters to include.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Granular Module Selector (when in Custom Mode) */}
            {filterConfig.mode === 'custom' && (
              <div className="space-y-4 p-4 rounded-xl border border-primary/30 bg-background shadow-xs">
                
                {/* 1. Pre-built modules checklist */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Filter size={13} className="text-primary" /> 1. Pre-Built Filter Modules for this Category
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { key: 'showPriceFilter', label: 'Price Range Slider & Brackets' },
                      { key: 'showRatingFilter', label: 'Customer Rating (4★ & Above)' },
                      { key: 'showInStockFilter', label: 'In-Stock Only Filter' },
                      { key: 'showDiscountFilter', label: 'Special Offers / Discounted Filter' }
                    ].map(item => {
                      const isChecked = filterConfig[item.key] !== false;
                      return (
                        <label 
                          key={item.key} 
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                            isChecked ? 'border-emerald-500/40 bg-emerald-50/50 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-200' : 'border-border text-muted-foreground bg-muted/10'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={e => setFilterConfig({ ...filterConfig, [item.key]: e.target.checked })}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Global Custom Filter Selection */}
                {globalStoreFilters.length > 0 && (
                  <div className="pt-3 border-t border-border/60">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-primary" /> 2. Include Global Custom Dynamic Filters
                    </h4>
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Select which global custom filters (configured in Settings) should be active for this specific category:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {globalStoreFilters.map(flt => {
                        const fltId = flt.id || flt.key;
                        const isChecked = (filterConfig.enabledGlobalFilters || []).includes(fltId);
                        return (
                          <label 
                            key={fltId} 
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                              isChecked ? 'border-primary/40 bg-primary/5 text-foreground font-semibold' : 'border-border text-muted-foreground bg-muted/10'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => toggleGlobalFilterId(fltId)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span>{flt.label}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">({flt.options?.length || 0} options)</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Category-Specific Dynamic Filters / Groups */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    3. Category-Specific Custom Filter Groups
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add dedicated filter groups that exist exclusively for products inside this category.
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFilters([...filters, { title: '', options: [] }])}
                >
                  <Plus size={14} className="mr-1" /> Add Group
                </Button>
              </div>

              {filters.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                  No category-specific filter groups created yet. Click "+ Add Group" if you want custom tag filters tailored only to this category (e.g. <i>Cake Weight</i>, <i>Flower Type</i>).
                </div>
              ) : (
                <div className="space-y-3">
                  {filters.map((filterGroup, groupIdx) => (
                    <div key={groupIdx} className="p-3.5 rounded-lg border border-border bg-muted/10 space-y-3">
                      <div className="flex gap-2 items-center">
                        <Input 
                          placeholder="Filter Group Title (e.g. Cake Flavour, Occasion)" 
                          value={filterGroup.title}
                          onChange={e => {
                            const newFilters = [...filters];
                            newFilters[groupIdx].title = e.target.value;
                            setFilters(newFilters);
                          }}
                          className="font-medium text-xs h-9"
                        />
                        <Button type="button" variant="destructive" size="icon" className="h-9 w-9 shrink-0" onClick={() => {
                          const newFilters = [...filters];
                          newFilters.splice(groupIdx, 1);
                          setFilters(newFilters);
                        }}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      
                      <div className="pl-3 border-l-2 border-border/50 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Filter Options / Tags</span>
                          <Button type="button" variant="secondary" size="sm" className="h-7 text-xs" onClick={() => {
                            const newFilters = [...filters];
                            newFilters[groupIdx].options.push({ label: '', value: '' });
                            setFilters(newFilters);
                          }}>
                            <Plus size={12} className="mr-1" /> Add Option
                          </Button>
                        </div>
                        {filterGroup.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <Input 
                              placeholder="Display Label (e.g. Chocolate)" 
                              className="h-8 text-xs"
                              value={opt.label}
                              onChange={e => {
                                const newFilters = [...filters];
                                const option = newFilters[groupIdx].options[optIdx];
                                option.label = e.target.value;
                                if (!option.value) {
                                  option.value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                                }
                                setFilters(newFilters);
                              }}
                            />
                            <Input 
                              placeholder="Tag Value (e.g. chocolate)" 
                              className="h-8 text-xs font-mono"
                              value={opt.value}
                              onChange={e => {
                                const newFilters = [...filters];
                                newFilters[groupIdx].options[optIdx].value = e.target.value;
                                setFilters(newFilters);
                              }}
                            />
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0" onClick={() => {
                              const newFilters = [...filters];
                              newFilters[groupIdx].options.splice(optIdx, 1);
                              setFilters(newFilters);
                            }}>
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>}
        </form>

        <DialogFooter className="px-6 py-3.5 border-t border-border bg-card shrink-0 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Category updates immediately reflect across navigation and PLP menus.
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="h-9 text-xs">
              Cancel
            </Button>
            <Button type="submit" form="category-form" disabled={saving} className="h-9 text-xs">
              {saving ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
