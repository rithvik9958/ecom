'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import DataTable from '@/components/dashboard/DataTable'
import TableToolbar from '@/components/dashboard/TableToolbar'
import Toast from '@/components/dashboard/Toast'
import { Badge } from '@/components/ui/badge'
import { Search, Activity, ExternalLink, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'
import CustomSelect from '@/components/ui/CustomSelect'

const BASE_URL = ''

export default function SeoAuditPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEntity, setFilterEntity] = useState('All')
  const [toasts, setToasts] = useState([])

  function addToast(message, type = 'success') {
    setToasts(t => [...t, { id: Date.now(), message, type }])
  }

  useEffect(() => { fetchAudit() }, [])

  async function fetchAudit() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/seo-audit`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch SEO audit')
      const result = await res.json()
      if (result.success) {
        setData(result.data)
        if (data) addToast('Audit refreshed successfully!')
      } else {
        throw new Error(result.message)
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const entities = data ? ['All', ...new Set(data.issues.map(i => i.entity))] : ['All']

  const filteredIssues = data?.issues
    .filter(i => filterEntity === 'All' || i.entity === filterEntity)
    .filter(i => 
      i.name.toLowerCase().includes(search.toLowerCase()) || 
      i.issue.toLowerCase().includes(search.toLowerCase())
    ) || []

  const columns = [
    {
      key: 'entity',
      label: 'Content Type',
      render: (row) => (
        <Badge variant="outline" className="bg-muted text-foreground/80 font-semibold uppercase text-[10px]">
          {row.entity}
        </Badge>
      )
    },
    {
      key: 'name',
      label: 'Page / Item Name',
      render: (row) => (
        <span className="font-semibold text-[14px] text-foreground">{row.name}</span>
      )
    },
    {
      key: 'issue',
      label: 'SEO Issue',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.severity === 'high' ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : row.severity === 'medium' ? (
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-blue-500" />
          )}
          <span className={`text-sm font-medium ${row.severity === 'high' ? 'text-red-600' : row.severity === 'medium' ? 'text-orange-600' : 'text-blue-600'}`}>
            {row.issue}
          </span>
        </div>
      )
    },
    {
      key: 'action',
      align: 'right',
      label: 'Action',
      render: (row) => (
        <Link 
          href={row.link} 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
        >
          Fix Now <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      )
    }
  ]

  // Calculate gauge color based on score
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-orange-500';
    return 'text-red-500';
  }
  
  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Global SEO Health" 
        subtitle="Automatically monitor your website's SEO completeness"
        crumbs={[{ label: 'Advanced Features' }, { label: 'SEO Auditor' }]} 
      />

      {loading && !data ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
        </div>
      ) : data && (
        <>
          {/* Health Score Card */}
          <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground">SEO Health Audit</h2>
              <p className="text-muted-foreground text-sm max-w-lg">
                We checked <strong>{data.totalChecks}</strong> SEO parameters across all your products, categories, and static pages. 
                There are currently <strong>{data.issuesCount}</strong> issues that need your attention to reach 100% optimization.
              </p>
              <div className="pt-4 flex items-center justify-center md:justify-start gap-4">
                <button 
                  onClick={fetchAudit} 
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
                  {loading ? 'Auditing...' : 'Re-run Audit'}
                </button>
              </div>
            </div>

            {/* Score Visual */}
            <div className="shrink-0 relative flex items-center justify-center w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-border"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className={`${getScoreColor(data.score)} drop-shadow-sm transition-all duration-1000 ease-out`}
                  strokeDasharray={`${data.score}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${getScoreColor(data.score)}`}>{data.score}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Score</span>
              </div>
            </div>
          </div>

          {/* Issues Table */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search issues or pages..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-transparent focus:border-indigo-500 focus:bg-background rounded-xl text-sm outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filter by:</span>
                <CustomSelect
                  value={filterEntity}
                  onChange={setFilterEntity}
                  size="sm"
                  fullWidth={false}
                  className="min-w-[140px]"
                  options={entities.map(m => ({ value: m, label: m }))}
                />
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="py-20 text-center border border-border bg-card rounded-3xl shadow-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xl font-bold text-foreground">Perfect SEO Health!</p>
                <p className="text-sm text-muted-foreground max-w-sm mt-2">All your pages, products, and categories are fully optimized with meta tags and canonical URLs.</p>
              </div>
            ) : (
              <DataTable 
                columns={columns} 
                data={filteredIssues} 
                actions={false} 
              />
            )}
          </div>
        </>
      )}

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
