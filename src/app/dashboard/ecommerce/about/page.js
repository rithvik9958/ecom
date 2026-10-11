'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input';
import CustomSelect from '@/components/ui/CustomSelect';
import {
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Award,
  Leaf,
  Clock,
  Heart,
  ShieldCheck,
  Truck,
  Gift,
  Users,
  FileText,
  Target,
  Search,
  Upload,
  Code
} from 'lucide-react';
import AIAssistantButton from '@/components/dashboard/AIAssistantButton';
import { DEFAULT_ECOM_ABOUT } from '@/lib/defaultAbout';

const RichEditor = dynamic(() => import('@/components/dashboard/RichEditor'), { ssr: false });

const AVAILABLE_ICONS = [
  { name: 'Leaf', label: 'Leaf (Nature / Eco)', icon: Leaf },
  { name: 'Award', label: 'Award (Quality / Mastercraft)', icon: Award },
  { name: 'Clock', label: 'Clock (Speed / 2-Hour Delivery)', icon: Clock },
  { name: 'Heart', label: 'Heart (Care / Emotion)', icon: Heart },
  { name: 'ShieldCheck', label: 'ShieldCheck (Trust / Security)', icon: ShieldCheck },
  { name: 'Sparkles', label: 'Sparkles (Magic / Luxury)', icon: Sparkles },
  { name: 'Truck', label: 'Truck (Logistics / Express)', icon: Truck },
  { name: 'Gift', label: 'Gift (Gifting / Packaging)', icon: Gift },
  { name: 'Users', label: 'Users (Community / Smiles)', icon: Users }
];

