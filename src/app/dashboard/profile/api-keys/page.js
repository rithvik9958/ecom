'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Check, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';
import Link from 'next/link';

const PROVIDERS = [
  {
    id: 'groq',
    key: 'groqApiKey',
    label: 'Groq',
    badge: 'PRIMARY',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    borderColor: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500',
    model: 'llama-3.3-70b-versatile',
    placeholder: 'gsk_...',
    url: 'https://console.groq.com/keys',
    description: 'Ultra-fast inference — Llama 3.3 70B. Best speed on free tier.',
    icon: '🚀',
  },
  {
    id: 'openrouter',
    key: 'openRouterApiKey',
    label: 'OpenRouter',
    badge: 'FALLBACK 1',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    borderColor: 'border-blue-500/40',
    iconBg: 'bg-blue-500',
    model: 'openrouter/free',
    placeholder: 'sk-or-v1-...',
    url: 'https://openrouter.ai/keys',
    description: 'Best free tier — OpenRouter Auto Free. Automatically selects the best available free model.',
    icon: '⚡',
  },
  {
    id: 'cerebras',
    key: 'cerebrasApiKey',
    label: 'Cerebras',
    badge: 'FALLBACK 2',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    borderColor: 'border-purple-500/40',
    iconBg: 'bg-purple-500',
    model: 'llama-3.3-70b',
    placeholder: 'csk-...',
    url: 'https://cloud.cerebras.ai',
    description: 'World-fastest AI chip — Llama 3.3 70B at incredible speed.',
    icon: '🧠',
  },
  {
    id: 'gemini',
    key: 'geminiApiKey',
    label: 'Google Gemini',
    badge: 'LEGACY',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    borderColor: 'border-orange-500/40',
    iconBg: 'bg-orange-500',
    model: 'gemini-1.5-flash',
    placeholder: 'AIzaSy...',
    url: 'https://aistudio.google.com/app/apikey',
    description: 'Google Gemini — used as last resort if others are exhausted.',
    icon: '✦',
  },
];

export default function ManageAPIKeysPage() {
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  // API Key States
  const [keys, setKeys] = useState({ openRouterApiKey: '', groqApiKey: '', cerebrasApiKey: '', geminiApiKey: '' });
  const [sequence, setSequence] = useState(['groq', 'cerebras', 'openrouter', 'gemini']);
  const [savingKeys, setSavingKeys] = useState(false);
  const [showKeys, setShowKeys] = useState({});

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/global-settings');
      const data = await res.json();
      if (data.success && data.data) {
        setKeys({
          openRouterApiKey: data.data.openRouterApiKey || '',
          groqApiKey: data.data.groqApiKey || '',
          cerebrasApiKey: data.data.cerebrasApiKey || '',
          geminiApiKey: data.data.geminiApiKey || '',
        });
        if (data.data.aiProviderSequence) {
          setSequence(data.data.aiProviderSequence.split(',').map(s => s.trim()).filter(Boolean));
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveKeys = async () => {
    try {
      setSavingKeys(true);
      const fd = new FormData();
      Object.entries(keys).forEach(([k, v]) => fd.append(k, v));
      fd.append('aiProviderSequence', sequence.join(','));

      const res = await fetch('/api/global-settings', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) addToast('AI provider keys saved successfully!');
      else addToast('Failed to save keys', 'error');
    } catch { addToast('Error saving keys', 'error'); }
    finally { setSavingKeys(false); }
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newSeq = [...sequence];
    [newSeq[index - 1], newSeq[index]] = [newSeq[index], newSeq[index - 1]];
    setSequence(newSeq);
  };

  const moveDown = (index) => {
    if (index === sequence.length - 1) return;
    const newSeq = [...sequence];
    [newSeq[index + 1], newSeq[index]] = [newSeq[index], newSeq[index + 1]];
    setSequence(newSeq);
  };

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] mx-auto w-full">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile', href: '/dashboard/profile' }, { label: 'Manage API Keys' }]} />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard/profile" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Profile
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Key className="w-8 h-8 text-indigo-500" />
              Manage AI API Keys
            </h1>
            <p className="text-muted-foreground mt-2">
              Securely configure your API keys for the multi-provider AI engine. Keys are encrypted and safely stored.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Fallback Chain Visual */}
          <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-2xl border border-border/60">
            <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-sm font-semibold text-foreground">Active Fallback Chain:</span>
            {sequence.map((id, i) => {
              const p = PROVIDERS.find(x => x.id === id);
              if (!p) return null;
              return (
                <span key={p.id} className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.badgeColor} ${!keys[p.key] ? 'opacity-50 grayscale' : ''}`}>
                    {p.icon} {p.label}
                  </span>
                  {i < sequence.length - 1 && <span className="text-muted-foreground/50 text-sm">→</span>}
                </span>
              );
            })}
          </div>

          {/* Provider Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PROVIDERS.map((provider) => {
              const isConfigured = !!keys[provider.key]?.trim();
              return (
                <Card key={provider.id} className={`border ${provider.borderColor} rounded-2xl overflow-hidden transition-shadow hover:shadow-md`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${provider.iconBg} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                          {provider.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-[15px] font-bold">{provider.label}</CardTitle>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Model: {provider.model}</p>
                        </div>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${isConfigured ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-muted-foreground/30'}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{provider.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="relative">
                      <input
                        type={showKeys[provider.id] ? 'text' : 'password'}
                        value={keys[provider.key]}
                        onChange={(e) => setKeys(k => ({ ...k, [provider.key]: e.target.value }))}
                        placeholder={provider.placeholder}
                        className="w-full bg-background border border-border/70 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 pr-16 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeys(s => ({ ...s, [provider.id]: !s[provider.id] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showKeys[provider.id] ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <a href={provider.url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 hover:underline">
                        Get free API key ↗
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Sequence & Save Card */}
          <Card className="border border-border/50 shadow-sm mt-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1 text-foreground">Provider Priority Sequence</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Reorder the providers below to define the exact fallback chain. The system will try the top provider first, then automatically fall back down the list.
                  </p>
                </div>
                
                <div className="w-full md:w-auto bg-muted/30 border border-border rounded-xl p-2 flex flex-col gap-1 min-w-[280px]">
                  {sequence.map((id, index) => {
                    const p = PROVIDERS.find(x => x.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex items-center justify-between bg-background border border-border px-3 py-2 rounded-lg text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-4">{index + 1}.</span>
                          <span className={p.badgeColor.split(' ')[1]}>{p.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 hover:bg-muted text-muted-foreground rounded disabled:opacity-30">▲</button>
                          <button onClick={() => moveDown(index)} disabled={index === sequence.length - 1} className="p-1 hover:bg-muted text-muted-foreground rounded disabled:opacity-30">▼</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex justify-end pt-6 border-t border-border/50">
                <Button
                  onClick={saveKeys}
                  disabled={savingKeys}
                  className="px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {savingKeys ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Check className="w-4 h-4 mr-2" /> Save Settings & API Keys</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Toast toasts={toasts} onRemove={id => setToasts(ts => ts.filter(x => x.id !== id))} />
    </div>
  );
}
