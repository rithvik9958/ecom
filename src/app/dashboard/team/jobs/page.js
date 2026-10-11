'use client'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import { useState } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { FloatingInput, FloatingTextarea, FloatingSelect } from '@/components/ui/floating-input'
import { Edit2, Trash2, Plus, Briefcase, MapPin, ArrowLeft } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'
import StatusSwitch from '@/components/dashboard/StatusSwitch'

const DEPTS = ['Management', 'Operations', 'Quality', 'HR', 'Sales', 'Finance', 'R&D', 'Maintenance']
const TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']
const INIT = [
  { id: 1, title: 'Junior Quality Inspector', department: 'Quality', location: 'Bahadurgarh, Haryana', type: 'Full-time', experience: '1-3 years', description: 'Responsible for in-process and final inspection of steel strips...', status: 'open' },
  { id: 2, title: 'Sales Executive — Exports', department: 'Sales', location: 'Bahadurgarh / Remote', type: 'Full-time', experience: '2-5 years', description: 'Handle export enquiries, quotations, and international client relationships...', status: 'open' },
  { id: 3, title: 'Maintenance Engineer', department: 'Maintenance', location: 'Bahadurgarh, Haryana', type: 'Full-time', experience: '3-7 years', description: 'Preventive and breakdown maintenance of rolling mill machinery...', status: 'closed' },
]

function JobModal({ job, onClose, onSave }) {
  const [form, setForm] = useState(job || { title: '', department: 'Sales', location: 'Bahadurgarh, Haryana', type: 'Full-time', experience: '', description: '' })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{job ? 'Edit Job Opening' : 'Add Job Opening'}</DialogTitle>
          <p className="text-muted-foreground text-sm">Fill out the information below to {job ? 'update' : 'create'} this job posting.</p>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-6 mt-4">
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <FloatingInput label="Job Title *" required value={form.title} onChange={e => f('title', e.target.value)} rightElement={<AIAssistantButton context="Manufacturing/Industrial Job Position" field="Job Title" onGenerate={(val) => f('title', val)} />} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingSelect label="Department" value={form.department} onChange={e => f('department', e.target.value)}>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </FloatingSelect>
              <FloatingSelect label="Type" value={form.type} onChange={e => f('type', e.target.value)}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </FloatingSelect>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FloatingInput label="Location" value={form.location} onChange={e => f('location', e.target.value)} />
              <FloatingInput label="Experience Required" value={form.experience} onChange={e => f('experience', e.target.value)} placeholder="e.g. 2-5 years" />
            </div>
            
            <FloatingTextarea label="Job Description" value={form.description} onChange={e => f('description', e.target.value)} rows={5} rightElement={<AIAssistantButton context={form.title} field="Job Description" onGenerate={(val) => f('description', val)} />} />
          </div>

          <DialogFooter className="pt-6 border-t border-border mt-6">
            <Button variant="ghost" type="button" onClick={onClose} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
            <Button type="submit" className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
              {job ? 'Save Changes' : 'Post Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState(INIT)
  const [modal, setModal] = useState(null)
  
  // Standard states
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [toasts, setToasts] = useState([])
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  
  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }])

  const filteredJobs = jobs
    .filter(j => 
      j.title?.toLowerCase().includes(search.toLowerCase()) || 
      j.department?.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '')
      if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '')
      return 0
    })

  function handleSave(form) {
    if (form.id) {
      setJobs(j => j.map(x => x.id === form.id ? { ...x, ...form } : x))
    } else {
      setJobs(j => [...j, { ...form, id: Date.now(), status: 'open' }])
    }
    setModal(null)
    addToast('Job opening saved!')
  }

  async function handleBulkDelete() {
    try {
      setConfirmModal({ isOpen: false, type: 'bulk', id: null })
      setBulkDeleting(true)
      await new Promise(r => setTimeout(r, 600))
      setJobs(j => j.filter(x => !selectedIds.includes(x.id)))
      setSelectedIds([])
      addToast('Jobs deleted', 'warning')
    } catch (err) {
      addToast('Error deleting jobs: ' + err.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  function handleDelete(id) {
      setConfirmModal({ isOpen: false, type: 'single', id: null })
      setDeletingId(id)
      setTimeout(() => {
         setJobs(j => j.filter(x => x.id !== id))
         addToast('Deleted.', 'warning')
         setDeletingId(null)
      }, 300)
  }

  function handleToggleStatus(id, currentStatus) {
    setTogglingId(id)
    const newStatus = currentStatus === 'open' ? 'closed' : 'open'
    setTimeout(() => {
      setJobs(j => j.map(x => x.id === id ? { ...x, status: newStatus } : x))
      addToast('Status updated!')
      setTogglingId(null)
    }, 300)
  }

  const handleReorder = (reorderedList) => {
    setJobs(reorderedList);
    addToast('Job postings order updated');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredJobs.length) setSelectedIds([])
    else setSelectedIds(filteredJobs.map(x => x.id))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = [
    {
      key: 'title',
      label: 'Job Title',
      render: (job) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[14px] text-foreground">{job.title}</span>
          <span className="text-[11px] text-muted-foreground mt-1 truncate max-w-[250px]">
            {job.description.substring(0, 60)}...
          </span>
        </div>
      )
    },
    {
      key: 'department',
      label: 'Department',
      render: (job) => (
        <Badge variant="outline" className="bg-muted text-foreground/80 font-medium">
          {job.department}
        </Badge>
      )
    },
    {
      key: 'details',
      label: 'Details',
      render: (job) => (
        <div className="flex flex-col gap-1.5 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary/70" /> {job.location}</span>
          <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-primary/70" /> {job.type} • {job.experience}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (job) => (
        <StatusSwitch
          checked={job.status === 'open'}
          loading={togglingId === job.id}
          onCheckedChange={() => handleToggleStatus(job.id, job.status)}
          label={job.status === 'open' ? 'Open' : 'Closed'}
        />
      )
    },
    {
      key: 'actions',
      align: 'right',
      label: 'Actions',
      render: (job) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setModal(job); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Job"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: job.id }); }}
            disabled={deletingId === job.id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Job"
          >
            {deletingId === job.id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  const extraActions = (
    <Link href="/dashboard/team">
      <Button variant="outline" className="rounded-md px-4 h-9 font-medium whitespace-nowrap">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Team
      </Button>
    </Link>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Job Openings" 
        subtitle={`Manage job postings and career opportunities (${jobs.length} total)`}
        crumbs={[{ label: 'Team', href: '/dashboard/team' }, { label: 'Job Openings' }]} 
      />
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={() => setConfirmModal({ isOpen: true, type: 'bulk', id: null })}
        bulkDeleting={bulkDeleting}
        onAdd={() => setModal('new')}
        addLabel="Add Opening"
        extraActions={extraActions}
      />

      <DataTable 
        columns={columns}
        data={filteredJobs}
        loading={false}
        onRowClick={(row) => setModal(row)}
        actions={false}
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelect}
        onReorder={handleReorder}
      />

      {modal && <JobModal job={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Job" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? "Are you sure you want to delete this job posting? This action cannot be undone." 
          : `Are you sure you want to delete ${selectedIds.length} job postings? This action cannot be undone.`}
      />
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
