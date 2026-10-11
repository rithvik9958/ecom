'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import Toast from '@/components/dashboard/Toast';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, ImageIcon, Layers, FileUp, Settings2 } from 'lucide-react';
import Link from 'next/link';
import ProductModal from './ProductModal';
import BulkUploadModal from '@/components/dashboard/BulkUploadModal';
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'new' or product object
  const [confirmDelete, setConfirmDelete] = useState(null); // id to delete
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [togglingId, setTogglingId] = useState(null);
  
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkUploadModal, setBulkUploadModal] = useState(false);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/store-products').then(r => r.json()),
      fetch('/api/admin/store-categories').then(r => r.json())
    ]).then(([prods, cats]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSave = (savedProd) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => (p._id === savedProd._id || p.id === savedProd.id));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedProd;
        return next;
      }
      return [savedProd, ...prev];
    });
    setModal(null);
    addToast('Product saved successfully');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/store-products/${confirmDelete}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      setProducts(prev => prev.filter(p => p._id !== confirmDelete && p.id !== confirmDelete));
      addToast('Product deleted', 'warning');
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
        fetch(`/api/admin/store-products/${id}`, { method: 'DELETE' })
      ));
      setProducts(prev => prev.filter(p => !selectedIds.includes(p._id) && !selectedIds.includes(p.id)));
      addToast(`${selectedIds.length} products deleted`, 'warning');
    } catch (e) {
      addToast('Error during bulk delete', 'danger');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleReorder = async (reorderedData) => {
    setProducts(reorderedData);
    addToast('Display order updated');
    try {
      const orderData = reorderedData.map((p, index) => ({
        id: p._id || p.id,
        order: index
      }));
      await fetch('/api/admin/store-products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderData })
      });
    } catch (e) {
      console.error('Failed to save product order', e);
      addToast('Failed to save order', 'danger');
    }
  };

  const handleBulkUpload = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/bulk-upload/products', { method: 'POST', body: fd });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to bulk upload');
    }
    const data = await res.json();
    addToast(data.message || 'Products uploaded successfully');
    
    // Refresh products
    setLoading(true);
    fetch('/api/admin/store-products').then(r => r.json()).then(prods => {
      setProducts(Array.isArray(prods) ? prods : []);
      setLoading(false);
    });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setTogglingId(id);
      const fd = new FormData();
      fd.append('isActive', (!currentStatus).toString());
      const res = await fetch(`/api/admin/store-products/${id}`, { method: 'PUT', body: fd });
      if (!res.ok) throw new Error('Failed to update status');
      setProducts(prev => prev.map(p => (p._id === id || p.id === id) ? { ...p, isActive: !currentStatus } : p));
      addToast('Status updated');
    } catch (e) {
      addToast(e.message, 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredData = products.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center overflow-hidden shrink-0">
          {row.thumbnail ? (
            <img src={row.thumbnail.startsWith('http') ? row.thumbnail : `/uploads/${row.thumbnail}`} alt={row.title} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
          )}
        </div>
      )
    },
    {
      key: 'details',
      label: 'Product',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground">{row.title}</span>
          <span className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{row.category}</span>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm text-primary">₹{(row.price || 0).toLocaleString('en-IN')}</span>
          {row.mrp > row.price && (
            <span className="text-xs text-muted-foreground line-through">₹{(row.mrp || 0).toLocaleString('en-IN')}</span>
          )}
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (row) => (
        <Badge variant="outline" className={row.stock > 10 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-medium' : (row.stock > 0 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-medium' : 'bg-destructive/10 text-destructive border-destructive/30 font-medium')}>
          {row.stock > 0 ? `${row.stock} in stock` : 'Out of stock'}
        </Badge>
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
            title="Edit Product"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(row._id || row.id); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const customButtons = (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => setBulkUploadModal(true)}>
        <FileUp className="w-4 h-4 mr-2" /> Bulk Upload
      </Button>
      <Link href="/dashboard/ecommerce/attribute-templates">
        <div className="inline-flex items-center justify-center rounded-md px-4 h-10 font-medium bg-transparent border border-border hover:bg-muted transition-colors text-sm cursor-pointer">
          <Settings2 className="w-4 h-4 mr-1.5" /> Attr Templates
        </div>
      </Link>
      <Link href="/dashboard/ecommerce/categories">
        <div className="inline-flex items-center justify-center rounded-md px-4 h-10 font-medium bg-transparent border border-border hover:bg-muted transition-colors text-sm cursor-pointer">
          <Layers className="w-4 h-4 mr-1.5" /> Categories
        </div>
      </Link>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Store Products" 
        subtitle={`Manage your storefront products (${products.length} total)`}
        crumbs={[{ label: 'Storefront Management' }, { label: 'Products' }]} 
      />
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        hideSort={true}
        onAdd={() => setModal('new')}
        addLabel="Add Product"
        extraActions={customButtons}
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
        <ProductModal 
          product={modal === 'new' ? null : modal} 
          categories={categories}
          onClose={() => setModal(null)} 
          onSave={handleSave} 
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!confirmDelete}
        isDeleting={deleting}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
      
      <BulkUploadModal
        isOpen={bulkUploadModal}
        onClose={() => setBulkUploadModal(false)}
        onUpload={handleBulkUpload}
        templateHref="/templates/products_template.csv"
        title="Bulk Upload Products"
      />
      
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
