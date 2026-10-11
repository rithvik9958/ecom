'use client'
import { useState, useEffect } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import Toast from '@/components/dashboard/Toast'
import { FloatingInput } from '@/components/ui/floating-input'
import { Button } from '@/components/ui/button'
import { ShieldCheck, X } from 'lucide-react'

const BASE_URL = ''

export default function SecurityPage() {
  const [settings, setSettings] = useState({
    blockedIps: [],
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    rateLimitRequests: 100,
    rateLimitWindowMs: 60000,
  })
  
  const [ipInput, setIpInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState([])

  function addToast(message, type = 'success') {
    setToasts(t => [...t, { id: Date.now(), message, type }])
  }

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const res = await fetch(`${BASE_URL}/api/security`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.data) {
        setSettings(json.data)
      }
    } catch (err) {
      addToast('Could not load settings: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddIp = () => {
    if (!ipInput.trim()) return
    if (settings.blockedIps.includes(ipInput.trim())) {
        addToast('IP is already blocked', 'error')
        return
    }
    setSettings(s => ({ ...s, blockedIps: [...s.blockedIps, ipInput.trim()] }))
    setIpInput('')
  }

  const handleRemoveIp = (ip) => {
    setSettings(s => ({ ...s, blockedIps: s.blockedIps.filter(x => x !== ip) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch(`${BASE_URL}/api/security`, {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Save failed')
      addToast('Security settings updated successfully!')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Security Settings" 
        subtitle="Manage IP blocking, rate limits, and login protections"
        crumbs={[{ label: 'Security' }]} 
      />

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
        
        {/* Login Protections */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Login Protection</h3>
                    <p className="text-xs text-muted-foreground">Protect admin accounts from brute force attacks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput 
                    label="Max Login Attempts" 
                    type="number"
                    value={settings.maxLoginAttempts} 
                    onChange={e => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })} 
                />
                <FloatingInput 
                    label="Lockout Duration (Minutes)" 
                    type="number"
                    value={settings.lockoutDurationMinutes} 
                    onChange={e => setSettings({ ...settings, lockoutDurationMinutes: parseInt(e.target.value) || 15 })} 
                />
            </div>
        </div>

        {/* IP Blocking */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-1">IP Blocking</h3>
            <p className="text-xs text-muted-foreground mb-6">Manually block specific IP addresses from accessing the API.</p>

            <div className="flex gap-4 mb-4">
                <input 
                    type="text" 
                    className="flex h-11 w-full rounded-xl border border-input/60 bg-background px-4 text-sm" 
                    placeholder="Enter IP Address (e.g. 192.168.1.1)"
                    value={ipInput}
                    onChange={e => setIpInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddIp())}
                />
                <Button type="button" onClick={handleAddIp} className="h-11 rounded-xl px-6">Block</Button>
            </div>

            {settings.blockedIps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {settings.blockedIps.map(ip => (
                        <div key={ip} className="flex items-center gap-2 bg-red-500/10 text-red-600 px-3 py-1.5 rounded-full text-sm font-medium border border-red-500/20">
                            {ip}
                            <button type="button" onClick={() => handleRemoveIp(ip)} className="hover:bg-red-500/20 rounded-full p-0.5"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground italic">No IPs are currently blocked.</p>
            )}
        </div>

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving} className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
                {saving ? 'Saving...' : 'Save Security Settings'}
            </Button>
        </div>
      </form>

      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  )
}
