'use client'
import { useState, useEffect } from 'react'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import RichEditor from '@/components/dashboard/RichEditor'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FloatingInput } from '@/components/ui/floating-input'
import { Switch } from '@/components/ui/switch'
import { Edit2, Trash2, Mail, Eye, Send, Code } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'
import StatusSwitch from '@/components/dashboard/StatusSwitch'
import { Button } from '@/components/ui/button'

const BASE_URL = ''

const EMPTY = { name: '', subject: '', htmlContent: '', isActive: true }

const DYNAMIC_VARS = ['{{userName}}', '{{companyName}}', '{{resetLink}}', '{{contactEmail}}', '{{supportPhone}}']

function TemplateModal({ template, onClose, onSave, saving }) {
  const [form, setForm] = useState(template || { ...EMPTY })
  const [showPreview, setShowPreview] = useState(false)

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ ...form })
  }

  function insertVar(v) {
    f('htmlContent', form.htmlContent + v)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 rounded-2xl">
        {showPreview ? (
          <div className="flex flex-col h-full bg-muted/30">
            <div className="p-4 border-b border-border bg-card flex items-center justify-between shadow-sm sticky top-0 z-10">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Eye className="w-5 h-5 text-blue-500"/> HTML Preview</h2>
              <Button variant="outline" onClick={() => setShowPreview(false)} className="rounded-xl">Back to Editor</Button>
            </div>
            <div className="p-8 flex-1 flex justify-center">
              <div 
                className="w-full max-w-2xl bg-card shadow-xl rounded-xl p-8 border border-border email-preview-content"
                dangerouslySetInnerHTML={{ __html: form.htmlContent || '<p class="text-muted-foreground text-center">No content</p>' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
              <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                <span>{template ? 'Edit Email Template' : 'Add Email Template'}</span>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="rounded-xl flex items-center gap-2">
                  <Eye className="w-4 h-4"/> Preview
                </Button>
              </DialogTitle>
              <p className="text-muted-foreground text-sm">Create standard email templates for system notifications.</p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="p-6 space-y-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput label="Template Name *" required value={form.name} onChange={e => f('name', e.target.value)} />
                  <FloatingInput label="Email Subject *" required value={form.subject} onChange={e => f('subject', e.target.value)} rightElement={<AIAssistantButton context={form.name || 'Email Template'} field="Catchy Subject Line" onGenerate={(val) => f('subject', val)} />} />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-foreground/80 block">HTML Content *</label>
                    <AIAssistantButton context={form.name || 'Email'} field="Professional Email Content" onGenerate={(val) => f('htmlContent', val)} />
                  </div>
                  
                  {/* Dynamic Variables */}
                  <div className="flex flex-wrap gap-2 items-center bg-muted/30 p-2 px-3 rounded-lg border border-border/50">
                    <Code className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-semibold text-foreground/80 mr-2">Click to insert:</span>
                    {DYNAMIC_VARS.map(v => (
                      <button 
                        key={v}
                        type="button"
                        onClick={() => insertVar(v)}
                        className="text-xs font-mono bg-background dark:bg-muted/50 text-foreground border border-border hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1.5 rounded-md transition-colors shadow-sm"
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  <div className="border border-input/60 rounded-xl overflow-hidden shadow-sm">
                    <RichEditor 
                      value={form.htmlContent} 
                      onChange={v => f('htmlContent', v)} 
                      placeholder="Write your email body here. Use {{variableName}} for dynamic variables." 
                      minHeight={400} 
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 pt-4 border-t border-border bg-muted/20 mt-auto">
                <Button variant="ghost" type="button" onClick={onClose} disabled={saving} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-full px-10 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
                  {saving ? 'Saving...' : 'Save Template'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function EmailTemplatesPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(null)
  
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [toasts, setToasts] = useState([])
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })
  const [testingId, setTestingId] = useState(null)
  const [testModal, setTestModal] = useState({ isOpen: false, templateId: null, email: '' })

  function addToast(message, type = 'success') {
    setToasts(t => [...t, { id: Date.now(), message, type }])
  }

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/email-templates`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRows(data || [])
    } catch (err) {
      addToast('Could not load templates: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(form) {
    try {
      setSaving(true)
      const isEdit = Boolean(form._id)
      const url = isEdit ? `${BASE_URL}/api/email-templates/${form._id}` : `${BASE_URL}/api/email-templates`
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Save failed')

      addToast(isEdit ? 'Template updated!' : 'Template created!')
      setModal(null)
      fetchTemplates()
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
      const res = await fetch(`${BASE_URL}/api/email-templates/${id}`, { method: 'DELETE' })
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
      await Promise.all(selectedIds.map(id => fetch(`${BASE_URL}/api/email-templates/${id}`, { method: 'DELETE' })))
      setRows(r => r.filter(x => !selectedIds.includes(x._id)))
      setSelectedIds([])
      addToast('Templates deleted.', 'warning')
    } catch (err) {
      addToast('Error deleting templates: ' + err.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function handleToggleStatus(id, currentStatus) {
    try {
      setTogglingId(id)
      const res = await fetch(`${BASE_URL}/api/email-templates/${id}`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      if (!res.ok) throw new Error(await res.text())
      setRows(r => r.map(x => x._id === id ? { ...x, isActive: !currentStatus } : x))
      addToast('Status updated!')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const handleTestEmail = (id, e) => {
    e.stopPropagation()
    setTestModal({ isOpen: true, templateId: id, email: '' })
  }

  const sendRealTestEmail = async (e) => {
    e.preventDefault()
    if (!testModal.email) return

    try {
      setTestingId(testModal.templateId)
      const res = await fetch(`${BASE_URL}/api/email-templates/test`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: testModal.templateId, toEmail: testModal.email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to send')
      
      addToast(data.message)
      setTestModal({ isOpen: false, templateId: null, email: '' })
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setTestingId(null)
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
    .filter(r => r.name?.toLowerCase().includes(search.toLowerCase()) || r.subject?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if (sort === 'a-z') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'z-a') return (b.name || '').localeCompare(a.name || '')
      return 0
    })

  const columns = [
    {
      key: 'name',
      label: 'Template Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[14px] text-foreground">{row.name}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{row.subject}</span>
          </div>
        </div>
      )
    },
    {
      key: 'variables',
      label: 'Variables Found',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.variables?.length > 0 ? row.variables.map((v, i) => (
            <span key={i} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono">
              {v}
            </span>
          )) : (
            <span className="text-xs text-muted-foreground/50">None</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Active Status',
      render: (row) => (
        <StatusSwitch
          checked={row.isActive}
          loading={togglingId === row._id}
          onCheckedChange={() => handleToggleStatus(row._id, row.isActive)}
          label={row.isActive ? 'Active' : 'Inactive'}
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
            onClick={(e) => handleTestEmail(row._id, e)}
            disabled={testingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
            title="Send Test Email"
          >
            {testingId === row._id ? <span className="w-3.5 h-3.5 animate-spin border-2 border-primary border-t-transparent rounded-full" /> : <Send className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setModal(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Template"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: row._id }) }}
            disabled={deletingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Template"
          >
            {deletingId === row._id ? <span className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin"/> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  const handleReorder = (reorderedList) => {
    setRows(reorderedList);
    addToast('Template order updated');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Email Templates" 
        subtitle="Manage and customize system emails"
        crumbs={[{ label: 'Email Templates' }]} 
      />
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        onAdd={() => setModal(EMPTY)}
        addLabel="New Template"
        selectedCount={selectedIds.length}
        onBulkDelete={() => setConfirmModal({ isOpen: true, type: 'bulk', id: null })}
      />

      <DataTable 
        columns={columns}
        data={filteredData}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelect}
        actions={false}
        onReorder={handleReorder}
      />

      {modal && <TemplateModal template={modal === EMPTY ? null : modal} onClose={() => setModal(null)} onSave={handleSave} saving={saving} />}

      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'bulk' ? bulkDeleting : deletingId !== null}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'bulk' ? handleBulkDelete() : handleDelete(confirmModal.id)}
        title={confirmModal.type === 'bulk' ? `Delete ${selectedIds.length} templates?` : "Delete Template"}
        message="Are you sure? This cannot be undone."
      />

      {/* Test Email Modal */}
      {testModal.isOpen && (
        <Dialog open={true} onOpenChange={(open) => !open && setTestModal({ isOpen: false, templateId: null, email: '' })}>
          <DialogContent className="max-w-md p-0 rounded-2xl overflow-hidden shadow-xl border-0">
            <div className="bg-muted/30 p-6 border-b border-border">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-500" />
                Send Test Email
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enter an email address below to receive a live preview of this template.
              </p>
            </div>
            <form onSubmit={sendRealTestEmail} className="p-6 space-y-6">
              <FloatingInput 
                label="Destination Email Address *"
                type="email" 
                required 
                value={testModal.email} 
                onChange={e => setTestModal(prev => ({ ...prev, email: e.target.value }))}
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" type="button" onClick={() => setTestModal({ isOpen: false, templateId: null, email: '' })} className="rounded-xl hover:bg-muted">
                  Cancel
                </Button>
                <Button type="submit" disabled={testingId === testModal.templateId} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]">
                  {testingId === testModal.templateId ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Test'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
