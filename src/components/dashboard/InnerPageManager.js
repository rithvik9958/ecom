'use client'
import AIAssistantButton from './AIAssistantButton'
import { useState, useEffect } from 'react'
import Breadcrumb from './Breadcrumb'
import DataTable from './DataTable'
import TableToolbar from './TableToolbar'
import Toast from './Toast'
import RichEditor from './RichEditor'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Switch } from '../ui/switch'
import StatusSwitch from './StatusSwitch'
import { FloatingInput, FloatingTextarea, FloatingSelect } from '../ui/floating-input'
import { SlugInput } from './SlugInput'
import { SortInput } from './SortInput'
import { Edit2, Trash2, Plus, ImageIcon } from 'lucide-react'
import ConfirmDeleteModal from './ConfirmDeleteModal'

const BASE_URL = ''

const EMPTY = {
  b_heading: '', title: '', slug: '', content: '', alt: '',
  isActive: true, sort: '',
  metatag: '', metakeywords: '', metaDescription: '', canonicalUrl: '',
  ogTitle: '', ogDescription: '', twitterCard: 'summary_large_image',
  robots: 'index, follow', schema: '',
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function AboutModal({ about, section, nextSort = 1, onClose, onSave, saving }) {
  const [form, setForm] = useState(about ? {
    ...about,
    metakeywords: Array.isArray(about.metakeywords) ? about.metakeywords.join(', ') : (about.metakeywords || ''),
    schema: about.schemaMarkup ? JSON.stringify(about.schemaMarkup, null, 2) : '',
  } : { ...EMPTY, sort: nextSort })

  const [activeTab, setActiveTab] = useState('general')
  // Slug is "linked" (auto-syncs with title) only when creating a new page
  const [slugLinked, setSlugLinked] = useState(!about)
  const [sortIsAuto, setSortIsAuto] = useState(!about)

  // image states
  const [bannerFile, setBannerFile]     = useState(null)
  const [imageFile, setImageFile]       = useState(null)
  const [ogImageFile, setOgImageFile]   = useState(null)
  const [bannerPreview, setBannerPreview] = useState(about?.bannerImage || '')
  const [imagePreview, setImagePreview]   = useState(about?.image || '')
  const [ogImagePreview, setOgImagePreview] = useState(about?.ogImage || '')

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function toSlug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function handleFile(e, setFile, setPreview) {
    const file = e.target.files[0]
    if (!file) return
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form, section }, { bannerFile, imageFile, ogImageFile })
  }

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'seo',     label: 'SEO' },
    { key: 'schema',  label: 'Schema' },
  ]

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-2xl font-bold">{about ? 'Edit Page' : 'Add Page'}</DialogTitle>
              <p className="text-muted-foreground text-sm mt-0.5">Fill out the information below to {about ? 'update' : 'create'} this page.</p>
            </div>
            <StatusSwitch
              checked={form.isActive}
              onCheckedChange={val => f('isActive', val)}
              label={form.isActive ? 'Active' : 'Inactive'}
            />
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* ── Tabs ── */}
          <div className="flex gap-6 border-b border-border px-2">
            {tabs.map(t => (
              <button
                key={t.key} type="button"
                onClick={() => setActiveTab(t.key)}
                className={`py-3 text-[14px] font-semibold transition-colors relative ${
                  activeTab === t.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
                {activeTab === t.key && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-md" />}
              </button>
            ))}
          </div>

          <div className="py-2 space-y-6">
            {/* ── General Tab ── */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput label="Banner Heading" value={form.b_heading} onChange={e => f('b_heading', e.target.value)} rightElement={<AIAssistantButton context={form.title || 'Page Section'} field="Catchy Banner Heading" onGenerate={(val) => f('b_heading', val)} />} />
                  <FloatingInput
                    label="Title *"
                    required
                    value={form.title}
                    onChange={e => {
                      f('title', e.target.value)
                      if (slugLinked) f('slug', toSlug(e.target.value))
                    }}
                    rightElement={<AIAssistantButton context="Web Page" field="Catchy Title" onGenerate={(val) => {
                      f('title', val)
                      if (slugLinked) f('slug', toSlug(val))
                    }} />}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SlugInput
                    label="Slug *"
                    required
                    value={form.slug}
                    isEditing={!!about}
                    linked={slugLinked}
                    onToggleLink={() => {
                      const nextLinked = !slugLinked
                      setSlugLinked(nextLinked)
                      if (nextLinked) f('slug', toSlug(form.title))
                    }}
                    onChange={v => {
                      setSlugLinked(false)
                      f('slug', v)
                    }}
                  />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
                    <label className="text-sm font-semibold text-foreground/80 mb-1 block">Banner Image</label>
                    <p className="text-[11px] text-muted-foreground mb-3">Recommended: 1920×680px</p>
                    <input type="file" accept="image/*" onChange={e => handleFile(e, setBannerFile, setBannerPreview)} className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" />
                    {bannerPreview && (
                      <img src={bannerPreview} alt="banner preview" className="mt-4 max-h-32 rounded-lg border border-border shadow-sm object-cover" />
                    )}
                  </div>
                  <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
                    <label className="text-sm font-semibold text-foreground/80 mb-1 block">Main Image</label>
                    <p className="text-[11px] text-muted-foreground mb-3">Main section image</p>
                    <input type="file" accept="image/*" onChange={e => handleFile(e, setImageFile, setImagePreview)} className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" />
                    {imagePreview && (
                      <img src={imagePreview} alt="image preview" className="mt-4 max-h-32 rounded-lg border border-border shadow-sm object-cover" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SortInput
                    label="Sort Order"
                    value={form.sort}
                    isEditing={Boolean(about)}
                    isAuto={sortIsAuto}
                    onManualEdit={() => setSortIsAuto(false)}
                    onChange={v => f('sort', v)}
                  />
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
                  <FloatingSelect label="Robots" value={form.robots} onChange={e => f('robots', e.target.value)}>
                    <option value="index, follow">index, follow</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="index, nofollow">index, nofollow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                  </FloatingSelect>
                  <FloatingSelect label="Twitter Card" value={form.twitterCard} onChange={e => f('twitterCard', e.target.value)}>
                    <option value="summary_large_image">summary_large_image</option>
                    <option value="summary">summary</option>
                  </FloatingSelect>
                </div>

                {/* Open Graph */}
                <h4 className="font-semibold text-foreground mt-8 mb-2">Open Graph</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput label="OG Title" value={form.ogTitle} onChange={e => f('ogTitle', e.target.value)} rightElement={<AIAssistantButton context={form.title} field="OpenGraph Title" onGenerate={(val) => f('ogTitle', val)} />} />
                  <FloatingInput label="OG Description" value={form.ogDescription} onChange={e => f('ogDescription', e.target.value)} rightElement={<AIAssistantButton context={form.title} field="OpenGraph Description" onGenerate={(val) => f('ogDescription', val)} />} />
                </div>
                
                <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
                  <label className="text-sm font-semibold text-foreground/80 mb-1 block">OG Image</label>
                  <p className="text-[11px] text-muted-foreground mb-3">Recommended: 1200×630px</p>
                  <input type="file" accept="image/*" onChange={e => handleFile(e, setOgImageFile, setOgImagePreview)} className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" />
                  {ogImagePreview && (
                    <img src={ogImagePreview} alt="og preview" className="mt-4 max-h-32 rounded-lg border border-border shadow-sm object-cover" />
                  )}
                </div>
              </div>
            )}

            {/* ── Schema Tab ── */}
            {activeTab === 'schema' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <FloatingTextarea
                  label="Schema JSON-LD"
                  rows={12}
                  value={form.schema}
                  onChange={e => f('schema', e.target.value)}
                  className="font-mono text-xs"
                  rightElement={<AIAssistantButton context={form.title} field="" isSchema={true} onGenerate={(val) => f('schema', val)} />}
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-border mt-6">
            <Button variant="ghost" type="button" onClick={onClose} disabled={saving} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
              {saving ? 'Saving...' : 'Save Page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function InnerPageManager({ sectionKey = 'aboutus', title = 'About Management' }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  function addToast(message, type = 'success') {
    setToasts(t => [...t, { id: Date.now(), message, type }])
  }

  useEffect(() => { fetchAbout() }, [sectionKey])

  async function fetchAbout() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/about?section=${sectionKey}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRows(data)
    } catch (err) {
      addToast(`Could not load ${title}: ` + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(form, { bannerFile, imageFile, ogImageFile }) {
    try {
      setSaving(true)

      const fd = new FormData()
      fd.append('b_heading',       form.b_heading      || '')
      fd.append('title',           form.title          || '')
      fd.append('slug',            form.slug           || '')
      fd.append('section',         form.section        || sectionKey)
      fd.append('content',         form.content        || '')
      fd.append('alt',             form.alt            || '')
      fd.append('sort',            form.sort           || 0)
      // If adding new, default isActive to true; otherwise preserve
      if (form._id) {
        fd.append('isActive', form.isActive ? 'true' : 'false')
      } else {
        fd.append('isActive', 'true')
      }
      
      // SEO
      fd.append('metatag',         form.metatag        || '')
      fd.append('metaDescription', form.metaDescription || '')
      fd.append('canonicalUrl',    form.canonicalUrl   || '')
      fd.append('ogTitle',         form.ogTitle        || '')
      fd.append('ogDescription',   form.ogDescription  || '')
      fd.append('twitterCard',     form.twitterCard    || 'summary_large_image')
      fd.append('robots',          form.robots         || 'index, follow')
      // keywords → JSON array string
      fd.append('metakeywords', JSON.stringify(
        form.metakeywords
          ? form.metakeywords.split(',').map(k => k.trim()).filter(Boolean)
          : []
      ))
      // schema → JSON string
      fd.append('schema', form.schema || '{}')

      if (bannerFile)  fd.append('bannerImage', bannerFile)
      if (imageFile)   fd.append('image',       imageFile)
      if (ogImageFile) fd.append('ogImage',     ogImageFile)

      const isEdit = Boolean(form._id)
      const url    = isEdit ? `${BASE_URL}/api/about/${form._id}` : `${BASE_URL}/api/about`
      const method = isEdit ? 'PUT' : 'POST'

      const res  = await fetch(url, { method, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Save failed')

      addToast(isEdit ? 'Page updated!' : 'Page created!')
      setModal(null)
      fetchAbout()
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
      const res  = await fetch(`${BASE_URL}/api/about/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Delete failed')
      addToast('Deleted.', 'warning')
      setRows(r => r.filter(x => x._id !== id))
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
      await Promise.all(selectedIds.map(id => fetch(`${BASE_URL}/api/about/${id}`, { method: 'DELETE' })))
      setRows(r => r.filter(x => !selectedIds.includes(x._id)))
      setSelectedIds([])
      addToast('Pages deleted', 'warning')
    } catch (e) {
      addToast('Error deleting some pages: ' + e.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function handleToggleStatus(id, currentStatus) {
    try {
      setTogglingId(id)
      const fd = new FormData()
      fd.append('isActive', (!currentStatus).toString())
      const res = await fetch(`${BASE_URL}/api/about/${id}`, { method: 'PUT', body: fd })
      if (!res.ok) throw new Error(await res.text())
      setRows(r => r.map(x => x._id === id ? { ...x, isActive: !currentStatus } : x))
      addToast('Status updated!')
    } catch (e) {
      addToast(e.message, 'error')
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
      row.title?.toLowerCase().includes(search.toLowerCase()) || 
      row.slug?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '')
      if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '')
      return (a.sort || 0) - (b.sort || 0)
    })

  const columns = [
    {
      key: 'bannerImage',
      label: 'Banner Image',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
            {row.bannerImage ? (
              <img src={row.bannerImage} alt="banner" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
            )}
          </div>
        </div>
      )
    },
    {
      key: 'image',
      label: 'Main Image',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border flex items-center justify-center overflow-hidden">
            {row.image ? (
              <img src={row.image} alt="main" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
            )}
          </div>
        </div>
      )
    },
    {
      key: 'details',
      label: 'Page Details',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[14px] text-foreground">{row.title}</span>
          <span className="text-xs text-muted-foreground mt-0.5">{row.slug}</span>
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
        <div onClick={(e) => e.stopPropagation()}>
          <StatusSwitch 
            checked={row.isActive}
            loading={togglingId === row._id}
            onCheckedChange={() => handleToggleStatus(row._id, row.isActive)}
            label={row.isActive ? 'Active' : 'Inactive'}
          />
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2 pr-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setModal(row)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Page"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmModal({ isOpen: true, type: 'single', id: row._id })}
            disabled={deletingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Page"
          >
            {deletingId === row._id ? (
              <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <Breadcrumb 
          title={title} 
          subtitle={`Total ${rows.length} pages`}
          crumbs={[{ label: 'Pages' }, { label: title }]} 
        />
      </div>
      <div className="flex-1 p-6">
        <TableToolbar 
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          selectedCount={selectedIds.length}
          onBulkDelete={() => setConfirmModal({ isOpen: true, type: 'bulk', id: null })}
          bulkDeleting={bulkDeleting}
          onAdd={() => setModal('new')}
          addLabel="Add New"
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
        />
      </div>

      {modal && (
        <AboutModal
          about={modal === 'new' ? null : modal}
          section={sectionKey}
          nextSort={rows.reduce((max, r) => Math.max(max, Number(r.sort) || 0), 0) + 1}
          onClose={() => setModal(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
      
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Page" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? "Are you sure you want to delete this page? This action cannot be undone." 
          : `Are you sure you want to delete ${selectedIds.length} pages? This action cannot be undone.`}
      />
      
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
