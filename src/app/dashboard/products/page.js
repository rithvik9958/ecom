'use client'
import { useState, useEffect } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Edit2, Trash2, Layers, ImageIcon, Eye } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'
import StatusSwitch from '@/components/dashboard/StatusSwitch'

// Lazy-load ProductModal so CKEditor doesn't crash the categories route
const ProductModal = dynamic(() => import('./ProductModal'), { ssr: false })

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  
  // Standardization states
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })
  
  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }])
  const stripHtml = html => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  useEffect(() => {
    const t = Date.now();
    Promise.all([
      fetch(`/api/products?t=${t}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/categories?t=${t}`, { cache: 'no-store' }).then(r => r.json())
    ]).then(([prods, cats]) => {
      setProducts(Array.isArray(prods) ? prods : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setLoading(false)
    }).catch(e => {
      console.error(e)
      addToast('Failed to load data', 'danger')
      setLoading(false)
    })
  }, [])

  function handleSave(savedProd) {
    setProducts(r => {
      const idx = r.findIndex(x => x._id === savedProd._id)
      if (idx > -1) {
        const nr = [...r]; nr[idx] = savedProd; return nr
      }
      return [...r, savedProd]
    })
    setModal(null)
    addToast('Product saved successfully!')
  }

  async function handleDelete(id) {
    try {
      setConfirmModal({ isOpen: false, type: 'single', id: null })
      setDeletingId(id)
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setProducts(r => r.filter(x => x._id !== id))
      setSelectedIds(prev => prev.filter(x => x !== id))
      addToast('Product deleted', 'warning')
    } catch (e) {
      addToast(e.message, 'danger')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleBulkDelete() {
    try {
      setConfirmModal({ isOpen: false, type: 'bulk', id: null })
      setBulkDeleting(true)
      await Promise.all(selectedIds.map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })))
      setProducts(r => r.filter(x => !selectedIds.includes(x._id)))
      setSelectedIds([])
      addToast('Products deleted', 'warning')
    } catch (e) {
      addToast('Error deleting some products: ' + e.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function handleToggleStatus(id, currentStatus) {
    try {
      setTogglingId(id)
      const existing = products.find(x => x._id === id)
      const fd = new FormData()
      fd.append('name', existing?.name || '')
      fd.append('slug', existing?.slug || '')
      fd.append('category', existing?.category?._id || existing?.category || '')
      fd.append('sort', existing?.sort ?? '')
      fd.append('isActive', (!currentStatus).toString())
      const res = await fetch(`/api/products/${id}`, { method: 'PUT', body: fd })
      if (!res.ok) throw new Error(await res.text())
      setProducts(r => r.map(x => x._id === id ? { ...x, isActive: !currentStatus } : x))
      addToast('Status updated!')
    } catch (e) {
      addToast(e.message, 'danger')
    } finally {
      setTogglingId(null)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) setSelectedIds([])
    else setSelectedIds(filteredData.map(x => x._id))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filteredData = products
    .filter(p => 
      p.name?.toLowerCase().includes(search.toLowerCase()) || 
      p.grade?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if (sort === 'a-z') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'z-a') return (b.name || '').localeCompare(a.name || '')
      return (a.sort || 0) - (b.sort || 0)
    })

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
          {row.image ? (
            <img
              src={row.image.startsWith('http') ? row.image : (row.image.startsWith('/') ? row.image : `/uploads/${row.image}`)}
              alt={row.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
          )}
        </div>
      )
    },
    {
      key: 'details',
      label: 'Product Name & Size',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[14px] text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
            {stripHtml(row.description).substring(0, 60)}{stripHtml(row.description).length > 60 ? '…' : ''}
          </span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 font-medium">
          {row.category?.name || '—'}
        </Badge>
      )
    },
    {
      key: 'sort',
      label: 'Sort',
      render: (row) => <span className="font-medium text-sm text-muted-foreground">{row.sort}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusSwitch
          checked={row.isActive}
          loading={togglingId === row._id}
          onCheckedChange={() => handleToggleStatus(row._id, row.isActive)}
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
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: row._id }); }}
            disabled={deletingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Product"
          >
            {deletingId === row._id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  const handleReorder = async (reorderedList) => {
    const updated = reorderedList.map((item, idx) => ({ ...item, sort: idx + 1 }));
    setProducts(updated);
    addToast('Product display order updated');
    try {
      await Promise.all(
        updated.slice(0, 15).map(item => {
          const fd = new FormData();
          fd.append('name', item.name || '');
          fd.append('slug', item.slug || '');
          fd.append('sort', String(item.sort));
          return fetch(`/api/products/${item._id}`, { method: 'PUT', body: fd });
        })
      );
    } catch (e) {
      console.error('Error persisting sort order:', e);
    }
  };

  const customButtons = (
    <Link href="/dashboard/products/categories">
      <div className="inline-flex items-center justify-center rounded-md px-4 h-10 font-medium bg-transparent border border-border hover:bg-muted transition-colors text-sm cursor-pointer">
        <Layers className="w-4 h-4 mr-1.5" /> Categories
      </div>
    </Link>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Products Management" 
        subtitle={`Manage your product catalogue (${products.filter(p => p.isActive).length} active)`}
        crumbs={[{ label: 'Products' }]} 
      />
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={() => setConfirmModal({ isOpen: true, type: 'bulk', id: null })}
        bulkDeleting={bulkDeleting}
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
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelect}
        onReorder={handleReorder}
      />
      
      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          categories={categories}
          nextSort={products.reduce((max, r) => Math.max(max, Number(r.sort) || 0), 0) + 1}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Product" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? "Are you sure you want to delete this product? This action cannot be undone." 
          : `Are you sure you want to delete ${selectedIds.length} products? This action cannot be undone.`}
      />
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
