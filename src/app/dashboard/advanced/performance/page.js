'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Database, Cpu, MemoryStick, Clock, RefreshCw, Server } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';

function StatCard({ icon: Icon, label, value, sub, color = 'blue', bar, barColor }) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };
  return (
    <Card className="border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {sub && <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{sub}</span>}
        </div>
        <p className="text-2xl font-extrabold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {bar !== undefined && (
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all ${barColor || 'bg-blue-500'}`} style={{ width: `${Math.min(bar, 100)}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{bar}% used</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function PerformanceMonitor() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchHealth = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    const minWait = new Promise(r => setTimeout(r, 600));
    try {
      const [res] = await Promise.all([fetch('/api/system/health'), silent ? Promise.resolve() : minWait]);
      const data = await res.json();
      if (data.status === 'OK' || data.success) {
        // Normalize the existing health endpoint format
        setHealth(data);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error('Health check failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(true), 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const parseMemMB = (str) => parseFloat(str?.replace(' MB', '') || 0);

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Advanced', href: '#' }, { label: 'Performance Monitor' }]} />

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-500" />
              Performance Monitor
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Live server health dashboard. Auto-refreshes every 30 seconds.
              {lastRefresh && <span className="text-xs ml-2">Last updated: {lastRefresh.toLocaleTimeString()}</span>}
            </p>
          </div>
          <button
            onClick={() => fetchHealth()}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors disabled:opacity-60 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-purple-500" />
          </div>
        ) : !health ? (
          <div className="text-center py-16 text-muted-foreground">Failed to load health data.</div>
        ) : (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${health.status === 'OK' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700'}`}>
              <div className={`w-3 h-3 rounded-full animate-pulse ${health.status === 'OK' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-bold">{health.status === 'OK' ? '✅ All systems operational' : '❌ System issue detected'}</span>
              <span className="text-xs opacity-70 ml-auto">{health.timestamp}</span>
            </div>

            {/* Grid Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard icon={Database} label="Database Status" value={health.database?.status || '—'} color={health.database?.status === 'Connected' ? 'green' : 'red'} sub={`${health.database?.latencyMs ?? 0}ms`} />
              <StatCard icon={Clock} label="Server Uptime" value={formatUptime(health.uptimeSeconds || 0)} color="blue" />
              <StatCard icon={Server} label="Environment" value={health.environment || '—'} color="purple" />
              <StatCard icon={Cpu} label="Node.js" value={process?.version || 'N/A'} color="orange" />
            </div>

            {/* Memory */}
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                <MemoryStick className="w-4 h-4 text-muted-foreground" /> Memory Usage
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={MemoryStick} label="Heap Used" value={health.memory?.heapUsed} color="blue" />
                <StatCard icon={MemoryStick} label="Heap Total" value={health.memory?.heapTotal} color="purple" />
                <StatCard icon={MemoryStick} label="RSS (Process)" value={health.memory?.rss} color="orange" />
                <StatCard icon={MemoryStick} label="External (V8)" value={health.memory?.external} color="green" />
              </div>
            </div>

            {/* Raw JSON debug */}
            <div>
              <details className="group">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground font-semibold">
                  Show raw health data
                </summary>
                <pre className="mt-2 text-xs font-mono bg-muted/30 border border-border rounded-xl p-4 overflow-auto max-h-60">
                  {JSON.stringify(health, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
