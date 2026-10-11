'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import * as LucideIcons from 'lucide-react';
import { showToast as toastNotification } from '@/lib/storeToast';
import { Save, QrCode, CreditCard, Banknote, Building2, ShieldCheck, Zap, RotateCcw, Truck, Heart, Star, Award, Clock, Leaf, Sparkles, Gift, CheckCircle2, Lock, Headphones, BadgeCheck, Crown, Gem, ThumbsUp, Package, Percent, Upload, Image as ImageIcon, X, Loader2, SlidersHorizontal, Filter, PlusCircle, Trash2, Tag, CheckSquare, History, Bell, Volume2 } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

const ICON_CATEGORIES = [
  {
    category: 'Quality & Trust',
    icons: [
      { id: 'ShieldCheck', label: 'Shield Check' },
      { id: 'BadgeCheck', label: 'Badge Check' },
      { id: 'Award', label: 'Award Ribbon' },
      { id: 'CheckCircle2', label: 'Check Circle' },
      { id: 'Check', label: 'Checkmark' },
      { id: 'Star', label: 'Star' },
      { id: 'Crown', label: 'Crown (Premium)' },
      { id: 'Gem', label: 'Diamond / Gem' },
      { id: 'Sparkles', label: 'Sparkles' },
      { id: 'ThumbsUp', label: 'Thumbs Up' },
    ]
  },
  {
    category: 'Delivery & Speed',
    icons: [
      { id: 'Truck', label: 'Truck Delivery' },
      { id: 'Zap', label: 'Lightning / Express' },
      { id: 'Clock', label: 'Clock / Scheduled' },
      { id: 'Timer', label: 'Timer' },
      { id: 'Package', label: 'Package Box' },
      { id: 'Box', label: 'Box' },
      { id: 'Rocket', label: 'Rocket (Super Fast)' },
      { id: 'Plane', label: 'Express Air' },
      { id: 'Navigation', label: 'Navigation' },
      { id: 'MapPin', label: 'Map Pin (Local)' },
    ]
  },
  {
    category: 'Support & Returns',
    icons: [
      { id: 'RotateCcw', label: 'Easy Return / Refund' },
      { id: 'RefreshCw', label: 'Refresh / Exchange' },
      { id: 'Headphones', label: '24/7 Support' },
      { id: 'PhoneCall', label: 'Phone Help' },
      { id: 'MessageSquare', label: 'Live Chat' },
      { id: 'LifeBuoy', label: 'Life Buoy Assistance' },
      { id: 'HelpCircle', label: 'Help Circle' },
    ]
  },
  {
    category: 'Payment & Security',
    icons: [
      { id: 'Lock', label: '100% Secure / SSL' },
      { id: 'Shield', label: 'Shield Protection' },
      { id: 'CreditCard', label: 'Safe Payments' },
      { id: 'Wallet', label: 'Digital Wallet' },
      { id: 'Banknote', label: 'Cash / Currency' },
      { id: 'Coins', label: 'Coins' },
      { id: 'BadgePercent', label: 'Best Price / Discount' },
      { id: 'Tag', label: 'Price Tag' },
    ]
  },
  {
    category: 'Product & Lifestyle',
    icons: [
      { id: 'Gift', label: 'Gift Packaging' },
      { id: 'Heart', label: 'Handcrafted / Love' },
      { id: 'Smile', label: 'Customer Happiness' },
      { id: 'Leaf', label: '100% Organic / Eco' },
      { id: 'Feather', label: 'Lightweight' },
      { id: 'Flame', label: 'Hot / Trending' },
      { id: 'Sun', label: 'Fresh Daily' },
      { id: 'Cake', label: 'Bakery / Fresh' },
    ]
  }
];

const DynamicBadgeIcon = ({ name, size = 18, color = '#16a34a' }) => {
  if (!name) return <ShieldCheck size={size} color={color} />;
  const formatted = name.trim().replace(/\s+/g, '');
  const IconComponent = LucideIcons[formatted] || LucideIcons[formatted.charAt(0).toUpperCase() + formatted.slice(1)] || LucideIcons.ShieldCheck;
  return <IconComponent size={size} color={color} />;
};

