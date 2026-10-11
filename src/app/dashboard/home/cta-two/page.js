'use client'
import { useState, useEffect } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import Toast from '@/components/dashboard/Toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/floating-input'
import RichEditor from '@/components/dashboard/RichEditor'
import { Save, Link as LinkIcon, RotateCcw, Megaphone } from 'lucide-react'

const BASE_URL = ''

const DEFAULT = { title: '', subtitle: '', content: '', buttonText1: '', url1: '', buttonText2: '', url2: '' }

export default function CtaTwoPage() {
  const [form, setForm] = useState(DEFAULT)
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
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/othercta`)
      if (!res.ok) throw new Error('Failed to fetch CTA')
      const data = await res.json()
      if (data.length > 0) {
        const r = data[0]
        setRecordId(r._id)
        setForm({
          title:       r.title       || '',
          subtitle:    r.subtitle    || '',
          content:     r.content     || '',
          buttonText1: r.buttonText1 || '',
          url1:        r.url1        || '',
          buttonText2: r.buttonText2 || '',
          url2:        r.url2        || '',
        })
        setPreview(r.image || '')
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
      
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('subtitle', form.subtitle)
      formData.append('content', form.content)
      formData.append('buttonText1', form.buttonText1)
      formData.append('url1', form.url1)
      formData.append('buttonText2', form.buttonText2)
      formData.append('url2', form.url2)
      if (imageFile) formData.append('image', imageFile)

      const res = await fetch(`${BASE_URL}/api/othercta`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Save failed')
      addToast('Secondary CTA saved successfully!')
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
        <Breadcrumb title="Secondary CTA" crumbs={[{ label: 'Home Management' }, { label: 'Secondary CTA' }]} />
      </div>
      
      <div className="p-4 sm:p-6 lg:p-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-sm shadow-primary/5 bg-background h-fit">
          <CardHeader className="border-b border-border/40 px-6 py-5 bg-card rounded-t-2xl">
            <CardTitle className="text-xl font-bold text-foreground">Edit Secondary CTA</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Update the title, subtitle, and buttons for the secondary call-to-action.</p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 space-y-6 bg-card">
              
              {/* Background Image Upload */}
              <div className="border border-input/60 rounded-xl p-5 bg-muted/10 space-y-4">
                <div className="text-sm font-semibold text-foreground/80 block">Background Image</div>
                <p className="text-[11px] text-muted-foreground -mt-2">Recommended: 1920×800px</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImage} 
                  className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" 
                />
                {preview && (
                  <img 
                    src={preview} 
                    alt="preview" 
                    className="mt-4 w-full max-h-48 rounded-lg border border-border shadow-sm object-cover" 
                  />
                )}
              </div>

              <div className="space-y-6">
                <FloatingInput
                  label="Title *"
                  required
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  rightElement={<AIAssistantButton context="Call to Action Section" field="Catchy Title" onGenerate={(val) => setForm({...form, title: val})} />}
                />
                <FloatingInput
                  label="Subtitle"
                  value={form.subtitle}
                  onChange={e => setForm({...form, subtitle: e.target.value})}
                  rightElement={<AIAssistantButton context={form.title || 'Call to Action Section'} field="Engaging Subtitle" onGenerate={(val) => setForm({...form, subtitle: val})} />}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-semibold text-foreground/80 block">CTA Content</label>
                  <AIAssistantButton context={form.title || 'Call to Action'} field="Persuasive Content" onGenerate={(val) => setForm({...form, content: val})} />
                </div>
                <div className="border border-input/60 rounded-xl overflow-hidden">
                  <RichEditor
                    value={form.content}
                    onChange={v => setForm({...form, content: v})}
                    placeholder="Enter CTA description..."
                    minHeight={140}
                  />
                </div>
              </div>

              {/* Primary Button */}
              <div className="border border-input/60 rounded-xl p-5 bg-muted/10 space-y-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Button</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FloatingInput
                    label="Button Text"
                    value={form.buttonText1}
                    onChange={e => setForm({...form, buttonText1: e.target.value})}
                    placeholder="e.g. Get a Quote"
                    rightElement={<AIAssistantButton context={form.title || 'Hero CTA'} field="Actionable Primary Button Text" onGenerate={(val) => setForm({...form, buttonText1: val})} />}
                  />
                  <FloatingInput
                    label="Button URL"
                    value={form.url1}
                    onChange={e => setForm({...form, url1: e.target.value})}
                    placeholder="/contact"
                    icon={<LinkIcon className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Secondary Button */}
              <div className="border border-input/60 rounded-xl p-5 bg-muted/10 space-y-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Secondary Button</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FloatingInput
                    label="Button Text"
                    value={form.buttonText2}
                    onChange={e => setForm({...form, buttonText2: e.target.value})}
                    placeholder="e.g. Know More"
                    rightElement={<AIAssistantButton context={form.title || 'Hero CTA'} field="Actionable Secondary Button Text" onGenerate={(val) => setForm({...form, buttonText2: val})} />}
                  />
                  <FloatingInput
                    label="Button URL"
                    value={form.url2}
                    onChange={e => setForm({...form, url2: e.target.value})}
                    placeholder="/products"
                    icon={<LinkIcon className="w-4 h-4" />}
                  />
                </div>
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
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Live Preview */}
        <div className="h-fit sticky top-6">
          <Card className="border border-blue-500/20 shadow-xl shadow-blue-500/5 bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
            <CardHeader className="bg-white/10 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex flex-row items-center gap-3">
              <Megaphone className="w-5 h-5 text-blue-200" />
              <CardTitle className="text-lg font-semibold text-white">Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-10 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="text-3xl font-extrabold tracking-tight mb-2">
                {form.title || 'Your CTA Title'}
              </div>
              {form.subtitle && (
                <div className="text-lg text-blue-100 font-medium mb-4">
                  {form.subtitle}
                </div>
              )}
              {form.content && (
                <div
                  className="text-sm text-blue-50/90 max-w-lg mx-auto leading-relaxed mb-8"
                  dangerouslySetInnerHTML={{ __html: form.content.replace(/<[^>]+>/g, ' ').trim() }}
                />
              )}
              
              <div className="flex flex-wrap items-center justify-center gap-4 mt-auto">
                {form.buttonText1 && (
                  <div className="bg-white text-blue-700 px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-black/10 hover:shadow-xl transition-all cursor-pointer">
                    {form.buttonText1}
                  </div>
                )}
                {form.buttonText2 && (
                  <div className="bg-transparent border-2 border-white/70 hover:border-white text-white px-8 py-3 rounded-full font-bold text-sm transition-all cursor-pointer">
                    {form.buttonText2}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}