'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ShieldAlert, Wrench, Globe, CheckCircle2 } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';

export default function MaintenanceManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [settings, setSettings] = useState({
    isMaintenanceMode: false,
    maintenanceMessage: '',
    emergencyShutdown: false
  });

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/system/maintenance');
      const data = await res.json();
      if (data.success) {
        setSettings(data.maintenance);
      }
    } catch (error) {
      addToast('Failed to load maintenance settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/system/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        addToast('Maintenance settings updated');
      } else {
        addToast(data.error || 'Failed to update settings', 'error');
      }
    } catch (error) {
      addToast('An error occurred while saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Advanced', href: '#' }, { label: 'Maintenance Mode' }]} />
        
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
              <Wrench className="w-8 h-8 text-blue-500" />
              Maintenance Management
            </h1>
            <p className="text-muted-foreground max-w-3xl">
              Control public access to your website. Enable maintenance mode during updates, or trigger an emergency shutdown if critical issues arise. The dashboard remains accessible to admins at all times.
            </p>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="rounded-xl px-8 h-12 font-bold shadow-lg">
             {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              
              <Card className={`border shadow-sm rounded-2xl overflow-hidden transition-colors ${settings.isMaintenanceMode ? 'border-orange-500 bg-orange-500/5' : 'border-border'}`}>
                 <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                       <div className="flex gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${settings.isMaintenanceMode ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                             <Wrench className="w-6 h-6" />
                          </div>
                          <div>
                             <h3 className="text-xl font-bold text-foreground mb-1">Standard Maintenance Mode</h3>
                             <p className="text-sm text-muted-foreground mb-4">
                               Displays a friendly maintenance screen to all public visitors. Search engines will be instructed to check back later without losing your SEO ranking (HTTP 503).
                             </p>
                             
                             {settings.isMaintenanceMode && (
                               <div className="space-y-3 mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                  <label className="text-sm font-semibold">Maintenance Message (Visible to users)</label>
                                  <textarea
                                    className="w-full bg-background border border-border rounded-xl p-3 min-h-[100px] focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={settings.maintenanceMessage}
                                    onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})}
                                    placeholder="e.g. We are currently upgrading our database. We'll be back online in 2 hours."
                                  />
                               </div>
                             )}
                          </div>
                       </div>
                       <Switch 
                          checked={settings.isMaintenanceMode}
                          onCheckedChange={(c) => setSettings({...settings, isMaintenanceMode: c})}
                          className="scale-125 mt-2 data-[state=checked]:bg-orange-500"
                       />
                    </div>
                 </CardContent>
              </Card>

              <Card className={`border shadow-sm rounded-2xl overflow-hidden transition-colors ${settings.emergencyShutdown ? 'border-red-500 bg-red-500/5' : 'border-border'}`}>
                 <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                       <div className="flex gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${settings.emergencyShutdown ? 'bg-red-500 text-white animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                             <ShieldAlert className="w-6 h-6" />
                          </div>
                          <div>
                             <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-1">Emergency Shutdown</h3>
                             <p className="text-sm text-muted-foreground max-w-lg">
                               Instantly blocks all public traffic with a stark "System Offline" message. Use this only during active security breaches or critical data corruption. Overrides standard maintenance mode.
                             </p>
                          </div>
                       </div>
                       <Switch 
                          checked={settings.emergencyShutdown}
                          onCheckedChange={(c) => setSettings({...settings, emergencyShutdown: c})}
                          className="scale-125 mt-2 data-[state=checked]:bg-red-500"
                       />
                    </div>
                 </CardContent>
              </Card>

           </div>

           <div className="space-y-6">
              <Card className="border border-border shadow-sm rounded-2xl bg-card">
                 <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <Globe className="w-5 h-5 text-green-500" />
                       Current Status
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-muted-foreground">Public Website</span>
                          {settings.emergencyShutdown ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                               <ShieldAlert className="w-3.5 h-3.5" /> OFFLINE
                            </span>
                          ) : settings.isMaintenanceMode ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
                               <Wrench className="w-3.5 h-3.5" /> MAINTENANCE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                               <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
                            </span>
                          )}
                       </div>
                       <div className="flex items-center justify-between pt-4 border-t border-border">
                          <span className="text-sm font-semibold text-muted-foreground">Admin Dashboard</span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                             <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE
                          </span>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>

        <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />

      </div>
    </div>
  );
}
