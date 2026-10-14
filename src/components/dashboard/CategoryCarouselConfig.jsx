'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import DataTable from '@/components/dashboard/DataTable';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Plus, Trash2, Edit2, Image as ImageIcon, Search, Sparkles } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';

function getImgSrc(img) {
  if (!img) return '';
  if (img.startsWith('http') || img.startsWith('blob:')) return img;
  return `/uploads/${img}`;
}

export default function CategoryCarouselConfig({ config, onChange }) {
  const title = config.title ?? 'Pick their favourite Flower';
  const autoPlay = config.autoPlay ?? false;
  const autoPlayDelay = config.autoPlayDelay ?? 4000;
  const slidesPerView = config.slidesPerView ?? 4;
  const categories = config.categories ?? [];

  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteCategoryIndex, setDeleteCategoryIndex] = useState(null);
  const [togglingIndex, setTogglingIndex] = useState(null);
  const isEditing = editingIndex !== null;
  const currentCategory = isEditing ? categories[editingIndex] : null;

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('order');

  const filteredCategories = categories
    .filter(c => (c.title || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });

  const update = (field, val, autoSave = false) => onChange({ ...config, [field]: val }, autoSave);

  const addCategory = () => {
    onChange({
      ...config,
      categories: [
        ...categories,
        {
          title: '',
          link: '/products',
          image: '',
          isVisible: true,
        },
      ],
    });
    setEditingIndex(categories.length);
  };

  const removeCategory = (i) => {
    onChange({ ...config, categories: categories.filter((_, idx) => idx !== i) });
    setDeleteCategoryIndex(null);
  };

  const toggleCategoryStatus = (idx) => {
    setTogglingIndex(idx);
    const next = [...categories];
    const cur = next[idx]?.isVisible !== false;
    next[idx] = { ...next[idx], isVisible: !cur };
    onChange({ ...config, categories: next });
    setTimeout(() => setTogglingIndex(null), 400);
  };

  const handleBulkDelete = async (selectedIndices) => {
    const next = categories.filter((_, idx) => !selectedIndices.includes(String(idx)));
    onChange({ ...config, categories: next });
  };

  const updateCurrentCategory = (field, val) => {
    if (editingIndex === null) return;
    const next = [...categories];
    next[editingIndex] = { ...next[editingIndex], [field]: val };
    onChange({ ...config, categories: next });
  };

  const handleFile = (e) => {
    if (editingIndex === null) return;
    const file = e.target.files[0];
    if (!file) return;
    const next = [...categories];
    next[editingIndex] = { ...next[editingIndex], _file: file, _preview: URL.createObjectURL(file) };
    onChange({ ...config, categories: next });
  };

  return (
    <div className="space-y-6">
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
        <div className="w-px h-6 bg-border hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slides Per View</label>
          <CustomSelect
            value={String(slidesPerView)}
            onChange={(val) => update('slidesPerView', Number(val))}
            size="sm"
            fullWidth={false}
            className="w-44"
            options={[
              ...(categories.length >= 2 ? [{ value: '2', label: '2 — Two at once' }] : []),
              ...(categories.length >= 3 ? [{ value: '3', label: '3 — Three at once' }] : []),
              ...(categories.length >= 4 ? [{ value: '4', label: '4 — Four at once' }] : []),
              ...(categories.length >= 4 ? [{ value: '4.5', label: '4.5 — Four + peek' }] : []),
              ...(categories.length >= 5 ? [{ value: '5', label: '5 — Five at once' }] : []),
              ...(categories.length >= 5 ? [{ value: '5.5', label: '5.5 — Five + peek' }] : []),
              ...(categories.length >= 6 ? [{ value: '6', label: '6 — Six at once' }] : []),
            ]}
          />
        </div>
      </div>

      {/* Section Fields */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Section Title
          </label>
          <Input
            value={title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Pick their favourite Flower"
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
              value={config.bgColor || '#ffffff'}
              onChange={(e) => update('bgColor', e.target.value)}
              className="h-10 w-12 rounded-lg border border-border p-1 cursor-pointer bg-background shrink-0"
            />
            <Input
              value={config.bgColor || '#ffffff'}
              onChange={(e) => update('bgColor', e.target.value)}
              className="font-mono uppercase text-xs h-10 flex-1"
            />
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Carousel Categories ({categories.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reorder or hide categories displayed in the storefront carousel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search categories..."
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
            <Button size="sm" onClick={addCategory} className="w-full sm:w-auto h-9 gap-1.5">
              <Plus size={15} /> Add Category
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
                  <div className="w-12 h-12 rounded-lg border border-border shadow-xs flex items-center justify-center overflow-hidden shrink-0 bg-muted/40">
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
                label: 'Category Details',
                render: (row) => (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm text-foreground">{row.title || 'Untitled Category'}</span>
                    <span className="text-xs text-muted-foreground font-mono">{row.link || '/products'}</span>
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (row) => {
                  const i = categories.indexOf(row);
                  const isActive = row.isVisible !== false;
                  return (
                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusSwitch
                        checked={isActive}
                        loading={togglingIndex === i}
                        onCheckedChange={() => toggleCategoryStatus(i)}
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
                  const i = categories.indexOf(row);
                  return (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingIndex(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCategoryIndex(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }
              }
            ]}
            data={filteredCategories}
            loading={false}
            actions={false}
            pagination={false}
            onBulkDelete={handleBulkDelete}
            onRowClick={(row) => setEditingIndex(categories.indexOf(row))}
            onReorder={(newOrder) => update('categories', newOrder, true)}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditing} onOpenChange={(val) => !val && setEditingIndex(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                Edit Carousel Category
              </DialogTitle>
              {currentCategory && (
                <StatusSwitch
                  checked={currentCategory.isVisible !== false}
                  onCheckedChange={(val) => updateCurrentCategory('isVisible', val)}
                  label={currentCategory.isVisible !== false ? 'Active' : 'Hidden'}
                />
              )}
            </div>
          </DialogHeader>

          {currentCategory && (
            <div className="flex flex-col sm:flex-row gap-6 py-4">
              {/* Image side */}
              <div className="w-full sm:w-44 shrink-0 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Category Image
                </label>
                <div className="relative aspect-square rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted/30 group flex items-center justify-center">
                  {currentCategory._preview || currentCategory.image ? (
                    <img src={currentCategory._preview || getImgSrc(currentCategory.image)} className="w-full h-full object-contain p-2 bg-white dark:bg-zinc-900" alt="preview" />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      <ImageIcon size={24} className="mx-auto mb-2 opacity-50" />
                      <span className="text-xs font-medium">Click to upload</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleFile}
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xs font-semibold bg-black/50 px-2.5 py-1 rounded-md">Change Image</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground text-center font-medium leading-tight">
                  📐 Recommended: <span className="font-mono text-primary font-semibold">500 × 500 px (1:1)</span>
                </p>
              </div>

              {/* Fields side */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Category Title *
                  </label>
                  <Input
                    value={currentCategory.title || ''}
                    onChange={(e) => updateCurrentCategory('title', e.target.value)}
                    placeholder="e.g. Roses"
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Link URL
                  </label>
                  <Input
                    value={currentCategory.link || ''}
                    onChange={(e) => updateCurrentCategory('link', e.target.value)}
                    placeholder="/category/roses"
                    className="h-10 text-xs font-mono"
                  />
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

      <ConfirmDeleteModal
        isOpen={deleteCategoryIndex !== null}
        onClose={() => setDeleteCategoryIndex(null)}
        onConfirm={() => removeCategory(deleteCategoryIndex)}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
      />
    </div>
  );
}
