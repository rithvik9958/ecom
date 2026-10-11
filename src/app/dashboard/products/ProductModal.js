'use client'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FloatingInput, FloatingSelect, FloatingTextarea } from '@/components/ui/floating-input'
import { Button } from '@/components/ui/button'
import { SlugInput } from '@/components/dashboard/SlugInput'
import { SortInput } from '@/components/dashboard/SortInput'
import RichEditor from '@/components/dashboard/RichEditor'
import showToast from '@/lib/storeToast'

const EMPTY = { 
  name: '', slug: '', category: '', grade: '',
  description: '', breadcrumb: '', status: 'active', sort: '', alt: '',
  image: '', detailImage: '',
  metatag: '', metaDescription: '', metakeywords: '', canonicalUrl: '',
  ogTitle: '', ogDescription: '', twitterCard: 'summary_large_image', robots: 'index, follow',
  schema: ''
}

export default function ProductModal({ product, categories, nextSort = 1, onClose, onSave }) {
  const [form, setForm] = useState(() => {
    if (!product) return { ...EMPTY, category: categories[0]?._id || '', sort: nextSort }
    return {
      ...EMPTY,
      ...product,
      image: product.image || '',
      detailImage: product.detailImage || '',
      category: product.category?._id || product.category || '',
      status: product.isActive ? 'active' : 'inactive',
      schema: product.schemaMarkup && Object.keys(product.schemaMarkup).length > 0 
        ? JSON.stringify(product.schemaMarkup, null, 2) : '',
      metakeywords: Array.isArray(product.metakeywords) 
        ? product.metakeywords.join(', ') : (product.metakeywords || ''),
      breadcrumb: product.breadcrumb || ''
    }
  })
  
  const [tab, setTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  // Slug is "linked" only when creating a new product
  const [slugLinked, setSlugLinked] = useState(!product)
  const [sortIsAuto, setSortIsAuto] = useState(!product)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function toSlug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData()

    fd.append('name',            form.name || '')
    fd.append('slug',            form.slug || '')
    fd.append('category',        form.category || '')
    fd.append('grade',           form.grade || '')
    fd.append('description',     form.description || '')
    fd.append('breadcrumb',      form.breadcrumb || '')
    fd.append('alt',             form.alt || '')
    fd.append('sort',            form.sort || '0')
    fd.append('isActive',        form.status === 'active' ? 'true' : 'false')
    fd.append('metatag',         form.metatag || '')
    fd.append('metaDescription', form.metaDescription || '')
    fd.append('metakeywords',    form.metakeywords || '')
    fd.append('canonicalUrl',    form.canonicalUrl || '')
    fd.append('ogTitle',         form.ogTitle || '')
    fd.append('ogDescription',   form.ogDescription || '')
    fd.append('twitterCard',     form.twitterCard || 'summary_large_image')
    fd.append('robots',          form.robots || 'index, follow')
    fd.append('schema',          form.schema || '')

    if (form.image instanceof File) {
      fd.append('image', form.image)
    } else {
      fd.append('existingImage', form.image || '')
    }

    if (form.detailImage instanceof File) {
      fd.append('detailImage', form.detailImage)
    } else {
      fd.append('existingDetailImage', form.detailImage || '')
    }

    try {
      const url = product ? `/api/products/${product._id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      const res = await fetch(url, { method, body: fd })
      const text = await res.text()
      if (!res.ok) throw new Error(text)
      const data = JSON.parse(text)
      onSave(data)
    } catch (err) {
      showToast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'desc', label: 'Description' },
    { key: 'media', label: 'Images' },
    { key: 'seo', label: 'SEO' }
  ]

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <p className="text-muted-foreground text-sm">Fill out the information below to {product ? 'update' : 'create'} this product.</p>
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
            {/* ── BASIC ── */}
            {tab === 'basic' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput 
                    label="Product Name *" 
                    required 
                    value={form.name} 
                    onChange={e => { 
                      f('name', e.target.value)
                      if (slugLinked) f('slug', toSlug(e.target.value))
                    }} 
                    rightElement={<AIAssistantButton context="Steel/Metal Product" field="Product Name" onGenerate={(val) => {
                      f('name', val)
                      if (slugLinked) f('slug', toSlug(val))
                    }} />}
                  />
                  <SlugInput
                    label="URL Slug *"
                    required
                    value={form.slug}
                    isEditing={!!product}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingSelect label="Category *" required value={form.category} onChange={e => f('category', e.target.value)}>
                    <option value="">— Select Category —</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </FloatingSelect>
                  <FloatingInput 
                    label="Breadcrumb Label" 
                    value={form.breadcrumb} 
                    onChange={e => f('breadcrumb', e.target.value)} 
                    rightElement={<AIAssistantButton context={form.name || 'Product'} field="Breadcrumb Label" onGenerate={(val) => f('breadcrumb', val)} />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput 
                    label="Grade(s)" 
                    value={form.grade} 
                    onChange={e => f('grade', e.target.value)} 
                  />
                  <FloatingInput 
                    label="Image ALT Text" 
                    value={form.alt} 
                    onChange={e => f('alt', e.target.value)} 
                    rightElement={<AIAssistantButton context={form.name} field="SEO alt text for image" onGenerate={(val) => f('alt', val)} />}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SortInput
                    label="Sort Order"
                    value={form.sort}
                    isEditing={Boolean(product)}
                    isAuto={sortIsAuto}
                    onManualEdit={() => setSortIsAuto(false)}
                    onChange={v => f('sort', v)}
                  />
                </div>
              </div>
            )}

            {/* ── DESCRIPTION ── */}
            {tab === 'desc' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-foreground/80 block">Product Description</label>
                  <AIAssistantButton context={form.name} field="Full HTML Product Description" onGenerate={(val) => f('description', val)} />
                </div>
                <div className="border border-input/60 rounded-xl overflow-hidden shadow-sm">
                  <RichEditor
                    value={form.description}
                    onChange={v => f('description', v)}
                    placeholder="Enter complete product description..."
                    minHeight={400}
                  />
                </div>
              </div>
            )}

            {/* ── MEDIA / IMAGES ── */}
            {tab === 'media' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
                  <label className="text-sm font-semibold text-foreground/80 mb-3 block">Banner / Card Image</label>
                  <input className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" type="file" accept="image/*" 
                    onChange={e => { if (e.target.files[0]) f('image', e.target.files[0]) }} />
                  {form.image instanceof File ? (
                    <img src={URL.createObjectURL(form.image)} alt="preview" className="mt-4 max-h-32 rounded-lg border border-border shadow-sm" />
                  ) : typeof form.image === 'string' && form.image ? (
                    <img src={form.image} alt="current" className="mt-4 max-h-32 rounded-lg border border-border shadow-sm" />
                  ) : null}
                </div>
                
                <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
                  <label className="text-sm font-semibold text-foreground/80 mb-3 block">Detail Page Image</label>
                  <input className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" type="file" accept="image/*" 
                    onChange={e => { if (e.target.files[0]) f('detailImage', e.target.files[0]) }} />
                  {form.detailImage instanceof File ? (
                    <img src={URL.createObjectURL(form.detailImage)} alt="detail preview" className="mt-4 max-h-32 rounded-lg border border-border shadow-sm" />
                  ) : typeof form.detailImage === 'string' && form.detailImage ? (
                    <img src={form.detailImage} alt="current detail" className="mt-4 max-h-32 rounded-lg border border-border shadow-sm" />
                  ) : null}
                </div>
              </div>
            )}

            {/* ── SEO ── */}
            {tab === 'seo' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <FloatingInput label="Meta Title (SEO)" value={form.metatag} onChange={e => f('metatag', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="SEO Meta Title" onGenerate={(val) => f('metatag', val)} />} />
                <FloatingTextarea label="Meta Description (SEO)" rows={3} value={form.metaDescription} onChange={e => f('metaDescription', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="SEO Meta Description" onGenerate={(val) => f('metaDescription', val)} />} />
                <FloatingInput label="Meta Keywords (Comma separated)" value={form.metakeywords} onChange={e => f('metakeywords', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="SEO Meta Keywords (comma separated)" onGenerate={(val) => f('metakeywords', val)} />} />
                <FloatingInput label="Canonical URL" value={form.canonicalUrl} onChange={e => f('canonicalUrl', e.target.value)} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput label="OG Title (Social Share)" value={form.ogTitle} onChange={e => f('ogTitle', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="OpenGraph Title" onGenerate={(val) => f('ogTitle', val)} />} />
                  <FloatingInput label="OG Description" value={form.ogDescription} onChange={e => f('ogDescription', e.target.value)} rightElement={<AIAssistantButton context={form.name} field="OpenGraph Description" onGenerate={(val) => f('ogDescription', val)} />} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingSelect label="Twitter Card" value={form.twitterCard} onChange={e => f('twitterCard', e.target.value)}>
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="summary">Summary</option>
                  </FloatingSelect>
                  <FloatingInput label="Robots (e.g. index, follow)" value={form.robots} onChange={e => f('robots', e.target.value)} />
                </div>
                
                <FloatingTextarea label="Schema Markup (JSON-LD)" rows={5} value={form.schema} onChange={e => f('schema', e.target.value)} className="font-mono text-xs" rightElement={<AIAssistantButton context={form.name} field="" isSchema={true} onGenerate={(val) => f('schema', val)} />} />
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-border mt-6">
            <Button variant="ghost" type="button" onClick={onClose} disabled={saving} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
            <Button type="submit" disabled={saving} className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
              {saving ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
