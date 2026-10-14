'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Ticket, Percent, IndianRupee, Calendar, AlertCircle, Sparkles, Check, Clock, Users, UserPlus, Mail, Repeat, EyeOff, Eye } from 'lucide-react';

export default function CouponModal({ coupon, onClose, onSave }) {
  const isEdit = Boolean(coupon && coupon !== 'new');

  const [form, setForm] = useState({
    code: isEdit ? (coupon.code || '') : '',
    description: isEdit ? (coupon.description || '') : '',
    discountType: isEdit ? (coupon.discountType || 'percentage') : 'percentage',
    discountValue: isEdit ? (coupon.discountValue ?? '') : '',
    minOrderValue: isEdit ? (coupon.minOrderValue ?? 0) : 0,
    expiresAt: isEdit && coupon.expiresAt
      ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
      : '',
    isActive: isEdit ? (coupon.isActive !== false) : true,
    isSecret: isEdit ? Boolean(coupon.isSecret) : false,
    targetAudience: isEdit ? (coupon.targetAudience || 'all') : 'all',
    targetEmail: isEdit ? (coupon.targetEmail || '') : '',
    maxUsesPerUser: isEdit ? (coupon.maxUsesPerUser ?? 1) : 1,
    usageLimit: isEdit ? (coupon.usageLimit ?? 0) : 0
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formattedCode = form.code.trim().toUpperCase();
    if (!formattedCode) {
      setError('Coupon code is required');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required');
      return;
    }
    const val = Number(form.discountValue);
    if (isNaN(val) || val <= 0) {
      setError('Discount value must be greater than 0');
      return;
    }
    if (form.discountType === 'percentage' && val > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }
    if (form.targetAudience === 'specific_customer') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.targetEmail.trim() || !emailRegex.test(form.targetEmail.trim())) {
        setError('Please enter a valid customer email for this targeted coupon');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        code: formattedCode,
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: val,
        minOrderValue: Number(form.minOrderValue) || 0,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        isActive: form.isActive,
        isSecret: Boolean(form.isSecret),
        targetAudience: form.targetAudience,
        targetEmail: form.targetAudience === 'specific_customer' ? form.targetEmail.trim().toLowerCase() : '',
        maxUsesPerUser: Math.max(1, Number(form.maxUsesPerUser) || 1),
        usageLimit: Math.max(0, Number(form.usageLimit) || 0)
      };

      const url = isEdit ? `/api/admin/coupons/${coupon._id}` : '/api/admin/coupons';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save coupon');
      }

      onSave(data.coupon);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const discountBadgeText = form.discountType === 'percentage'
    ? `${form.discountValue ? form.discountValue : '0'}% OFF`
    : `₹${form.discountValue ? Number(form.discountValue).toLocaleString('en-IN') : '0'} OFF`;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Ticket size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                {isEdit ? `Edit Coupon "${coupon.code}"` : 'Create New Coupon'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEdit ? 'Update discount rules, minimum spend, or expiration date.' : 'Configure a promo code to offer percentage or fixed bill discounts.'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form id="coupon-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Live Customer Preview */}
          <div className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles size={13} /> Customer Preview in Cart
              </span>
              <div className="flex items-center gap-1.5">
                {form.isSecret && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <EyeOff size={10} /> Hidden / Secret
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  form.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                }`}>
                  {form.isActive ? 'Active' : 'Draft / Inactive'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border shadow-xs">
              <div>
                <div className="font-mono font-black text-sm tracking-widest text-primary uppercase">
                  {form.code.trim() ? form.code.trim().toUpperCase() : 'COUPONCODE'}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {form.description.trim() || 'Add a friendly offer description'}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {Number(form.minOrderValue) > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                      Min order: <strong>₹{Number(form.minOrderValue).toLocaleString('en-IN')}</strong>
                    </span>
                  )}
                  {form.targetAudience === 'first_time' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      ★ 1st Order Only
                    </span>
                  )}
                  {form.targetAudience === 'specific_customer' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 truncate max-w-[220px]" title={form.targetEmail || 'Single customer'}>
                      🔒 {form.targetEmail ? form.targetEmail : 'Specific Customer'}
                    </span>
                  )}
                  {form.targetAudience === 'returning' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      ★ Returning VIP
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-primary text-primary-foreground">
                  {discountBadgeText}
                </span>
                {form.expiresAt && (
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                    <Clock size={10} /> Exp: {form.expiresAt}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                Promo Code <span className="text-destructive">*</span>
              </label>
              <Input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                placeholder="e.g. FESTIVE20"
                className="h-10 text-sm font-mono font-bold tracking-wider uppercase"
                required
              />
              <span className="text-[10px] text-muted-foreground">Spaces removed automatically</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                Discount Type <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 h-10">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, discountType: 'percentage' })}
                  className={`flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.discountType === 'percentage'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background hover:bg-muted text-muted-foreground border-border'
                  }`}
                >
                  <Percent size={14} /> Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, discountType: 'fixed' })}
                  className={`flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.discountType === 'fixed'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background hover:bg-muted text-muted-foreground border-border'
                  }`}
                >
                  <IndianRupee size={14} /> Flat Amount
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
              Offer Description <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Get 20% off on all gift orders above ₹999"
              className="h-10 text-sm"
              required
            />
          </div>

          {/* Value, Min Order, Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                {form.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'} <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max={form.discountType === 'percentage' ? '100' : undefined}
                value={form.discountValue}
                onChange={e => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === 'percentage' ? '10' : '100'}
                className="h-10 text-sm font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                Min Order (₹)
              </label>
              <Input
                type="number"
                min="0"
                value={form.minOrderValue}
                onChange={e => setForm({ ...form, minOrderValue: e.target.value })}
                placeholder="0"
                className="h-10 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">0 for no minimum</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                Expiration Date
              </label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="h-10 text-xs font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Optional deadline</span>
            </div>
          </div>

          {/* Target Audience & Conditional Eligibility */}
          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                <Users size={14} className="text-primary" /> Target Audience &amp; Eligibility
              </label>
              <span className="text-[10px] text-muted-foreground">Select customer condition</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'all',
                  label: 'All Customers',
                  desc: 'Public coupon code valid for all guest and registered shoppers',
                  icon: Users
                },
                {
                  id: 'first_time',
                  label: 'New Customers Only',
                  desc: 'Auto-restricted to first-time shoppers (0 previous orders)',
                  icon: UserPlus
                },
                {
                  id: 'specific_customer',
                  label: 'Specific Customer',
                  desc: 'Locked to a specific registered customer email address',
                  icon: Mail
                },
                {
                  id: 'returning',
                  label: 'Returning VIPs',
                  desc: 'Exclusive for repeat customers with at least 1 previous order',
                  icon: Repeat
                }
              ].map(aud => {
                const Icon = aud.icon;
                const isSelected = form.targetAudience === aud.id;
                return (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setForm({ ...form, targetAudience: aud.id })}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-xs'
                        : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {aud.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        {aud.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Specific Customer Email Input */}
            {form.targetAudience === 'specific_customer' && (
              <div className="pt-3 border-t border-border space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                  <Mail size={13} className="text-primary" /> Target Customer Email <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  value={form.targetEmail}
                  onChange={e => setForm({ ...form, targetEmail: e.target.value.toLowerCase().trim() })}
                  placeholder="e.g. customer@example.com"
                  className="h-10 text-sm font-mono"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  This coupon will be hidden from other shoppers and only redeemable when this specific customer is checked out.
                </p>
              </div>
            )}
          </div>

          {/* Usage Limit Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                Per-Customer Limit
              </label>
              <Input
                type="number"
                min="1"
                value={form.maxUsesPerUser}
                onChange={e => setForm({ ...form, maxUsesPerUser: e.target.value })}
                placeholder="1"
                className="h-10 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">Max times each customer can redeem (default 1)</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                Total Redemptions Cap
              </label>
              <Input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                placeholder="0"
                className="h-10 text-sm font-mono"
              />
              <span className="text-[10px] text-muted-foreground">0 for unlimited claims across all customers</span>
            </div>
          </div>

          {/* Secret / Hidden Promo Code Switch */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <EyeOff size={14} className="text-amber-600 dark:text-amber-400" />
                Secret Promo Code (Manual Code Entry Only)
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {form.isSecret
                  ? 'Hidden from storefront & cart coupon drawers. Shoppers can only apply it by manually typing the code (great for influencer campaigns, private VIPs, or printed marketing).'
                  : 'Publicly visible — Eligible shoppers can see and pick this coupon directly from the cart drawer.'}
              </div>
            </div>
            <Switch
              checked={form.isSecret}
              onCheckedChange={v => setForm({ ...form, isSecret: v })}
            />
          </div>

          {/* Active Status */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-foreground">Coupon Status</div>
              <div className="text-xs text-muted-foreground">
                {form.isActive ? 'Active — Customers can apply this code at checkout.' : 'Inactive — Coupon is saved as a draft and cannot be redeemed.'}
              </div>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={v => setForm({ ...form, isActive: v })}
            />
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="coupon-form" size="sm" disabled={saving} className="gap-1.5">
            {saving ? 'Saving...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
