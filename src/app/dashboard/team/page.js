'use client'
import AIAssistantButton from '@/components/dashboard/AIAssistantButton'
import { useState } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import RichEditor from '@/components/dashboard/RichEditor'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-input'
import { Edit2, Trash2, Plus, Briefcase, Mail, Phone } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'
import StatusSwitch from '@/components/dashboard/StatusSwitch'

const DEPTS = ['Management', 'Operations', 'Quality', 'HR', 'Sales', 'Finance', 'R&D', 'Maintenance']
const INIT = [
  { id: 1, name: 'Rajesh Kumar Gupta', designation: 'Managing Director', department: 'Management', email: 'rajesh@jindalmetal.com', phone: '+91 98765 00001', bio: '<p>Leading Jindal Metals for over 20 years with a strong focus on quality and global expansion.</p>', photo: '', status: 'active', sort: 1 },
  { id: 2, name: 'Sunita Sharma', designation: 'GM — Operations', department: 'Operations', email: 'sunita@jindalmetal.com', phone: '+91 98765 00002', bio: '<p>Oversees all plant operations and ensures production targets are consistently met.</p>', photo: '', status: 'active', sort: 2 },
  { id: 3, name: 'Amit Verma', designation: 'Head — Quality', department: 'Quality', email: 'amit@jindalmetal.com', phone: '+91 98765 00003', bio: '<p>Responsible for maintaining QEHS standards and all national and international certifications.</p>', photo: '', status: 'active', sort: 3 },
  { id: 4, name: 'Pooja Singh', designation: 'HR Manager', department: 'HR', email: 'pooja@jindalmetal.com', phone: '+91 98765 00004', bio: '<p>Manages recruitment, training programs, and employee welfare initiatives.</p>', photo: '', status: 'active', sort: 4 },
  { id: 5, name: 'Deepak Joshi', designation: 'Sales Manager', department: 'Sales', email: 'deepak@jindalmetal.com', phone: '+91 98765 00005', bio: '<p>Handles domestic and international sales, export enquiries, and key account management.</p>', photo: '', status: 'active', sort: 5 },
]

function MemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState(member || { name: '', designation: '', department: 'Management', email: '', phone: '', bio: '', photo: '', sort: '' })
  const [tab, setTab] = useState('basic')
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{member ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          <p className="text-muted-foreground text-sm">Fill out the information below to {member ? 'update' : 'create'} this team profile.</p>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-6 mt-2">
          
          <div className="flex flex-wrap gap-2 border-b border-border px-2 pb-3">
            {[['basic', 'Basic Info'], ['bio', 'Bio / Profile'], ['media', 'Photo']].map(([key, label]) => (
              <button key={key} type="button" onClick={() => setTab(key)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tab === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>


          <div className="py-2 space-y-6">
            {tab === 'basic' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput label="Full Name *" required value={form.name} onChange={e => f('name', e.target.value)} />
                  <FloatingInput label="Designation *" required value={form.designation} onChange={e => f('designation', e.target.value)} rightElement={<AIAssistantButton context={form.name || 'Team Member'} field="Professional Job Title" onGenerate={(val) => f('designation', val)} />} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingSelect label="Department" value={form.department} onChange={e => f('department', e.target.value)}>
                    {DEPTS.map(d => <option key={d}>{d}</option>)}
                  </FloatingSelect>
                  <FloatingInput type="email" label="Email" value={form.email} onChange={e => f('email', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FloatingInput label="Phone" value={form.phone} onChange={e => f('phone', e.target.value)} />
                  <FloatingInput type="number" min="1" label="Sort Order" value={form.sort} onChange={e => f('sort', e.target.value)} />
                </div>
              </div>
            )}
            
            {tab === 'bio' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-foreground/80 block">Bio / Profile</label>
                  <AIAssistantButton context={form.name} field="Professional team member bio" onGenerate={(val) => f('bio', val)} />
                </div>
                <div className="border border-input/60 rounded-xl overflow-hidden shadow-sm">
                  <RichEditor value={form.bio} onChange={v => f('bio', v)} placeholder="Write a short professional bio..." minHeight={220} />
                </div>
              </div>
            )}
            
            {tab === 'media' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border border-input/60 rounded-xl p-6 bg-muted/10">
                  <label className="text-sm font-semibold text-foreground/80 mb-1 block">Profile Photo</label>
                  <p className="text-[11px] text-muted-foreground mb-3">Square image recommended, min 300×300px</p>
                  <input type="file" accept="image/*" onChange={e => { if (e.target.files[0]) f('photo', URL.createObjectURL(e.target.files[0])) }} className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 py-2 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary cursor-pointer hover:border-input" />
                  {form.photo && (
                    <img src={form.photo} alt="preview" className="mt-4 w-24 h-24 rounded-full border-4 border-white shadow-md object-cover" />
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6 border-t border-border mt-6">
            <Button variant="ghost" type="button" onClick={onClose} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
            <Button type="submit" className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
              {member ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function TeamPage() {
  const [members, setMembers] = useState(INIT)
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
  const stripHtml = html => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

  function handleSave(form) {
    if (form.id) {
      setMembers(m => m.map(x => x.id === form.id ? { ...x, ...form } : x))
    } else {
      setMembers(m => [...m, { ...form, id: Date.now(), status: 'active', sort: members.length + 1 }])
    }
    setModal(null)
    addToast('Team member saved!')
  }

  async function handleBulkDelete() {
    try {
      setConfirmModal({ isOpen: false, type: 'bulk', id: null })
      setBulkDeleting(true)
      await new Promise(r => setTimeout(r, 600))
      setMembers(m => m.filter(x => !selectedIds.includes(x.id)))
      setSelectedIds([])
      addToast('Members deleted', 'warning')
    } catch (err) {
      addToast('Error deleting members: ' + err.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  function handleDelete(id) {
    setConfirmModal({ isOpen: false, type: 'single', id: null })
    setDeletingId(id)
    setTimeout(() => {
      setMembers(x => x.filter(r => r.id !== id))
      addToast('Removed.', 'warning')
      setDeletingId(null)
    }, 300)
  }

  function handleToggleStatus(id, currentStatus) {
    setTogglingId(id)
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setTimeout(() => {
      setMembers(m => m.map(x => x.id === id ? { ...x, status: newStatus } : x))
      addToast('Status updated!')
      setTogglingId(null)
    }, 300)
  }

  const handleReorder = (reorderedList) => {
    const updated = reorderedList.map((item, idx) => ({ ...item, sort: idx + 1 }));
    setMembers(updated);
    addToast('Team member order updated');
  };

  const filteredMembers = members
    .filter(m => 
      m.name?.toLowerCase().includes(search.toLowerCase()) || 
      m.designation?.toLowerCase().includes(search.toLowerCase()) ||
      m.department?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'a-z') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'z-a') return (b.name || '').localeCompare(a.name || '')
      return (a.sort || 0) - (b.sort || 0)
    })

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMembers.length) setSelectedIds([])
    else setSelectedIds(filteredMembers.map(x => x.id))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = [
    {
      key: 'photo',
      label: 'Photo',
      render: (m) => (
        <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center overflow-hidden bg-primary/10 text-primary font-bold shadow-sm">
          {m.photo ? (
            <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
          ) : (
            <span>{m.name.charAt(0)}</span>
          )}
        </div>
      )
    },
    {
      key: 'details',
      label: 'Member Details',
      render: (m) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[14px] text-foreground">{m.name}</span>
          <span className="text-xs font-medium text-primary mt-0.5">{m.designation}</span>
          <span className="text-[11px] text-muted-foreground mt-1 truncate max-w-[200px]">
            {stripHtml(m.bio).substring(0, 55)}…
          </span>
        </div>
      )
    },
    {
      key: 'department',
      label: 'Department',
      render: (m) => (
        <Badge variant="outline" className="bg-muted text-foreground/80 font-medium">
          {m.department}
        </Badge>
      )
    },
    {
      key: 'contact',
      label: 'Contact Info',
      render: (m) => (
        <div className="flex flex-col gap-1.5 text-[12px] text-muted-foreground">
          {m.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {m.email}</span>}
          {m.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {m.phone}</span>}
        </div>
      )
    },
    {
      key: 'sort',
      label: 'Sort',
      render: (m) => (
        <span className="font-medium text-muted-foreground text-sm">{m.sort}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (m) => (
        <StatusSwitch
          checked={m.status === 'active'}
          loading={togglingId === m.id}
          onCheckedChange={() => handleToggleStatus(m.id, m.status)}
          label={m.status === 'active' ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      key: 'actions',
      align: 'right',
      label: 'Actions',
      render: (m) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setModal(m); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Member"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: m.id }); }}
            disabled={deletingId === m.id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Member"
          >
            {deletingId === m.id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  const extraActions = (
    <Link href="/dashboard/team/jobs">
      <Button variant="outline" className="rounded-full px-4 h-10 font-medium whitespace-nowrap">
        <Briefcase className="w-4 h-4 mr-1.5" /> Job Openings
      </Button>
    </Link>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Team Management" 
        subtitle={`Manage your team members and profiles (${members.length} total)`} 
        crumbs={[{ label: 'Team Management' }]} 
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
        addLabel="Add Member"
        extraActions={extraActions}
      />

      <DataTable 
        columns={columns}
        data={filteredMembers}
        loading={false}
        onRowClick={(row) => setModal(row)}
        actions={false}
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelect}
        onReorder={handleReorder}
      />

      {modal && <MemberModal member={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Remove Member" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? "Are you sure you want to remove this team member? This action cannot be undone." 
          : `Are you sure you want to remove ${selectedIds.length} members? This action cannot be undone.`}
      />
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
