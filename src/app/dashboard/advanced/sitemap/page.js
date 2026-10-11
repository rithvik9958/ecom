'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, FileText, RefreshCw, ExternalLink, Check } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';

const TABS = [
  { key: 'sitemap', label: 'Sitemap', icon: Globe },
  { key: 'robots', label: 'Robots.txt', icon: FileText },
];

export default function SitemapManager() {
  const [activeTab, setActiveTab] = useState('sitemap');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [sitemapPreview, setSitemapPreview] = useState('');
  const [loadingSitemap, setLoadingSitemap] = useState(false);
  const [robotsTxt, setRobotsTxt] = useState('');
  const [saving, setSaving] = useState(false);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetchSettings();
    fetchSitemap();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/global-settings');
      const data = await res.json();
      if (data.success) setRobotsTxt(data.data.robotsTxt || 'User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml');
    } catch { addToast('Failed to load settings', 'error'); }
    finally { setLoading(false); }
  };

  const fetchSitemap = async () => {
    try {
      setLoadingSitemap(true);
      const res = await fetch('/sitemap.xml');
      const text = await res.text();
      setSitemapPreview(text);
    } catch { setSitemapPreview('Failed to fetch sitemap'); }
    finally { setLoadingSitemap(false); }
  };

  const saveRobots = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('robotsTxt', robotsTxt);
      const res = await fetch('/api/global-settings', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) addToast('robots.txt saved successfully!');
      else addToast('Failed to save', 'error');
    } catch { addToast('Error saving', 'error'); }
    finally { setSaving(false); }
  };

  const urlCount = (sitemapPreview.match(/<url>/g) || []).length;

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-primary" /></div>;

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Advanced', href: '#' }, { label: 'Sitemap Manager' }]} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
            <Globe className="w-8 h-8 text-green-500" />
            Sitemap & Robots.txt Manager
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Control how search engines crawl and index your website. Sitemap is auto-generated from your live content.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                activeTab === key
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Sitemap Tab */}
        {activeTab === 'sitemap' && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card className="border border-border rounded-2xl shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-extrabold text-foreground">{urlCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">URLs in Sitemap</p>
                </CardContent>
              </Card>
              <Card className="border border-border rounded-2xl shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">Live</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Auto-generated</p>
                </CardContent>
              </Card>
              <div className="flex flex-col gap-2">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> View Sitemap
                </a>
                <button
                  onClick={fetchSitemap}
                  disabled={loadingSitemap}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSitemap ? 'animate-spin' : ''}`} />
                  {loadingSitemap ? 'Refreshing...' : 'Refresh Preview'}
                </button>
              </div>
            </div>

            {/* Sitemap XML Preview */}
            <Card className="border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">sitemap.xml preview</span>
                <span className="text-xs text-muted-foreground">/sitemap.xml</span>
              </div>
              <CardContent className="p-0">
                <pre className="text-xs font-mono p-4 overflow-auto max-h-[500px] text-foreground/80 whitespace-pre-wrap">
                  {loadingSitemap ? 'Loading...' : sitemapPreview}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Robots Tab */}
        {activeTab === 'robots' && (
          <div className="max-w-3xl space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-800 dark:text-blue-300">
              💡 The <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">robots.txt</code> file tells search engines which pages to crawl. The file is served live at <a href="/robots.txt" target="_blank" rel="noreferrer" className="font-semibold underline">/robots.txt</a>.
            </div>

            <Card className="border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">robots.txt</span>
                <a href="/robots.txt" target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">View Live <ExternalLink className="w-3 h-3" /></a>
              </div>
              <CardContent className="p-4">
                <textarea
                  rows={14}
                  value={robotsTxt}
                  onChange={e => setRobotsTxt(e.target.value)}
                  className="w-full font-mono text-sm bg-muted/20 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 resize-none"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveRobots} disabled={saving} className="px-8 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold">
                {saving ? 'Saving...' : <><Check className="w-4 h-4 mr-2" /> Save robots.txt</>}
              </Button>
            </div>
          </div>
        )}

        <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
      </div>
    </div>
  );
}
