'use client'
import { useState, useEffect } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import Toast from '@/components/dashboard/Toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FloatingInput, FloatingTextarea, FloatingSelect } from '@/components/ui/floating-input'
import { Save, Search, Share2, Globe, FileJson } from 'lucide-react'

const BASE_URL = ''

const DEFAULT = {
  pageSlug: 'home', title: '', metaDescription: '',
  metaKeywords: '', canonicalUrl: '', ogTitle: '',
  ogDescription: '', ogImage: '', twitterCard: 'summary_large_image',
  robots: 'index, follow', h1: '',
}

export default function HomeSeoPage() {
  const [form, setForm] = useState(DEFAULT)
  const [schema, setSchema] = useState('{}')
  const [schemaError, setSchemaError] = useState('')
  const [recordId, setRecordId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('basic')
  const [toasts, setToasts] = useState([])

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const addToast = (message, type = 'success') =>
    setToasts(t => [...t, { id: Date.now(), message, type }])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fetch(`${BASE_URL}/api/home-seo`)
        if (!res.ok) throw new Error('Failed to fetch SEO settings')
        const data = await res.json()
        if (data.length > 0) {
          const r = data[0]
          setRecordId(r._id)
          setForm({
            pageSlug:        r.pageSlug        || 'home',
            title:           r.title           || '',
            metaDescription: r.metaDescription || '',
            metaKeywords:    Array.isArray(r.metaKeywords) ? r.metaKeywords.join(', ') : (r.metaKeywords || ''),
            canonicalUrl:    r.canonicalUrl    || '',
            ogTitle:         r.ogTitle         || '',
            ogDescription:   r.ogDescription   || '',
            ogImage:         r.ogImage         || '',
            twitterCard:     r.twitterCard     || 'summary_large_image',
            robots:          r.robots          || 'index, follow',
            h1:              r.h1              || '',
          })
          setSchema(r.schema ? JSON.stringify(r.schema, null, 2) : '{}')
        }
      } catch (err) {
        addToast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    
    let parsedSchema = {}
    try {
      parsedSchema = JSON.parse(schema)
      setSchemaError('')
    } catch {
      setSchemaError('Invalid JSON — please fix before saving.')
      setTab('schema')
      return
    }

    try {
      setSaving(true)
      const payload = {
        ...form,
        metaKeywords: form.metaKeywords.split(',').map(k => k.trim()).filter(Boolean),
        schema: parsedSchema,
        updatedAt: new Date().toISOString().split('T')[0],
      }
      const res = await fetch(`${BASE_URL}/api/home-seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Save failed')
      addToast('SEO settings saved!')
      if (data.data && data.data._id) {
        setRecordId(data.data._id)
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const TABS = [
    { key: 'basic',  label: 'Basic SEO', icon: Search },
    { key: 'og',     label: 'Open Graph', icon: Share2 },
    { key: 'tw',     label: 'Twitter', icon: Globe },
    { key: 'schema', label: 'Schema', icon: FileJson },
  ]

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <Breadcrumb title="Homepage SEO" crumbs={[{ label: 'Home Management' }, { label: 'SEO Tags' }]} />
      </div>
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <Card className="border-0 shadow-sm shadow-primary/5 bg-background">
          <CardHeader className="border-b border-border/40 pb-5">
            <CardTitle className="text-2xl font-bold text-foreground">Homepage SEO Settings</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Manage search engine optimization for your homepage.</p>
          </CardHeader>

          {/* Tab bar */}
          <div className="flex flex-wrap gap-2 border-b border-border px-6 mt-2 pb-3 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.key} type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    tab === t.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>


          <form onSubmit={handleSubmit}>
            <CardContent className="p-6">
              {/* ── Basic SEO ── */}
              {tab === 'basic' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingInput label="Page Slug" value={form.pageSlug} onChange={e => f('pageSlug', e.target.value)} />
                    <FloatingInput label="H1 Heading" value={form.h1} onChange={e => f('h1', e.target.value)} />
                  </div>
                  
                  <div className="space-y-1">
                    <FloatingInput label="Meta Title *" required value={form.title} onChange={e => f('title', e.target.value)} rightElement={<AIAssistantButton context="Jindal Metal Homepage" field="SEO Meta Title" onGenerate={(val) => f('title', val)} />} />
                    <div className="flex justify-between text-[11px] px-1">
                      <span className="text-muted-foreground">Recommended: up to 60 characters</span>
                      <span className={form.title.length > 60 ? 'text-red-500 font-medium' : 'text-muted-foreground'}>{form.title.length}/60</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <FloatingTextarea label="Meta Description" value={form.metaDescription} onChange={e => f('metaDescription', e.target.value)} rows={3} rightElement={<AIAssistantButton context="Jindal Metal Homepage" field="SEO Meta Description" onGenerate={(val) => f('metaDescription', val)} />} />
                    <div className="flex justify-between text-[11px] px-1">
                      <span className="text-muted-foreground">Recommended: up to 160 characters</span>
                      <span className={form.metaDescription.length > 160 ? 'text-red-500 font-medium' : 'text-muted-foreground'}>{form.metaDescription.length}/160</span>
                    </div>
                  </div>
                  
                  <FloatingTextarea label="Meta Keywords (Comma separated)" value={form.metaKeywords} onChange={e => f('metaKeywords', e.target.value)} rows={2} rightElement={<AIAssistantButton context="Jindal Metal Homepage" field="SEO Meta Keywords" onGenerate={(val) => f('metaKeywords', val)} />} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FloatingInput label="Canonical URL" value={form.canonicalUrl} onChange={e => f('canonicalUrl', e.target.value)} placeholder="https://example.com/" />
                    <FloatingSelect label="Robots" value={form.robots} onChange={e => f('robots', e.target.value)}>
                      <option value="index, follow">index, follow</option>
                      <option value="noindex, follow">noindex, follow</option>
                      <option value="index, nofollow">index, nofollow</option>
                      <option value="noindex, nofollow">noindex, nofollow</option>
                    </FloatingSelect>
                  </div>
                </div>
              )}

              {/* ── Open Graph ── */}
              {tab === 'og' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FloatingInput label="OG Title" value={form.ogTitle} onChange={e => f('ogTitle', e.target.value)} rightElement={<AIAssistantButton context="Jindal Metal Homepage" field="OpenGraph Title" onGenerate={(val) => f('ogTitle', val)} />} />
                  <FloatingTextarea label="OG Description" value={form.ogDescription} onChange={e => f('ogDescription', e.target.value)} rows={3} rightElement={<AIAssistantButton context="Jindal Metal Homepage" field="OpenGraph Description" onGenerate={(val) => f('ogDescription', val)} />} />
                  
                  <div className="space-y-4">
                    <FloatingInput label="OG Image URL" value={form.ogImage} onChange={e => f('ogImage', e.target.value)} placeholder="https://cdn.example.com/og.jpg" />
                    {form.ogImage && (
                      <div className="mt-2 border border-border rounded-xl p-2 bg-muted/10 w-fit">
                        <img src={form.ogImage} alt="OG preview" className="max-w-[320px] w-full h-auto rounded-lg object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Twitter ── */}
              {tab === 'tw' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <FloatingSelect label="Twitter Card Type" value={form.twitterCard} onChange={e => f('twitterCard', e.target.value)}>
                    <option value="summary_large_image">summary_large_image</option>
                    <option value="summary">summary</option>
                    <option value="app">app</option>
                    <option value="player">player</option>
                  </FloatingSelect>
                  
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 leading-relaxed">
                    <span className="font-semibold block mb-1">💡 Note on Twitter Cards</span>
                    Twitter card uses OG Title, OG Description and OG Image by default. Set those in the Open Graph tab. The card type above controls the display format.
                  </div>
                </div>
              )}

              {/* ── Schema ── */}
              {tab === 'schema' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[13px] font-semibold text-foreground/75 leading-none">Schema Markup (JSON-LD)</label>
                      <AIAssistantButton context="Jindal Metal Homepage" isSchema={true} onGenerate={(val) => { setSchema(val); setSchemaError(''); }} />
                    </div>
                    <FloatingTextarea
                      label=""
                      value={schema}
                      onChange={e => { setSchema(e.target.value); setSchemaError('') }}
                      rows={18}
                      className="font-mono text-xs"
                    />
                    {schemaError && <p className="text-sm font-medium text-red-500 mt-2 px-1">⚠ {schemaError}</p>}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="p-6 bg-muted/10 border-t border-border/40 flex items-center justify-end gap-4 rounded-b-2xl">
              <Button 
                type="submit" 
                disabled={saving}
                className="rounded-md px-8 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all whitespace-nowrap border-0 shadow-xs"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save SEO Settings'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}