export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCustomFilter, setNewCustomFilter] = useState({ label: '', key: '', optionsText: '' });
  const [showAddFilterModal, setShowAddFilterModal] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const [settings, setSettings] = useState({
    upiId: '',
    merchantName: '',
    merchantCode: '',
    showDeliveryTagline: true,
    deliveryTaglineText: 'Free Standard Delivery above ₹{freeAbove}',
    deliveryTaglineIcon: 'Truck',
    deliveryTaglineColor: '#16a34a',
    infoSectionHeading: 'Product Information & Care',
    infoSectionIcon: 'ShieldCheck',
    infoSectionColor: '#111111',
    showTrustBadges: true,
    trustBadges: [
      { iconType: 'icon', icon: 'ShieldCheck', image: '', title: '100% Quality', subtitle: 'Guaranteed Fresh', color: '#16a34a', isActive: true },
      { iconType: 'icon', icon: 'Zap', image: '', title: 'Fast Shipping', subtitle: 'Express Slots', color: '#f59e0b', isActive: true },
      { iconType: 'icon', icon: 'RotateCcw', image: '', title: 'Easy Support', subtitle: 'Dedicated Help', color: '#3b82f6', isActive: true }
    ],
    catalogFilterSettings: {
      showCategoryFilter: true,
      showPriceFilter: true,
      showRatingFilter: true,
      showInStockFilter: true,
      showDiscountFilter: true,
      showTagsFilter: true,
      priceRanges: [
        { label: 'Under ₹499', min: 0, max: 499 },
        { label: '₹500 - ₹999', min: 500, max: 999 },
        { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
        { label: '₹2,000 & Above', min: 2000, max: 999999 }
      ],
      customFilters: []
    },
    recentlyViewedSettings: {
      badgeText: 'Pick Up Where You Left Off',
      title: 'Recently Viewed by You',
      subtitle: 'Products you browsed during your recent visits'
    },
    relatedProductsSettings: {
      badgeText: 'Handpicked Recommendations',
      title: 'You Might Also Like',
      subtitle: 'Curated choices and similar gifts loved by customers'
    },
    whatsappNumber: '919876543210',
    supportPhone: '+91 98765 43210',
    supportEmail: 'support@store.com',
    enableAiHelp: true
  });

  const showToast = (message, type = 'success') => {
    if (type === 'error' || type === 'danger') {
      toastNotification.error(message);
    } else if (type === 'warning') {
      toastNotification.warning(message);
    } else {
      toastNotification.success(message);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/store-payment-settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings({
          upiId: data.settings.upiId || '',
          merchantName: data.settings.merchantName || '',
          merchantCode: data.settings.merchantCode || '',
          showDeliveryTagline: data.settings.showDeliveryTagline !== undefined ? data.settings.showDeliveryTagline : true,
          deliveryTaglineText: data.settings.deliveryTaglineText || 'Free Standard Delivery above ₹{freeAbove}',
          deliveryTaglineIcon: data.settings.deliveryTaglineIcon || 'Truck',
          deliveryTaglineColor: data.settings.deliveryTaglineColor || '#16a34a',
          infoSectionHeading: data.settings.infoSectionHeading || 'Product Information & Care',
          infoSectionIcon: data.settings.infoSectionIcon || 'ShieldCheck',
          infoSectionColor: data.settings.infoSectionColor || '#111111',
          showTrustBadges: data.settings.showTrustBadges !== undefined ? data.settings.showTrustBadges : true,
          trustBadges: data.settings.trustBadges?.length ? data.settings.trustBadges.map(b => ({
            ...b,
            iconType: b.iconType || (b.image ? 'image' : 'icon'),
            image: b.image || '',
            isActive: b.isActive !== false
          })) : [
            { iconType: 'icon', icon: 'ShieldCheck', image: '', title: '100% Quality', subtitle: 'Guaranteed Fresh', color: '#16a34a', isActive: true },
            { iconType: 'icon', icon: 'Zap', image: '', title: 'Fast Shipping', subtitle: 'Express Slots', color: '#f59e0b', isActive: true },
            { iconType: 'icon', icon: 'RotateCcw', image: '', title: 'Easy Support', subtitle: 'Dedicated Help', color: '#3b82f6', isActive: true }
          ],
          catalogFilterSettings: data.settings.catalogFilterSettings || {
            showCategoryFilter: true,
            showPriceFilter: true,
            showRatingFilter: true,
            showInStockFilter: true,
            showDiscountFilter: true,
            showTagsFilter: true,
            priceRanges: [
              { label: 'Under ₹499', min: 0, max: 499 },
              { label: '₹500 - ₹999', min: 500, max: 999 },
              { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
              { label: '₹2,000 & Above', min: 2000, max: 999999 }
            ],
            customFilters: []
          },
          recentlyViewedSettings: data.settings.recentlyViewedSettings || {
            badgeText: 'Pick Up Where You Left Off',
            title: 'Recently Viewed by You',
            subtitle: 'Products you browsed during your recent visits'
          },
          relatedProductsSettings: data.settings.relatedProductsSettings || {
            badgeText: 'Handpicked Recommendations',
            title: 'You Might Also Like',
            subtitle: 'Curated choices and similar gifts loved by customers'
          },
          whatsappNumber: data.settings.whatsappNumber || '919876543210',
          supportPhone: data.settings.supportPhone || '+91 98765 43210',
          supportEmail: data.settings.supportEmail || 'support@store.com',
          enableAiHelp: data.settings.enableAiHelp !== undefined ? data.settings.enableAiHelp : true
        });
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilterOption = (filterKey) => {
    setSettings(prev => ({
      ...prev,
      catalogFilterSettings: {
        ...prev.catalogFilterSettings,
        [filterKey]: !prev.catalogFilterSettings?.[filterKey]
      }
    }));
  };

  const handleAddCustomFilter = (e) => {
    e.preventDefault();
    if (!newCustomFilter.label.trim()) {
      showToast('Filter label is required', 'warning');
      return;
    }
    const key = newCustomFilter.key.trim().toLowerCase().replace(/\s+/g, '_') || newCustomFilter.label.trim().toLowerCase().replace(/\s+/g, '_');
    const options = newCustomFilter.optionsText
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    if (options.length === 0) {
      showToast('Please enter at least one filter option', 'warning');
      return;
    }

    const newFilterObj = {
      id: `filter_${Date.now()}`,
      key,
      label: newCustomFilter.label.trim(),
      options,
      isActive: true
    };

    setSettings(prev => ({
      ...prev,
      catalogFilterSettings: {
        ...prev.catalogFilterSettings,
        customFilters: [...(prev.catalogFilterSettings?.customFilters || []), newFilterObj]
      }
    }));

    setNewCustomFilter({ label: '', key: '', optionsText: '' });
    setShowAddFilterModal(false);
    showToast(`Added custom filter "${newFilterObj.label}"`);
  };

  const handleRemoveCustomFilter = (filterId) => {
    setSettings(prev => ({
      ...prev,
      catalogFilterSettings: {
        ...prev.catalogFilterSettings,
        customFilters: (prev.catalogFilterSettings?.customFilters || []).filter(f => f.id !== filterId)
      }
    }));
  };

  const handleToggleCustomFilter = (filterId) => {
    setSettings(prev => ({
      ...prev,
      catalogFilterSettings: {
        ...prev.catalogFilterSettings,
        customFilters: (prev.catalogFilterSettings?.customFilters || []).map(f => f.id === filterId ? { ...f, isActive: !f.isActive } : f)
      }
    }));
  };

  const updateBadge = (index, field, value) => {
    setSettings(prev => {
      const updated = [...(prev.trustBadges || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, trustBadges: updated };
    });
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;
    setUploadingIdx(index);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/store-media/upload', {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSettings(prev => {
          const updated = [...(prev.trustBadges || [])];
          if (updated[index]) {
            updated[index] = { ...updated[index], image: data.url, iconType: 'image' };
          }
          return { ...prev, trustBadges: updated };
        });
        showToast('Badge image uploaded successfully!', 'success');
      } else {
        showToast(data.message || 'Image upload failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/store-payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.settings) {
          setSettings(prev => ({
            upiId: data.settings.upiId || '',
            merchantName: data.settings.merchantName || '',
            merchantCode: data.settings.merchantCode || '',
            showDeliveryTagline: data.settings.showDeliveryTagline !== undefined ? data.settings.showDeliveryTagline : true,
            deliveryTaglineText: data.settings.deliveryTaglineText || 'Free Standard Delivery above ₹{freeAbove}',
            deliveryTaglineIcon: data.settings.deliveryTaglineIcon || 'Truck',
            deliveryTaglineColor: data.settings.deliveryTaglineColor || '#16a34a',
            infoSectionHeading: data.settings.infoSectionHeading || 'Product Information & Care',
            infoSectionIcon: data.settings.infoSectionIcon || 'ShieldCheck',
            infoSectionColor: data.settings.infoSectionColor || '#111111',
            showTrustBadges: data.settings.showTrustBadges !== undefined ? data.settings.showTrustBadges : true,
            trustBadges: Array.isArray(data.settings.trustBadges) ? data.settings.trustBadges.map(b => ({
              ...b,
              iconType: b.iconType || (b.image ? 'image' : 'icon'),
              image: b.image || '',
              isActive: b.isActive !== false
            })) : prev.trustBadges,
            catalogFilterSettings: data.settings.catalogFilterSettings || prev.catalogFilterSettings,
            recentlyViewedSettings: data.settings.recentlyViewedSettings || prev.recentlyViewedSettings,
            relatedProductsSettings: data.settings.relatedProductsSettings || prev.relatedProductsSettings,
            whatsappNumber: data.settings.whatsappNumber || prev.whatsappNumber,
            supportPhone: data.settings.supportPhone || prev.supportPhone,
            supportEmail: data.settings.supportEmail || prev.supportEmail,
            enableAiHelp: data.settings.enableAiHelp !== undefined ? data.settings.enableAiHelp : prev.enableAiHelp
          }));
        }
        showToast('Settings saved successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to save settings', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb
        title="Store & Payment Settings"
        subtitle="Manage payment gateway, dynamic UPI QR, product promo taglines, and accordion headers."
        crumbs={[{ label: 'Storefront Management', href: '/dashboard/ecommerce' }, { label: 'Store & Payment Settings' }]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* UPI Configuration Card */}
          <div className="col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold leading-none tracking-tight">UPI Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Configure the destination for all UPI payments. The dynamic QR code in the cart will use these details.
              </p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid gap-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  Merchant UPI ID
                </label>
                <input
                  type="text"
                  required
                  value={settings.upiId}
                  onChange={e => setSettings({...settings, upiId: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-primary"
                  placeholder="e.g. yourbusiness@ybl"
                />
                <p className="text-[0.8rem] text-muted-foreground">The exact UPI VPA where funds will be credited.</p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  Merchant Name (Payee Name)
                </label>
                <input
                  type="text"
                  required
                  value={settings.merchantName}
                  onChange={e => setSettings({...settings, merchantName: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-primary"
                  placeholder="e.g. City Shop Demo"
                />
                <p className="text-[0.8rem] text-muted-foreground">The name displayed on the user's UPI app while scanning.</p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-muted-foreground" />
                  Merchant Category Code (MCC)
                </label>
                <input
                  type="text"
                  required
                  value={settings.merchantCode}
                  onChange={e => setSettings({...settings, merchantCode: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-primary"
                  placeholder="e.g. 0000"
                />
                <p className="text-[0.8rem] text-muted-foreground">Default is 0000. Ask your bank if you need a specific MCC.</p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="col-span-1 space-y-6">
            <div className="rounded-xl border bg-primary/5 text-card-foreground shadow-sm p-6 border-primary/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                <QrCode className="w-4 h-4" />
                Dynamic QR Generation
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When a customer places an order, the frontend instantly pulls the active credentials from this configuration and generates a dynamic UPI QR Code with the exact grand total encoded into it.
              </p>
            </div>
          </div>
        </div>

        {/* ── Card: Customer Care, WhatsApp & AI Support Widget Settings ── */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 border-b border-border/50 bg-muted/20">
            <div>
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold leading-none tracking-tight">Customer Care, WhatsApp &amp; Live Help Widget</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                Configure the WhatsApp number, phone helpline, and AI assistant powering the floating support hub on your storefront.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium shrink-0">
              <input
                type="checkbox"
                checked={settings.enableAiHelp !== false}
                onChange={e => setSettings({ ...settings, enableAiHelp: e.target.checked })}
                className="rounded border-input text-primary focus:ring-primary w-4 h-4"
              />
              Enable AI Support Assistant
            </label>
          </div>

          <div className="p-6 grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                WhatsApp Support Number
              </label>
              <input
                type="text"
                value={settings.whatsappNumber || ''}
                onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="e.g. 919876543210"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono"
              />
              <p className="text-[0.78rem] text-muted-foreground">Include country code without + or dashes (e.g. 919876543210).</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer Helpline Phone
              </label>
              <input
                type="text"
                value={settings.supportPhone || ''}
                onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono"
              />
              <p className="text-[0.78rem] text-muted-foreground">Displayed for direct phone calling on support widgets and invoices.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Support Email Address
              </label>
              <input
                type="email"
                value={settings.supportEmail || ''}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                placeholder="e.g. care@yourstore.com"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="text-[0.78rem] text-muted-foreground">Official support inbox for alerts and customer inquiries.</p>
            </div>
          </div>
        </div>

        {/* ── Card: Owner Real-Time Alerts & Multi-Channel Notifications ── */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 border-b border-border/50 bg-muted/20">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-semibold leading-none tracking-tight">Store Owner Real-Time Alerts &amp; Notifications</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                Instant multi-channel alerts (Live Audio Chime, Dashboard Activity Feed, Formatted HTML Email &amp; Web Push) whenever a customer places an order, requests a return, or cancels.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Monitoring Active
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Admin Alert Email Recipient
                </label>
                <input
                  type="email"
                  value={settings.supportEmail || ''}
                  onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                  placeholder="e.g. owner@yourbusiness.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <p className="text-[0.78rem] text-muted-foreground">Formatted HTML alerts with full order &amp; return details will be sent here.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Owner WhatsApp Alert Number
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber || ''}
                  onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="e.g. 919876543210"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono"
                />
                <p className="text-[0.78rem] text-muted-foreground">Used for 1-tap WhatsApp notifications and customer communication.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Audio &amp; Push Channels
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const AudioCtx = window.AudioContext || window.webkitAudioContext;
                        if (AudioCtx) {
                          const ctx = new AudioCtx();
                          const now = ctx.currentTime;
                          const osc = ctx.createOscillator();
                          const gain = ctx.createGain();
                          osc.type = 'sine';
                          osc.frequency.setValueAtTime(880, now);
                          osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
                          gain.gain.setValueAtTime(0.25, now);
                          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                          osc.connect(gain);
                          gain.connect(ctx.destination);
                          osc.start(now);
                          osc.stop(now + 0.55);
                        }
                        showToast('🔊 Audio chime test played!', 'success');
                      } catch (e) {}
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-10 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> Test Cash Chime
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/admin/notifications', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'new_order',
                            title: '🛍️ New Order #TEST-101 (₹2,499)',
                            message: 'Sample test order from Rahul Sharma • 2 items • UPI',
                            link: '/dashboard/ecommerce/orders',
                            metadata: { orderId: 'test-101', grandTotal: 2499, customerName: 'Rahul Sharma' }
                          })
                        });
                        showToast('🔔 Test notification sent to Topbar bell!', 'success');
                      } catch (e) {}
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-10 rounded-lg border border-border bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5" /> Trigger Test Alert
                  </button>
                </div>
                <p className="text-[0.78rem] text-muted-foreground">Test the real-time audio sound and topbar notification bell live.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card: Product Page Delivery / Promo Tagline Pill ── */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 border-b border-border/50 bg-muted/20">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-semibold leading-none tracking-tight">Product Page Promo &amp; Delivery Tagline Pill</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                Customize the promotional delivery badge shown right underneath the product price on product detail pages.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium shrink-0">
              <input
                type="checkbox"
                checked={settings.showDeliveryTagline}
                onChange={e => setSettings({ ...settings, showDeliveryTagline: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Show on Product Pages
            </label>
          </div>

          <div className="p-6 space-y-6">
            {/* Live Preview */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Live Storefront Pill Preview</span>
                {settings.showDeliveryTagline ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      background: `${settings.deliveryTaglineColor || '#16a34a'}15`,
                      border: `1px solid ${settings.deliveryTaglineColor || '#16a34a'}35`,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px'
                    }}
                  >
                    <DynamicBadgeIcon name={settings.deliveryTaglineIcon || 'Truck'} size={14} color={settings.deliveryTaglineColor || '#16a34a'} />
                    <span style={{ fontSize: '0.8rem', color: settings.deliveryTaglineColor || '#16a34a', fontWeight: 600 }}>
                      {(settings.deliveryTaglineText || 'Free Standard Delivery above ₹{freeAbove}')
                        .replace('{freeAbove}', '1,500')
                        .replace('{amount}', '1,500')}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Pill is currently disabled and hidden on storefront.</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground self-center">
                {settings.showDeliveryTagline ? '✓ Displaying under Product Price' : '✕ Hidden'}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tagline Text / Template
                  </label>
                  <input
                    type="text"
                    value={settings.deliveryTaglineText}
                    onChange={e => setSettings({ ...settings, deliveryTaglineText: e.target.value })}
                    placeholder="e.g. Free Standard Delivery above ₹{freeAbove}"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Tip: Use <code className="bg-muted px-1.5 py-0.5 rounded text-primary text-xs font-mono">{'{freeAbove}'}</code> to automatically show your active threshold from Shipping Rules, or type any fixed promo text.
                  </p>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Badge Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.deliveryTaglineColor || '#16a34a'}
                      onChange={e => setSettings({ ...settings, deliveryTaglineColor: e.target.value })}
                      className="h-10 w-12 p-0.5 border border-input rounded-md cursor-pointer bg-background"
                    />
                    <input
                      type="text"
                      value={settings.deliveryTaglineColor || '#16a34a'}
                      onChange={e => setSettings({ ...settings, deliveryTaglineColor: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pill Icon Preset
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'Truck', label: 'Truck' },
                      { id: 'Zap', label: 'Lightning' },
                      { id: 'Sparkles', label: 'Sparkles' },
                      { id: 'Gift', label: 'Gift' },
                      { id: 'BadgePercent', label: 'Discount' },
                      { id: 'Tag', label: 'Tag' },
                      { id: 'Clock', label: 'Clock' },
                      { id: 'ShieldCheck', label: 'Shield' },
                      { id: 'Heart', label: 'Heart' },
                      { id: 'Crown', label: 'Crown' },
                      { id: 'Rocket', label: 'Rocket' },
                      { id: 'Box', label: 'Box' }
                    ].map(iconItem => {
                      const isSelected = (settings.deliveryTaglineIcon || 'Truck') === iconItem.id;
                      return (
                        <button
                          key={iconItem.id}
                          type="button"
                          onClick={() => setSettings({ ...settings, deliveryTaglineIcon: iconItem.id })}
                          className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-semibold'
                              : 'border-border bg-background hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <DynamicBadgeIcon name={iconItem.id} size={14} color={isSelected ? 'currentColor' : '#777'} />
                          <span className="truncate">{iconItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Or Enter Custom Lucide Icon Name:</label>
                    <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-primary hover:underline text-[11px] font-medium inline-flex items-center gap-1">
                      Browse 1000+ Icons ↗
                    </a>
                  </div>
                  <input
                    type="text"
                    value={settings.deliveryTaglineIcon || ''}
                    onChange={e => setSettings({ ...settings, deliveryTaglineIcon: e.target.value })}
                    placeholder="e.g. Plane, Flame, Gem, Smile, etc."
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card: Product Information & Care Accordion Header ── */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold leading-none tracking-tight">Product Information &amp; Care Section Heading</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              Customize the section header, title text color, and icon rendered above the expandable product details accordion.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Live Preview */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">Live Storefront Accordion Header Preview</span>
                <div className="flex items-center gap-2.5 bg-background p-3 rounded-xl border border-border shadow-sm">
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${settings.infoSectionColor || '#111111'}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: settings.infoSectionColor || '#111111'
                    }}
                  >
                    <DynamicBadgeIcon name={settings.infoSectionIcon || 'ShieldCheck'} size={18} color={settings.infoSectionColor || '#111111'} />
                  </div>
                  <h4 style={{ color: settings.infoSectionColor || '#111111' }} className="text-sm font-bold">
                    {settings.infoSectionHeading || 'Product Information & Care'}
                  </h4>
                </div>
              </div>
              <span className="text-xs text-muted-foreground self-center">
                ✓ Displaying above product details accordions
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Section Heading Title
                  </label>
                  <input
                    type="text"
                    value={settings.infoSectionHeading}
                    onChange={e => setSettings({ ...settings, infoSectionHeading: e.target.value })}
                    placeholder="e.g. Product Information & Care"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Examples: <span className="italic font-medium text-foreground">"Product Information & Care"</span>, <span className="italic font-medium text-foreground">"Specifications & Storage Instructions"</span>, <span className="italic font-medium text-foreground">"Ingredients & Details"</span>
                  </p>
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Title &amp; Icon Text Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.infoSectionColor || '#111111'}
                      onChange={e => setSettings({ ...settings, infoSectionColor: e.target.value })}
                      className="h-10 w-12 p-0.5 border border-input rounded-md cursor-pointer bg-background"
                    />
                    <input
                      type="text"
                      value={settings.infoSectionColor || '#111111'}
                      onChange={e => setSettings({ ...settings, infoSectionColor: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Section Header Icon Preset
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'ShieldCheck', label: 'Shield' },
                      { id: 'FileText', label: 'Document' },
                      { id: 'Info', label: 'Info' },
                      { id: 'Sparkles', label: 'Sparkles' },
                      { id: 'Layers', label: 'Layers' },
                      { id: 'PackageCheck', label: 'Package' },
                      { id: 'Award', label: 'Award' },
                      { id: 'CheckCircle2', label: 'Check' },
                      { id: 'HeartHandshake', label: 'Care' },
                      { id: 'BookOpen', label: 'Book' },
                      { id: 'HelpCircle', label: 'Help' },
                      { id: 'ListOrdered', label: 'List' }
                    ].map(iconItem => {
                      const isSelected = (settings.infoSectionIcon || 'ShieldCheck') === iconItem.id;
                      return (
                        <button
                          key={iconItem.id}
                          type="button"
                          onClick={() => setSettings({ ...settings, infoSectionIcon: iconItem.id })}
                          className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-semibold'
                              : 'border-border bg-background hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          <DynamicBadgeIcon name={iconItem.id} size={14} color={isSelected ? (settings.infoSectionColor || 'currentColor') : '#777'} />
                          <span className="truncate">{iconItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Or Custom Lucide Icon Name:</label>
                    <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-primary hover:underline text-[11px] font-medium inline-flex items-center gap-1">
                      Browse 1000+ Icons ↗
                    </a>
                  </div>
                  <input
                    type="text"
                    value={settings.infoSectionIcon || ''}
                    onChange={e => setSettings({ ...settings, infoSectionIcon: e.target.value })}
                    placeholder="e.g. Bookmark, Eye, Fingerprint, Shield, etc."
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Product Page Trust Badges & Highlights Card ── */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
            <div>
              <h3 className="text-lg font-semibold leading-none tracking-tight">Product Page Trust Badges &amp; Highlights</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Customize the 3 trust &amp; guarantee badges displayed above the action buttons on product detail pages.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={settings.showTrustBadges}
                onChange={e => setSettings({ ...settings, showTrustBadges: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Show on Product Pages
            </label>
          </div>

          <div className="p-6 space-y-6">
            {/* Live Preview Box */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Storefront Preview</span>
                <span className="text-xs text-muted-foreground">
                  {settings.showTrustBadges ? '✓ Badges Enabled' : '✕ Badges Hidden Site-wide'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-muted/30 border border-border rounded-xl p-4 text-center max-w-xl shadow-inner">
                {(settings.trustBadges || []).map((badge, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
                      idx === 1 ? 'border-x border-border' : ''
                    } ${!badge.isActive ? 'opacity-35 grayscale bg-destructive/5' : ''}`}
                  >
                    {badge.iconType === 'image' && badge.image ? (
                      <img
                        src={badge.image.startsWith('http') ? badge.image : (badge.image.startsWith('/') ? badge.image : `/${badge.image}`)}
                        alt={badge.title || 'Badge'}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <DynamicBadgeIcon name={badge.icon} size={22} color={badge.color || '#16a34a'} />
                    )}
                    <span className="text-xs font-bold text-foreground mt-0.5">{badge.title || `Badge ${idx + 1}`}</span>
                    <span className="text-[11px] text-muted-foreground">{badge.subtitle || 'Description'}</span>
                    {!badge.isActive && (
                      <span className="text-[9px] font-bold text-destructive uppercase tracking-wider mt-0.5">Disabled</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Badges Editor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {(settings.trustBadges || []).map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border bg-card shadow-sm space-y-4 transition-colors ${
                    badge.isActive !== false ? 'border-border' : 'border-border/60 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {badge.iconType === 'image' && badge.image ? (
                          <img
                            src={badge.image.startsWith('http') ? badge.image : (badge.image.startsWith('/') ? badge.image : `/${badge.image}`)}
                            alt="Badge preview"
                            className="w-5 h-5 object-contain"
                          />
                        ) : (
                          <DynamicBadgeIcon name={badge.icon} size={16} color={badge.color || '#16a34a'} />
                        )}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide text-primary">Badge #{idx + 1}</span>
                    </div>

                    {/* High-visibility Active Switch */}
                    <button
                      type="button"
                      onClick={() => updateBadge(idx, 'isActive', badge.isActive === false)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        badge.isActive !== false
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                          : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'}`} />
                      {badge.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Icon vs Custom Image Switcher */}
                  <div className="flex rounded-lg bg-muted/60 p-1 border border-border">
                    <button
                      type="button"
                      onClick={() => updateBadge(idx, 'iconType', 'icon')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        badge.iconType !== 'image' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Sparkles size={13} /> Vector Icon
                    </button>
                    <button
                      type="button"
                      onClick={() => updateBadge(idx, 'iconType', 'image')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        badge.iconType === 'image' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <ImageIcon size={13} /> Custom Image
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Title</label>
                    <input
                      type="text"
                      value={badge.title || ''}
                      onChange={e => updateBadge(idx, 'title', e.target.value)}
                      placeholder="e.g. 100% Quality"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Subtitle</label>
                    <input
                      type="text"
                      value={badge.subtitle || ''}
                      onChange={e => updateBadge(idx, 'subtitle', e.target.value)}
                      placeholder="e.g. Guaranteed Fresh"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                    />
                  </div>

                  {/* Image Upload Mode */}
                  {badge.iconType === 'image' ? (
                    <div className="space-y-2.5 pt-1">
                      <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                        <span>Badge Image</span>
                        {badge.image && <span className="text-[10px] text-emerald-500 font-medium">✓ Image Selected</span>}
                      </label>

                      {badge.image ? (
                        <div className="relative flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background">
                          <img
                            src={badge.image.startsWith('http') ? badge.image : (badge.image.startsWith('/') ? badge.image : `/${badge.image}`)}
                            alt="Badge thumbnail"
                            className="w-10 h-10 object-contain rounded bg-muted/20 p-1 border border-border/50"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{badge.image.split('/').pop()}</p>
                            <p className="text-[10px] text-muted-foreground">Uploaded Custom Image</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateBadge(idx, 'image', '')}
                            title="Remove image"
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
                          {uploadingIdx === idx ? (
                            <div className="flex flex-col items-center gap-1.5 py-1 text-primary">
                              <Loader2 size={20} className="animate-spin" />
                              <span className="text-xs font-medium">Uploading image...</span>
                            </div>
                          ) : (
                            <>
                              <Upload size={20} className="text-muted-foreground mb-1" />
                              <span className="text-xs font-medium text-foreground">Upload Custom Image / Icon</span>
                              <span className="text-[10px] text-muted-foreground mt-0.5">PNG, SVG, JPG, WebP</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingIdx === idx}
                            onChange={e => {
                              if (e.target.files?.[0]) handleImageUpload(idx, e.target.files[0]);
                            }}
                          />
                        </label>
                      )}

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Image URL</label>
                        <input
                          type="text"
                          value={badge.image || ''}
                          onChange={e => updateBadge(idx, 'image', e.target.value)}
                          placeholder="https://... or /uploads/..."
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Vector Icon Mode */
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Icon Preset</label>
                        <span className="text-[10px] text-muted-foreground font-mono">({badge.icon || 'ShieldCheck'})</span>
                      </div>
                      <CustomSelect
                        value={ICON_CATEGORIES.some(c => c.icons.some(i => i.id === badge.icon)) ? badge.icon : 'custom'}
                        onChange={val => {
                          if (val !== 'custom') {
                            updateBadge(idx, 'icon', val);
                          }
                        }}
                        size="sm"
                        options={[
                          ...ICON_CATEGORIES.flatMap(cat =>
                            cat.icons.map(ic => ({
                              value: ic.id,
                              label: `${ic.label} (${ic.id})`,
                              desc: cat.category
                            }))
                          ),
                          { value: 'custom', label: '✏️ Enter Custom Icon Name...' }
                        ]}
                      />

                      <div className="pt-1 space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
                          <span>Custom Icon Name</span>
                          <a href="https://lucide.dev/icons" target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px]">
                            Browse 1000+ Icons ↗
                          </a>
                        </label>
                        <input
                          type="text"
                          value={badge.icon || ''}
                          onChange={e => updateBadge(idx, 'icon', e.target.value)}
                          placeholder="e.g. Gift, Crown, Percent, Flame..."
                          className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 pt-1 border-t border-border/50">
                        <label className="text-xs font-medium text-muted-foreground">Accent Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={badge.color || '#16a34a'}
                            onChange={e => updateBadge(idx, 'color', e.target.value)}
                            className="h-9 w-10 p-0.5 border border-input rounded-md cursor-pointer bg-background"
                          />
                          <input
                            type="text"
                            value={badge.color || '#16a34a'}
                            onChange={e => updateBadge(idx, 'color', e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 5. Product Catalog Filter Modules & Custom Filters ── */}
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 bg-muted/20 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold leading-none tracking-tight">Product Catalog Filter &amp; Search Controls</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5">
                Enable or disable standard ecommerce filter modules (price slider, ratings, stock, tags) and configure custom category attributes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddFilterModal(!showAddFilterModal)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-input rounded-md text-xs font-medium bg-background hover:bg-muted transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> Add Custom Filter
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Pre-built filter toggles */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Pre-Built Storefront Filter Modules
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'showCategoryFilter', label: 'Category Filter', desc: 'Category tree selector on catalog sidebar' },
                  { key: 'showPriceFilter', label: 'Price Range Brackets', desc: 'Pre-set budget ranges & min/max inputs' },
                  { key: 'showRatingFilter', label: 'Customer Rating (4★+)', desc: 'Filter products by verified reviews rating' },
                  { key: 'showInStockFilter', label: 'In-Stock Only Filter', desc: 'Quick switch to hide out-of-stock items' },
                  { key: 'showDiscountFilter', label: 'Discount & Offers Filter', desc: 'Filter products with active sale discount' },
                  { key: 'showTagsFilter', label: 'Product Tags / Highlights', desc: 'Filter by bestseller, trending, seasonal tags' },
                ].map(item => {
                  const isChecked = settings.catalogFilterSettings?.[item.key] !== false;
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleFilterOption(item.key)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isChecked ? 'bg-primary/5 border-primary/40 shadow-xs' : 'bg-muted/10 border-border opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                          <span>{item.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isChecked ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                            {isChecked ? 'ACTIVE' : 'OFF'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Filter Add Form Modal / Inline Box */}
            {showAddFilterModal && (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-primary" /> Create New Custom Filter Module
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddFilterModal(false)}
                    className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Filter Title / Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Flower Color, Flavor, Material..."
                      value={newCustomFilter.label}
                      onChange={e => setNewCustomFilter({ ...newCustomFilter, label: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Filter Key / Attribute (slug)</label>
                    <input
                      type="text"
                      placeholder="e.g. color, flavor (auto-generated if empty)"
                      value={newCustomFilter.key}
                      onChange={e => setNewCustomFilter({ ...newCustomFilter, key: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Filter Options (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Red, Pink, White, Yellow, Purple, Mixed"
                    value={newCustomFilter.optionsText}
                    onChange={e => setNewCustomFilter({ ...newCustomFilter, optionsText: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Separate selectable values with commas.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleAddCustomFilter}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Add Filter Module
                  </button>
                </div>
              </div>
            )}

            {/* Custom Filters List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                <span>Active Custom Product Filters ({settings.catalogFilterSettings?.customFilters?.length || 0})</span>
              </h4>

              {(!settings.catalogFilterSettings?.customFilters || settings.catalogFilterSettings.customFilters.length === 0) ? (
                <div className="p-6 text-center border border-dashed border-border rounded-xl text-sm text-muted-foreground">
                  No custom filters added yet. Click &quot;Add Custom Filter&quot; above to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {settings.catalogFilterSettings.customFilters.map((flt) => (
                    <div
                      key={flt.id || flt.key}
                      className="p-4 rounded-xl border border-border bg-card flex flex-col justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{flt.label}</span>
                            <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              key: {flt.key}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCustomFilter(flt.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                flt.isActive !== false
                                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                  : 'bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              {flt.isActive !== false ? 'ACTIVE' : 'DISABLED'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomFilter(flt.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete filter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Options preview tag list */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {flt.options?.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className="text-xs bg-muted/60 text-foreground px-2 py-0.5 rounded-md border border-border/60"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Card: Product Carousel & Recommendation Headings ── */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold leading-none tracking-tight">Product Carousels &amp; Recommendation Headings</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              Customize the top badge tagline, main section title, and descriptive subtitle for both the &quot;Recently Viewed&quot; and &quot;You Might Also Like&quot; carousels across the storefront.
            </p>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Panel: Recently Viewed by You */}
              <div className="p-5 rounded-xl border border-border bg-background/50 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-sm text-foreground">1. &quot;Recently Viewed&quot; Carousel</h4>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Storewide</span>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold flex items-center justify-between">
                      <span>Top Badge Tagline Text</span>
                      <span className="text-[10px] text-muted-foreground">Pill tag at top of divider</span>
                    </label>
                    <input
                      type="text"
                      value={settings.recentlyViewedSettings?.badgeText || ''}
                      onChange={e => setSettings({
                        ...settings,
                        recentlyViewedSettings: {
                          ...settings.recentlyViewedSettings,
                          badgeText: e.target.value
                        }
                      })}
                      placeholder="e.g. Pick Up Where You Left Off"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold flex items-center justify-between">
                      <span>Main Section Title</span>
                      <span className="text-[10px] text-muted-foreground">Main H3 heading</span>
                    </label>
                    <input
                      type="text"
                      value={settings.recentlyViewedSettings?.title || ''}
                      onChange={e => setSettings({
                        ...settings,
                        recentlyViewedSettings: {
                          ...settings.recentlyViewedSettings,
                          title: e.target.value
                        }
                      })}
                      placeholder="e.g. Recently Viewed by You"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs font-medium"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold flex items-center justify-between">
                      <span>Subheading / Description</span>
                      <span className="text-[10px] text-muted-foreground">Subtitle below title</span>
                    </label>
                    <input
                      type="text"
                      value={settings.recentlyViewedSettings?.subtitle || ''}
                      onChange={e => setSettings({
                        ...settings,
                        recentlyViewedSettings: {
                          ...settings.recentlyViewedSettings,
                          subtitle: e.target.value
                        }
                      })}
                      placeholder="e.g. Products you browsed during your recent visits"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                    />
                  </div>
                </div>

                {/* Live Storefront Visual Preview */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Live Storefront Header Preview:</span>
                  <div className="p-4 rounded-lg bg-card border border-border text-center shadow-xs">
                    {settings.recentlyViewedSettings?.badgeText && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1.5">
                        <Sparkles size={10} /> {settings.recentlyViewedSettings.badgeText}
                      </span>
                    )}
                    <h5 className="font-extrabold text-sm text-foreground flex items-center justify-center gap-1.5 m-0">
                      <History size={14} className="text-emerald-600" /> {settings.recentlyViewedSettings?.title || 'Recently Viewed by You'}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1 mb-0">
                      {settings.recentlyViewedSettings?.subtitle || 'Products you browsed during your recent visits'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Panel: You Might Also Like */}
              <div className="p-5 rounded-xl border border-border bg-background/50 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-sm text-foreground">2. &quot;You Might Also Like&quot; Carousel</h4>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Product Detail Page</span>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold flex items-center justify-between">
                      <span>Top Badge Tagline Text</span>
                      <span className="text-[10px] text-muted-foreground">Pill tag at top of divider</span>
                    </label>
                    <input
                      type="text"
                      value={settings.relatedProductsSettings?.badgeText || ''}
                      onChange={e => setSettings({
                        ...settings,
                        relatedProductsSettings: {
                          ...settings.relatedProductsSettings,
                          badgeText: e.target.value
                        }
                      })}
                      placeholder="e.g. Handpicked Recommendations"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold flex items-center justify-between">
                      <span>Main Section Title</span>
                      <span className="text-[10px] text-muted-foreground">Main H3 heading</span>
                    </label>
                    <input
                      type="text"
                      value={settings.relatedProductsSettings?.title || ''}
                      onChange={e => setSettings({
                        ...settings,
                        relatedProductsSettings: {
                          ...settings.relatedProductsSettings,
                          title: e.target.value
                        }
                      })}
                      placeholder="e.g. You Might Also Like"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs font-medium"
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-semibold flex items-center justify-between">
                      <span>Subheading / Description</span>
                      <span className="text-[10px] text-muted-foreground">Subtitle below title</span>
                    </label>
                    <input
                      type="text"
                      value={settings.relatedProductsSettings?.subtitle || ''}
                      onChange={e => setSettings({
                        ...settings,
                        relatedProductsSettings: {
                          ...settings.relatedProductsSettings,
                          subtitle: e.target.value
                        }
                      })}
                      placeholder="e.g. Curated choices and similar gifts loved by customers"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                    />
                  </div>
                </div>

                {/* Live Storefront Visual Preview */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">Live Storefront Header Preview:</span>
                  <div className="p-4 rounded-lg bg-card border border-border text-center shadow-xs">
                    {settings.relatedProductsSettings?.badgeText && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1.5">
                        <Sparkles size={10} /> {settings.relatedProductsSettings.badgeText}
                      </span>
                    )}
                    <h5 className="font-extrabold text-sm text-foreground flex items-center justify-center gap-1.5 m-0">
                      <Sparkles size={14} className="text-emerald-600" /> {settings.relatedProductsSettings?.title || 'You Might Also Like'}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1 mb-0">
                      {settings.relatedProductsSettings?.subtitle || 'Curated choices and similar gifts loved by customers'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Settings...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
