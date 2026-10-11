'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import Toast from '@/components/dashboard/Toast';
import { Edit2, Trash2 } from 'lucide-react';
import AddonCategoryModal from './AddonCategoryModal';

export default function AddonCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [togglingId, setTogglingId] = useState(null);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetch('/api/admin/store-addon-categories')
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = (savedCat) => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c._id === savedCat._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedCat;
        return next;
      }
      return [savedCat, ...prev];
    });
    setModal(null);
    addToast('Add-on Category saved successfully');
  };

  const handleToggleStatus = async (catId, currentStatus) => {
    try {
      setTogglingId(catId);
      const cat = categories.find(c => (c._id || c.id) === catId);
      if (!cat) return;

      const fd = new FormData();
      fd.append('name', cat.name || '');
      fd.append('order', String(cat.order || 0));
      fd.append('isActive', (!currentStatus).toString());

      const res = await fetch(`/api/admin/store-addon-categories/${catId}`, {
        method: 'PUT',
        body: fd
      });
      if (res.ok) {
        const updated = await res.json();
        setCategories(prev => prev.map(c => (c._id || c.id) === catId ? updated : c));
        addToast('Category status updated');
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error updating status', 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/store-addon-categories/${confirmDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      setCategories(prev => prev.filter(c => c._id !== confirmDelete));
      addToast('Category deleted', 'warning');
    } catch (e) {
      addToast(e.message, 'danger');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleReorder = async (reorderedList) => {
    const updated = reorderedList.map((item, idx) => ({ ...item, order: idx + 1 }));
    setCategories(updated);
    addToast('Category order updated');
    try {
      await Promise.all(
        updated.slice(0, 10).map(item => {
          const fd = new FormData();
          fd.append('name', item.name || '');
          fd.append('order', String(item.order));
          fd.append('isActive', String(item.isActive !== false));
          return fetch(`/api/admin/store-addon-categories/${item._id}`, { method: 'PUT', body: fd });
        })
      );
    } catch (e) {
      console.error('Error persisting addon category order:', e);
    }
  };

  const columns = [
    { key: 'image', label: 'Image', render: (row) => (
      <div className="w-10 h-10 rounded-full bg-muted/30 border border-border flex items-center justify-center overflow-hidden shrink-0">
        {row.image ? <img src={row.image.startsWith('http') ? row.image : `/uploads/${row.image}`} alt="Img" className="w-full h-full object-cover" /> : <div className="w-4 h-4 bg-muted" />}
      </div>
    )},
    { key: 'name', label: 'Name', render: (row) => <span className="font-semibold text-sm text-foreground">{row.name}</span> },
    { key: 'order', label: 'Sort Order', render: (row) => <span className="text-sm text-muted-foreground">{row.order}</span> },
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
          title="Edit Category"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmDelete(row._id || row.id); }}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
          title="Delete Category"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Add-on Categories" 
        subtitle={`Manage extra product categories (${categories.length} total)`}
        crumbs={[{ label: 'Storefront Management' }, { label: 'Add-on Categories' }]} 
      />

      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        hideSort={true}
        onAdd={() => setModal('new')}
        addLabel="Add Category"
      />

      <DataTable 
        columns={columns}
        data={categories.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()))}
        loading={loading}
        onRowClick={(row) => setModal(row)}
        actions={false}
        onReorder={handleReorder}
        emptyMessage="No add-on categories found. Create your first one!"
      />

      {modal && (
        <AddonCategoryModal 
          category={modal === 'new' ? null : modal} 
          onClose={() => setModal(null)} 
          onSave={handleSave} 
        />
      )}

      <ConfirmDeleteModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={handleDelete} 
        title="Delete Category" 
        loading={deleting}
      />

      <Toast toasts={toasts} onRemove={id => setToasts(ts => ts.filter(x => x.id !== id))} />
    </div>
  );
}
