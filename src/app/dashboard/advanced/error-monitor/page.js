'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';
import Link from 'next/link';

import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';

export default function ErrorMonitor() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [total, setTotal] = useState(0);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null });

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  const fetchLogs = async () => {
    setLoading(true);
    const minWait = new Promise(r => setTimeout(r, 600));
    try {
      const [res] = await Promise.all([fetch('/api/system/errors?limit=100'), minWait]);
      const data = await res.json();
      if (data.success) { setLogs(data.data); setTotal(data.total); }
    } catch { addToast('Failed to load logs', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const markResolved = async (id) => {
    try {
      const res = await fetch('/api/system/errors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolved: true }),
      });
      const data = await res.json();
      if (data.success) setLogs(prev => prev.map(l => l._id === id ? { ...l, resolved: true } : l));
    } catch { addToast('Error updating log', 'error'); }
  };

  const deleteLog = async (id) => {
    try {
      setConfirmModal({ isOpen: false, type: 'single', id: null });
      setDeletingId(id);
      const res = await fetch('/api/system/errors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) { setLogs(prev => prev.filter(l => l._id !== id)); setTotal(t => t - 1); }
    } catch { addToast('Error deleting log', 'error'); }
    finally { setDeletingId(null); }
  };

  const clearAll = async () => {
    try {
      setConfirmModal({ isOpen: false, type: 'clear', id: null });
      setClearing(true);
      await fetch('/api/system/errors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      setLogs([]); setTotal(0);
      addToast('All logs cleared');
    } catch { addToast('Failed to clear', 'error'); }
    finally { setClearing(false); }
  };

  const unresolvedCount = logs.filter(l => !l.resolved).length;

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Advanced', href: '#' }, { label: 'Error Monitor' }]} />

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              Error & 404 Monitor
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Track all 404 broken links and errors on your public website. Fix them by adding redirects.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchLogs} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-70">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            {logs.length > 0 && (
              <button onClick={() => setConfirmModal({ isOpen: true, type: 'clear', id: null })} disabled={clearing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                <Trash2 className="w-4 h-4" /> {clearing ? 'Clearing...' : 'Clear All'}
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border border-border rounded-2xl shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-extrabold text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Logged Errors</p>
            </CardContent>
          </Card>
          <Card className="border border-red-200 dark:border-red-800 rounded-2xl shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">{unresolvedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Unresolved</p>
            </CardContent>
          </Card>
          <Card className="border border-green-200 dark:border-green-800 rounded-2xl shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400">{total - unresolvedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-20 text-green-500" />
            <p className="text-lg font-medium">No errors logged</p>
            <p className="text-sm">Errors will appear here automatically when visitors hit broken links</p>
          </div>
        ) : (
          <Card className="border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Path</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Referrer</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Time</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map(log => (
                    <tr key={log._id} className={`hover:bg-muted/20 transition-colors ${log.resolved ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-destructive max-w-[200px] truncate">{log.path}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{log.referrer || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="destructive">
                          {log.statusCode}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {log.resolved ? (
                          <Badge variant="success">Resolved</Badge>
                        ) : (
                          <Badge variant="warning">Open</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {!log.resolved && (
                            <button title="Mark resolved" onClick={() => markResolved(log._id)} className="p-1.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/15 rounded-lg transition-colors">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            href={`/dashboard/advanced/redirects?from=${encodeURIComponent(log.path)}`}
                            title="Create redirect for this path"
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/15 rounded-lg transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                          <button title="Delete log" onClick={() => setConfirmModal({ isOpen: true, type: 'single', id: log._id })} disabled={deletingId === log._id} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded-lg transition-colors disabled:opacity-50">
                            {deletingId === log._id ? <span className="w-4 h-4 rounded-full border-2 border-destructive border-t-transparent animate-spin inline-block" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <ConfirmDeleteModal
          isOpen={confirmModal.isOpen}
          isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : clearing}
          onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null })}
          onConfirm={() => confirmModal.type === 'single' ? deleteLog(confirmModal.id) : clearAll()}
          title={confirmModal.type === 'single' ? "Delete Log Entry" : "Clear All Logs"}
          message={confirmModal.type === 'single'
            ? "Are you sure you want to delete this log entry? This cannot be undone."
            : "Are you sure you want to clear all error logs? This cannot be undone."}
        />

        <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
      </div>
    </div>
  );
}
