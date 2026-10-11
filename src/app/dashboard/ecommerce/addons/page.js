'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import Toast from '@/components/dashboard/Toast';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import AddonModal from './AddonModal';

export default function AddonsPage() {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'new' or object
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetch('/api/store-addons')
      .then(res => res.json())
      .then(data => {
        setAddons(data.addons || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = (savedAddon) => {
    setAddons(prev => {
      const idx = prev.findIndex(c => c._id === savedAddon._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedAddon;
        return next;
      }
      return [savedAddon, ...prev];
    });
    setModal(null);
    addToast('Add-on saved successfully');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/store-addons/${confirmDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete add-on');
      setAddons(prev => prev.filter(c => c._id !== confirmDelete));
      addToast('Add-on deleted', 'warning');
    } catch (e) {
      addToast(e.message, 'danger');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleBulkDelete = async (selectedIds) => {
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => 
        fetch(`/api/store-addons/${id}`, { method: 'DELETE' })
      ));
      setAddons(prev => prev.filter(c => !selectedIds.includes(c._id)));
      addToast(`${selectedIds.length} add-ons deleted`, 'warning');
    } catch (e) {
      addToast('Error during bulk delete', 'danger');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleStatus = async (addonId, currentStatus) => {
    try {
      setTogglingId(addonId);
      const addon = addons.find(a => (a._id || a.id) === addonId);
      if (!addon) return;

      const fd = new FormData();
      fd.append('name', addon.name || '');
      fd.append('price', String(addon.price || 0));
      fd.append('mrp', String(addon.mrp || 0));
      fd.append('isActive', (!currentStatus).toString());
      if (addon.category) {
        fd.append('category', typeof addon.category === 'object' ? addon.category._id : addon.category);
      }

      const res = await fetch(`/api/store-addons/${addonId}`, {
        method: 'PUT',
        body: fd
      });
      const data = await res.json();
      if (data.success && data.addon) {
        setAddons(prev => prev.map(a => (a._id || a.id) === addonId ? data.addon : a));
        addToast('Add-on status updated');
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error updating status', 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  const handleReorder = (reorderedList) => {
    setAddons(reorderedList);
    addToast('Add-ons order updated');
  };

  const columns = [
    { key: 'image', label: 'Image', render: (row) => (
        <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center overflow-hidden shrink-0">
          {row.image ? <img src={row.image.startsWith('http') ? row.image : `/uploads/${row.image}`} alt="Img" className="w-full h-full object-cover" /> : <div className="w-4 h-4 bg-muted" />}
        </div>
      )},
    { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-sm text-foreground">{row.name}</span> },
    { key: 'category', label: 'Category', render: (row) => <span className="text-sm text-muted-foreground">{row.category?.name || '-'}</span> },
    { key: 'price', label: 'Price', render: (row) => <span className="text-sm font-semibold text-primary">₹{row.price}</span> },
    { key: 'isActive', label: 'Status', render: (row) => (
      <StatusSwitch
        checked={row.isActive}
        loading={togglingId === (row._id || row.id)}
        onCheckedChange={() => handleToggleStatus(row._id || row.id, row.isActive)}
        label={row.isActive ? 'Active' : 'Inactive'}
      />
    )},
    { key: 'actions', align: 'right', label: 'Actions', render: (row) => (
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setModal(row); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
          title="Edit Add-on"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(row._id || row.id); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
          title="Delete Add-on"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Add-ons" 
        subtitle={`Manage extra products that can be added to main items (${addons.length} total)`}
        crumbs={[{ label: 'Storefront Management' }, { label: 'Add-ons' }]} 
      />

      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        hideSort={true}
        onAdd={() => setModal('new')}
        addLabel="Add New Add-on"
      />

      <DataTable 
        columns={columns}
        data={addons.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()))}
        loading={loading}
        onRowClick={(row) => setModal(row)}
        actions={false}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={bulkDeleting}
        onReorder={handleReorder}
        emptyMessage="No add-ons found. Create your first one!"
      />

      {modal && (
        <AddonModal 
          addon={modal === 'new' ? null : modal} 
          onClose={() => setModal(null)} 
          onSave={handleSave} 
        />
      )}

      <ConfirmDeleteModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={handleDelete} 
        title="Delete Add-on" 
        loading={deleting}
      />

      <Toast toasts={toasts} onRemove={id => setToasts(ts => ts.filter(x => x.id !== id))} />
    </div>
  );
}
