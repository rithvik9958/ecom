'use client'
import { useState, useEffect } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import Toast from '@/components/dashboard/Toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/floating-input'
import RichEditor from '@/components/dashboard/RichEditor'
import { Save, Image as ImageIcon, RotateCcw } from 'lucide-react'

const BASE_URL = ''

export default function CtaOnePage() {
  const [form, setForm] = useState({ title: '', content: '', image: '' })
  const [recordId, setRecordId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    setToasts(t => [...t, { id: Date.now(), message, type }])
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== t[t.length - 1]?.id))
    }, 4000)
  }

  useEffect(() => {
    fetchCta()
  }, [])

  async function fetchCta() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/cta`)
      if (!res.ok) throw new Error('Failed to fetch CTA')
      const data = await res.json()
      if (data.length > 0) {
        const record = data[0]
        setRecordId(record._id)
        setForm({ title: record.title || '', content: record.content || '', image: record.image || '' })
        setPreview(record.image || '')
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setSaving(true)
      const fd = new FormData()
      fd.append('title', form.title || '')
      fd.append('content', form.content || '')
      if (imageFile) fd.append('image', imageFile)

      const res = await fetch(`${BASE_URL}/api/cta`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Save failed')
      addToast('CTA saved successfully!')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse">Loading CTA Data...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <Breadcrumb title="Some CTA" crumbs={[{ label: 'Home Management' }, { label: 'Some CTA' }]} />
      </div>
      
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <Card className="border-0 shadow-sm shadow-primary/5 bg-background">
          <CardHeader className="border-b border-border/40 px-6 py-5 bg-card rounded-t-2xl">
            <CardTitle className="text-xl font-bold text-foreground">Edit CTA Section</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Update the content and background image for the CTA section.</p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-8 bg-card">
              
              <div className="border border-input/60 rounded-2xl p-6 bg-muted/10">
                <label className="text-sm font-semibold text-foreground/80 mb-1 block">Background / Feature Image</label>
                <p className="text-[11px] text-muted-foreground mb-4">Recommended size: 1200×600px</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input"
                  />
                  
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-muted-foreground mb-2 block w-full">Current Preview</span>
                    <div className="w-full h-32 rounded-xl border border-border bg-[#1a1a1a] flex items-center justify-center shadow-sm overflow-hidden">
                      {preview ? (
                        <img
                          src={preview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground/50">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-medium uppercase tracking-wider">No Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <FloatingInput
                  label="CTA Title"
                  required
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  rightElement={<AIAssistantButton context="Call to Action Section" field="Catchy Title" onGenerate={(val) => setForm({...form, title: val})} />}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-semibold text-foreground/80 block">CTA Content</label>
                    <AIAssistantButton context={form.title || 'Call to Action'} field="Persuasive Content" onGenerate={(val) => setForm({...form, content: val})} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2 ml-1">Supports rich text formatting</p>
                  <div className="border border-input/60 rounded-xl overflow-hidden">
                    <RichEditor
                      value={form.content}
                      onChange={v => setForm({...form, content: v})}
                      placeholder="Enter CTA content..."
                      minHeight={160}
                    />
                  </div>
                </div>
              </div>

            </CardContent>

            <CardFooter className="p-6 bg-muted/10 border-t border-border/40 flex items-center justify-end gap-4 rounded-b-2xl">
              <Button 
                type="button" 
                variant="outline" 
                onClick={fetchCta}
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
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}