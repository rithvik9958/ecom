'use client'
import { useState, useEffect } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import Toast from '@/components/dashboard/Toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/floating-input'
import { Save, RotateCcw, Type } from 'lucide-react'

const BASE_URL = ''

const DEFAULT = {
  choose_title: '', choose_subtitle: '',
  product_title: '', product_subtitle: '',
  certified_title: '', certified_subtitle: '',
  work_title: '', work_subtitle: '',
  blog_title: '', blog_subtitle: '',
  contact_title: '', contact_subtitle: '',
}

const sections = [
  { key: 'choose',    label: 'Why Choose Us Section', fields: ['choose_title', 'choose_subtitle'] },
  { key: 'product',   label: 'Products Section',      fields: ['product_title', 'product_subtitle'] },
  { key: 'certified', label: 'Certified Section',     fields: ['certified_title', 'certified_subtitle'] },
  { key: 'work',      label: 'Our Work Section',      fields: ['work_title', 'work_subtitle'] },
  { key: 'blog',      label: 'Blog Section',          fields: ['blog_title', 'blog_subtitle'] },
]

const fieldLabel = k => k.endsWith('_title') ? 'Title' : k.endsWith('_subtitle') ? 'Subtitle' : k

export default function HeadingTextPage() {
  const [form, setForm] = useState(DEFAULT)
  const [recordId, setRecordId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState([])

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const addToast = (message, type = 'success') => {
    setToasts(t => [...t, { id: Date.now(), message, type }])
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== t[t.length - 1]?.id))
    }, 4000)
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/home-extra`)
      if (!res.ok) throw new Error('Failed to fetch heading texts')
      const data = await res.json()
      if (data.length > 0) {
        const r = data[0]
        setRecordId(r._id)
        setForm({
          choose_title:      r.choose_title      || '',
          choose_subtitle:   r.choose_subtitle   || '',
          product_title:     r.product_title     || '',
          product_subtitle:  r.product_subtitle  || '',
          certified_title:   r.certified_title   || '',
          certified_subtitle:r.certified_subtitle|| '',
          work_title:        r.work_title        || '',
          work_subtitle:     r.work_subtitle     || '',
          blog_title:        r.blog_title        || '',
          blog_subtitle:     r.blog_subtitle     || '',
          contact_title:     r.contact_title     || '',
          contact_subtitle:  r.contact_subtitle  || '',
        })
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch(`${BASE_URL}/api/home-extra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Save failed')
      addToast('All heading texts saved!')
      if (data.data && data.data._id) {
        setRecordId(data.data._id)
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse">Loading Headings Data...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <Breadcrumb
          title="Home Page Heading Text"
          crumbs={[{ label: 'Home Management' }, { label: 'Heading Text' }]}
        />
      </div>
      
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <Card className="border-0 shadow-sm shadow-primary/5 bg-background">
          <CardHeader className="border-b border-border/40 px-6 py-5 bg-card rounded-t-2xl flex flex-row items-center gap-3">
            <Type className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Edit Section Headings</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage titles and subtitles for various sections on the home page.</p>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 bg-card space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map(sec => (
                  <div key={sec.key} className="border border-input/60 rounded-xl p-5 bg-muted/10 space-y-4">
                    <h3 className="font-bold text-foreground text-sm flex items-center border-b border-border/60 pb-2 mb-4">
                      {sec.label}
                    </h3>
                    <div className="space-y-4">
                      {sec.fields.map(fieldKey => (
                        <FloatingInput
                          key={fieldKey}
                          label={fieldLabel(fieldKey)}
                          value={form[fieldKey] || ''}
                          onChange={e => f(fieldKey, e.target.value)}
                          rightElement={<AIAssistantButton context={`${sec.label} - ${fieldLabel(fieldKey)}`} field="Engaging Text" onGenerate={(val) => f(fieldKey, val)} />}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </CardContent>

            <CardFooter className="p-6 bg-muted/10 border-t border-border/40 flex items-center justify-end gap-4 rounded-b-2xl">
              <Button 
                type="button" 
                variant="outline" 
                onClick={fetchData}
                disabled={saving}
                className="rounded-md px-6 h-10 font-medium bg-background"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="rounded-md px-8 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all whitespace-nowrap border-0 shadow-xs"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save All Headings'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}