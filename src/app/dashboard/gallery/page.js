'use client'
import { useState, useEffect } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FloatingInput } from '@/components/ui/floating-input'
import { Switch } from '@/components/ui/switch'
import { Image as ImageIcon, Edit2, Trash2, X, UploadCloud } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'
import StatusSwitch from '@/components/dashboard/StatusSwitch'

export default function GalleryPage() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [selectedIds, setSelectedIds] = useState([])
  const [deletingId, setDeletingId] = useState(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })

  // Modal State
  const [modal, setModal] = useState(null) // 'upload' | { _id: string, caption: string }
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }])

  useEffect(() => {
    fetchImages()
  }, [])

  async function fetchImages() {
    try {
      setLoading(true)
      const res = await fetch('/api/gallery-images')
      const data = await res.json()
      setImages(data)
    } catch (err) {
      addToast('Failed to fetch images', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function deleteImage(id) {
    try {
        setConfirmModal({ isOpen: false, type: 'single', id: null })
        setDeletingId(id)
        const res = await fetch(`/api/gallery-images/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error("Failed to delete")
        setImages(i => i.filter(x => x._id !== id))
        setSelectedIds(prev => prev.filter(x => x !== id))
        addToast('Image deleted.', 'warning')
    } catch (err) {
        addToast(err.message, 'error')
    } finally {
        setDeletingId(null)
    }
  }

  async function handleToggleStatus(id, currentStatus) {
    try {
      setTogglingId(id)
      const fd = new FormData()
      fd.append('isActive', (!currentStatus).toString())
      const res = await fetch(`/api/gallery-images/${id}`, { method: 'PUT', body: fd })
      if (!res.ok) throw new Error('Failed to update status')
      setImages(images => images.map(x => x._id === id ? { ...x, isActive: !currentStatus } : x))
      addToast('Status updated!')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleBulkDelete() {
    try {
      setConfirmModal({ isOpen: false, type: 'bulk', id: null })
      setBulkDeleting(true)
      await Promise.all(selectedIds.map(id => fetch(`/api/gallery-images/${id}`, { method: 'DELETE' })))
      setImages(i => i.filter(x => !selectedIds.includes(x._id)))
      setSelectedIds([])
      addToast('Images deleted.', 'warning')
    } catch (err) {
      addToast('Error deleting some images: ' + err.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  function openUpload() {
    setTitle('')
    setFile(null)
    setPreview('')
    setModal('upload')
  }

  function openEdit(row) {
    setTitle(row.caption || '')
    setPreview(row.url || '')
    setFile(null)
    setModal(row)
  }

  function handleFile(e) {
    const selected = e.target.files[0]
    if (selected) {
        setFile(selected)
        setPreview(URL.createObjectURL(selected))
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    
    try {
        setSaving(true)
        
        if (modal === 'upload') {
            if (!file) throw new Error('Please select an image file first.')
            
            const fd = new FormData()
            fd.append(`files[0]`, file)
            fd.append(`captions[0]`, title)

            const res = await fetch('/api/gallery-images', { method: 'POST', body: fd })
            if (!res.ok) throw new Error("Upload failed")
            
            addToast(`Image uploaded successfully!`, 'success')
            fetchImages() // refresh list
        } else {
            // Edit existing
            const fd = new FormData()
            fd.append('caption', title)
            if (file) fd.append('file', file)

            const res = await fetch(`/api/gallery-images/${modal._id}`, { 
                method: 'PUT',
                body: fd
            })
            if (!res.ok) throw new Error("Failed to update image")
            
            const updatedData = await res.json()
            setImages(images => images.map(img => 
                img._id === modal._id ? updatedData.data : img
            ))
            addToast("Image updated!", "success")
        }
        
        setModal(null)
    } catch (err) {
        addToast(err.message, 'error')
    } finally {
        setSaving(false)
    }
  }

  const filteredData = images
    .filter(img => 
      img.caption?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.date || 0) - new Date(a.date || 0)
      if (sort === 'oldest') return new Date(a.date || 0) - new Date(b.date || 0)
      if (sort === 'a-z') return (a.caption || '').localeCompare(b.caption || '')
      if (sort === 'z-a') return (b.caption || '').localeCompare(a.caption || '')
      return 0
    })

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) setSelectedIds([])
    else setSelectedIds(filteredData.map(x => x._id))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = [
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        <div 
          className="w-16 h-16 rounded-md border border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={(e) => { e.stopPropagation(); setLightbox(row); }}
        >
          {row.url ? (
            <img src={row.url} className="w-full h-full object-cover" alt={row.caption} />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
          )}
        </div>
      )
    },
    {
      key: 'title',
      label: 'Title / Caption',
      render: (row) => (
        <span className="font-semibold text-[14px] text-foreground">{row.caption || "No title"}</span>
      )
    },
    {
      key: 'date',
      label: 'Date Uploaded',
      render: (row) => (
        <span className="text-xs font-medium text-muted-foreground">{row.date}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusSwitch
          checked={row.isActive !== false}
          loading={togglingId === row._id}
          onCheckedChange={() => handleToggleStatus(row._id, row.isActive !== false)}
          label={row.isActive !== false ? 'Active' : 'Inactive'}
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
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Image"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: row._id }); }}
            disabled={deletingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Image"
          >
            {deletingId === row._id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  const handleReorder = (reorderedList) => {
    setImages(reorderedList);
    addToast('Gallery order updated');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Gallery Management" 
        subtitle={`Manage your gallery images (${images.length} total)`} 
        crumbs={[{ label: 'Gallery Management' }]} 
      />
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={() => setConfirmModal({ isOpen: true, type: 'bulk', id: null })}
        bulkDeleting={bulkDeleting}
        onAdd={openUpload}
        addLabel="Upload Images"
      />

      <DataTable 
        columns={columns}
        data={filteredData}
        loading={loading}
        onRowClick={(row) => setLightbox(row)}
        actions={false}
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelect}
        onReorder={handleReorder}
      />

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="max-w-6xl w-full relative flex flex-col items-center justify-center h-full">
            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors z-10">
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full h-[80vh] flex items-center justify-center">
                <img src={lightbox.url} alt={lightbox.caption} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm" onClick={e => e.stopPropagation()} />
            </div>
            {lightbox.caption && (
                <div className="mt-6 text-center text-white/90 text-lg font-medium px-4 py-2 bg-black/50 rounded-full backdrop-blur-sm">
                    {lightbox.caption}
                </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Form for Upload / Edit */}
      <Dialog open={!!modal} onOpenChange={(open) => !open && !saving && setModal(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {modal === 'upload' ? 'Upload New Image' : 'Edit Image Title'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 mt-4">
            <FloatingInput 
                label={modal === 'upload' ? "Image Title (Optional)" : "Image Title / Caption"} 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                rightElement={<AIAssistantButton context="Gallery Image" field="Creative Image Caption" onGenerate={(val) => setTitle(val)} />}
            />

            <div className="space-y-4">
              <label className="text-sm font-semibold text-foreground/80 block">
                  {modal === 'upload' ? 'Image File *' : 'Replace Image File (Optional)'}
              </label>
              <div className="border-2 border-dashed border-input/60 rounded-xl p-8 bg-muted/10 hover:bg-muted/20 hover:border-primary/50 transition-all text-center relative cursor-pointer overflow-hidden group">
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFile} 
                    required={modal === 'upload'} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {!preview ? (
                  <div className="flex flex-col items-center justify-center pointer-events-none py-4">
                    <div className="w-14 h-14 bg-background rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-base font-bold text-foreground mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                ) : (
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md">
                    <img src={preview} alt="Preview" className="w-full h-full object-contain bg-black/5" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
                         <UploadCloud className="w-4 h-4" /> Click to change image
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setModal(null)} disabled={saving} className="rounded-full px-6">Cancel</Button>
              <Button type="submit" disabled={saving || (modal === 'upload' && !file)} className="rounded-full px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
                  {saving ? 'Saving...' : modal === 'upload' ? 'Upload Image' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? deleteImage(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Image" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? "Are you sure you want to delete this gallery image? This action cannot be undone."
          : `Are you sure you want to delete ${selectedIds.length} gallery images? This action cannot be undone.`}
      />
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
