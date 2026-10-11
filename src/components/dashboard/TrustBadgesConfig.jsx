'use client';
import { useState } from 'react';
import { Plus, Trash2, Edit2, Image as ImageIcon, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomSelect from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/dashboard/DataTable';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';

export default function TrustBadgesConfig({ config, onChange }) {
  const badges = config.badges || [];
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [togglingIndex, setTogglingIndex] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('order');

  const filteredBadges = badges
    .filter(b => (b.title || '').toLowerCase().includes(search.toLowerCase()) || (b.subtext || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });

  const addBadge = () => {
    const nextBadges = [...badges, { id: Date.now(), image: '', title: 'New Feature', subtext: 'Short description here', isVisible: true }];
    onChange({ ...config, badges: nextBadges });
    setEditingIndex(nextBadges.length - 1);
  };

  const updateBadge = (field, value) => {
    if (editingIndex === null) return;
    const next = [...badges];
    next[editingIndex] = { ...next[editingIndex], [field]: value };
    onChange({ ...config, badges: next });
  };

  const removeBadge = (i) => {
    onChange({ ...config, badges: badges.filter((_, idx) => idx !== i) });
    setDeleteIndex(null);
  };

  const toggleBadgeStatus = (idx) => {
    setTogglingIndex(idx);
    const next = [...badges];
    const cur = next[idx]?.isVisible !== false;
    next[idx] = { ...next[idx], isVisible: !cur };
    onChange({ ...config, badges: next });
    setTimeout(() => setTogglingIndex(null), 400);
  };

  const handleBulkDelete = async (selectedIndices) => {
    const next = badges.filter((_, idx) => !selectedIndices.includes(String(idx)));
    onChange({ ...config, badges: next });
  };

  const handleFile = (e) => {
    if (editingIndex === null) return;
    const file = e.target.files[0];
    if (!file) return;
    const next = [...badges];
    next[editingIndex] = { ...next[editingIndex], _file: file, _preview: URL.createObjectURL(file) };
    onChange({ ...config, badges: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            Trust & Feature Badges ({badges.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Highlight guaranteed delivery, secure payments, and quality assurances across your store.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search badges..."
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
          <Button size="sm" onClick={addBadge} className="w-full sm:w-auto h-9 gap-1.5">
            <Plus size={15} /> Add Badge
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          columns={[
            {
              key: 'icon',
              label: 'Badge Icon',
              render: (row) => (
                <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center border border-border shadow-xs overflow-hidden shrink-0">
                  {row._preview || row.image ? (
                    <img src={row._preview || (row.image.startsWith('http') ? row.image : `/${row.image}`)} className="w-full h-full object-contain p-1.5" alt="" />
                  ) : (
                    <ImageIcon size={18} className="text-muted-foreground/50" />
                  )}
                </div>
              )
            },
            {
              key: 'details',
              label: 'Badge Details',
              render: (row) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm text-foreground line-clamp-1">{row.title || 'No title'}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{row.subtext || 'No subtext provided'}</span>
                </div>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (row) => {
                const i = badges.indexOf(row);
                const isActive = row.isVisible !== false;
                return (
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusSwitch
                      checked={isActive}
                      loading={togglingIndex === i}
                      onCheckedChange={() => toggleBadgeStatus(i)}
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
                const i = badges.indexOf(row);
                return (
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEditingIndex(i)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                      title="Edit Badge"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteIndex(i)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
                      title="Delete Badge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }
            }
          ]}
          data={filteredBadges}
          loading={false}
          actions={false}
          pagination={false}
          onBulkDelete={handleBulkDelete}
          onRowClick={(row) => setEditingIndex(badges.indexOf(row))}
          onReorder={(newOrder) => onChange({ ...config, badges: newOrder }, true)}
        />
      </div>

      {/* Edit Modal */}
      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck size={20} className="text-primary" />
                Edit Trust Badge
              </DialogTitle>
              {editingIndex !== null && badges[editingIndex] && (
                <StatusSwitch
                  checked={badges[editingIndex].isVisible !== false}
                  onCheckedChange={(val) => updateBadge('isVisible', val)}
                  label={badges[editingIndex].isVisible !== false ? 'Active' : 'Hidden'}
                />
              )}
            </div>
          </DialogHeader>

          {editingIndex !== null && badges[editingIndex] && (
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Badge Icon</label>
                <div className="flex items-start gap-4 p-3 bg-muted/20 border border-border rounded-xl">
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-background flex items-center justify-center border border-border relative group shadow-xs">
                    {badges[editingIndex]._preview || badges[editingIndex].image ? (
                      <img src={badges[editingIndex]._preview || (badges[editingIndex].image.startsWith('http') ? badges[editingIndex].image : `/${badges[editingIndex].image}`)} className="w-full h-full object-contain p-2" alt="" />
                    ) : (
                      <ImageIcon size={24} className="text-muted-foreground/30" />
                    )}
                    <input type="file" accept="image/png,image/webp,image/jpeg,image/*,image/svg+xml" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFile} />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-white text-[10px] font-semibold bg-black/50 px-2 py-0.5 rounded">Change</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Click icon square to upload</p>
                    <p>Supported: SVG, WebP, PNG.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Badge Title *</label>
                <Input placeholder="e.g. Worldwide Delivery" value={badges[editingIndex].title || ''} onChange={(e) => updateBadge('title', e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Subtext / Description</label>
                <Input placeholder="e.g. We deliver gifts to over 70 countries" value={badges[editingIndex].subtext || ''} onChange={(e) => updateBadge('subtext', e.target.value)} className="h-10 text-sm" />
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-4">
            <DialogClose asChild>
              <Button type="button" className="min-w-[100px]">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={deleteIndex !== null}
        onClose={() => setDeleteIndex(null)}
        onConfirm={() => removeBadge(deleteIndex)}
        title="Delete Trust Badge"
        description="Are you sure you want to delete this trust badge? This action cannot be undone."
      />
    </div>
  );
}
