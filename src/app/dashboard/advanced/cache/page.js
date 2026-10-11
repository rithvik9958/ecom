'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Globe, RefreshCw, Zap, Server, Trash2, Hash, FileSymlink, AlertCircle } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import Toast from '@/components/dashboard/Toast';

export default function CacheManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pathInput, setPathInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [toasts, setToasts] = useState([]);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '', // 'all' | 'redis' | 'cdn'
    target: null,
    title: '',
    message: ''
  });

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  const handleOpenConfirm = (type, target = null) => {
    let title = '';
    let message = '';
    
    if (type === 'all') {
      title = 'Purge Entire Site Cache';
      message = 'Are you sure you want to clear the entire Next.js site cache? The next visitor to any page will trigger a fresh build. Use with caution during high traffic.';
    } else if (type === 'redis') {
      title = 'Clear Redis Cache';
      message = 'Are you sure you want to clear all key-value pairs stored in the Redis instance?';
    } else if (type === 'cdn') {
      title = 'Purge CDN Edge Nodes';
      message = 'Are you sure you want to purge all Edge nodes worldwide? This will temporarily increase load on your origin server.';
    }

    setConfirmModal({
      isOpen: true,
      type,
      target,
      title,
      message
    });
  };

  const executePurge = async () => {
    const { type, target } = confirmModal;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    await purgeCache(type, target);
  };

  const purgeCache = async (type, target = null) => {
    try {
      setLoading(true);
      const res = await fetch('/api/system/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type, target })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(data.message || 'Cache purged successfully');
        if (type === 'path') setPathInput('');
        if (type === 'tag') setTagInput('');
      } else {
        addToast(data.error || 'Failed to purge cache', 'error');
      }
    } catch (err) {
      addToast('An error occurred while purging cache', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Advanced', href: '#' }, { label: 'Cache Management' }]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
             <Zap className="w-8 h-8 text-yellow-500" />
             Cache Management
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Control the caching layer of your Next.js application. Manually revalidate paths, purge data by tags, or clear the entire site cache to ensure users see the latest content.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Native Next.js Caching */}
           <div className="space-y-6">
              
              <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
                 <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <FileSymlink className="w-5 h-5 text-blue-500" />
                       Revalidate Specific Path
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">Target a specific page URL to rebuild its cache without affecting the rest of the site.</p>
                    <div className="flex gap-3">
                       <input 
                         type="text" 
                         value={pathInput}
                         onChange={(e) => setPathInput(e.target.value)}
                         placeholder="e.g. /products/steel-pipes" 
                         className="flex-1 bg-background text-foreground border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                       />
                       <Button disabled={loading || !pathInput} onClick={() => purgeCache('path', pathInput)} className="rounded-xl px-6">Revalidate</Button>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
                 <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <Hash className="w-5 h-5 text-purple-500" />
                       Revalidate Data Tag
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">Purge all pages that depend on a specific data tag (e.g., clearing 'products' updates all product pages).</p>
                    <div className="flex gap-3">
                       <input 
                         type="text" 
                         value={tagInput}
                         onChange={(e) => setTagInput(e.target.value)}
                         placeholder="e.g. products, blogs" 
                         className="flex-1 bg-background text-foreground border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                       />
                       <Button disabled={loading || !tagInput} onClick={() => purgeCache('tag', tagInput)} variant="secondary" className="rounded-xl px-6">Purge Tag</Button>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-red-500/20 shadow-sm rounded-2xl overflow-hidden bg-red-500/5">
                 <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                       <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-2">
                          <Trash2 className="w-5 h-5" /> Global Site Purge
                       </h3>
                       <p className="text-sm text-red-600/80 dark:text-red-400/80 max-w-sm">Wipe the entire Next.js cache. The next visitor to any page will trigger a fresh build. Use with caution during high traffic.</p>
                    </div>
                    <Button disabled={loading} onClick={() => handleOpenConfirm('all')} variant="destructive" className="rounded-xl px-8 font-bold whitespace-nowrap">Purge Entire Site</Button>
                 </CardContent>
              </Card>

           </div>

           {/* Third Party / Instructions */}
           <div className="space-y-6">
             
              <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
                 <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <Server className="w-5 h-5 text-orange-500" />
                       External Caching Services
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-border">
                       <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleOpenConfirm('redis')}>
                          <div>
                             <h4 className="font-bold text-foreground flex items-center gap-2"><Database className="w-4 h-4 text-rose-500" /> Redis Cache</h4>
                             <p className="text-xs text-muted-foreground mt-1">Clear key-value pairs stored in the Redis instance.</p>
                          </div>
                          <Button variant="outline" disabled={loading} className="rounded-xl shrink-0" size="sm">Clear Redis</Button>
                       </div>
                       <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleOpenConfirm('cdn')}>
                          <div>
                             <h4 className="font-bold text-foreground flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-500" /> CDN Cache (Cloudflare)</h4>
                             <p className="text-xs text-muted-foreground mt-1">Purge Edge nodes worldwide so users get fresh assets.</p>
                          </div>
                          <Button variant="outline" disabled={loading} className="rounded-xl shrink-0" size="sm">Purge Edge Nodes</Button>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="bg-blue-500/10 border-blue-500/20 shadow-sm rounded-2xl">
                 <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                       <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                       <div>
                          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Browser Caching Notes</h4>
                          <p className="text-sm text-blue-800/80 dark:text-blue-200/80 mb-3">
                             If you have purged the server cache but you or your clients still see old content, the browser might be aggressively caching assets locally.
                          </p>
                          <ul className="text-xs text-blue-800/70 dark:text-blue-200/70 space-y-1 list-disc pl-4">
                             <li><strong>Windows / Linux:</strong> Hold <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded font-mono text-[10px]">Ctrl</kbd> and press <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded font-mono text-[10px]">F5</kbd></li>
                             <li><strong>Mac:</strong> Hold <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded font-mono text-[10px]">Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded font-mono text-[10px]">Shift</kbd> and press <kbd className="px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 rounded font-mono text-[10px]">R</kbd></li>
                          </ul>
                       </div>
                    </div>
                 </CardContent>
              </Card>

           </div>
        </div>

        <ConfirmDeleteModal
          isOpen={confirmModal.isOpen}
          isDeleting={loading}
          onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={executePurge}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Confirm Purge"
          loadingText="Purging..."
        />

        <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />

      </div>
    </div>
  );
}
