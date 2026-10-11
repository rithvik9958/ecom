'use client'
import { useState, useEffect } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input'
import FloatingCustomSelect from '@/components/ui/FloatingCustomSelect'
import { Plus, Image as ImageIcon, Edit2, Trash2, ExternalLink, FileText, Globe, Search, Code } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import StatusSwitch from '@/components/dashboard/StatusSwitch'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'
import dynamic from 'next/dynamic'
import { SlugInput } from '@/components/dashboard/SlugInput'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
const RichEditor = dynamic(() => import('@/components/dashboard/RichEditor'), { ssr: false })

const BASE_URL = ''
const EMPTY = { 
  title: '', slug: '', content: '', bannerImage: '', alt: '', 
  isActive: true, sort: 0, metatag: '', metaDescription: '', metakeywords: '', 
  canonicalUrl: '', ogTitle: '', ogDescription: '', twitterCard: 'summary_large_image', robots: 'index, follow', schemaMarkup: '' 
}

export default function CustomPages() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [imageFile, setImageFile] = useState(null)
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
  const [slugLinked, setSlugLinked] = useState(true)
  const [activeTab, setActiveTab] = useState('general')

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function toSlug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
  }

  function addToast(message, type = 'success') {
    setToasts(t => [...t, { id: Date.now(), message, type }])
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== t[t.length - 1]?.id))
    }, 4000)
  }

  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/custom-pages`)
      if (!res.ok) throw new Error('Failed to fetch pages')
      const data = await res.json()
      setRows(data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function openModal(item = null) {
    if (item) {
      setForm({
        ...EMPTY,
        ...item,
        metakeywords: Array.isArray(item.metakeywords) ? item.metakeywords.join(', ') : item.metakeywords || '',
        schemaMarkup: typeof item.schemaMarkup === 'object' && Object.keys(item.schemaMarkup).length > 0
          ? JSON.stringify(item.schemaMarkup, null, 2)
          : ''
      })
      setPreview(item.bannerImage || '')
    } else {
      setForm({ ...EMPTY })
      setPreview('')
    }
    setImageFile(null)
    setModal(item ? 'edit' : 'add')
    setSlugLinked(!item)
    setActiveTab('general')
  }

  function closeModal() {
    setModal(null)
    setForm({ ...EMPTY })
    setImageFile(null)
    setPreview('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData()
    
    Object.keys(form).forEach(key => {
      if (key !== 'bannerImage' && form[key] !== null && form[key] !== undefined) {
        formData.append(key, form[key])
      }
    })
    
    if (imageFile) formData.append('bannerImage', imageFile)
    
    try {
      const url = modal === 'edit' ? `${BASE_URL}/api/custom-pages/${form._id}` : `${BASE_URL}/api/custom-pages`
      const res = await fetch(url, {
        method: modal === 'edit' ? 'PUT' : 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      
      addToast(`Page ${modal === 'edit' ? 'updated' : 'added'} successfully`)
      closeModal()
      fetchPages()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    setConfirmModal({ isOpen: true, type: 'single', id })
  }

  async function confirmDelete() {
    try {
      setDeletingId(confirmModal.id)
      const res = await fetch(`${BASE_URL}/api/custom-pages/${confirmModal.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      addToast('Page deleted successfully')
      fetchPages()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setDeletingId(null)
      setConfirmModal({ isOpen: false, type: 'single', id: null })
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return
    setConfirmModal({ isOpen: true, type: 'bulk', id: null })
  }

  async function confirmBulkDelete() {
    try {
      setBulkDeleting(true)
      const res = await fetch(`${BASE_URL}/api/custom-pages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      })
      if (!res.ok) throw new Error('Bulk delete failed')
      addToast('Selected pages deleted successfully')
      setSelectedIds([])
      fetchPages()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setBulkDeleting(false)
      setConfirmModal({ isOpen: false, type: 'bulk', id: null })
    }
  }

  async function toggleStatus(id, currentStatus) {
    try {
      setStatusTogglingId(id)
      const formData = new FormData()
      formData.append('isActive', !currentStatus)
      const res = await fetch(`${BASE_URL}/api/custom-pages/${id}`, { method: 'PUT', body: formData })
      if (!res.ok) throw new Error('Failed to update status')
      setRows(r => r.map(x => x._id === id ? { ...x, isActive: !currentStatus } : x))
      addToast('Status updated')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setStatusTogglingId(null)
    }
  }

  const columns = [
    {
      key: 'banner',
      label: 'Banner',
      render: (row) => (
        <div className="w-16 h-10 rounded overflow-hidden bg-muted flex items-center justify-center relative">
          {row.bannerImage ? (
            <img src={row.bannerImage} alt="banner" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      )
    },
    {
      key: 'titleSlug',
      label: 'Title & Slug',
      render: (row) => (
        <div>
          <div className="font-medium text-foreground">{row.title}</div>
          <div className="text-sm text-muted-foreground">/{row.slug}</div>
        </div>
      )
    },
    {
      key: 'sort',
      label: 'Sort',
      render: (row) => (
        <span className="font-medium text-muted-foreground text-sm">{row.sort || 0}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusSwitch 
          checked={row.isActive}
          loading={statusTogglingId === row._id}
          onCheckedChange={() => toggleStatus(row._id, row.isActive)}
          label={row.isActive ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2 pr-2">
          <a
            href={`/${row.slug}`}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-muted text-muted-foreground hover:text-foreground"
            title="View Page"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); openModal(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Page"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: row._id }); }}
            disabled={deletingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Page"
          >
            {deletingId === row._id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  let filteredRows = [...rows]
  if (search) {
    filteredRows = filteredRows.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase()))
  }
  if (sort === 'oldest') filteredRows.reverse()

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Toast toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <Breadcrumb 
        title="Custom Pages" 
        subtitle={`Manage standalone custom pages for your website. (${rows.length} pages)`}
        crumbs={[{ label: 'Dashboard' }, { label: 'Custom Pages' }]} 
      />

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        bulkDeleting={bulkDeleting}
        onAdd={() => openModal()}
        addLabel="Add Page"
      />

      <DataTable
        columns={columns}
        data={filteredRows}
        loading={loading}
        onRowClick={openModal}
        actions={false}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        selectable={true}
        onReorder={(reordered) => setRows(reordered)}
      />

      <Dialog open={!!modal} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {modal === 'edit' ? 'Edit Custom Page' : 'Add New Custom Page'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {modal === 'edit' ? 'Update page content, SEO metadata and schema markup.' : 'Create a new standalone page with rich content and full SEO control.'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* ── Pill Tabs (standard style) ── */}
            <div className="flex items-center gap-2 border-b border-border pb-3">
              {[
                { key: 'general', label: 'General', icon: FileText },
                { key: 'seo',     label: 'SEO & Metadata', icon: Globe },
                { key: 'schema',  label: 'Schema JSON-LD', icon: Code },
              ].map(t => {
                const Icon = t.icon;
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key} type="button"
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="py-2 space-y-6">
              {/* ── General Tab ── */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingInput 
                      label="Title *" 
                      value={form.title} 
                      onChange={e => {
                        f('title', e.target.value)
                        if (slugLinked) f('slug', toSlug(e.target.value))
                      }} 
                      rightElement={<AIAssistantButton context="Web Page" field="Catchy Title" onGenerate={(val) => {
                        f('title', val)
                        if (slugLinked) f('slug', toSlug(val))
                      }} />}
                      required 
                    />
                    <SlugInput 
                      label="Slug *" 
                      value={form.slug} 
                      onChange={val => {
                        setSlugLinked(false)
                        f('slug', val)
                      }} 
                      linked={slugLinked}
                      onToggleLink={() => {
                        const nextLinked = !slugLinked
                        setSlugLinked(nextLinked)
                        if (nextLinked) f('slug', toSlug(form.title))
                      }}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingInput label="Sort Order" type="number" value={form.sort} onChange={e => f('sort', Number(e.target.value))} />
                    <FloatingInput label="Image ALT Text" value={form.alt} onChange={e => f('alt', e.target.value)} rightElement={<AIAssistantButton context={form.title} field="SEO alt text for image" onGenerate={(val) => f('alt', val)} />} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-foreground/80 block">Content</label>
                      <AIAssistantButton context={form.title} field="Full HTML Page Content" onGenerate={(val) => f('content', val)} />
                    </div>
                    <div className="border border-input/60 rounded-xl overflow-hidden shadow-sm">
                      <RichEditor
                        value={form.content}
                        onChange={v => f('content', v)}
                        placeholder="Page content..."
                        minHeight={280}
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="grid grid-cols-1 gap-6 md:w-1/2">
                    <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
                      <label className="text-sm font-semibold text-foreground/80 mb-1 block">Banner Image</label>
                      <p className="text-[11px] text-muted-foreground mb-3">Recommended: 1920×680px</p>
                      <input type="file" accept="image/*" onChange={e => {
                        const file = e.target.files[0]
                        if (file) { setImageFile(file); setPreview(URL.createObjectURL(file)) }
                      }} className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" />
                      {preview && (
                        <img src={preview} alt="banner preview" className="mt-4 max-h-32 rounded-lg border border-border shadow-sm object-cover" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SEO Tab ── */}
              {activeTab === 'seo' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingInput label="Meta Title" value={form.metatag} onChange={e => f('metatag', e.target.value)} rightElement={<AIAssistantButton context={form.title} field="SEO Meta Title" onGenerate={(val) => f('metatag', val)} />} />
                    <FloatingInput label="Canonical URL" value={form.canonicalUrl} onChange={e => f('canonicalUrl', e.target.value)} />
                  </div>
                  
                  <FloatingTextarea 
                    label="Meta Description" 
                    rows={2} 
                    value={form.metaDescription} 
                    onChange={e => f('metaDescription', e.target.value)} 
                    rightElement={<AIAssistantButton context={form.title} field="SEO Meta Description" onGenerate={(val) => f('metaDescription', val)} />}
                  />
                  
                  <FloatingInput label="Meta Keywords (Comma separated)" value={form.metakeywords} onChange={e => f('metakeywords', e.target.value)} rightElement={<AIAssistantButton context={form.title} field="SEO Meta Keywords (comma separated)" onGenerate={(val) => f('metakeywords', val)} />} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingCustomSelect
                      label="Robots"
                      value={form.robots}
                      onChange={(val) => f('robots', val)}
                      options={[
                        { value: 'index, follow', label: 'index, follow' },
                        { value: 'noindex, follow', label: 'noindex, follow' },
                        { value: 'index, nofollow', label: 'index, nofollow' },
                        { value: 'noindex, nofollow', label: 'noindex, nofollow' },
                      ]}
                    />
                    <FloatingCustomSelect
                      label="Twitter Card"
                      value={form.twitterCard}
                      onChange={(val) => f('twitterCard', val)}
                      options={[
                        { value: 'summary_large_image', label: 'summary_large_image' },
                        { value: 'summary', label: 'summary' },
                      ]}
                    />
                  </div>

                  <h4 className="font-semibold text-foreground mt-8 mb-2">Open Graph</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingInput label="OG Title" value={form.ogTitle} onChange={e => f('ogTitle', e.target.value)} rightElement={<AIAssistantButton context={form.title} field="OpenGraph Title" onGenerate={(val) => f('ogTitle', val)} />} />
                    <FloatingInput label="OG Description" value={form.ogDescription} onChange={e => f('ogDescription', e.target.value)} rightElement={<AIAssistantButton context={form.title} field="OpenGraph Description" onGenerate={(val) => f('ogDescription', val)} />} />
                  </div>
                </div>
              )}

              {/* ── Schema Tab ── */}
              {activeTab === 'schema' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FloatingTextarea
                    label="Schema JSON-LD"
                    rows={12}
                    value={form.schemaMarkup}
                    onChange={e => f('schemaMarkup', e.target.value)}
                    className="font-mono text-xs"
                    rightElement={<AIAssistantButton context={form.title} field="" isSchema={true} onGenerate={(val) => f('schemaMarkup', val)} />}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="mt-8 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? 'Saving...' : 'Save Page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        onClose={() => !deletingId && !bulkDeleting && setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={confirmModal.type === 'bulk' ? confirmBulkDelete : confirmDelete}
        title={confirmModal.type === 'bulk' ? "Delete Multiple Pages" : "Delete Page"}
        message={confirmModal.type === 'bulk' ? `Are you sure you want to delete ${selectedIds.length} pages?` : "Are you sure you want to delete this page?"}
        isDeleting={deletingId || bulkDeleting}
      />


    </div>
  )
}