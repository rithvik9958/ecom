'use client'
import { useState, useEffect } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-input'
import { Plus, LayoutGrid, ChevronRight, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import StatusSwitch from '@/components/dashboard/StatusSwitch'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Edit2, Trash2, MoreVertical } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'

const BASE_URL = ''
const EMPTY = { title: '', logo: '', status: 'active', sort: '', category: 'Industry' }

export default function OurWorkPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [logoFile, setLogoFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [toasts, setToasts] = useState([])
  const [deletingId, setDeletingId] = useState(null)
  const [statusTogglingId, setStatusTogglingId] = useState(null)

  // New States for Standardization
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })

  function addToast(message, type = 'success') {
    setToasts(t => [...t, { id: Date.now(), message, type }])
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== t[t.length - 1]?.id))
    }, 4000)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/work`)
      if (!res.ok) throw new Error('Failed to fetch work items')
      const data = await res.json()
      setRows(data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm({ ...EMPTY })
    setLogoFile(null)
    setPreview('')
    setModal('new')
  }

  function openEdit(item) {
    setForm({ ...item })
    setLogoFile(null)
    setPreview(item.logo || '')
    setModal(item)
  }

  function handleLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form._id && !logoFile) {
      addToast('Please upload an image.', 'error')
      return
    }
    try {
      setSaving(true)

      const fd = new FormData()
      fd.append('title', form.title || '')
      fd.append('status', form.status || 'active')
      fd.append('category', form.category || 'Industry')
      fd.append('sort', form.sort || 0)
      if (logoFile) fd.append('logo', logoFile)

      const isEdit = Boolean(form._id)
      const url = isEdit ? `${BASE_URL}/api/work/${form._id}` : `${BASE_URL}/api/work`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, { method, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Save failed')

      addToast(isEdit ? 'Item updated!' : 'Item added!')
      setModal(null)
      fetchItems()
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
      const res = await fetch(`${BASE_URL}/api/work/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Delete failed')
      addToast('Item deleted.', 'warning')
      setRows(r => r.filter(x => x._id !== id))
      setSelectedIds(s => s.filter(x => x !== id))
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
      await Promise.all(selectedIds.map(id => fetch(`${BASE_URL}/api/work/${id}`, { method: 'DELETE' })))
      setRows(r => r.filter(x => !selectedIds.includes(x._id)))
      setSelectedIds([])
      addToast('Items deleted', 'warning')
    } catch (e) {
      addToast('Error deleting some items: ' + e.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function toggleStatus(row) {
    try {
      setStatusTogglingId(row._id)
      const newStatus = row.status === 'active' ? 'inactive' : 'active'

      const fd = new FormData()
      fd.append('title', row.title)
      fd.append('status', newStatus)
      fd.append('sort', row.sort || 0)

      const res = await fetch(`${BASE_URL}/api/work/${row._id}`, { method: 'PUT', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Status update failed')

      setRows(r => r.map(x => x._id === row._id ? { ...x, status: newStatus } : x))
      addToast('Status updated.')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setStatusTogglingId(null)
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
    .filter(row => row.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '')
      if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '')
      return (a.sort || 0) - (b.sort || 0)
    })

  const columns = [
    {
      key: 'logo',
      label: 'Icon / Image',
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border shrink-0 p-1">
            {row.logo ? (
              <img src={row.logo} alt={row.title} className="w-full h-full object-contain" />
            ) : (
              <LayoutGrid className="w-6 h-6 text-muted-foreground/50" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-bold text-foreground">{row.title}</div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary w-fit">
              {row.category || 'Industry'}
            </span>
          </div>
        </div>
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
          checked={row.status === 'active'}
          loading={statusTogglingId === row._id}
          onCheckedChange={() => toggleStatus(row)}
          label={row.status === 'active' ? 'Active' : 'Inactive'}
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
            title="Edit Item"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: row._id }); }}
            disabled={deletingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Item"
          >
            {deletingId === row._id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb
        title="Our Work Items"
        subtitle={`Manage your portfolio or work items (${rows.filter(r => r.status === 'active').length} active)`}
        crumbs={[{ label: 'Home Management' }, { label: 'Our Work' }]}
      />

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={() => setConfirmModal({ isOpen: true, type: 'bulk', id: null })}
        bulkDeleting={bulkDeleting}
        onAdd={openCreate}
        addLabel="Add Item"
      />

      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        onRowClick={openEdit}
        actions={false}
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelect}
        onReorder={(reordered) => setRows(reordered)}
      />

      <Dialog open={!!modal} onOpenChange={(open) => !open && !saving && setModal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{modal === 'new' ? "Add Our Work Item" : "Edit Work Item"}</DialogTitle>
            <p className="text-muted-foreground text-sm">{modal === 'new' ? "Create a new portfolio item" : "Modify existing item details"}</p>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 mt-4">
            <FloatingInput
              label="Item Title *"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              rightElement={<AIAssistantButton context="Portfolio Item" field="Catchy Title" onGenerate={(val) => setForm({ ...form, title: val })} />}
            />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 block">
                {modal === 'new' ? 'Image File *' : 'Replace Image File (Optional)'}
              </label>
              <input
                type="file"
                accept="image/*,.svg"
                onChange={handleLogo}
                className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input"
              />
              {preview && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-border mt-2 bg-muted p-2 flex items-center justify-center">
                  <img src={preview} alt="preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FloatingInput
                label="Sort Order"
                type="number"
                min="0"
                value={form.sort}
                onChange={e => setForm({ ...form, sort: e.target.value })}
              />
              <FloatingSelect
                label="Category Section"
                value={form.category || 'Industry'}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="Industry">Industry We Cater</option>
                <option value="Application">Critical End Application</option>
              </FloatingSelect>
              <FloatingSelect
                label="Status"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </FloatingSelect>
            </div>

            <DialogFooter className="pt-6 border-t border-border mt-6">
              <Button variant="ghost" type="button" onClick={() => setModal(null)} disabled={saving} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
                {saving ? 'Saving...' : modal === 'new' ? 'Save Item' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Item" : "Bulk Delete"}
        message={confirmModal.type === 'single'
          ? "Are you sure you want to delete this item? This action cannot be undone."
          : `Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`}
      />

      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 right-8 px-6 py-3 rounded-xl shadow-2xl text-white text-sm font-bold z-50 flex items-center gap-3",
              toast.type === 'success' ? "bg-primary text-primary-foreground" : "bg-red-600"
            )}
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              {toast.type === 'success' ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 rotate-45" />}
            </div>
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}