'use client'
import { useState, useEffect, useRef } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import Toast from '@/components/dashboard/Toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, UploadCloud, Copy, Trash2, Image as ImageIcon, FileText, CheckCircle2, Grid, List, CheckSquare, Upload, Folder, Video, Filter } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'

const BASE_URL = ''

export default function FileManagerPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [sourceInfo, setSourceInfo] = useState('')
  
  const [viewMode, setViewMode] = useState('grid')
  const [filterType, setFilterType] = useState('all')
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  
  const [deletingUrl, setDeletingUrl] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, url: null, isBulk: false })
  const [toasts, setToasts] = useState([])
  const [copiedUrl, setCopiedUrl] = useState(null)
  
  const fileInputRef = useRef(null)

  function addToast(message, type = 'success') {
    setToasts(t => [...t, { id: Date.now(), message, type }])
  }

  useEffect(() => { fetchFiles() }, [])

  async function fetchFiles() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/files`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setFiles(json.data || [])
      setSourceInfo(json.source || 'unknown')
    } catch (err) {
      addToast('Could not load files: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file) {
    if (!file) return
    try {
      setUploading(true)
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch(`${BASE_URL}/api/files/upload`, {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Upload failed')

      addToast('File uploaded successfully!')
      fetchFiles()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleFileUpload(e) {
    uploadFile(e.target.files?.[0])
  }

  async function handleDelete(url) {
    try {
      setConfirmModal({ isOpen: false, url: null, isBulk: false })
      setDeletingUrl(url)
      
      const res = await fetch(`${BASE_URL}/api/files?url=${encodeURIComponent(url)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Delete failed')
      
      addToast('File deleted successfully', 'warning')
      setFiles(f => f.filter(x => x.url !== url))
      setSelectedFiles(prev => {
        const next = new Set(prev)
        next.delete(url)
        return next
      })
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setDeletingUrl(null)
    }
  }

  async function handleBulkDelete() {
    try {
      setConfirmModal({ isOpen: false, url: null, isBulk: false })
      setBulkDeleting(true)
      
      let successCount = 0
      for (const url of selectedFiles) {
        try {
          const res = await fetch(`${BASE_URL}/api/files?url=${encodeURIComponent(url)}`, { method: 'DELETE' })
          if (res.ok) {
            successCount++
            setFiles(f => f.filter(x => x.url !== url))
          }
        } catch (e) {}
      }
      
      addToast(`Successfully deleted ${successCount} files`, 'warning')
      setSelectedFiles(new Set())
    } catch (err) {
      addToast('Error during bulk deletion', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  function handleCopy(url) {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
    addToast('URL copied to clipboard!')
  }

  const toggleSelect = (url) => {
    setSelectedFiles(prev => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isImage = (format) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(format?.toLowerCase())
  const isVideo = (format) => ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(format?.toLowerCase())

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.id.toLowerCase().includes(search.toLowerCase()) || f.format?.toLowerCase().includes(search.toLowerCase())
    let matchesType = true
    if (filterType === 'image') matchesType = isImage(f.format)
    if (filterType === 'video') matchesType = isVideo(f.format)
    if (filterType === 'document') matchesType = !isImage(f.format) && !isVideo(f.format)
    return matchesSearch && matchesType
  })

  const totalBytes = files.reduce((acc, f) => acc + (f.sizeBytes || 0), 0)
  const QUOTA = 5 * 1024 * 1024 * 1024 // 5GB Mock Quota
  const quotaPercent = Math.min((totalBytes / QUOTA) * 100, 100)

  // Drag and drop handlers
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); }
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); }
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]) // Upload first file dropped
    }
  }

  return (
    <div 
      className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full transition-colors"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary m-4 rounded-3xl pointer-events-none">
          <div className="bg-background/90 p-8 rounded-3xl flex flex-col items-center shadow-2xl">
            <Upload className="w-16 h-16 text-primary mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-foreground">Drop file here to upload</h2>
          </div>
        </div>
      )}

      <Breadcrumb 
        title="Central File Manager" 
        subtitle={`Manage all your media assets across ${sourceInfo === 'cloudinary' ? 'Cloud Storage' : 'Local Server Storage'}`}
        crumbs={[{ label: 'File Manager' }]} 
      />
      
      {/* Storage Metrics & Bulk Actions */}
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1 p-5 rounded-3xl border-border shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Folder className="w-7 h-7 text-blue-500" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-bold text-foreground">Storage Used</p>
                <p className="text-xs text-muted-foreground">{formatSize(totalBytes)} of {formatSize(QUOTA)}</p>
              </div>
              <span className="text-xs font-bold text-blue-500">{quotaPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${quotaPercent}%` }} />
            </div>
          </div>
        </Card>

        {selectedFiles.size > 0 && (
          <Card className="lg:w-auto w-full p-5 rounded-3xl border-border bg-blue-50 dark:bg-blue-900/10 shadow-sm flex items-center justify-between gap-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-400">{selectedFiles.size} selected</p>
                <button onClick={() => setSelectedFiles(new Set())} className="text-xs text-blue-600 hover:underline">Clear selection</button>
              </div>
            </div>
            <Button 
              onClick={() => setConfirmModal({ isOpen: true, url: null, isBulk: true })}
              variant="destructive" 
              className="rounded-xl shadow-sm"
              disabled={bulkDeleting}
            >
              {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
            </Button>
          </Card>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border p-3 rounded-2xl shadow-sm">
        
        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search files..." 
              className="pl-9 rounded-xl bg-muted/50 border-transparent focus:border-border h-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex bg-muted/50 rounded-xl p-1 shrink-0">
            {['all', 'image', 'video', 'document'].map(t => (
              <button 
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filterType === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Upload & View Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex bg-muted/50 rounded-xl p-1 mr-2">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading}
                className="rounded-xl px-5 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
                {uploading ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                Upload File
            </Button>
        </div>
      </div>

      {/* Files Display */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl shadow-sm border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No files found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Upload a file or adjust your search and filters.</p>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mt-6 rounded-xl">Browse Files</Button>
        </div>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredFiles.map((file) => {
                const selected = selectedFiles.has(file.url)
                return (
                  <Card key={file.id} className={`group overflow-hidden bg-card hover:border-primary/50 transition-all duration-200 relative rounded-2xl shadow-sm flex flex-col ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
                      {/* Checkbox Overlay */}
                      <div className={`absolute top-2 left-2 z-20 transition-opacity ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button onClick={() => toggleSelect(file.url)} className={`w-6 h-6 rounded-md flex items-center justify-center shadow-sm border backdrop-blur-md ${selected ? 'bg-primary border-primary text-primary-foreground' : 'bg-background/80 border-border text-transparent hover:text-muted-foreground'}`}>
                          <CheckCircle2 className={`w-4 h-4 ${selected ? 'text-white' : ''}`} />
                        </button>
                      </div>

                      <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
                          {isImage(file.format) ? (
                              <img src={file.url} alt={file.id} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                          ) : isVideo(file.format) ? (
                              <Video className="w-12 h-12 text-muted-foreground/50" />
                          ) : (
                              <FileText className="w-12 h-12 text-muted-foreground/50" />
                          )}
                          
                          {/* Hover Overlay Actions */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 backdrop-blur-[2px] z-10">
                              <button onClick={() => handleCopy(file.url)} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors" title="Copy URL">
                                  {copiedUrl === file.url ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                              </button>
                              <button onClick={() => setConfirmModal({ isOpen: true, url: file.url, isBulk: false })} className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-600 flex items-center justify-center text-white transition-colors" title="Delete File">
                                  <Trash2 className="w-5 h-5" />
                              </button>
                          </div>

                          <Badge variant="outline" className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-md text-[9px] uppercase font-bold border-none shadow-sm z-10 pointer-events-none">
                              {file.format || 'FILE'}
                          </Badge>
                      </div>
                      
                      <div className="p-3 border-t border-border flex-1 flex flex-col justify-between">
                          <p className="text-xs font-semibold text-foreground truncate" title={file.id}>
                              {file.id.split('/').pop()}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-muted-foreground font-medium">{formatSize(file.sizeBytes)}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(file.createdAt).toLocaleDateString()}</span>
                          </div>
                      </div>
                  </Card>
                )
              })}
          </div>
        ) : (
          <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground font-bold">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">
                      <button onClick={() => setSelectedFiles(selectedFiles.size === filteredFiles.length ? new Set() : new Set(filteredFiles.map(f => f.url)))} className="w-5 h-5 rounded border border-border flex items-center justify-center hover:border-primary mx-auto">
                        {selectedFiles.size === filteredFiles.length && <CheckSquare className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    </th>
                    <th className="px-4 py-3">File Name</th>
                    <th className="px-4 py-3">Preview</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Date Added</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFiles.map((file) => {
                    const selected = selectedFiles.has(file.url)
                    return (
                      <tr key={file.id} className={`hover:bg-muted/20 transition-colors ${selected ? 'bg-primary/5' : ''}`}>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleSelect(file.url)} className={`w-5 h-5 rounded border flex items-center justify-center mx-auto transition-colors ${selected ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-primary'}`}>
                            {selected && <CheckSquare className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate" title={file.id}>
                          {file.id.split('/').pop()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center">
                            {isImage(file.format) ? <img src={file.url} className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-muted-foreground" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="uppercase text-[10px] bg-muted">{file.format}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatSize(file.sizeBytes)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(file.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleCopy(file.url)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="Copy URL">
                              {copiedUrl === file.url ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setConfirmModal({ isOpen: true, url: file.url, isBulk: false })} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.isBulk ? bulkDeleting : deletingUrl === confirmModal.url}
        onClose={() => setConfirmModal({ isOpen: false, url: null, isBulk: false })}
        onConfirm={confirmModal.isBulk ? handleBulkDelete : () => handleDelete(confirmModal.url)}
        title={confirmModal.isBulk ? `Delete ${selectedFiles.size} files?` : "Delete File"}
        message={confirmModal.isBulk 
          ? "Are you sure you want to delete all selected files? This cannot be undone." 
          : "Are you sure you want to delete this file? This will permanently remove it from your storage."}
      />

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
