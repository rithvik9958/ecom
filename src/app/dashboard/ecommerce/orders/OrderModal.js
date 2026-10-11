'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Toast from '@/components/dashboard/Toast';
import CustomSelect from '@/components/ui/CustomSelect';
import {
  Truck, Package, Clock, CheckCircle2, XCircle, ExternalLink, Save,
  Loader2, MapPin, RotateCcw, User, Phone, Mail, Calendar,
  CreditCard, ChevronRight, AlertCircle, Send, Check, ShieldCheck, ArrowRight
} from 'lucide-react';

const COURIER_PRESETS = [
  { name: 'Blue Dart', trackingUrlPattern: 'https://www.bluedart.com/tracking?trackNumber=' },
  { name: 'Delhivery', trackingUrlPattern: 'https://www.delhivery.com/track/package/' },
  { name: 'DTDC', trackingUrlPattern: 'https://www.dtdc.in/tracking.asp?strCnno=' },
  { name: 'Shadowfax', trackingUrlPattern: 'https://tracker.shadowfax.in/#/' },
  { name: 'Dunzo', trackingUrlPattern: 'https://www.dunzo.com/track/' },
  { name: 'Ekart Logistics', trackingUrlPattern: 'https://ekartlogistics.com/track/' },
  { name: 'Ecom Express', trackingUrlPattern: 'https://ecomexpress.in/tracking/?awb=' },
  { name: 'In-House Express Driver', trackingUrlPattern: '' },
  { name: 'Other / Custom', trackingUrlPattern: '' }
];

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Received & awaiting fulfillment' },
  { key: 'processing', label: 'Processing', desc: 'Packed & ready for dispatch' },
  { key: 'shipped', label: 'Dispatched', desc: 'In transit with courier' },
  { key: 'delivered', label: 'Delivered', desc: 'Successfully handed over' },
];

