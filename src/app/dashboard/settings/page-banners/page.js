'use client'
import { useState, useEffect } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-input'
import { Edit2, Trash2, ImageIcon } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'
import StatusSwitch from '@/components/dashboard/StatusSwitch'

const BASE_URL = ''

const pageKeys = [
  { key: 'blog', label: 'Blog Listing Page' },
  { key: 'contact', label: 'Contact Page' },
  { key: 'certifications', label: 'Certifications Page' },
  { key: 'gallery', label: 'Gallery Page' },
]

export default function PageBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Standard states
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null) // null | 'new' | banner object
  const [previewImage, setPreviewImage] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })
  const [deletingId, setDeletingId] = useState(null)

  const addToast = (message, type = 'success') => setToasts(t => [...t, { id: Date.now(), message, type }])

  const filteredBanners = banners
    .filter(b => 
      b.title?.toLowerCase().includes(search.toLowerCase()) || 
      b.pageKey?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '')
      if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '')
      return 0
    })

  useEffect(() => { fetchBanners() }, [])

  async function fetchBanners() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/page-banners`)
      if (!res.ok) throw new Error('Failed to fetch banners')
      const data = await res.json()
      setBanners(data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    try {
      setSaving(true)
      const fd = new FormData(e.target)
      
      // If adding new, default isActive to true
      if (modal === 'new') {
        fd.set('isActive', 'true')
      } else {
        fd.set('isActive', modal.isActive ? 'true' : 'false')
      }
      
      const res = await fetch(`${BASE_URL}/api/page-banners`, {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Save failed')
      
      addToast('Banner saved!')
      setModal(null)
      fetchBanners()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      setConfirmModal({ isOpen: false, type: 'single', id: null })
      setDeletingId(id)
      const res = await fetch(`${BASE_URL}/api/page-banners?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete banner')
      setBanners(b => b.filter(x => x._id !== id))
      setSelectedIds(prev => prev.filter(x => x !== id))
      addToast('Banner deleted', 'warning')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleBulkDelete() {
    try {
      setConfirmModal({ isOpen: false, type: 'bulk', id: null })
      setBulkDeleting(true)
      await Promise.all(selectedIds.map(id => fetch(`${BASE_URL}/api/page-banners?id=${id}`, { method: 'DELETE' })))
      setBanners(b => b.filter(x => !selectedIds.includes(x._id)))
      setSelectedIds([])
      addToast('Banners deleted', 'warning')
    } catch (err) {
      addToast('Error deleting some banners: ' + err.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function handleToggleStatus(id, currentStatus) {
    try {
      setTogglingId(id)
      const existing = banners.find(b => b._id === id)
      const fd = new FormData()
      fd.append('pageKey', existing.pageKey)
      fd.append('title', existing.title)
      fd.append('isActive', (!currentStatus).toString())
      
      const res = await fetch(`${BASE_URL}/api/page-banners`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Failed to update status')
      setBanners(b => b.map(x => x._id === id ? { ...x, isActive: !currentStatus } : x))
      addToast('Status updated!')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredBanners.length) setSelectedIds([])
    else setSelectedIds(filteredBanners.map(x => x._id))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        <div className="w-16 h-10 rounded-md border border-border overflow-hidden bg-muted flex items-center justify-center">
          {row.image ? (
            <img src={row.image} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
          )}
        </div>
      )
    },
    {
      key: 'pageKey',
      label: 'Page',
      render: (row) => (
        <Badge variant="outline" className="bg-muted text-foreground/80 font-medium capitalize">
          {row.pageKey}
        </Badge>
      )
    },
    {
      key: 'title',
      label: 'Heading Text',
      render: (row) => (
        <span className="font-semibold text-[14px] text-foreground">{row.title}</span>
      )
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
            onClick={(e) => { e.stopPropagation(); setModal(row); setPreviewImage(row.image) }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Banner"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: row._id }); }}
            disabled={deletingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Banner"
          >
            {deletingId === row._id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  const handleReorder = (reorderedList) => {
    setBanners(reorderedList);
    addToast('Banner order updated');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Global Page Banners" 
        subtitle={`Manage banners across your website (${banners.length} total)`} 
        crumbs={[{ label: 'Settings' }, { label: 'Page Banners' }]} 
      />
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={() => setConfirmModal({ isOpen: true, type: 'bulk', id: null })}
        bulkDeleting={bulkDeleting}
        onAdd={() => { setModal('new'); setPreviewImage(null) }}
        addLabel="Add Banner"
      />

      <DataTable 
        columns={columns}
        data={filteredBanners}
        loading={loading}
        onRowClick={(row) => { setModal(row); setPreviewImage(row.image) }}
        actions={false}
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelect}
        onReorder={handleReorder}
      />

      {modal && (
        <Dialog open={true} onOpenChange={(open) => !open && !saving && setModal(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{modal === 'new' ? 'Add Banner' : 'Edit Banner'}</DialogTitle>
              <p className="text-muted-foreground text-sm">Fill out the information below to {modal === 'new' ? 'create' : 'update'} this banner.</p>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6 mt-4">
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <FloatingSelect name="pageKey" label="Page *" required defaultValue={modal?.pageKey || ''}>
                  <option value="" disabled>Select a page...</option>
                  {pageKeys.map(p => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </FloatingSelect>
                
                <FloatingInput id="banner-title" name="title" label="Heading Text *" defaultValue={modal?.title || ''} required rightElement={<AIAssistantButton context="Page Banner" field="Catchy Banner Heading" onGenerate={(val) => { const el = document.getElementById('banner-title'); if(el) el.value = val; }} />} />

                <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
                  <label className="text-sm font-semibold text-foreground/80 mb-1 block">Banner Image</label>
                  <p className="text-[11px] text-muted-foreground mb-3">Recommended size: 1920x680px</p>
                  <input name="image" type="file" accept="image/*" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setPreviewImage(URL.createObjectURL(e.target.files[0]))
                    }
                  }} className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" />
                  {previewImage && (
                    <img src={previewImage} alt="preview" className="mt-4 max-h-32 rounded-lg border border-border shadow-sm object-cover" />
                  )}
                </div>
              </div>

              <DialogFooter className="pt-6 border-t border-border mt-6">
                <Button variant="ghost" type="button" onClick={() => setModal(null)} disabled={saving} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
                  {saving ? 'Saving...' : 'Save Banner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Banner" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? "Are you sure you want to delete this banner? This action cannot be undone." 
          : `Are you sure you want to delete ${selectedIds.length} banners? This action cannot be undone.`}
      />
      
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
