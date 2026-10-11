'use client'
import { useState, useEffect } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { FloatingInput } from '@/components/ui/floating-input'
import { SortInput } from '@/components/dashboard/SortInput'
import { Edit2, Trash2, FileText, ExternalLink } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'
import StatusSwitch from '@/components/dashboard/StatusSwitch'

function CertModal({ cert, nextSort = 1, onClose, onSave, saving }) {
  const [form, setForm] = useState(cert || { name: '', sub_title: '', third_title: '', sort: nextSort })
  const [sortIsAuto, setSortIsAuto] = useState(!cert)
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(cert?.file_url || '')

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function handleFileChange(e) {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(selectedFile.name);
      }
    }
  }

  function renderPreview() {
    if (!filePreview) return null;
    if (filePreview.match(/\.(jpeg|jpg|gif|png|webp)$/i) || filePreview.startsWith('blob:')) {
      return <img src={filePreview} className="mt-4 max-h-32 rounded-lg border border-border shadow-sm object-cover" alt="" />;
    }
    return <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium"><FileText className="w-5 h-5" /> Selected: {filePreview.split('/').pop()}</div>;
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{cert ? 'Edit Document' : 'Add Document'}</DialogTitle>
          <p className="text-muted-foreground text-sm">Fill out the information below to {cert ? 'update' : 'create'} this document.</p>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form, file) }} className="space-y-6 mt-4">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <FloatingInput label="Title *" required value={form.name} onChange={e => f('name', e.target.value)} rightElement={<AIAssistantButton context="Certification or Award" field="Formal Document Title" onGenerate={(val) => f('name', val)} />} />
            
            <FloatingInput label="Subtitle / Standard Code (e.g., IS 15997)" value={form.sub_title || ''} onChange={e => f('sub_title', e.target.value)} />

            <FloatingInput label="Third Title (Optional)" value={form.third_title || ''} onChange={e => f('third_title', e.target.value)} />
            
            <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
              <label className="text-sm font-semibold text-foreground/80 mb-1 block">Upload File</label>
              <p className="text-[11px] text-muted-foreground mb-3">Accepts Image or PDF</p>
              <input type="file" accept="image/*, .pdf" onChange={handleFileChange} required={!cert} className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" />
              {renderPreview()}
            </div>

            <SortInput
              label="Sort Order"
              value={form.sort}
              isEditing={Boolean(cert)}
              isAuto={sortIsAuto}
              onManualEdit={() => setSortIsAuto(false)}
              onChange={v => f('sort', v)}
            />
          </div>

          <DialogFooter className="pt-6 border-t border-border mt-6">
            <Button variant="ghost" type="button" onClick={onClose} disabled={saving} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
              {saving ? 'Saving...' : 'Save Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function CertificationsPage() {
  const [certs, setCerts] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Standard states
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [selectedIds, setSelectedIds] = useState([])
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [toasts, setToasts] = useState([])
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })
  
  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }])

  const filteredCerts = certs
    .filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'a-z') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'z-a') return (b.name || '').localeCompare(a.name || '')
      return (a.sort || 0) - (b.sort || 0)
    })

  useEffect(() => {
    fetchCerts()
  }, [])

  async function fetchCerts() {
    try {
      setLoading(true)
      const res = await fetch('/api/company-certifications')
      const data = await res.json()
      setCerts(Array.isArray(data) ? data : [])
    } catch (err) {
      addToast("Failed to fetch certifications", "error")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(form, file) {
    try {
      setSaving(true)
      const fd = new FormData()
      fd.append("name", form.name || "")
      fd.append("sub_title", form.sub_title || "")
      fd.append("third_title", form.third_title || "")
      fd.append("sort", form.sort || "")
      
      if (file) fd.append("file", file)
      
      const isEdit = Boolean(form._id)
      
      if (!isEdit) {
        fd.append("status", "active")
      } else {
        fd.append("status", form.status)
      }

      const url = isEdit ? `/api/company-certifications/${form._id}` : '/api/company-certifications'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, { method, body: fd })
      if (!res.ok) throw new Error("Failed to save")
      
      addToast('Document saved!')
      setModal(null)
      fetchCerts()
    } catch (err) {
      addToast(err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      setConfirmModal({ isOpen: false, type: 'single', id: null })
      setDeletingId(id)
      const res = await fetch(`/api/company-certifications/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Delete failed")
      addToast('Deleted.', 'warning')
      setCerts(c => c.filter(x => x._id !== id))
      setSelectedIds(prev => prev.filter(x => x !== id))
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
      await Promise.all(selectedIds.map(id => fetch(`/api/company-certifications/${id}`, { method: 'DELETE' })))
      setCerts(c => c.filter(x => !selectedIds.includes(x._id)))
      setSelectedIds([])
      addToast('Documents deleted.', 'warning')
    } catch (err) {
      addToast('Error deleting some documents: ' + err.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function handleToggleStatus(id, currentStatus) {
    try {
      setTogglingId(id)
      const fd = new FormData()
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      fd.append('status', newStatus)
      const res = await fetch(`/api/company-certifications/${id}`, { method: 'PUT', body: fd })
      if (!res.ok) throw new Error('Failed to update status')
      setCerts(c => c.map(x => x._id === id ? { ...x, status: newStatus } : x))
      addToast('Status updated!')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCerts.length) setSelectedIds([])
    else setSelectedIds(filteredCerts.map(x => x._id))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = [
    {
      key: 'preview',
      label: 'Preview',
      render: (cert) => {
        const isImage = cert.file_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
        return (
          <div className="w-16 h-12 rounded-md border border-border overflow-hidden bg-muted flex items-center justify-center">
            {isImage ? (
              <img src={cert.file_url} className="w-full h-full object-cover" alt={cert.name} />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <FileText className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold">PDF</span>
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'title',
      label: 'Title',
      render: (cert) => (
        <span className="font-semibold text-[14px] text-foreground">{cert.name}</span>
      )
    },
    {
      key: 'sort',
      label: 'Sort',
      render: (cert) => (
        <span className="font-medium text-muted-foreground text-sm">{cert.sort}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (cert) => (
        <StatusSwitch
          checked={cert.status === 'active'}
          loading={togglingId === cert._id}
          onCheckedChange={() => handleToggleStatus(cert._id, cert.status)}
          label={cert.status === 'active' ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      key: 'actions',
      align: 'right',
      label: 'Actions',
      render: (cert) => (
        <div className="flex items-center justify-end gap-2">
          {cert.file_url && (
            <a
              href={cert.file_url}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-muted text-muted-foreground hover:text-foreground"
              title="View Document"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setModal(cert); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Document"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: cert._id }); }}
            disabled={deletingId === cert._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Document"
          >
            {deletingId === cert._id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  const handleReorder = async (reorderedList) => {
    const updated = reorderedList.map((item, idx) => ({ ...item, sort: idx + 1 }));
    setCerts(updated);
    addToast('Document order updated');
    try {
      await Promise.all(
        updated.slice(0, 15).map(item => {
          const fd = new FormData();
          fd.append('name', item.name || '');
          fd.append('sub_title', item.sub_title || '');
          fd.append('third_title', item.third_title || '');
          fd.append('status', item.status || 'active');
          fd.append('sort', String(item.sort));
          return fetch(`/api/company-certifications/${item._id}`, { method: 'PUT', body: fd });
        })
      );
    } catch (e) {
      console.error('Error persisting cert order:', e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Certifications Management" 
        subtitle={`Manage your company certifications and documents (${certs.length} total)`}
        crumbs={[{ label: 'Certifications' }]} 
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
        addLabel="Add Document"
      />

      <DataTable 
        columns={columns}
        data={filteredCerts}
        loading={loading}
        onRowClick={(row) => setModal(row)}
        actions={false}
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelect}
        onReorder={handleReorder}
      />

      {modal && <CertModal cert={modal === 'new' ? null : modal} nextSort={certs.reduce((max, r) => Math.max(max, Number(r.sort) || 0), 0) + 1} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />}
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Document" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? "Are you sure you want to delete this document? This action cannot be undone." 
          : `Are you sure you want to delete ${selectedIds.length} documents? This action cannot be undone.`}
      />
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
