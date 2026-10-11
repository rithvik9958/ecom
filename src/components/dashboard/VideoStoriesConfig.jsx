'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Video, Image as ImageIcon, Search, UploadCloud, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomSelect from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import DataTable from '@/components/dashboard/DataTable';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';

function getImageUrl(val) {
  if (!val) return '';
  if (val.startsWith('http') || val.startsWith('data:')) return val;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${val}`;
}

export default function VideoStoriesConfig({ config, onChange }) {
  const { title = 'Joyful Gifting Stories', bgColor = 'transparent', slides = [] } = config;

  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [togglingIndex, setTogglingIndex] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('order');

  const filteredSlides = slides
    .filter((s, i) => {
      const slideName = s.title || `Slide ${i + 1}`;
      const prodTitles = (s.products || []).map(p => p.title || '').join(' ');
      const q = search.toLowerCase();
      return slideName.toLowerCase().includes(q) || prodTitles.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });

  const isEditing = editingIndex !== null;
  const currentSlide = isEditing ? slides[editingIndex] : null;

  const update = (field, val) => {
    onChange({ ...config, [field]: val });
  };

  const addSlide = () => {
    const next = [...slides];
    next.push({
      title: `Story ${slides.length + 1}`,
      video: '',
      isVisible: true,
      products: []
    });
    onChange({ ...config, slides: next });
    setEditingIndex(next.length - 1);
  };

  const removeSlide = (i) => {
    onChange({ ...config, slides: slides.filter((_, idx) => idx !== i) });
    setDeleteIndex(null);
  };

  const toggleSlideStatus = (idx) => {
    setTogglingIndex(idx);
    const next = [...slides];
    const cur = next[idx]?.isVisible !== false;
    next[idx] = { ...next[idx], isVisible: !cur };
    onChange({ ...config, slides: next });
    setTimeout(() => setTogglingIndex(null), 400);
  };

  const handleVideoFile = (e) => {
    if (editingIndex === null) return;
    const file = e.target.files[0];
    if (!file) return;
    const next = [...slides];
    next[editingIndex] = { ...next[editingIndex], _file: file, _preview: URL.createObjectURL(file) };
    onChange({ ...config, slides: next });
  };

  const updateCurrentSlide = (field, val) => {
    if (editingIndex === null) return;
    const next = [...slides];
    next[editingIndex] = { ...next[editingIndex], [field]: val };
    onChange({ ...config, slides: next });
  };

  const addProduct = () => {
    if (editingIndex === null) return;
    const next = [...slides];
    const slide = next[editingIndex];
    slide.products = [...(slide.products || []), { title: '', currentPrice: '', originalPrice: '', link: '/products', image: '' }];
    onChange({ ...config, slides: next });
  };

  const updateProduct = (pIdx, field, val) => {
    if (editingIndex === null) return;
    const next = [...slides];
    const slide = next[editingIndex];
    const nextProducts = [...(slide.products || [])];
    nextProducts[pIdx] = { ...nextProducts[pIdx], [field]: val };
    slide.products = nextProducts;
    onChange({ ...config, slides: next });
  };

  const removeProduct = (pIdx) => {
    if (editingIndex === null) return;
    const next = [...slides];
    const slide = next[editingIndex];
    const nextProducts = [...(slide.products || [])];
    nextProducts.splice(pIdx, 1);
    slide.products = nextProducts;
    onChange({ ...config, slides: next });
  };

  const handleBulkDelete = async (selectedIndices) => {
    const next = slides.filter((_, idx) => !selectedIndices.includes(String(idx)));
    onChange({ ...config, slides: next });
  };

  const handleProductFile = (e, pIdx) => {
    if (editingIndex === null) return;
    const file = e.target.files[0];
    if (!file) return;
    const next = [...slides];
    const slide = next[editingIndex];
    const nextProducts = [...(slide.products || [])];
    nextProducts[pIdx] = { ...nextProducts[pIdx], _file: file, _preview: URL.createObjectURL(file) };
    slide.products = nextProducts;
    onChange({ ...config, slides: next });
  };

  return (
    <div className="space-y-6">
      {/* Section Fields */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Section Title
          </label>
          <Input
            value={title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Joyful Gifting Stories"
            className="h-10 text-sm"
          />
        </div>
        <div className="w-full sm:w-56 shrink-0">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Background Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={bgColor === 'transparent' ? '#ffffff' : bgColor}
              onChange={(e) => update('bgColor', e.target.value)}
              className="h-10 w-12 rounded-lg border border-border p-1 cursor-pointer bg-background shrink-0"
            />
            <Input
              value={bgColor}
              onChange={(e) => update('bgColor', e.target.value)}
              placeholder="transparent"
              className="font-mono uppercase text-xs h-10 flex-1"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Film size={18} className="text-primary" />
              Video Stories Slides ({slides.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag to reorder vertical 9:16 video stories and tag related products.
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
                key: 'media',
                label: 'Video Preview',
                render: (row) => {
                  const hasVideo = row._preview || row.video;
                  return (
                    <div className="w-14 h-20 rounded-lg border border-border shadow-xs flex items-center justify-center overflow-hidden shrink-0 bg-muted/40 relative group">
                      {hasVideo ? (
                        <video
                          src={row._preview || getImageUrl(row.video)}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-1 text-center text-muted-foreground/50">
                          <Video size={18} />
                          <span className="text-[9px] mt-1 font-medium">9:16</span>
                        </div>
                      )}
                    </div>
                  );
                }
              },
              {
                key: 'details',
                label: 'Story Details',
                render: (row) => {
                  const i = slides.indexOf(row);
                  const prodCount = row.products?.length || 0;
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-foreground">
                        {row.title || `Story Slide #${i + 1}`}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 font-medium bg-muted/60 px-2 py-0.5 rounded text-[11px]">
                          {prodCount} tagged product{prodCount === 1 ? '' : 's'}
                        </span>
                        {row.video ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Video uploaded</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">No video uploaded</span>
                        )}
                      </div>
                    </div>
                  );
                }
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
                        onClick={() => setDeleteIndex(i)}
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Film size={20} className="text-primary" />
                  Edit Video Slide {editingIndex !== null ? `#${editingIndex + 1}` : ''}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure vertical video asset, story title, and product quick-links.
                </p>
              </div>
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
            <div className="space-y-6 py-4">
              {/* Slide Title */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Story Title / Caption
                </label>
                <Input
                  value={currentSlide.title || ''}
                  onChange={(e) => updateCurrentSlide('title', e.target.value)}
                  placeholder="e.g. Handcrafted Rose Bouquets"
                  className="h-10 text-sm"
                />
              </div>

              {/* Video Asset Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Video File (.mp4, .webm)
                </label>
                <div className="flex flex-col sm:flex-row gap-5 items-start bg-muted/20 border border-border rounded-xl p-4">
                  <div className="w-32 h-52 shrink-0 rounded-xl overflow-hidden bg-background flex items-center justify-center border border-border shadow-xs relative group">
                    {currentSlide._preview || currentSlide.video ? (
                      <video
                        src={currentSlide._preview || getImageUrl(currentSlide.video)}
                        className="w-full h-full object-cover"
                        controls
                        controlsList="nodownload"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-3 text-muted-foreground/40">
                        <Video size={32} />
                        <span className="text-[11px] font-semibold mt-1">9:16 Vertical</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 bg-card rounded-xl p-5 cursor-pointer transition-colors group">
                      <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                      <span className="text-sm font-semibold text-foreground">Click to upload video</span>
                      <span className="text-xs text-muted-foreground mt-1">MP4 or WebM (9:16 aspect ratio recommended)</span>
                      <input type="file" accept="video/mp4,video/webm" onChange={handleVideoFile} className="hidden" />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Optimal resolution: 1080×1920. Keep video files under 8MB for ultra-fast storefront loading.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tagged Products */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Tagged Products ({currentSlide.products?.length || 0})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Products shown at the bottom of the video for one-click checkout.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={addProduct} className="gap-1 h-8">
                    <Plus size={14} /> Add Product
                  </Button>
                </div>

                <div className="space-y-3">
                  {(currentSlide.products || []).length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed border-border rounded-xl">
                      No products tagged to this story yet. Click "Add Product" above.
                    </div>
                  ) : (
                    currentSlide.products.map((prod, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3.5 bg-card border border-border rounded-xl shadow-xs space-y-3 relative group transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => removeProduct(pIdx)}
                          className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                          title="Remove Product"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div className="flex gap-3">
                          <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border relative">
                            {prod._preview || prod.image ? (
                              <img
                                src={prod._preview || getImageUrl(prod.image)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="text-muted-foreground/40" size={20} />
                            )}
                            <label className="absolute inset-0 cursor-pointer bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium">
                              Upload
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleProductFile(e, pIdx)}
                              />
                            </label>
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input
                              value={prod.title || ''}
                              onChange={(e) => updateProduct(pIdx, 'title', e.target.value)}
                              placeholder="Product Title"
                              className="h-8 text-sm"
                            />
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                                <Input
                                  value={prod.currentPrice || ''}
                                  onChange={(e) => updateProduct(pIdx, 'currentPrice', e.target.value)}
                                  placeholder="Price"
                                  className="h-8 text-sm pl-6"
                                  type="number"
                                />
                              </div>
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                                <Input
                                  value={prod.originalPrice || ''}
                                  onChange={(e) => updateProduct(pIdx, 'originalPrice', e.target.value)}
                                  placeholder="Old Price"
                                  className="h-8 text-sm pl-6"
                                  type="number"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <Input
                          value={prod.link || ''}
                          onChange={(e) => updateProduct(pIdx, 'link', e.target.value)}
                          placeholder="Link URL (e.g. /products/roses-bouquet)"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-4">
            <DialogClose asChild>
              <Button type="button" className="min-w-[100px]">
                Done
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        onConfirm={() => removeSlide(deleteIndex)}
        title="Delete Video Slide"
        description="Are you sure you want to delete this video slide? This action cannot be undone."
      />
    </div>
  );
}
