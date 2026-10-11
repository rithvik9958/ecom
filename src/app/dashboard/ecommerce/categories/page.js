'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import Toast from '@/components/dashboard/Toast';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Edit2, Trash2, ImageIcon, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CategoryModal from './CategoryModal';
import BulkUploadModal from '@/components/dashboard/BulkUploadModal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'new' or category object
  const [confirmDelete, setConfirmDelete] = useState(null); // id to delete
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [togglingId, setTogglingId] = useState(null);
  
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUploadModal, setBulkUploadModal] = useState(false);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetch('/api/admin/store-categories')
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
      const idx = prev.findIndex(c => c._id === savedCat._id || c.id === savedCat.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedCat;
        return next;
      }
      return [savedCat, ...prev];
    });
    setModal(null);
    addToast('Category saved successfully');
  };

  const handleReorder = async (reorderedData) => {
    setCategories(reorderedData);
    addToast('Category display order updated');
    try {
      const orderData = reorderedData.map((c, index) => ({
        id: c._id || c.id,
        order: index
      }));
      await fetch('/api/admin/store-categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderData })
      });
    } catch (e) {
      console.error('Failed to save category order', e);
      addToast('Failed to save order', 'danger');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/store-categories/${confirmDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      setCategories(prev => prev.filter(c => c._id !== confirmDelete && c.id !== confirmDelete));
      addToast('Category deleted', 'warning');
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
        fetch(`/api/admin/store-categories/${id}`, { method: 'DELETE' })
      ));
      setCategories(prev => prev.filter(c => !selectedIds.includes(c._id) && !selectedIds.includes(c.id)));
      addToast(`${selectedIds.length} categories deleted`, 'warning');
    } catch (e) {
      addToast('Error during bulk delete', 'danger');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkUpload = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/bulk-upload/categories', { method: 'POST', body: fd });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to bulk upload');
    }
    const data = await res.json();
    addToast(data.message || 'Categories uploaded successfully');
    
    // Refresh categories
    setLoading(true);
    fetch('/api/admin/store-categories').then(r => r.json()).then(cats => {
      setCategories(Array.isArray(cats) ? cats : []);
      setLoading(false);
    });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setTogglingId(id);
      const fd = new FormData();
      fd.append('isActive', (!currentStatus).toString());
      const res = await fetch(`/api/admin/store-categories/${id}`, { method: 'PUT', body: fd });
      if (!res.ok) throw new Error('Failed to update status');
      setCategories(prev => prev.map(c => (c._id === id || c.id === id) ? { ...c, isActive: !currentStatus } : c));
      addToast('Category status updated');
    } catch (e) {
      addToast(e.message, 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredData = categories.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center overflow-hidden shrink-0">
          {row.image ? (
            <img src={row.image.startsWith('http') ? row.image : `/uploads/${row.image}`} alt={row.title} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
          )}
        </div>
      )
    },
    {
      key: 'details',
      label: 'Category Details',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground">{row.title}</span>
          <span className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{row.slug}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusSwitch
          checked={row.isActive}
          loading={togglingId === (row._id || row.id)}
          onCheckedChange={() => handleToggleStatus(row._id || row.id, row.isActive)}
          label={row.isActive ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      key: 'actions',
      align: 'right',
      label: 'Actions',
      render: (row) => (
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
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Store Categories" 
        subtitle={`Manage e-commerce product categories (${categories.length} total)`}
        crumbs={[{ label: 'Storefront Management' }, { label: 'Categories' }]} 
      />
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        hideSort={true}
        onAdd={() => setModal('new')}
        addLabel="Add Category"
        extraActions={
          <Button variant="outline" onClick={() => setBulkUploadModal(true)}>
            <FileUp className="w-4 h-4 mr-2" /> Bulk Upload
          </Button>
        }
      />

      <DataTable 
        columns={columns}
        data={filteredData}
        loading={loading}
        onRowClick={(row) => setModal(row)}
        actions={false}
        onReorder={handleReorder}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={bulkDeleting}
      />

      {modal && (
        <CategoryModal 
          category={modal === 'new' ? null : modal} 
          onClose={() => setModal(null)} 
          onSave={handleSave} 
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!confirmDelete}
        isDeleting={deleting}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Products in this category may be affected."
      />
      
      <BulkUploadModal
        isOpen={bulkUploadModal}
        onClose={() => setBulkUploadModal(false)}
        onUpload={handleBulkUpload}
        templateHref="/templates/categories_template.csv"
        title="Bulk Upload Categories"
      />
      
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
