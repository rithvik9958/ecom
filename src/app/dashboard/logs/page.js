'use client'
import { useState, useEffect } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock, Eye, LayoutList, Grip, ShieldCheck } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import CustomSelect from '@/components/ui/CustomSelect'

const BASE_URL = ''

// Try to parse stringified JSON in the details
function parseDetails(details) {
  if (!details) return null
  if (typeof details === 'object') return details
  try {
    return JSON.parse(details)
  } catch (e) {
    return { summary: details }
  }
}

export default function ActivityLogsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('latest')
  const [moduleFilter, setModuleFilter] = useState('All')
  const [viewMode, setViewMode] = useState('timeline') // 'table' | 'timeline'
  const [selectedLog, setSelectedLog] = useState(null)
  const [toasts, setToasts] = useState([])

  function addToast(message, type = 'success') {
    setToasts(t => [...t, { id: Date.now(), message, type }])
  }

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/logs?limit=500`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRows(data || [])
    } catch (err) {
      addToast('Could not load logs: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const modules = ['All', ...new Set(rows.map(r => r.module).filter(Boolean))]

  const filteredData = rows
    .filter(r => moduleFilter === 'All' || r.module === moduleFilter)
    .filter(r => 
        r.action?.toLowerCase().includes(search.toLowerCase()) || 
        r.module?.toLowerCase().includes(search.toLowerCase()) ||
        r.userName?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      return 0
    })

  const columns = [
    {
      key: 'action',
      label: 'Activity',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col max-w-[300px]">
            <span className="font-semibold text-[14px] text-foreground">{row.action}</span>
            <span className="text-xs text-muted-foreground mt-0.5 truncate">{row.details || '—'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'module',
      label: 'Module',
      render: (row) => (
        <Badge variant="outline" className="bg-muted text-foreground/80 font-medium">
          {row.module}
        </Badge>
      )
    },
    {
      key: 'user',
      label: 'Performed By',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-[13px]">{row.userName || 'System'}</span>
          {row.ipAddress && <span className="text-[10px] text-muted-foreground font-mono">{row.ipAddress}</span>}
        </div>
      )
    },
    {
      key: 'date',
      label: 'Timestamp',
      render: (row) => (
        <span className="text-xs font-medium text-muted-foreground">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      key: 'actions',
      align: 'right',
      label: 'Action',
      render: (row) => (
        <button 
          onClick={() => setSelectedLog(row)} 
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 transition-colors flex items-center gap-1.5 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" /> Details
        </button>
      )
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Activity Logs" 
        subtitle="Detailed audit trail of all administrative actions"
        crumbs={[{ label: 'Activity Logs' }]} 
      />
      
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <TableToolbar 
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          hideAddButton={true}
        />

        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-border">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Module:</span>
            <CustomSelect
              value={moduleFilter}
              onChange={setModuleFilter}
              size="md"
              fullWidth={false}
              className="min-w-[160px]"
              options={modules.map(m => ({ value: m, label: m }))}
            />
          </div>

          <div className="flex bg-muted/50 rounded-xl p-1 shrink-0">
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('timeline')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Timeline View"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
      ) : filteredData.length === 0 ? (
        <div className="py-20 text-center border border-border bg-card rounded-3xl shadow-sm">
          <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-bold text-foreground">No logs found</p>
          <p className="text-sm text-muted-foreground">No activities match your current filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        <DataTable columns={columns} data={filteredData} actions={false} />
      ) : (
        <div className="bg-card border border-border rounded-3xl shadow-sm p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-[39px] sm:left-[67px] w-px bg-border/80" />
          
          <div className="space-y-8 relative z-10">
            {filteredData.map((log, index) => (
              <div key={log._id || index} className="flex gap-4 sm:gap-6 group">
                {/* Timeline Node */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-12 h-12 rounded-full bg-card border-4 border-background shadow-sm flex items-center justify-center relative z-10 group-hover:border-primary/20 group-hover:scale-110 transition-all">
                    <Activity className={`w-5 h-5 ${log.action?.includes('Delete') ? 'text-red-500' : log.action?.includes('Update') ? 'text-blue-500' : 'text-green-500'}`} />
                  </div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border transition-colors rounded-2xl p-4 sm:p-5 relative mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base text-foreground">{log.action}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0">{log.module}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground/90 max-w-3xl leading-relaxed">{log.details}</p>
                    </div>
                    
                    <div className="flex flex-col sm:items-end gap-2 shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2 mt-1 bg-background border border-border px-3 py-1.5 rounded-lg shadow-sm">
                        <span className="text-xs font-bold">{log.userName || 'System'}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedLog(log)} 
                    className="absolute -bottom-3 right-6 bg-background border border-border shadow-sm rounded-full px-3 py-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                  >
                    View JSON payload
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <Dialog open={true} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Audit Log Details
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Action</p>
                  <p className="text-sm font-semibold">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Module</p>
                  <p className="text-sm font-semibold">{selectedLog.module}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Performed By</p>
                  <p className="text-sm font-semibold">{selectedLog.userName || 'System'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Timestamp</p>
                  <p className="text-sm font-semibold">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Grip className="w-4 h-4" /> Raw Payload Details
                </p>
                <div className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto border border-slate-800">
                  <pre className="text-xs font-mono leading-relaxed">
                    {JSON.stringify(parseDetails(selectedLog.details), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button onClick={() => setSelectedLog(null)} className="rounded-xl px-8">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
