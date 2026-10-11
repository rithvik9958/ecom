'use client'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import { useState, useEffect } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { FloatingInput, FloatingTextarea, FloatingSelect } from '@/components/ui/floating-input'
import { SlugInput } from '@/components/dashboard/SlugInput'
import { SortInput } from '@/components/dashboard/SortInput'
import { Edit2, Trash2, ImageIcon } from 'lucide-react'
import RichEditor from '@/components/dashboard/RichEditor'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'
import StatusSwitch from '@/components/dashboard/StatusSwitch'
import showToast from '@/lib/storeToast'

const EMPTY = { 
  name: '', slug: '', description: '', breadcrumb: '', sort: '',
  metatag: '', metaDescription: '', metakeywords: '', canonicalUrl: '',
  ogTitle: '', ogDescription: '', twitterCard: 'summary_large_image', robots: 'index, follow',
  schema: '', alt: ''
}

function CatModal({ cat, nextSort = 1, onClose, onSave }) {
  const [form, setForm] = useState(() => {
    if (!cat) return { ...EMPTY, sort: nextSort }
    return {
      ...EMPTY,
      ...cat,
      schema: cat.schemaMarkup ? JSON.stringify(cat.schemaMarkup, null, 2) : '',
      metakeywords: Array.isArray(cat.metakeywords) ? cat.metakeywords.join(', ') : (cat.metakeywords || '')
    }
  })
  const [tab, setTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState(cat?.image || '')
  const [slugLinked, setSlugLinked] = useState(!cat)
  const [sortIsAuto, setSortIsAuto] = useState(!cat)
  
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function toSlug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData()
    
    Object.keys(form).forEach(k => {
      if (k === 'image' && form[k] instanceof File) {
        formData.append(k, form[k])
      } else if (k !== 'image') {
        formData.append(k, form[k])
      }
    })

    if (!cat) {
      formData.append('isActive', 'true')
    }

    try {
      const url = cat ? `/api/categories/${cat._id}` : '/api/categories'
      const method = cat ? 'PUT' : 'POST'
      const res = await fetch(url, { method, body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      onSave(data)
    } catch (err) {
      showToast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'media', label: 'Image' },
    { key: 'seo',   label: 'SEO Settings' },
  ]

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{cat ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <p className="text-muted-foreground text-sm">Fill out the information below to {cat ? 'update' : 'create'} this category.</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-border px-2 pb-3">
            {tabs.map(t => (
              <button
                key={t.key} type="button"
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === t.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>


          <div className="py-2 space-y-6">
            {tab === 'basic' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput 
                    label="Category Name *" 
                    required 
                    value={form.name} 
                    onChange={e => { 
                      f('name', e.target.value)
                      if (slugLinked) f('slug', toSlug(e.target.value))
                    }} 
                    rightElement={<AIAssistantButton context="Steel/Metal Product Category" field="Category Name" onGenerate={(val) => {
                      f('name', val)
                      if (slugLinked) f('slug', toSlug(val))
                    }} />}
                  />
                  <SlugInput
                    label="URL Slug *"
                    required
                    value={form.slug}
                    isEditing={!!cat}
                    linked={slugLinked}
                    onToggleLink={() => {
                      const nextLinked = !slugLinked
                      setSlugLinked(nextLinked)
                      if (nextLinked) f('slug', toSlug(form.name))
                    }}
                    onChange={v => {
                      setSlugLinked(false)
                      f('slug', v)
                    }}
                  />
                </div>
                
                <div className="space-y-4 w-full overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-foreground/80 block">Category Description</label>
                    <AIAssistantButton context={form.name} field="Full HTML Category Description" onGenerate={(val) => f('description', val)} />
                  </div>
                  <div className="border border-input/60 rounded-xl overflow-hidden shadow-sm w-full">
                    <RichEditor
                      value={form.description}
                      onChange={v => f('description', v)}
                      placeholder="Enter category description..."
                      minHeight={200}
                    />
                  </div>
                </div>
                
                <FloatingInput label="Breadcrumb Label" value={form.breadcrumb} onChange={e => f('breadcrumb', e.target.value)} rightElement={<AIAssistantButton context={form.name || 'Product Category'} field="Breadcrumb Label" onGenerate={(val) => f('breadcrumb', val)} />} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SortInput
                    label="Sort Order"
                    value={form.sort}
                    isEditing={Boolean(cat)}
                    isAuto={sortIsAuto}
                    onManualEdit={() => setSortIsAuto(false)}
                    onChange={v => f('sort', v)}
                  />
                </div>
              </div>
            )}
            
            {tab === 'media' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
                  <label className="text-sm font-semibold text-foreground/80 mb-1 block">Category Image</label>
                  <p className="text-[11px] text-muted-foreground mb-3">Upload an image for this category</p>
                  <input type="file" accept="image/*" onChange={e => { 
                    const file = e.target.files[0]
                    if (file) {
                      f('image', file)
                      setImagePreview(URL.createObjectURL(file))
                    } 
                  }} className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" />
                  {imagePreview && (
                    <img src={imagePreview} className="mt-4 max-h-32 rounded-lg border border-border shadow-sm object-cover" alt="preview" />
                  )}
                </div>
                <FloatingInput label="Image ALT Text" value={form.alt} onChange={e => f('alt', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="SEO alt text for category image" onGenerate={(val) => f('alt', val)} />} />
              </div>
            )}

            {tab === 'seo' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <FloatingInput label="Meta Title" value={form.metatag} onChange={e => f('metatag', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="SEO Meta Title" onGenerate={(val) => f('metatag', val)} />} />
                <FloatingTextarea label="Meta Description" value={form.metaDescription} onChange={e => f('metaDescription', e.target.value)} rows={2} rightElement={<AIAssistantButton context={form.name} field="SEO Meta Description" onGenerate={(val) => f('metaDescription', val)} />} />
                <FloatingInput label="Meta Keywords (Comma separated)" value={form.metakeywords} onChange={e => f('metakeywords', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="SEO Meta Keywords (comma separated)" onGenerate={(val) => f('metakeywords', val)} />} />
                <FloatingInput label="Canonical URL" value={form.canonicalUrl} onChange={e => f('canonicalUrl', e.target.value)} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput label="OG Title" value={form.ogTitle} onChange={e => f('ogTitle', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="OpenGraph Title" onGenerate={(val) => f('ogTitle', val)} />} />
                  <FloatingInput label="OG Description" value={form.ogDescription} onChange={e => f('ogDescription', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="OpenGraph Description" onGenerate={(val) => f('ogDescription', val)} />} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingSelect label="Twitter Card" value={form.twitterCard} onChange={e => f('twitterCard', e.target.value)}>
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary Large Image</option>
                  </FloatingSelect>
                  <FloatingInput label="Robots" value={form.robots} onChange={e => f('robots', e.target.value)} />
                </div>
                <FloatingTextarea label="Schema Markup (JSON)" value={form.schema} onChange={e => f('schema', e.target.value)} rows={4} className="font-mono text-xs" rightElement={<AIAssistantButton context={form.name} field="" isSchema={true} onGenerate={(val) => f('schema', val)} />} />
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-border mt-6">
            <Button variant="ghost" type="button" onClick={onClose} disabled={saving} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
              {saving ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function CategoriesPage() {
  const [rows, setRows] = useState([])
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

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        setRows(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        addToast('Failed to load categories', 'danger')
        setLoading(false)
      })
  }, [])

  function handleSave(savedCat) {
    setRows(r => {
      const idx = r.findIndex(x => x._id === savedCat._id)
      if (idx > -1) {
        const nr = [...r]; nr[idx] = savedCat; return nr;
      }
      return [...r, savedCat]
    })
    setModal(null)
    addToast('Category saved successfully!')
  }

  async function handleDelete(id) {
    try {
      setConfirmModal({ isOpen: false, type: 'single', id: null })
      setDeletingId(id)
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setRows(r => r.filter(x => x._id !== id))
      setSelectedIds(prev => prev.filter(x => x !== id))
      addToast('Category deleted', 'warning')
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
      await Promise.all(selectedIds.map(id => fetch(`/api/categories/${id}`, { method: 'DELETE' })))
      setRows(r => r.filter(x => !selectedIds.includes(x._id)))
      setSelectedIds([])
      addToast('Categories deleted', 'warning')
    } catch (e) {
      addToast('Error deleting some categories: ' + e.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function handleToggleStatus(id, currentStatus) {
    try {
      setTogglingId(id)
      const existing = rows.find(x => x._id === id)
      const fd = new FormData()
      fd.append('name', existing?.name || '')
      fd.append('slug', existing?.slug || '')
      fd.append('sort', existing?.sort ?? '')
      fd.append('isActive', (!currentStatus).toString())
      const res = await fetch(`/api/categories/${id}`, { method: 'PUT', body: fd })
      if (!res.ok) throw new Error(await res.text())
      setRows(r => r.map(x => x._id === id ? { ...x, isActive: !currentStatus } : x))
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

  const filteredData = rows
    .filter(row => 
      row.name?.toLowerCase().includes(search.toLowerCase()) || 
      row.slug?.toLowerCase().includes(search.toLowerCase())
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
      key: 'category',
      label: 'Category',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[14px] text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground mt-0.5 font-mono">{row.slug}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <span className="text-xs text-muted-foreground truncate max-w-[200px] inline-block">
          {row.description || '—'}
        </span>
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
            title="Edit Category"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: row._id }); }}
            disabled={deletingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Category"
          >
            {deletingId === row._id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  const handleReorder = async (reorderedList) => {
    const updated = reorderedList.map((item, idx) => ({ ...item, sort: idx + 1 }));
    setRows(updated);
    addToast('Category display order updated');
    try {
      await Promise.all(
        updated.slice(0, 15).map(item => {
          const fd = new FormData();
          fd.append('name', item.name || '');
          fd.append('slug', item.slug || '');
          fd.append('sort', String(item.sort));
          return fetch(`/api/categories/${item._id}`, { method: 'PUT', body: fd });
        })
      );
    } catch (e) {
      console.error('Error persisting category sort order:', e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Product Categories" 
        subtitle={`Manage your categories (${rows.filter(r => r.isActive).length} active)`}
        crumbs={[{ label: 'Products' }, { label: 'Categories' }]} 
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
        addLabel="Add Category"
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
      
      {modal && <CatModal cat={modal === 'new' ? null : modal} nextSort={rows.reduce((max, r) => Math.max(max, Number(r.sort) || 0), 0) + 1} onClose={() => setModal(null)} onSave={handleSave} />}
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Category" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? "Are you sure you want to delete this category? This action cannot be undone." 
          : `Are you sure you want to delete ${selectedIds.length} categories? This action cannot be undone.`}
      />
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
