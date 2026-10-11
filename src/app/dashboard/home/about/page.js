'use client'
import { useEffect, useState } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import Toast from '@/components/dashboard/Toast'
import RichEditor from '@/components/dashboard/RichEditor'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/floating-input'
import { Save, RotateCcw, Image as ImageIcon } from 'lucide-react'

const API_URL = ''

export default function HomeAboutPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aboutId, setAboutId] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    imageFile: null,
    alt: '',
  })
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }])
  }

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    fetchHomeAbout()
  }, [])

  const fetchHomeAbout = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/home-about`, { cache: 'no-store' })
      const data = await response.json()

      if (data && data.length > 0) {
        const about = data[0]
        setAboutId(about._id)
        setForm({
          title: about.title || '',
          description: about.description || '',
          image: about.image || '',
          imageFile: null,
          alt: about.alt || '',
        })
      }
    } catch (error) {
      console.error(error)
      addToast('Failed to load about section', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async e => {
    e.preventDefault()
    try {
      setSaving(true)
      const formData = new FormData()

      formData.append('title', form.title)
      formData.append('description', form.description)
      formData.append('alt', form.alt)

      if (form.imageFile) {
        formData.append('image', form.imageFile)
      }

      const response = await fetch(`/api/home-about`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.message || 'Update failed')
      }

      addToast('About section updated successfully!', 'success')
      fetchHomeAbout()
    } catch (error) {
      console.error(error)
      addToast(error.message || 'Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

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
        <Breadcrumb title="Home Page About" crumbs={[{ label: 'Home Management' }, { label: 'About Section' }]} />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <Card className="border-0 shadow-sm shadow-primary/5 bg-background">
          <CardHeader className="border-b border-border/40 px-6 py-5 bg-card rounded-t-2xl">
            <CardTitle className="text-xl font-bold text-foreground">Edit About Section</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Update the content for the Home Page About section.</p>
          </CardHeader>

          <form onSubmit={handleSave}>
            <CardContent className="p-6 space-y-6 bg-muted/20">
              
              {/* Image Upload Section */}
              <div className="bg-background rounded-xl border border-border/60 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Section Image</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-foreground/75 leading-none">Upload New Image</label>
                      <p className="text-[11px] text-muted-foreground">Recommended size: 600×450px</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setForm(prev => ({
                              ...prev,
                              imageFile: file,
                              image: URL.createObjectURL(file),
                            }))
                          }
                        }}
                        className="flex h-10 w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                    </div>
                    <FloatingInput
                      label="Image ALT Text"
                      value={form.alt}
                      onChange={e => updateField('alt', e.target.value)}
                      placeholder="Descriptive alt text for SEO"
                      rightElement={<AIAssistantButton context={form.title || 'About Jindal Metal'} field="SEO Image Alt Text" onGenerate={(val) => updateField('alt', val)} />}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold text-foreground/75 leading-none">Current Preview</span>
                    <div className="w-full aspect-video rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center shadow-sm">
                      {form.image ? (
                        <img
                          src={form.image.startsWith('/uploads') ? `${API_URL}${form.image}` : form.image}
                          alt={form.alt || 'About Image'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground/50">
                          <ImageIcon className="w-8 h-8 mb-2" />
                          <span className="text-xs font-medium">No image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="bg-background rounded-xl border border-border/60 p-6 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Content Details</h3>
                </div>
                
                <FloatingInput
                  label="Title *"
                  value={form.title}
                  onChange={e => updateField('title', e.target.value)}
                  required
                  rightElement={<AIAssistantButton context="Jindal Metal About Section" field="Catchy Title" onGenerate={(val) => updateField('title', val)} />}
                />

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-foreground/75 leading-none">Description *</label>
                    <AIAssistantButton context={form.title || 'About Jindal Metal'} field="Detailed About Us Description" onGenerate={(val) => updateField('description', val)} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Supports rich text formatting</p>
                  <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                    <RichEditor
                      value={form.description}
                      onChange={value => updateField('description', value)}
                      placeholder="Enter description..."
                      minHeight={250}
                    />
                  </div>
                </div>
              </div>

            </CardContent>

            <CardFooter className="p-6 bg-muted/10 border-t border-border/40 flex items-center justify-end gap-4 rounded-b-2xl">
              <Button 
                type="button" 
                variant="outline" 
                onClick={fetchHomeAbout}
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

      <Toast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(toast => toast.id !== id))} />
    </div>
  )
}