export default function AboutPageCMS() {
  const [about, setAbout] = useState(DEFAULT_ECOM_ABOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [toasts, setToasts] = useState([]);
  const [uploadingHeroImg, setUploadingHeroImg] = useState(false);
  const [uploadingStoryImg, setUploadingStoryImg] = useState(false);

  const addToast = (message, type = 'success') => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/store-about', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.about) {
        setAbout({
          ...DEFAULT_ECOM_ABOUT,
          ...data.about,
          hero: { ...DEFAULT_ECOM_ABOUT.hero, ...(data.about.hero || {}) },
          story: {
            ...DEFAULT_ECOM_ABOUT.story,
            ...(data.about.story || {}),
            paragraphs: data.about.story?.paragraphs?.length ? data.about.story.paragraphs : DEFAULT_ECOM_ABOUT.story.paragraphs,
            highlights: data.about.story?.highlights?.length ? data.about.story.highlights : DEFAULT_ECOM_ABOUT.story.highlights,
            quote: { ...DEFAULT_ECOM_ABOUT.story.quote, ...(data.about.story?.quote || {}) }
          },
          customContent: { ...DEFAULT_ECOM_ABOUT.customContent, ...(data.about.customContent || {}) },
          pillars: {
            ...DEFAULT_ECOM_ABOUT.pillars,
            ...(data.about.pillars || {}),
            items: data.about.pillars?.items?.length ? data.about.pillars.items : DEFAULT_ECOM_ABOUT.pillars.items
          },
          missionVision: { ...DEFAULT_ECOM_ABOUT.missionVision, ...(data.about.missionVision || {}) },
          seo: { ...DEFAULT_ECOM_ABOUT.seo, ...(data.about.seo || {}) }
        });
      }
    } catch (err) {
      addToast('Failed to load about page configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/store-about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(about)
      });
      const data = await res.json();
      if (data.success) {
        addToast('About Us page updated successfully! 🚀', 'success');
      } else {
        throw new Error(data.message || 'Failed to save');
      }
    } catch (err) {
      addToast(err.message || 'Error saving changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, targetField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isHero = targetField === 'hero.bannerImage';
    if (isHero) setUploadingHeroImg(true);
    else setUploadingStoryImg(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        if (isHero) {
          setAbout((prev) => ({ ...prev, hero: { ...prev.hero, bannerImage: data.url } }));
        } else {
          setAbout((prev) => ({ ...prev, story: { ...prev.story, image: data.url } }));
        }
        addToast('Image uploaded successfully!', 'success');
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error');
    } finally {
      if (isHero) setUploadingHeroImg(false);
      else setUploadingStoryImg(false);
    }
  };

  const updateNested = (section, field, value) => {
    setAbout((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateStoryQuote = (field, value) => {
    setAbout((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        quote: {
          ...prev.story.quote,
          [field]: value
        }
      }
    }));
  };

  // Story Paragraphs
  const handleAddParagraph = () => {
    setAbout((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        paragraphs: [...(prev.story.paragraphs || []), '']
      }
    }));
  };

  const handleUpdateParagraph = (idx, val) => {
    const next = [...(about.story.paragraphs || [])];
    next[idx] = val;
    setAbout((prev) => ({
      ...prev,
      story: { ...prev.story, paragraphs: next }
    }));
  };

  const handleDeleteParagraph = (idx) => {
    setAbout((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        paragraphs: prev.story.paragraphs.filter((_, i) => i !== idx)
      }
    }));
  };

  // Story Highlights
  const handleAddHighlight = () => {
    setAbout((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        highlights: [...(prev.story.highlights || []), '']
      }
    }));
  };

  const handleUpdateHighlight = (idx, val) => {
    const next = [...(about.story.highlights || [])];
    next[idx] = val;
    setAbout((prev) => ({
      ...prev,
      story: { ...prev.story, highlights: next }
    }));
  };

  const handleDeleteHighlight = (idx) => {
    setAbout((prev) => ({
      ...prev,
      story: {
        ...prev.story,
        highlights: prev.story.highlights.filter((_, i) => i !== idx)
      }
    }));
  };

  const handlePillarImageUpload = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        handleUpdatePillar(idx, 'image', data.url);
        addToast('Pillar image uploaded successfully!', 'success');
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error');
    }
  };

  const handleAddPillar = () => {
    setAbout((prev) => ({
      ...prev,
      pillars: {
        ...prev.pillars,
        items: [
          ...(prev.pillars.items || []),
          { icon: 'Award', image: '', title: 'New Pillar of Excellence', desc: 'Describe this commitment to quality and service.' }
        ]
      }
    }));
  };

  const handleUpdatePillar = (idx, field, val) => {
    const next = [...(about.pillars.items || [])];
    next[idx] = { ...next[idx], [field]: val };
    setAbout((prev) => ({
      ...prev,
      pillars: { ...prev.pillars, items: next }
    }));
  };

  const handleDeletePillar = (idx) => {
    setAbout((prev) => ({
      ...prev,
      pillars: {
        ...prev.pillars,
        items: prev.pillars.items.filter((_, i) => i !== idx)
      }
    }));
  };

  const TABS = [
    { id: 'hero', label: '1. Hero Header Banner', icon: Sparkles },
    { id: 'story', label: '2. Brand Story (Left Text & Right Image)', icon: FileText },
    { id: 'customContent', label: '3. Custom Content (CKEditor)', icon: Code },
    { id: 'pillars', label: '4. Pillars of Excellence', icon: Award },
    { id: 'mission', label: '5. Mission & Vision', icon: Target },
    { id: 'seo', label: '6. SEO Search Settings', icon: Search }
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-slate-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-sm">Loading About Us CMS...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Stack */}
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <Breadcrumb
            title="About Us Page CMS"
            crumbs={[
              { label: 'Storefront Management', href: '/dashboard/ecommerce' },
              { label: 'About Us Page CMS' }
            ]}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your storefront About Us page layout, hero banner, brand story with right-side image, custom CKEditor rich content, and craft pillars.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/about"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <ExternalLink size={13} /> View Live Page
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={fetchAboutData}
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <RotateCcw size={14} /> Discard Changes
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 text-xs font-bold px-5 shadow-xs"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: Hero Header Banner ── */}
      {activeTab === 'hero' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 py-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                1. Hero Header Banner Settings
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure the top page banner, title, celebration badge, and background overlay.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Main Hero Title
                </label>
                <AIAssistantButton
                  context="Luxury gifting storefront headline"
                  field="About Page Hero Title"
                  onGenerate={(val) => updateNested('hero', 'title', val)}
                />
              </div>
              <FloatingInput
                placeholder="e.g. Crafting Emotional Connections, One Heartfelt Gift at a Time"
                value={about.hero.title || ''}
                onChange={(e) => updateNested('hero', 'title', e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Hero Subtitle / Description
                </label>
                <AIAssistantButton
                  context="Elevated tagline about flowers, cakes, and gifts"
                  field="Hero Subtitle"
                  onGenerate={(val) => updateNested('hero', 'subtitle', val)}
                />
              </div>
              <FloatingTextarea
                rows={3}
                placeholder="Brief evocative summary for the header..."
                value={about.hero.subtitle || ''}
                onChange={(e) => updateNested('hero', 'subtitle', e.target.value)}
              />
            </div>

            {/* Banner Background Image */}
            <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <ImageIcon size={14} className="text-blue-500" />
                Hero Banner Background Image (Optional Ambient Overlay)
              </label>
              <div className="flex flex-wrap items-center gap-4">
                {about.hero.bannerImage ? (
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    <img
                      src={about.hero.bannerImage}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => updateNested('hero', 'bannerImage', '')}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-700 shadow"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="w-40 h-24 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <ImageIcon size={20} className="mb-1" />
                    <span>No Image Set</span>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'hero.bannerImage')}
                    className="text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Or Image URL:</span>
                    <input
                      type="text"
                      value={about.hero.bannerImage || ''}
                      onChange={(e) => updateNested('hero', 'bannerImage', e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="flex-1 text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                    />
                  </div>
                  {uploadingHeroImg && <p className="text-[11px] text-amber-500 font-semibold">Uploading hero image...</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: Brand Story (Left Text & Right Image) ── */}
      {activeTab === 'story' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 py-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                2. Brand Story & Journey (Left Content & Right Featured Image)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                On the storefront, the left side contains the text story, bullet points, and founder quote, while the right side displays the featured studio image.
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Left Content vs Right Image Split Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column Controls (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Section Tag
                    </label>
                    <FloatingInput
                      placeholder="e.g. OUR JOURNEY"
                      value={about.story.tag || ''}
                      onChange={(e) => updateNested('story', 'tag', e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Story Main Heading
                      </label>
                      <AIAssistantButton
                        context="Story heading for gifting brand"
                        field="Story Heading"
                        onGenerate={(val) => updateNested('story', 'heading', val)}
                      />
                    </div>
                    <FloatingInput
                      placeholder="e.g. From a Boutique Florist to India’s Most Trusted Gifting Destination"
                      value={about.story.heading || ''}
                      onChange={(e) => updateNested('story', 'heading', e.target.value)}
                    />
                  </div>
                </div>

                {/* Narrative Paragraphs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Brand Story Paragraphs
                    </label>
                    <Button
                      type="button"
                      onClick={handleAddParagraph}
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1 h-7"
                    >
                      <Plus size={12} /> Add Paragraph
                    </Button>
                  </div>

                  {(about.story.paragraphs || []).map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <textarea
                        rows={3}
                        value={p}
                        onChange={(e) => handleUpdateParagraph(idx, e.target.value)}
                        placeholder={`Paragraph ${idx + 1}...`}
                        className="flex-1 text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground leading-relaxed focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteParagraph(idx)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete paragraph"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Key Bullet Highlights */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Key Highlights & Guarantees (Checkmark List)
                    </label>
                    <Button
                      type="button"
                      onClick={handleAddHighlight}
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1 h-7"
                    >
                      <Plus size={12} /> Add Point
                    </Button>
                  </div>

                  {(about.story.highlights || []).map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => handleUpdateHighlight(idx, e.target.value)}
                        placeholder={`Highlight point ${idx + 1}...`}
                        className="flex-1 text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteHighlight(idx)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Founder's Philosophy Quote (Left Column Integration) */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 pt-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500" /> Founder's Philosophy Quote (Left Column Callout)
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={about.story.quote?.badge || ''}
                        onChange={(e) => updateStoryQuote('badge', e.target.value)}
                        placeholder="FOUNDER’S PHILOSOPHY"
                        className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-background text-foreground font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Author Name</label>
                      <input
                        type="text"
                        value={about.story.quote?.authorName || ''}
                        onChange={(e) => updateStoryQuote('authorName', e.target.value)}
                        placeholder="Executive Leadership Team"
                        className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 font-semibold block mb-1">Author Role / Entity</label>
                    <input
                      type="text"
                      value={about.story.quote?.authorRole || ''}
                      onChange={(e) => updateStoryQuote('authorRole', e.target.value)}
                      placeholder="City Shop E-Retail Private Limited"
                      className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-500 font-semibold">Quote Text</label>
                      <AIAssistantButton
                        context="Inspirational quote on heartfelt gifting"
                        field="Founder Quote"
                        onGenerate={(val) => updateStoryQuote('text', val)}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={about.story.quote?.text || ''}
                      onChange={(e) => updateStoryQuote('text', e.target.value)}
                      placeholder="“A gift is never just an object...”"
                      className="w-full text-xs p-2.5 rounded border border-slate-200 dark:border-slate-700 bg-background text-foreground italic"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Dedicated Full Featured Image Management (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ImageIcon size={15} className="text-blue-500" /> Right Side Story / Atelier Image (Full-Width Card)
                  </h4>
                  
                  {about.story.image ? (
                    <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img
                        src={about.story.image}
                        alt={about.story.alt || 'Story Image'}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => updateNested('story', 'image', '')}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full text-xs hover:bg-red-700 shadow"
                        title="Remove Image"
                      >
                        <Trash2 size={13} />
                      </button>
                      {about.story.experienceYears && (
                        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                          <span className="text-amber-400 font-black">{about.story.experienceYears}</span>
                          <span className="text-[11px] text-slate-300 font-medium">{about.story.experienceLabel || 'Years of Crafting Smiles'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-56 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Upload size={28} className="mb-2 text-slate-400" />
                      <span className="font-semibold">Upload atelier / team / floral studio photo</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Recommended size: 800 x 600px</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'story.image')}
                      className="text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer w-full"
                    />
                    {uploadingStoryImg && <p className="text-[11px] text-amber-500 font-semibold">Uploading image...</p>}
                    
                    <div>
                      <label className="text-[11px] text-slate-500 font-semibold block mb-1">Image URL Directly:</label>
                      <input
                        type="text"
                        value={about.story.image || ''}
                        onChange={(e) => updateNested('story', 'image', e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[11px] text-muted-foreground font-semibold block mb-1">Image Alt Text (SEO)</label>
                        <input
                          type="text"
                          value={about.story.alt || ''}
                          onChange={(e) => updateNested('story', 'alt', e.target.value)}
                          placeholder="e.g. City Shop Floral Studio"
                          className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground font-semibold block mb-1">Experience Badge</label>
                        <input
                          type="text"
                          value={about.story.experienceYears || ''}
                          onChange={(e) => updateNested('story', 'experienceYears', e.target.value)}
                          placeholder="e.g. 30+ Years"
                          className="w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-background text-foreground font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </CardContent>
        </Card>
      )}

      {/* ── TAB 3: Custom Content (CKEditor Section - Pure Content) ── */}
      {activeTab === 'customContent' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 py-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code size={16} className="text-emerald-500" />
                3. Custom Rich Content (CKEditor)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add any custom formatted rich text, headings, tables, or embeds directly without forced title headers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Visible on Store</span>
              <Switch
                checked={about.customContent?.isVisible !== false}
                onCheckedChange={(checked) => updateNested('customContent', 'isVisible', checked)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Page Rich Text Content (CKEditor)
              </label>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden min-h-[340px]">
                <RichEditor
                  value={about.customContent?.content || ''}
                  onChange={(html) => updateNested('customContent', 'content', html)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-2">
                💡 Tip: Type your own headings (H2, H3), paragraphs, bullet points, images, or custom code blocks directly inside the editor. Leave empty to hide on the storefront.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 4: Pillars of Excellence ── */}
      {activeTab === 'pillars' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 py-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                4. Pillars of Craftsmanship & Excellence (4-Card Grid)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage the core pillars that showcase your quality, culinary artistry, fulfillment speed, and packaging.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAddPillar}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5 h-8 shadow-xs"
            >
              <Plus size={13} /> Add Pillar
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Section Tag
                </label>
                <FloatingInput
                  placeholder="e.g. THE CITY SHOP PROMISE"
                  value={about.pillars.tag || ''}
                  onChange={(e) => updateNested('pillars', 'tag', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Section Heading
                </label>
                <FloatingInput
                  placeholder="e.g. Our 4 Pillars of Excellence"
                  value={about.pillars.heading || ''}
                  onChange={(e) => updateNested('pillars', 'heading', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Section Subtitle
              </label>
              <FloatingInput
                placeholder="Uncompromising dedication to quality, artistry, and punctual fulfillment."
                value={about.pillars.subtitle || ''}
                onChange={(e) => updateNested('pillars', 'subtitle', e.target.value)}
              />
            </div>

            {/* Pillar Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {(about.pillars.items || []).map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-blue-400 uppercase tracking-wider">
                      Pillar #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeletePillar(idx)}
                      className="text-muted-foreground hover:text-red-500 p-1 rounded transition-all"
                      title="Remove Pillar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Vector Icon</label>
                      <CustomSelect
                        value={pillar.icon || 'Leaf'}
                        onChange={(val) => handleUpdatePillar(idx, 'icon', val)}
                        size="sm"
                        options={AVAILABLE_ICONS.map((ic) => ({
                          value: ic.name,
                          label: ic.label,
                        }))}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Title</label>
                      <input
                        type="text"
                        value={pillar.title || ''}
                        onChange={(e) => handleUpdatePillar(idx, 'title', e.target.value)}
                        placeholder="e.g. Farm-Fresh Sourcing"
                        className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground font-bold"
                      />
                    </div>
                  </div>

                  {/* Custom Image / Badge Option */}
                  <div className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-background space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <ImageIcon size={13} className="text-amber-500" />
                        Custom Image / Icon Badge (Optional)
                      </label>
                      {pillar.image && (
                        <button
                          type="button"
                          onClick={() => handleUpdatePillar(idx, 'image', '')}
                          className="text-[10px] text-red-500 hover:underline font-semibold"
                        >
                          Remove & Use Vector Icon
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {pillar.image ? (
                        <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center">
                          <img src={pillar.image} alt={pillar.title} className="w-full h-full object-contain p-1" />
                        </div>
                      ) : null}

                      <div className="flex-1 space-y-1.5">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePillarImageUpload(e, idx)}
                          className="text-[11px] text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-primary-foreground cursor-pointer w-full"
                        />
                        <input
                          type="text"
                          value={pillar.image || ''}
                          onChange={(e) => handleUpdatePillar(idx, 'image', e.target.value)}
                          placeholder="Or paste image URL (SVG/PNG)..."
                          className="w-full text-[11px] p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Description</label>
                      <AIAssistantButton
                        context={`Pillar description for ${pillar.title || 'luxury service'}`}
                        field="Pillar Detail"
                        onGenerate={(val) => handleUpdatePillar(idx, 'desc', val)}
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={pillar.desc || ''}
                      onChange={(e) => handleUpdatePillar(idx, 'desc', e.target.value)}
                      placeholder="Details on sourcing, craft, or speed..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 5: Mission, Vision & Promise ── */}
      {activeTab === 'mission' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 py-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target size={16} className="text-emerald-500" />
                5. Mission, Vision & Absolute Promise Cards
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Highlight your organizational purpose, long-term vision, and customer promises.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Display Section</span>
              <Switch
                checked={about.missionVision?.isVisible !== false}
                onCheckedChange={(checked) => updateNested('missionVision', 'isVisible', checked)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mission Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Target size={14} className="text-blue-500" /> Purpose & Mission
                  </h4>
                  <AIAssistantButton
                    context="Corporate mission statement for luxury gifting boutique"
                    field="Mission Text"
                    onGenerate={(val) => updateNested('missionVision', 'missionText', val)}
                  />
                </div>
                <input
                  type="text"
                  value={about.missionVision?.missionTitle || ''}
                  onChange={(e) => updateNested('missionVision', 'missionTitle', e.target.value)}
                  placeholder="e.g. Our Purpose & Mission"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground font-bold"
                />
                <textarea
                  rows={4}
                  value={about.missionVision?.missionText || ''}
                  onChange={(e) => updateNested('missionVision', 'missionText', e.target.value)}
                  placeholder="Mission details..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground leading-relaxed"
                />
              </div>

              {/* Vision Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" /> Future Vision
                  </h4>
                  <AIAssistantButton
                    context="Inspiring future vision for online luxury gift retailer"
                    field="Vision Text"
                    onGenerate={(val) => updateNested('missionVision', 'visionText', val)}
                  />
                </div>
                <input
                  type="text"
                  value={about.missionVision?.visionTitle || ''}
                  onChange={(e) => updateNested('missionVision', 'visionTitle', e.target.value)}
                  placeholder="e.g. Our Future Vision"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground font-bold"
                />
                <textarea
                  rows={4}
                  value={about.missionVision?.visionText || ''}
                  onChange={(e) => updateNested('missionVision', 'visionText', e.target.value)}
                  placeholder="Vision details..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground leading-relaxed"
                />
              </div>

              {/* Absolute Promise Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" /> Absolute Promise
                  </h4>
                  <AIAssistantButton
                    context="Customer satisfaction and freshness guarantee pledge"
                    field="Promise Text"
                    onGenerate={(val) => updateNested('missionVision', 'promiseText', val)}
                  />
                </div>
                <input
                  type="text"
                  value={about.missionVision?.promiseTitle || ''}
                  onChange={(e) => updateNested('missionVision', 'promiseTitle', e.target.value)}
                  placeholder="e.g. Our Absolute Promise"
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground font-bold"
                />
                <textarea
                  rows={4}
                  value={about.missionVision?.promiseText || ''}
                  onChange={(e) => updateNested('missionVision', 'promiseText', e.target.value)}
                  placeholder="Promise details..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-background text-foreground leading-relaxed"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 6: SEO Search Settings ── */}
      {activeTab === 'seo' && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search size={16} className="text-blue-500" />
              6. SEO Search Engine Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Meta Title (Browser & Google SERP)
                </label>
                <AIAssistantButton
                  context="SEO meta title for luxury gifting about page"
                  field="Meta Title"
                  onGenerate={(val) => updateNested('seo', 'metaTitle', val)}
                />
              </div>
              <FloatingInput
                placeholder="About Us — India’s Premier Luxury Gifting Boutique | City Shop"
                value={about.seo?.metaTitle || ''}
                onChange={(e) => updateNested('seo', 'metaTitle', e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Meta Description
                </label>
                <AIAssistantButton
                  context="Search engine snippet about online gifts, flowers, cakes"
                  field="Meta Description"
                  onGenerate={(val) => updateNested('seo', 'metaDescription', val)}
                />
              </div>
              <FloatingTextarea
                rows={2}
                placeholder="Concise 160 character description for Google search results..."
                value={about.seo?.metaDescription || ''}
                onChange={(e) => updateNested('seo', 'metaDescription', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Meta Keywords (Comma separated)
              </label>
              <FloatingInput
                placeholder="about city shop, luxury gifting, online florist, fresh flowers india"
                value={about.seo?.metaKeywords || ''}
                onChange={(e) => updateNested('seo', 'metaKeywords', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
