'use client';
import { useState } from 'react';
import { Plus, Trash2, Edit2, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CustomSelect from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/dashboard/DataTable';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';

export default function StatsCounterConfig({ config, onChange }) {
  const stats = config.stats || [];
  const bgColor = config.bgColor || '#f0f2ec';
  const accentColor = config.accentColor || '#6a8f4b';
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [togglingIndex, setTogglingIndex] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('order');

  const filteredStats = stats
    .filter(s => (s.label || '').toLowerCase().includes(search.toLowerCase()) || (s.value || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'a-z') return (a.label || '').localeCompare(b.label || '');
      if (sort === 'z-a') return (b.label || '').localeCompare(a.label || '');
      return 0;
    });

  const update = (field, value) => onChange({ ...config, [field]: value });

  const addStat = () => {
    const nextStats = [...stats, { id: Date.now(), value: '100+', label: 'New Stat Label', isVisible: true }];
    onChange({ ...config, stats: nextStats });
    setEditingIndex(nextStats.length - 1);
  };

  const updateStat = (field, value) => {
    if (editingIndex === null) return;
    const next = [...stats];
    next[editingIndex] = { ...next[editingIndex], [field]: value };
    onChange({ ...config, stats: next });
  };

  const removeStat = (i) => {
    onChange({ ...config, stats: stats.filter((_, idx) => idx !== i) });
    setDeleteIndex(null);
  };

  const toggleStatStatus = (idx) => {
    setTogglingIndex(idx);
    const next = [...stats];
    const cur = next[idx]?.isVisible !== false;
    next[idx] = { ...next[idx], isVisible: !cur };
    onChange({ ...config, stats: next });
    setTimeout(() => setTogglingIndex(null), 400);
  };

  const handleBulkDelete = async (selectedIndices) => {
    const next = stats.filter((_, idx) => !selectedIndices.includes(String(idx)));
    onChange({ ...config, stats: next });
  };

  return (
    <div className="space-y-6">
      {/* Section Settings */}
      <div className="p-4 border border-border rounded-xl bg-muted/20 space-y-3">
        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Section Appearance</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Background Color</label>
            <div className="flex gap-2">
              <input type="color" value={bgColor} onChange={(e) => update('bgColor', e.target.value)} className="h-10 w-12 rounded-lg border border-border p-1 cursor-pointer bg-background shrink-0" />
              <Input value={bgColor} onChange={(e) => update('bgColor', e.target.value)} className="font-mono text-xs uppercase h-10 flex-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">Number Color (Accent)</label>
            <div className="flex gap-2">
              <input type="color" value={accentColor} onChange={(e) => update('accentColor', e.target.value)} className="h-10 w-12 rounded-lg border border-border p-1 cursor-pointer bg-background shrink-0" />
              <Input value={accentColor} onChange={(e) => update('accentColor', e.target.value)} className="font-mono text-xs uppercase h-10 flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat Items */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Stats Counter Metrics ({stats.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Highlight numbers showing company scale, customer trust, and volume.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="Search stats..."
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
                { value: 'a-z', label: 'Label (A-Z)' },
                { value: 'z-a', label: 'Label (Z-A)' },
              ]}
            />
            <Button size="sm" onClick={addStat} className="w-full sm:w-auto h-9 gap-1.5">
              <Plus size={15} /> Add Stat
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <DataTable
            columns={[
              {
                key: 'value',
                label: 'Stat Value',
                render: (row) => (
                  <div className="text-xl font-extrabold" style={{ color: accentColor }}>
                    {row.value || '—'}
                  </div>
                )
              },
              {
                key: 'label',
                label: 'Label & Description',
                render: (row) => (
                  <div className="font-semibold text-sm text-foreground">
                    {row.label || 'No label'}
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (row) => {
                  const i = stats.indexOf(row);
                  const isActive = row.isVisible !== false;
                  return (
                    <div onClick={(e) => e.stopPropagation()}>
                      <StatusSwitch
                        checked={isActive}
                        loading={togglingIndex === i}
                        onCheckedChange={() => toggleStatStatus(i)}
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
                  const i = stats.indexOf(row);
                  return (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingIndex(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                        title="Edit Stat"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteIndex(i)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
                        title="Delete Stat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }
              }
            ]}
            data={filteredStats}
            loading={false}
            actions={false}
            pagination={false}
            onBulkDelete={handleBulkDelete}
            onRowClick={(row) => setEditingIndex(stats.indexOf(row))}
            onReorder={(newOrder) => onChange({ ...config, stats: newOrder }, true)}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                Edit Stat Metric
              </DialogTitle>
              {editingIndex !== null && stats[editingIndex] && (
                <StatusSwitch
                  checked={stats[editingIndex].isVisible !== false}
                  onCheckedChange={(val) => updateStat('isVisible', val)}
                  label={stats[editingIndex].isVisible !== false ? 'Active' : 'Hidden'}
                />
              )}
            </div>
          </DialogHeader>

          {editingIndex !== null && stats[editingIndex] && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Big Value *</label>
                  <Input placeholder="e.g. 50M+" value={stats[editingIndex].value || ''} onChange={(e) => updateStat('value', e.target.value)} className="text-lg font-bold h-10" />
                  <p className="text-[11px] text-muted-foreground">e.g. "30+", "50M+"</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Label Text *</label>
                  <Input placeholder="e.g. Gifts Delivered" value={stats[editingIndex].label || ''} onChange={(e) => updateStat('label', e.target.value)} className="h-10 text-sm" />
                  <p className="text-[11px] text-muted-foreground">Sub-text below number</p>
                </div>
              </div>
              {/* Live preview */}
              <div className="mt-2 p-5 rounded-xl flex items-center justify-center border border-border" style={{ backgroundColor: bgColor }}>
                <div className="text-center">
                  <p className="text-4xl font-black tracking-tight" style={{ color: accentColor }}>{stats[editingIndex].value || '100+'}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground mt-1">{stats[editingIndex].label || 'Label'}</p>
                </div>
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
        onConfirm={() => removeStat(deleteIndex)}
        title="Delete Stat Metric"
        description="Are you sure you want to delete this stat metric? This action cannot be undone."
      />
    </div>
  );
}

