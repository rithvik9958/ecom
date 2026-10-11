'use client'
import { useState } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import Toast from '@/components/dashboard/Toast'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input'
import { Save } from 'lucide-react'

const INIT = { metatitle: 'Steel Strip Products | Jindal Metals & Alloys', metakeyword: 'stainless steel strips products, H&T strips, precision foils', metadescription: 'Explore our full range of cold rolled precision stainless steel strips, ultra-thin foils, and hardened & tempered steel strips.', metatags: '', scripts: '' }

export default function ProductsSeoPage() {
  const [form, setForm] = useState(INIT)
  const [toasts, setToasts] = useState([])
  const [saving, setSaving] = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  
  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    // Simulate API call
    setTimeout(() => {
      setSaving(false)
      setToasts(t => [...t, { id: Date.now(), message: 'SEO Settings Saved successfully!', type: 'success' }])
    }, 600)
  }

  return (
    <div>
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        <Breadcrumb title="Products SEO" crumbs={[{ label: 'Products' }, { label: 'SEO' }]} />
      </div>
      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <Card className="border-0 shadow-sm shadow-primary/5 bg-background">
          <CardHeader className="border-b border-border/40 pb-5">
            <CardTitle className="text-2xl font-bold text-foreground">Products Page SEO Settings</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Manage search engine optimization for your products listing page.</p>
          </CardHeader>
          <form onSubmit={handleSave}>
            <CardContent className="p-6">
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <FloatingInput label="Meta Title" value={form.metatitle} onChange={e => f('metatitle', e.target.value)} rightElement={<AIAssistantButton context="Products SEO Page" field="SEO Meta Title" onGenerate={(val) => f('metatitle', val)} />} />
                <FloatingTextarea label="Meta Keywords" value={form.metakeyword} onChange={e => f('metakeyword', e.target.value)} rows={3} rightElement={<AIAssistantButton context="Products SEO Page" field="SEO Meta Keywords" onGenerate={(val) => f('metakeyword', val)} />} />
                <FloatingTextarea label="Meta Description" value={form.metadescription} onChange={e => f('metadescription', e.target.value)} rows={4} rightElement={<AIAssistantButton context="Products SEO Page" field="SEO Meta Description" onGenerate={(val) => f('metadescription', val)} />} />
                <FloatingTextarea label="Additional Meta Tags" className="font-mono text-xs" value={form.metatags} onChange={e => f('metatags', e.target.value)} rows={4} />
                <FloatingTextarea label="Scripts" className="font-mono text-xs" value={form.scripts} onChange={e => f('scripts', e.target.value)} rows={4} />
              </div>
            </CardContent>
            <CardFooter className="p-6 bg-muted/10 border-t border-border/40 flex items-center justify-end gap-4 rounded-b-xl">
              <Button 
                type="submit" 
                disabled={saving}
                className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
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
