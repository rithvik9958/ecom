'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, DownloadCloud, Clock, HardDrive, History, FileJson, AlertCircle } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';

export default function BackupManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/system/backup');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadManualBackup = async () => {
    try {
      setLoading(true);
      addToast('Preparing database dump... This may take a moment', 'default');
      
      const res = await fetch('/api/system/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await res.json();
      
      if (result.success) {
        // Trigger download in browser
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        addToast(`Backup completed successfully! (${result.totalDocs} documents exported)`);
        fetchLogs(); // Refresh history
      } else {
        addToast(result.error || 'Failed to generate backup', 'error');
      }
    } catch (error) {
      addToast('An error occurred during backup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Advanced', href: '#' }, { label: 'Backup Management' }]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-500" />
            Database Backups
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Protect your data. Generate full snapshots of your MongoDB database in JSON format. Schedule automated backups or trigger them manually before major content updates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Primary Actions */}
           <div className="lg:col-span-2 space-y-6">
              
              <Card className="border border-blue-500/20 shadow-lg rounded-2xl overflow-hidden bg-blue-500/5 relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                 <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                       <div>
                          <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
                             <DownloadCloud className="w-6 h-6 text-blue-500" /> 
                             Manual Backup
                          </h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Instantly export all collections across the entire platform. The data will be compiled into a single JSON snapshot and downloaded to your machine.
                          </p>
                       </div>
                       <Button 
                         onClick={downloadManualBackup} 
                         disabled={loading} 
                         className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20 whitespace-nowrap bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95"
                       >
                         {loading ? 'Generating Dump...' : 'Export JSON Backup'}
                       </Button>
                    </div>
                 </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="border border-border shadow-sm rounded-2xl overflow-hidden opacity-75">
                   <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                         <Clock className="w-5 h-5 text-indigo-500" />
                         Scheduled Backups
                      </CardTitle>
                      <CardDescription>Automated cloud syncs (Coming Soon)</CardDescription>
                   </CardHeader>
                   <CardContent className="p-6">
                      <div className="space-y-4">
                         <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                           <span className="text-sm font-medium">Daily Sync</span>
                           <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">00:00 UTC</span>
                         </div>
                         <Button variant="outline" className="w-full rounded-xl" disabled>Configure Schedule</Button>
                      </div>
                   </CardContent>
                </Card>

                <Card className="border border-border shadow-sm rounded-2xl overflow-hidden opacity-75">
                   <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                         <HardDrive className="w-5 h-5 text-emerald-500" />
                         Restore Data
                      </CardTitle>
                      <CardDescription>Upload a JSON snapshot to restore (Coming Soon)</CardDescription>
                   </CardHeader>
                   <CardContent className="p-6">
                      <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2">
                         <FileJson className="w-8 h-8 text-muted-foreground opacity-50" />
                         <span className="text-sm text-muted-foreground">Drag & drop JSON file</span>
                      </div>
                   </CardContent>
                </Card>
              </div>

           </div>

           {/* Sidebar / History */}
           <div className="space-y-6">
              <Card className="border border-border shadow-sm rounded-2xl h-full flex flex-col">
                 <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <History className="w-5 h-5 text-foreground" />
                       Backup History
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0 flex-1 overflow-auto max-h-[600px]">
                    {logs.length === 0 ? (
                       <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                          <AlertCircle className="w-8 h-8 opacity-20" />
                          No backups generated yet.
                       </div>
                    ) : (
                       <div className="divide-y divide-border">
                          {logs.map(log => (
                             <div key={log._id} className="p-5 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                   <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                      <span className="font-semibold text-sm truncate max-w-[150px]">{log.fileName}</span>
                                   </div>
                                   <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                     {formatBytes(log.sizeBytes)}
                                   </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                   <span>{new Date(log.createdAt).toLocaleString()}</span>
                                   <span className="capitalize border border-border/50 rounded-full px-2">{log.type}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </CardContent>
              </Card>
           </div>
        </div>

        <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />

      </div>
    </div>
  );
}
