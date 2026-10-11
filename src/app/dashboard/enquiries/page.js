'use client'
import { useEffect, useState } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Trash2, Mail, Building, Factory, FileText, Calendar, Eye } from 'lucide-react'
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal'

const STATUS_BADGE = { 
  new: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200', 
  replied: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200', 
  closed: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200' 
}

function ViewModal({ enq, onClose, onUpdateStatus }) {
  const [status, setStatus] = useState(enq.status)

  function saveStatus(s) {
    setStatus(s)
    onUpdateStatus(enq.id, s)
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Enquiry Details
                <Badge variant="outline" className="font-mono text-xs bg-muted/50 text-muted-foreground ml-2">#{enq.id.slice(-6)}</Badge>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Received on {new Date(enq.createdAt).toLocaleDateString()} at {new Date(enq.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <a href={`mailto:${enq.email}?subject=Re: Enquiry ${enq.id} - ${enq.product}`} className="hidden sm:flex">
              <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
                <Mail className="w-4 h-4 mr-2" /> Reply by Email
              </Button>
            </a>
          </div>
        </DialogHeader>

        <div className="py-2 space-y-6">
          {/* Status Update Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 glass-panel rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground/80">Update Status:</span>
              <div className="flex items-center bg-background rounded-full p-1 border border-border shadow-sm">
                {['new', 'replied', 'closed'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => saveStatus(s)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all capitalize ${
                      status === s 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <a href={`mailto:${enq.email}?subject=Re: Enquiry ${enq.id} - ${enq.product}`} className="sm:hidden w-full">
              <Button size="sm" variant="outline" className="w-full rounded-full">
                <Mail className="w-4 h-4 mr-2" /> Reply by Email
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> Contact Information
              </h3>
              <div className="glass-panel rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Name:</span>
                  <span className="text-foreground font-semibold">{enq.contactPerson}</span>
                  
                  <span className="text-muted-foreground font-medium">Company:</span>
                  <span className="text-foreground font-semibold">{enq.companyName || '—'}</span>
                  
                  <span className="text-muted-foreground font-medium">Email:</span>
                  <a href={`mailto:${enq.email}`} className="text-blue-600 hover:underline font-medium break-all">{enq.email}</a>
                  
                  <span className="text-muted-foreground font-medium">Phone:</span>
                  <a href={`tel:${enq.contactNo}`} className="text-blue-600 hover:underline font-medium">{enq.contactNo || '—'}</a>
                </div>
              </div>
            </div>

            {/* Material Req */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5" /> Material Requirements
              </h3>
              <div className="glass-panel rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-[90px_1fr] gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">Qty:</span>
                  <span className="text-foreground font-semibold">{enq.qty || 'N/A'}</span>
                  
                  <span className="text-muted-foreground font-medium">Standard:</span>
                  <span className="text-foreground font-semibold">{enq.standard || 'N/A'}</span>
                  
                  <span className="text-muted-foreground font-medium">Grade:</span>
                  <span className="text-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{enq.grade || 'N/A'}</span>
                  
                  <span className="text-muted-foreground font-medium">Thickness:</span>
                  <span className="text-foreground font-semibold">{enq.thicknessMin || '—'} – {enq.thicknessMax || '—'} mm</span>
                  
                  <span className="text-muted-foreground font-medium">Width:</span>
                  <span className="text-foreground font-semibold">{enq.widthMin || '—'} – {enq.widthMax || '—'} mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-orange-600/80 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Special Requirements / Message
            </h3>
            <div className="glass-panel !bg-orange-50/40 dark:!bg-orange-950/20 rounded-xl p-5 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {enq.message || <span className="text-muted-foreground italic">No additional message provided.</span>}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={onClose} className="rounded-full px-6 font-medium">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [deletingId, setDeletingId] = useState(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [toasts, setToasts] = useState([])
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null })
  
  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }])

  useEffect(() => {
    fetchEnquiries()
  }, [])

  async function fetchEnquiries() {
    try {
      setLoading(true)
      const res = await fetch("/api/enquiries")
      if (!res.ok) throw new Error("Failed to fetch enquiries")
      const data = await res.json()
      // Map _id to id for existing logic
      setEnquiries(data.map(d => ({ ...d, id: d._id })))
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredData = enquiries
    .filter(e => {
      const matchSearch = e.companyName?.toLowerCase().includes(search.toLowerCase()) || 
                          e.contactPerson?.toLowerCase().includes(search.toLowerCase()) || 
                          e.id?.toLowerCase().includes(search.toLowerCase()) || 
                          e.email?.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' || e.status === filter
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if (sort === 'a-z') return (a.contactPerson || '').localeCompare(b.contactPerson || '')
      if (sort === 'z-a') return (b.contactPerson || '').localeCompare(a.contactPerson || '')
      return 0
    })

  async function handleUpdateStatus(id, status) {
    try {
        const res = await fetch(`/api/enquiries/${id}`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        })
        if (!res.ok) throw new Error("Failed to update")
        setEnquiries(e => e.map(x => x.id === id ? { ...x, status } : x))
        addToast(`Enquiry marked as ${status}`)
    } catch (err) {
        addToast(err.message, 'error')
    }
  }

  async function handleViewEnquiry(row) {
    setSelected(row);
    if (!row.isRead) {
      try {
        const res = await fetch(`/api/enquiries/${row.id}`, {
          method: 'PUT',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRead: true })
        });
        if (res.ok) {
          setEnquiries(e => e.map(x => x.id === row.id ? { ...x, isRead: true } : x));
          window.dispatchEvent(new CustomEvent('enquiryRead'));
        }
      } catch (err) {
        console.error("Failed to mark enquiry as read", err);
      }
    }
  }

  async function handleDelete(id) {
    try {
        setConfirmModal({ isOpen: false, type: 'single', id: null })
        setDeletingId(id)
        const res = await fetch(`/api/enquiries/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error("Failed to delete")
        setEnquiries(e => e.filter(x => x.id !== id))
        setSelectedIds(prev => prev.filter(x => x !== id))
        addToast('Enquiry deleted.', 'warning')
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
      await Promise.all(selectedIds.map(id => fetch(`/api/enquiries/${id}`, { method: 'DELETE' })))
      setEnquiries(e => e.filter(x => !selectedIds.includes(x.id)))
      setSelectedIds([])
      addToast('Enquiries deleted.', 'warning')
    } catch (err) {
      addToast('Error deleting some enquiries: ' + err.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) setSelectedIds([])
    else setSelectedIds(filteredData.map(x => x.id))
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const counts = { 
    new: enquiries.filter(e => e.status === 'new').length, 
    replied: enquiries.filter(e => e.status === 'replied').length, 
    closed: enquiries.filter(e => e.status === 'closed').length 
  }

  const customFilter = (
    <div className="flex items-center bg-muted/30 rounded-full p-1 border border-border h-10">
      {['all', 'new', 'replied', 'closed'].map(s => (
        <button 
          key={s} 
          onClick={() => setFilter(s)}
          className={`px-4 py-1 text-xs font-semibold rounded-full transition-all capitalize h-full flex items-center ${
            filter === s 
              ? 'bg-background shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => (
        <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{row.id.slice(-6)}</span>
      )
    },
    {
      key: 'customer',
      label: 'Customer / Company',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[14px] text-foreground">{row.contactPerson}</span>
          <span className="text-xs font-medium text-primary mt-0.5">{row.companyName || '—'}</span>
          <span className="text-[11px] text-muted-foreground mt-1 truncate max-w-[200px]">
            {row.email}
          </span>
        </div>
      )
    },
    {
      key: 'requirements',
      label: 'Requirements',
      render: (row) => (
        <div className="flex flex-col gap-1 text-[12px] text-muted-foreground">
          {row.standard && <span className="truncate max-w-[150px]"><span className="font-medium text-foreground/80">Std:</span> {row.standard}</span>}
          {row.grade && <span><span className="font-medium text-foreground/80">Grade:</span> {row.grade}</span>}
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="text-xs font-medium text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant="outline" className={`capitalize font-medium ${STATUS_BADGE[row.status] || ''}`}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      align: 'right',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleViewEnquiry(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-muted text-muted-foreground hover:text-foreground"
            title="View Enquiry Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: row.id }); }}
            disabled={deletingId === row.id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete Enquiry"
          >
            {deletingId === row.id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full relative overflow-hidden z-0">
      {/* Decorative background to make glassmorphism visible in light mode */}
      <div className="absolute top-0 left-0 w-full h-[500px] overflow-hidden -z-10 pointer-events-none opacity-60 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[80%] bg-blue-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50"></div>
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[80%] bg-orange-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50"></div>
        <div className="absolute top-[20%] left-[30%] w-[40%] h-[80%] bg-purple-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-50"></div>
      </div>

      <Breadcrumb title="Enquiry Management" crumbs={[{ label: 'Enquiries' }]} />
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="glass-panel border-0 relative overflow-hidden !bg-gradient-to-br !from-white/90 !to-slate-200/50 dark:!from-slate-800/80 dark:!to-slate-900/60 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_32px_rgba(0,0,0,0.06)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Enquiries</p>
                <p className="text-3xl font-bold text-foreground">{enquiries.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-background/60 border border-border/50 flex items-center justify-center text-foreground">
                <i className="bi bi-envelope-fill text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-panel border-0 relative overflow-hidden !bg-gradient-to-br !from-white/90 !to-slate-200/50 dark:!from-slate-800/80 dark:!to-slate-900/60 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_32px_rgba(0,0,0,0.06)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">New</p>
                <p className="text-3xl font-bold text-orange-600">{counts.new}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-background/60 border border-border/50 flex items-center justify-center text-foreground relative">
                <i className="bi bi-envelope-exclamation-fill text-2xl relative z-10"></i>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/20 opacity-20"></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0 relative overflow-hidden !bg-gradient-to-br !from-white/90 !to-slate-200/50 dark:!from-slate-800/80 dark:!to-slate-900/60 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_32px_rgba(0,0,0,0.06)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Replied</p>
                <p className="text-3xl font-bold text-green-600">{counts.replied}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-background/60 border border-border/50 flex items-center justify-center text-foreground">
                <i className="bi bi-envelope-check-fill text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-0 relative overflow-hidden !bg-gradient-to-br !from-white/90 !to-slate-200/50 dark:!from-slate-800/80 dark:!to-slate-900/60 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_32px_rgba(0,0,0,0.06)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Closed</p>
                <p className="text-3xl font-bold text-zinc-600">{counts.closed}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-background/60 border border-border/50 flex items-center justify-center text-foreground">
                <i className="bi bi-archive-fill text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={() => setConfirmModal({ isOpen: true, type: 'bulk', id: null })}
        bulkDeleting={bulkDeleting}
        extraFilters={customFilter}
        extraActions={
          <Button 
            variant="outline" 
            onClick={() => window.open('/api/enquiries/export', '_blank')}
            className="rounded-full px-4 h-10 font-medium whitespace-nowrap bg-background text-foreground border-border hover:bg-muted transition-colors"
          >
            <FileText className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      <DataTable 
        columns={columns}
        data={filteredData}
        loading={loading}
        onRowClick={handleViewEnquiry}
        actions={false}
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelect}
      />

      {selected && (
        <ViewModal
          enq={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={(id, s) => { handleUpdateStatus(id, s); setSelected(prev => ({ ...prev, status: s })) }}
        />
      )}
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Enquiry" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? "Are you sure you want to delete this enquiry? This action cannot be undone." 
          : `Are you sure you want to delete ${selectedIds.length} enquiries? This action cannot be undone.`}
      />
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
