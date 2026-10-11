'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input';
import { Save, Loader2, Building2, MapPin, Mail, Phone, Globe, FileText } from 'lucide-react';
import Toast from '@/components/dashboard/Toast';

export default function InvoiceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    companyName: '',
    companyAddress: '',
    supportEmail: '',
    supportPhone: '',
    websiteUrl: '',
    taxId: '',
    taxId: '',
    terms: ''
  });
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => {
    setToasts((t) => [...t, { id: Date.now(), message: msg, type }]);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/settings/invoice');
      const json = await res.json();
      if (json.success && json.settings) {
        setData(json.settings);
      }
    } catch (err) {
      addToast('Failed to load invoice settings', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 600));
      
      const saveRequest = fetch('/api/admin/settings/invoice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const [res] = await Promise.all([saveRequest, minDelay]);
      const json = await res.json();
      
      if (json.success) {
        addToast(json.message || 'Settings saved successfully', 'success');
      } else {
        addToast(json.message || 'Failed to save settings', 'error');
      }
    } catch (error) {
      addToast('Network error while saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb
        title="Invoice Settings"
        subtitle="Manage company details, contact info, and tax/terms displayed on customer invoices."
        crumbs={[
          { label: 'Storefront Management', href: '/dashboard/ecommerce' },
          { label: 'Invoice Settings' }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 size={18} className="text-muted-foreground" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FloatingInput
                label="Company Name"
                name="companyName"
                value={data.companyName || ''}
                onChange={handleChange}
                placeholder="e.g. CityShop"
              />
              <FloatingInput
                label="Tax ID / GSTIN"
                name="taxId"
                value={data.taxId || ''}
                onChange={handleChange}
                placeholder="e.g. 07XXXXXXXXXX1Z5"
              />
              <FloatingTextarea
                label="Company Full Address"
                name="companyAddress"
                value={data.companyAddress || ''}
                onChange={handleChange}
                placeholder="e.g. 123 Tech Park..."
                rows={3}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText size={18} className="text-muted-foreground" />
                Terms & Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">These terms will appear at the bottom of the invoice.</p>
              <FloatingTextarea
                label="Invoice Terms"
                name="terms"
                value={data.terms || ''}
                onChange={handleChange}
                rows={5}
                placeholder="1. Returns accepted..."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FloatingInput
                label="Support Email"
                name="supportEmail"
                value={data.supportEmail || ''}
                onChange={handleChange}
              />
              <FloatingInput
                label="Support Phone"
                name="supportPhone"
                value={data.supportPhone || ''}
                onChange={handleChange}
              />
              <FloatingInput
                label="Website URL"
                name="websiteUrl"
                value={data.websiteUrl || ''}
                onChange={handleChange}
              />
            </CardContent>
            <CardFooter className="flex justify-end border-t border-white/5 pt-4">
              <Button onClick={handleSave} disabled={saving} className="bg-[var(--fnp-green)] hover:bg-emerald-600 text-white flex items-center gap-2 px-6">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <Toast toasts={toasts} onRemove={(id) => setToasts(toasts.filter(t => t.id !== id))} />
    </div>
  );
}
