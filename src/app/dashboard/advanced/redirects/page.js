'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Plus, Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';
import CustomSelect from '@/components/ui/CustomSelect';

import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';

export default function RedirectManager() {
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ from: '', to: '', type: 301 });
  const [deletingId, setDeletingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => { fetchRedirects(); }, []);

  const fetchRedirects = async () => {
    try {
      const res = await fetch('/api/system/redirects');
      const data = await res.json();
      if (data.success) setRedirects(data.data);
    } catch { addToast('Failed to load redirects', 'error'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.from.trim() || !form.to.trim()) { addToast('Both From and To paths are required', 'error'); return; }
    if (!form.from.startsWith('/')) { addToast('"From" path must start with /', 'error'); return; }
    try {
      setAdding(true);
      const res = await fetch('/api/system/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setRedirects(r => [data.data, ...r]);
        setForm({ from: '', to: '', type: 301 });
        addToast('Redirect added successfully');
      } else addToast(data.error || 'Failed to add redirect', 'error');
    } catch { addToast('Error adding redirect', 'error'); }
    finally { setAdding(false); }
  };

  const handleToggle = async (r) => {
    try {
      const res = await fetch('/api/system/redirects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r._id, from: r.from, to: r.to, type: r.type, isActive: !r.isActive }),
      });
      const data = await res.json();
      if (data.success) setRedirects(prev => prev.map(x => x._id === r._id ? data.data : x));
    } catch { addToast('Error updating redirect', 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      setConfirmModal({ isOpen: false, id: null });
      setDeletingId(id);
      const res = await fetch('/api/system/redirects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) setRedirects(prev => prev.filter(x => x._id !== id));
      else addToast('Failed to delete', 'error');
    } catch { addToast('Error deleting redirect', 'error'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Advanced', href: '#' }, { label: 'Redirect Manager' }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
            <ArrowRight className="w-8 h-8 text-blue-500" />
            Redirect Manager
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Create 301 (permanent) or 302 (temporary) redirects to preserve SEO when URLs change. Active redirects are applied via Next.js middleware on every request.
          </p>
        </div>

        {/* Add New Redirect */}
        <Card className="border border-border rounded-2xl mb-8 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-500" /> Add New Redirect</h3>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">FROM path</label>
                <input
                  type="text"
                  value={form.from}
                  onChange={e => setForm({ ...form, from: e.target.value })}
                  placeholder="/old-url-path"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 mb-2.5" />
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">TO path / URL</label>
                <input
                  type="text"
                  value={form.to}
                  onChange={e => setForm({ ...form, to: e.target.value })}
                  placeholder="/new-url-path or https://..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5 min-w-[160px]">
                <label className="text-xs font-semibold text-muted-foreground">Type</label>
                <CustomSelect
                  value={form.type}
                  onChange={val => setForm({ ...form, type: parseInt(val) })}
                  size="md"
                  options={[
                    { value: 301, label: '301 Permanent' },
                    { value: 302, label: '302 Temporary' },
                  ]}
                />
              </div>
              <Button onClick={handleAdd} disabled={adding} className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0">
                {adding ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Redirect Table */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" /></div>
        ) : redirects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ArrowRight className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No redirects yet</p>
            <p className="text-sm">Add your first redirect above to get started</p>
          </div>
        ) : (
          <Card className="border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">From</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">To</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {redirects.map(r => (
                    <tr key={r._id} className={`hover:bg-muted/20 transition-colors ${!r.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{r.from}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        <a href={r.to} target="_blank" rel="noreferrer" className="hover:text-indigo-500 flex items-center gap-1">
                          {r.to} <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={r.type === 301 ? 'success' : 'warning'}>
                          {r.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleToggle(r)} className="text-muted-foreground hover:text-foreground transition-colors">
                          {r.isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setConfirmModal({ isOpen: true, id: r._id })} disabled={deletingId === r._id} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded-lg transition-colors disabled:opacity-50" title="Delete Redirect">
                          {deletingId === r._id ? <span className="w-4 h-4 rounded-full border-2 border-destructive border-t-transparent animate-spin inline-block" /> : <Trash2 className="w-4 h-4" />}
                        </button>
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
          isDeleting={deletingId === confirmModal.id}
          onClose={() => setConfirmModal({ isOpen: false, id: null })}
          onConfirm={() => handleDelete(confirmModal.id)}
          title="Delete Redirect"
          message="Are you sure you want to delete this redirect? This cannot be undone."
        />

        <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
      </div>
    </div>
  );
}
