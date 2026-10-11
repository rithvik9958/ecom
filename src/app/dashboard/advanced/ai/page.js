'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Key, FileText, Search, Languages, MessageSquare, Copy, Check, Zap, ChevronDown } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';
import CustomSelect from '@/components/ui/CustomSelect';

const PROVIDERS = [
  {
    id: 'openrouter',
    key: 'openRouterApiKey',
    label: 'OpenRouter',
    badge: 'PRIMARY',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    borderColor: 'border-emerald-500/40',
    iconBg: 'bg-emerald-500',
    model: 'openrouter/free',
    placeholder: 'sk-or-v1-...',
    url: 'https://openrouter.ai/keys',
    description: 'Best free tier — OpenRouter Auto Free. Automatically selects the best available free model.',
    icon: '⚡',
  },
  {
    id: 'groq',
    key: 'groqApiKey',
    label: 'Groq',
    badge: 'FALLBACK 1',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    borderColor: 'border-blue-500/40',
    iconBg: 'bg-blue-500',
    model: 'llama-3.3-70b-versatile',
    placeholder: 'gsk_...',
    url: 'https://console.groq.com/keys',
    description: 'Ultra-fast inference — Llama 3.3 70B. Best speed on free tier.',
    icon: '🚀',
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

export default function AIFeaturesManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // API Key States
  const [keys, setKeys] = useState({ openRouterApiKey: '', groqApiKey: '', cerebrasApiKey: '', geminiApiKey: '' });
  const [preferredProvider, setPreferredProvider] = useState('auto');
  const [savingKeys, setSavingKeys] = useState(false);
  const [showKeys, setShowKeys] = useState({});

  // AI Tool States
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [result, setResult] = useState('');
  const [usedProvider, setUsedProvider] = useState('');
  const [copied, setCopied] = useState(false);

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
        setPreferredProvider(data.data.preferredAiProvider || 'auto');
        // Note: do NOT auto-switch tabs — let user stay on setup to see saved keys
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveKeys = async () => {
    try {
      setSavingKeys(true);
      const fd = new FormData();
      Object.entries(keys).forEach(([k, v]) => fd.append(k, v));
      fd.append('preferredAiProvider', preferredProvider);

      const res = await fetch('/api/global-settings', { method: 'PUT', body: fd });
      const data = await res.json();
      if (data.success) addToast('AI provider keys saved successfully!');
      else addToast('Failed to save keys', 'error');
    } catch { addToast('Error saving keys', 'error'); }
    finally { setSavingKeys(false); }
  };

  const generateAIContent = async (taskType) => {
    if (!prompt.trim()) { addToast('Please enter a prompt', 'error'); return; }
    try {
      setIsGenerating(true);
      setResult('');
      setUsedProvider('');

      const res = await fetch('/api/system/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ prompt, taskType, extraContext })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.text);
        setUsedProvider(data.provider || '');
        addToast(`Generated via ${data.provider || 'AI'}!`);
      } else {
        addToast(data.error || 'AI generation failed', 'error');
      }
    } catch { addToast('Server error occurred', 'error'); }
    finally { setIsGenerating(false); }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const configuredCount = Object.values(keys).filter(v => v?.trim()).length;

  const renderToolInterface = (taskType, title, description, promptLabel, contextLabel, contextOptions) => (
    <Card className="border border-indigo-500/30 shadow-lg rounded-2xl overflow-hidden mt-6">
      <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-border/50">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {contextLabel && contextOptions && (
              <div>
                <label className="block text-sm font-semibold mb-2">{contextLabel}</label>
                <CustomSelect
                  value={extraContext}
                  onChange={setExtraContext}
                  options={contextOptions}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-2">{promptLabel}</label>
              <textarea
                rows={6}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 resize-none text-sm"
                placeholder="Enter your text or topic here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Button
              onClick={() => generateAIContent(taskType)}
              disabled={isGenerating || !prompt}
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> Generate Content</span>
              )}
            </Button>
          </div>

          <div className="flex flex-col h-full relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                Output Result
                {usedProvider && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    via {usedProvider}
                  </span>
                )}
              </label>
              {result && (
                <button onClick={copyToClipboard} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <div className="flex-1 min-h-[250px] w-full bg-muted/30 border border-border rounded-xl p-4 overflow-y-auto whitespace-pre-wrap font-sans text-sm">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
                  <Sparkles className="w-8 h-8 animate-pulse text-indigo-400" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              ) : result ? (
                <div dangerouslySetInnerHTML={{ __html: result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground opacity-50">
                  Results will appear here
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-full flex flex-col bg-background">
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Advanced', href: '#' }, { label: 'AI Features' }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-500" />
            AI Features Management
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Multi-provider AI engine with automatic fallback. Uses the best available free provider — if one runs out of quota, it instantly switches to the next.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-border pb-2">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'content', label: 'Content Generator', icon: FileText },
              { key: 'seo', label: 'SEO Optimizer', icon: Search },
              { key: 'translate', label: 'Translator', icon: Languages },
              { key: 'grammar', label: 'Grammar & Tone', icon: MessageSquare },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setResult(''); setPrompt(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                  activeTab === key ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          
          <a href="/dashboard/profile/api-keys" className="px-4 py-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors border border-border">
            <Key className="w-4 h-4" /> Manage API Keys Securely
          </a>
        </div>

        {/* ── Content Tab ── */}
        {activeTab === 'content' && renderToolInterface('generate_content', 'AI Content Generator', 'Give the AI a topic and it will write a complete blog post, email, or description for you.', 'What would you like to write about?', null, null)}
        {activeTab === 'seo' && renderToolInterface('seo_optimize', 'SEO Meta Optimizer', 'Paste your page content or target topic and get an optimized Title, Description, and Keywords.', 'Page Content or Target Topic', null, null)}
        {activeTab === 'translate' && renderToolInterface('translate', 'AI Translator', 'Instantly translate your text into another language with high contextual accuracy.', 'Text to Translate', 'Target Language', [
          { value: 'Spanish', label: 'Spanish' },
          { value: 'French', label: 'French' },
          { value: 'German', label: 'German' },
          { value: 'Hindi', label: 'Hindi' },
          { value: 'Arabic', label: 'Arabic' },
          { value: 'Chinese', label: 'Chinese (Simplified)' },
        ])}
        {activeTab === 'grammar' && renderToolInterface('grammar_tone', 'Grammar & Tone Checker', "Paste your draft and let the AI fix grammatical errors and adjust the tone of voice.", 'Your Draft Text', 'Desired Tone', [
          { value: 'Professional', label: 'Professional / Corporate' },
          { value: 'Casual', label: 'Casual / Friendly' },
          { value: 'Persuasive', label: 'Persuasive / Sales' },
          { value: 'Academic', label: 'Academic / Formal' },
        ])}

        <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
      </div>
    </div>
  );
}