export default function OrderModal({ order, onClose, onSave, onToast }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [activeTab, setActiveTab] = useState('overview');

  // Shipment states
  const [courier, setCourier] = useState(order?.courier || '');
  const [trackingNumber, setTrackingNumber] = useState(order?.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState(order?.trackingUrl || '');
  const [deliveryNotes, setDeliveryNotes] = useState(order?.deliveryNotes || '');
  const [newTimelineNote, setNewTimelineNote] = useState('');

  // Target-specific loading state (e.g. 'shipped', 'tracking', 'note', etc.)
  const [updatingAction, setUpdatingAction] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Return & Replacement states
  const [returnStatus, setReturnStatus] = useState(order?.returnRequest?.status || '');
  const [returnAdminNote, setReturnAdminNote] = useState(order?.returnRequest?.adminNote || '');
  const [returnTrackingNumber, setReturnTrackingNumber] = useState(order?.returnRequest?.trackingNumber || '');
  const [refundRefNumber, setRefundRefNumber] = useState(order?.returnRequest?.refundRefNumber || '');

  useEffect(() => {
    if (order) {
      setCurrentOrder(order);
      setCourier(order.courier || '');
      setTrackingNumber(order.trackingNumber || '');
      setTrackingUrl(order.trackingUrl || '');
      setDeliveryNotes(order.deliveryNotes || '');
      setReturnStatus(order.returnRequest?.status || '');
      setReturnAdminNote(order.returnRequest?.adminNote || '');
      setReturnTrackingNumber(order.returnRequest?.trackingNumber || '');
      setRefundRefNumber(order.returnRequest?.refundRefNumber || '');
    }
  }, [order]);

  if (!currentOrder) return null;

  const showToast = (message, type = 'success') => {
    setToasts(prev => [...prev, { id: Date.now() + Math.random(), message, type }]);
    if (onToast) onToast(message, type);
  };

  const getStatusVariant = (s) => {
    switch (s) {
      case 'paid': case 'delivered': return 'success';
      case 'pending': case 'processing': return 'warning';
      case 'shipped': return 'info';
      case 'cancelled': case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  // Status transition handler with non-blocking target loader
  const handleUpdateStatus = async (newStatus) => {
    if (updatingAction) return;
    setUpdatingAction(newStatus);

    // Optimistic local update
    const previousOrder = { ...currentOrder };
    setCurrentOrder(prev => ({ ...prev, status: newStatus }));

    try {
      const res = await fetch(`/api/admin/store-orders/${currentOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          courier,
          trackingNumber,
          trackingUrl,
          deliveryNotes
        })
      });
      if (!res.ok) throw new Error('Failed to update order status');
      const updated = await res.json();
      setCurrentOrder(updated);
      onSave(updated);
      showToast(`Order status updated to ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
      setCurrentOrder(previousOrder);
      showToast(err.message || 'Error updating status', 'error');
    } finally {
      setUpdatingAction(null);
    }
  };

  // Payment Status update handler
  const handleUpdatePaymentStatus = async (newPaymentStatus) => {
    if (updatingAction) return;
    setUpdatingAction(`pay_${newPaymentStatus}`);

    const previousOrder = { ...currentOrder };
    setCurrentOrder(prev => ({ ...prev, paymentStatus: newPaymentStatus }));

    try {
      const res = await fetch(`/api/admin/store-orders/${currentOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentStatus: newPaymentStatus
        })
      });
      if (!res.ok) throw new Error('Failed to update payment status');
      const updated = await res.json();
      setCurrentOrder(updated);
      onSave(updated);
      showToast(`Payment status updated to ${newPaymentStatus.toUpperCase()}`, 'success');
    } catch (err) {
      setCurrentOrder(previousOrder);
      showToast(err.message || 'Error updating payment status', 'error');
    } finally {
      setUpdatingAction(null);
    }
  };

  // Save shipment & tracking information
  const handleSaveTracking = async () => {
    if (updatingAction) return;
    setUpdatingAction('tracking');

    try {
      const res = await fetch(`/api/admin/store-orders/${currentOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier,
          trackingNumber,
          trackingUrl,
          deliveryNotes,
          addTimelineNote: trackingNumber ? `Shipment updated: ${courier || 'Courier'} (AWB: ${trackingNumber})` : undefined
        })
      });
      if (!res.ok) throw new Error('Failed to save tracking details');
      const updated = await res.json();
      setCurrentOrder(updated);
      onSave(updated);
      showToast('Shipment & live tracking saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Error saving shipment info', 'error');
    } finally {
      setUpdatingAction(null);
    }
  };

  // Add a manual note to timeline
  const handleAddTimelineNote = async (e) => {
    e.preventDefault();
    if (!newTimelineNote.trim() || updatingAction) return;
    setUpdatingAction('note');

    try {
      const res = await fetch(`/api/admin/store-orders/${currentOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addTimelineNote: newTimelineNote.trim()
        })
      });
      if (!res.ok) throw new Error('Failed to add note');
      const updated = await res.json();
      setCurrentOrder(updated);
      onSave(updated);
      setNewTimelineNote('');
      showToast('Note added to audit timeline', 'success');
    } catch (err) {
      showToast(err.message || 'Error adding note', 'error');
    } finally {
      setUpdatingAction(null);
    }
  };

  // Return & Replacement update handler
  const handleUpdateReturnStatus = async (newStatus) => {
    if (updatingAction) return;
    setUpdatingAction(`return_${newStatus}`);

    try {
      const res = await fetch(`/api/admin/store-orders/${currentOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnRequestStatus: newStatus,
          returnAdminNote,
          returnTrackingNumber,
          refundRefNumber
        })
      });
      if (!res.ok) throw new Error('Failed to update return status');
      const updated = await res.json();
      setCurrentOrder(updated);
      onSave(updated);
      setReturnStatus(newStatus);
      showToast(`Return status updated to ${newStatus.replace(/_/g, ' ').toUpperCase()}`, 'success');
    } catch (err) {
      showToast(err.message || 'Error updating return request', 'error');
    } finally {
      setUpdatingAction(null);
    }
  };

  const handleCourierSelect = (selectedName) => {
    setCourier(selectedName);
    const preset = COURIER_PRESETS.find(p => p.name === selectedName);
    if (preset && preset.trackingUrlPattern && trackingNumber) {
      setTrackingUrl(`${preset.trackingUrlPattern}${trackingNumber}`);
    }
  };

  const handleTrackingNumberChange = (num) => {
    setTrackingNumber(num);
    const preset = COURIER_PRESETS.find(p => p.name === courier);
    if (preset && preset.trackingUrlPattern && num) {
      setTrackingUrl(`${preset.trackingUrlPattern}${num}`);
    }
  };

  // Compute order lifecycle progress index
  const currentStepIndex = ORDER_STEPS.findIndex(s => s.key === currentOrder.status);
  const isCancelled = currentOrder.status === 'cancelled';

  // Compute financial totals
  const subtotal = (currentOrder.items || []).reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const total = Number(currentOrder.total) || subtotal;
  const discount = currentOrder.discount || 0;
  const deliveryFee = currentOrder.deliveryFee || 0;

  const paymentMode = (() => {
    const rawMethod = String(currentOrder.paymentMethod || '').toLowerCase().trim();
    const hasStripe = Boolean(currentOrder.stripeSessionId);
    if (hasStripe || rawMethod === 'stripe' || rawMethod === 'card') return 'Card / Online';
    if (rawMethod === 'upi') return 'UPI Payment';
    return 'Cash on Delivery (COD)';
  })();

  const tabs = [
    { id: 'overview', label: 'Order Items & Total', icon: Package, count: currentOrder.items?.length },
    { id: 'logistics', label: 'Customer & Shipping', icon: Truck },
    { id: 'timeline', label: 'Timeline History', icon: Clock, count: currentOrder.timeline?.length },
    ...(currentOrder.returnRequest && currentOrder.returnRequest.status ? [{ id: 'returns', label: 'Return & Refund', icon: RotateCcw, alert: true }] : [])
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Sticky Header */}
        <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Package size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Order #{currentOrder._id.substring(currentOrder._id.length - 8).toUpperCase()}
                  </DialogTitle>
                  <Badge variant={getStatusVariant(currentOrder.status)} className="capitalize font-semibold text-xs">
                    {currentOrder.status}
                  </Badge>
                  {isCancelled && (
                    <Badge variant="destructive" className="font-semibold text-xs">
                      Cancelled
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>Placed on {new Date(currentOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span>•</span>
                  <span>ID: <code className="font-mono text-[11px]">{currentOrder._id}</code></span>
                </p>
              </div>
            </div>

            {/* Header Quick Status Action / Payment Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs">
                <CreditCard size={13} className="text-muted-foreground" />
                <span className="font-medium">{paymentMode}</span>
                <span className="text-muted-foreground">|</span>
                <span className={`font-bold uppercase text-[11px] ${currentOrder.paymentStatus === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {currentOrder.paymentStatus || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Order Lifecycle Stepper */}
          <div className="mt-4 pt-4 border-t border-border/60">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fulfillment Lifecycle
                </span>
                <span className="text-xs text-muted-foreground">
                  Click any stage to update status instantly
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ORDER_STEPS.map((step, idx) => {
                  const isPast = currentStepIndex > idx && !isCancelled;
                  const isCurrent = currentStepIndex === idx && !isCancelled;
                  const isPendingClick = updatingAction === step.key;

                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => handleUpdateStatus(step.key)}
                      disabled={isCurrent || Boolean(updatingAction)}
                      className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-primary/10 border-primary text-primary shadow-xs'
                          : isPast
                          ? 'bg-muted/40 border-border/80 text-foreground hover:border-primary/50'
                          : 'bg-muted/10 border-border/50 text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : isPast
                            ? 'bg-emerald-600 text-white'
                            : 'bg-muted border border-border text-muted-foreground'
                        }`}
                      >
                        {isPendingClick ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : isPast ? (
                          <Check size={13} />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">{step.label}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{step.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cancel Button Option */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-muted-foreground">
                  Quick Actions:
                </div>
                <div className="flex items-center gap-2">
                  {currentOrder.paymentStatus !== 'paid' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      disabled={Boolean(updatingAction)}
                      onClick={() => handleUpdatePaymentStatus('paid')}
                    >
                      {updatingAction === 'pay_paid' ? <Loader2 size={12} className="animate-spin mr-1" /> : <CheckCircle2 size={12} className="mr-1" />}
                      Mark Paid
                    </Button>
                  )}
                  {currentOrder.paymentStatus === 'paid' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      disabled={Boolean(updatingAction)}
                      onClick={() => handleUpdatePaymentStatus('pending')}
                    >
                      {updatingAction === 'pay_pending' ? <Loader2 size={12} className="animate-spin mr-1" /> : <Clock size={12} className="mr-1" />}
                      Mark Payment Pending
                    </Button>
                  )}
                  {!isCancelled ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={Boolean(updatingAction)}
                      onClick={() => handleUpdateStatus('cancelled')}
                    >
                      {updatingAction === 'cancelled' ? <Loader2 size={12} className="animate-spin mr-1" /> : <XCircle size={12} className="mr-1" />}
                      Cancel Order
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10"
                      disabled={Boolean(updatingAction)}
                      onClick={() => handleUpdateStatus('pending')}
                    >
                      {updatingAction === 'pending' ? <Loader2 size={12} className="animate-spin mr-1" /> : <RotateCcw size={12} className="mr-1" />}
                      Reactivate Order
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-border mt-3 -mb-4 pb-3 px-1 overflow-x-auto no-scrollbar">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'
                    }`}>
                      {t.count}
                    </span>
                  )}
                  {t.alert && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ORDER ITEMS & FINANCIALS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Order Items Table */}
              <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
                <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Package size={15} className="text-primary" />
                    Items Ordered ({currentOrder.items?.length || 0})
                  </h4>
                  <span className="text-xs font-medium text-muted-foreground">
                    Subtotal: ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/20 border-b border-border text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Product</th>
                        <th className="px-4 py-2.5">Price</th>
                        <th className="px-4 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {currentOrder.items?.map((item, i) => {
                        const vAttrs = item.selectedVariantAttrs || item.variant?.attrs;
                        const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);

                        return (
                          <tr key={i} className="hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-muted border border-border/80 overflow-hidden shrink-0 flex items-center justify-center">
                                  {item.image ? (
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package size={20} className="text-muted-foreground/50" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{item.title}</div>
                                  {vAttrs && typeof vAttrs === 'object' && Object.keys(vAttrs).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {Object.entries(vAttrs).map(([k, v]) => (
                                        <span key={k} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                                          {k}: <strong className="text-foreground">{String(v)}</strong>
                                        </span>
                                      ))}
                                      {item.sku && (
                                        <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                                          SKU: {item.sku}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                              ₹{Number(item.price || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-xs">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-sm text-foreground font-mono">
                              ₹{itemTotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Financial Breakdown */}
                <div className="p-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {currentOrder.couponCode && (
                      <p className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <Check size={13} /> Coupon Applied: <strong>{currentOrder.couponCode}</strong>
                      </p>
                    )}
                    {currentOrder.deliverySlot && (
                      <p className="flex items-center gap-1.5">
                        <Calendar size={13} /> Requested Slot: {currentOrder.deliveryDate} ({currentOrder.deliverySlot})
                      </p>
                    )}
                  </div>

                  <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items Subtotal:</span>
                      <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Shipping:</span>
                      <span className="font-mono">{deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE'}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold text-foreground">
                      <span>Grand Total:</span>
                      <span className="text-primary text-base font-mono">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Delivery Instructions / Notes (if present) */}
              {currentOrder.orderNotes && (
                <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs">
                  <span className="font-semibold text-foreground block mb-1">Customer Delivery Instructions:</span>
                  <p className="text-muted-foreground italic">"{currentOrder.orderNotes}"</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOMER & LOGISTICS */}
          {activeTab === 'logistics' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Customer & Delivery Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Customer Contact */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User size={15} className="text-primary" />
                    Customer Details
                  </h4>
                  <div className="space-y-1.5 text-foreground">
                    <p className="font-bold text-sm">
                      {currentOrder.address?.firstName} {currentOrder.address?.lastName || currentOrder.customerName || 'Guest User'}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Mail size={13} className="text-primary/70 shrink-0" />
                      <span>{currentOrder.email || 'No email provided'}</span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={13} className="text-primary/70 shrink-0" />
                      <span>{currentOrder.address?.phone || currentOrder.phone || 'No phone provided'}</span>
                    </p>
                  </div>

                  {currentOrder.senderDetails?.name && (
                    <div className="pt-2.5 border-t border-border text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Gifter / Sender:</span> {currentOrder.senderDetails.name} ({currentOrder.senderDetails.phone || 'N/A'})
                    </div>
                  )}
                </div>

                {/* Delivery Address & Slot */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MapPin size={15} className="text-primary" />
                    Delivery Destination
                  </h4>
                  <div className="space-y-1 text-foreground leading-relaxed">
                    <p className="font-semibold">
                      {currentOrder.address?.address || currentOrder.address || 'Address not specified'}
                    </p>
                    <p className="text-muted-foreground">
                      {[currentOrder.address?.city || currentOrder.city, currentOrder.address?.state || currentOrder.state, currentOrder.address?.pincode || currentOrder.postalCode].filter(Boolean).join(', ')}
                    </p>
                  </div>

                  {(currentOrder.deliveryDate || currentOrder.deliverySlot) && (
                    <div className="pt-2.5 border-t border-border flex items-center gap-2 text-[11px]">
                      <Calendar size={13} className="text-primary shrink-0" />
                      <span><strong>Slot:</strong> {currentOrder.deliveryDate} {currentOrder.deliverySlot ? `(${currentOrder.deliverySlot})` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Courier & Tracking Configuration Box */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Truck size={16} className="text-primary" />
                      Courier & Live Tracking Details
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure tracking AWB and driver dispatch notes for customer tracking updates.
                    </p>
                  </div>

                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg w-fit"
                    >
                      Test Tracking Link <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Courier Partner</label>
                    <CustomSelect
                      value={courier}
                      onChange={val => handleCourierSelect(val)}
                      options={COURIER_PRESETS.map(p => ({ value: p.name, label: p.name }))}
                      placeholder="Select Courier..."
                      searchable={true}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">AWB / Tracking Number</label>
                    <input
                      type="text"
                      placeholder="e.g. BLU1298492"
                      className="w-full text-xs h-9 px-3 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      value={trackingNumber}
                      onChange={e => handleTrackingNumberChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tracking URL (auto-generated)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      className="w-full text-xs h-9 px-3 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none font-mono text-[11px]"
                      value={trackingUrl}
                      onChange={e => setTrackingUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Driver / Delivery Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Driver assigned: Ramesh (9876543210), out for afternoon round"
                    className="w-full text-xs h-9 px-3 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveTracking}
                    disabled={updatingAction === 'tracking'}
                    className="gap-1.5 h-9"
                  >
                    {updatingAction === 'tracking' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Shipment & Tracking
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE & AUDIT TRAIL */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Add Note Card */}
              <form onSubmit={handleAddTimelineNote} className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock size={15} className="text-primary" />
                    Log Timeline Event or Internal Note
                  </h4>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Customer called to confirm morning delivery before 11am..."
                    className="flex-1 text-xs h-9 px-3 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    value={newTimelineNote}
                    onChange={e => setNewTimelineNote(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newTimelineNote.trim() || updatingAction === 'note'}
                    className="h-9 gap-1.5"
                  >
                    {updatingAction === 'note' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Add Note
                  </Button>
                </div>
              </form>

              {/* Event Stream */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Event Stream ({currentOrder.timeline?.length || 0} events)
                </h4>

                {Array.isArray(currentOrder.timeline) && currentOrder.timeline.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-[2px] before:bg-border">
                    {currentOrder.timeline.slice().reverse().map((event, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-xs text-foreground capitalize">
                              {event.title || event.status?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(event.time || Date.now()).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/50">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No custom events logged yet. Status transitions and shipment edits are automatically recorded here.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RETURN & REFUND RESOLUTION */}
          {activeTab === 'returns' && currentOrder.returnRequest && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-xl border border-border bg-card space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={18} className="text-amber-600" />
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Return & Refund Request</h4>
                      <p className="text-xs text-muted-foreground">Manage customer return resolution, inspection and refund.</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-bold uppercase text-xs bg-muted border-border">
                    {currentOrder.returnRequest.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-muted/20 p-4 rounded-xl border border-border">
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-0.5">Resolution Requested:</span>
                    <span className="font-bold text-foreground">
                      {currentOrder.returnRequest.returnType === 'replacement' ? '🔄 Replacement Product' : '💰 Full Refund to Payment Method'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-0.5">Reason for Request:</span>
                    <span className="text-foreground">{currentOrder.returnRequest.reason || 'Not specified'}</span>
                  </div>
                  {currentOrder.returnRequest.comment && (
                    <div className="sm:col-span-2 pt-2 border-t border-border">
                      <span className="font-semibold text-muted-foreground block mb-0.5">Customer Comment:</span>
                      <p className="italic text-foreground">"{currentOrder.returnRequest.comment}"</p>
                    </div>
                  )}
                  {currentOrder.returnRequest.items?.length > 0 && (
                    <div className="sm:col-span-2 pt-2 border-t border-border">
                      <span className="font-semibold text-muted-foreground block mb-1.5">Items to Return:</span>
                      <div className="flex flex-wrap gap-2">
                        {currentOrder.returnRequest.items.map((it, idx) => (
                          <span key={idx} className="bg-background border border-border px-2.5 py-1 rounded-lg text-xs font-medium">
                            {it.title} {it.quantity ? `(Qty: ${it.quantity})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Return Shipping & Refund References */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Reverse Courier Tracking AWB</label>
                    <input
                      type="text"
                      placeholder="e.g. REV-DTDC-992144"
                      className="w-full text-xs h-9 px-3 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      value={returnTrackingNumber}
                      onChange={e => setReturnTrackingNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Bank Refund Reference / UTR</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-9821498172"
                      className="w-full text-xs h-9 px-3 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      value={refundRefNumber}
                      onChange={e => setRefundRefNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Admin Resolution Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Refund processed to original card."
                      className="w-full text-xs h-9 px-3 border border-border rounded-lg bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      value={returnAdminNote}
                      onChange={e => setReturnAdminNote(e.target.value)}
                    />
                  </div>
                </div>

                {/* Return Transition Actions */}
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Update Return Lifecycle:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={currentOrder.returnRequest.status === 'approved' ? 'default' : 'outline'}
                      disabled={Boolean(updatingAction) || currentOrder.returnRequest.status === 'approved'}
                      onClick={() => handleUpdateReturnStatus('approved')}
                    >
                      {updatingAction === 'return_approved' && <Loader2 size={13} className="animate-spin mr-1" />}
                      1. Approve Return
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant={currentOrder.returnRequest.status === 'pickup_scheduled' ? 'default' : 'outline'}
                      disabled={Boolean(updatingAction) || currentOrder.returnRequest.status === 'pickup_scheduled'}
                      onClick={() => handleUpdateReturnStatus('pickup_scheduled')}
                    >
                      {updatingAction === 'return_pickup_scheduled' && <Loader2 size={13} className="animate-spin mr-1" />}
                      2. Schedule Pickup
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant={currentOrder.returnRequest.status === 'picked_up' ? 'default' : 'outline'}
                      disabled={Boolean(updatingAction) || currentOrder.returnRequest.status === 'picked_up'}
                      onClick={() => handleUpdateReturnStatus('picked_up')}
                    >
                      {updatingAction === 'return_picked_up' && <Loader2 size={13} className="animate-spin mr-1" />}
                      3. Item Received & Inspected
                    </Button>

                    {currentOrder.returnRequest.returnType !== 'replacement' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={currentOrder.returnRequest.status === 'refunded' ? 'default' : 'outline'}
                        className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-50"
                        disabled={Boolean(updatingAction) || currentOrder.returnRequest.status === 'refunded'}
                        onClick={() => handleUpdateReturnStatus('refunded')}
                      >
                        {updatingAction === 'return_refunded' && <Loader2 size={13} className="animate-spin mr-1" />}
                        ✓ Mark Refunded (Success)
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant={currentOrder.returnRequest.status === 'replaced' ? 'default' : 'outline'}
                        className="border-purple-500/50 text-purple-600 hover:bg-purple-50"
                        disabled={Boolean(updatingAction) || currentOrder.returnRequest.status === 'replaced'}
                        onClick={() => handleUpdateReturnStatus('replaced')}
                      >
                        {updatingAction === 'return_replaced' && <Loader2 size={13} className="animate-spin mr-1" />}
                        ✓ Mark Replacement Dispatched
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={Boolean(updatingAction) || currentOrder.returnRequest.status === 'rejected'}
                      onClick={() => handleUpdateReturnStatus('rejected')}
                    >
                      {updatingAction === 'return_rejected' && <Loader2 size={13} className="animate-spin mr-1" />}
                      Reject Request
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <DialogFooter className="px-6 py-3.5 border-t border-border bg-card shrink-0 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-primary" />
            <span>Customer order changes are saved to database and notified.</span>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
            Close Order
          </Button>
        </DialogFooter>
      </DialogContent>
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </Dialog>
  );
}
