'use client';
import { useState, useEffect, use } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { useCart } from '@/context/CartContext';
import { 
  ArrowLeft, Package, Truck, CheckCircle2, 
  MapPin, Phone, Download, RotateCcw,
  Receipt, CalendarClock, CreditCard, Wallet, Smartphone, ExternalLink, Clock, AlertCircle,
  XCircle, AlertTriangle, Star, X, Check, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import showToast from '@/lib/storeToast';

export default function OrderDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const router = useRouter();
  const { user, loading: authLoading } = useStoreAuth();
  const { addItem } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  // Cancellation State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [cancelComment, setCancelComment] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Return & Replacement State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('Damaged during transit');
  const [returnComment, setReturnComment] = useState('');
  const [returnType, setReturnType] = useState('refund'); // 'refund' | 'replacement'
  const [refundMethod, setRefundMethod] = useState('original_source');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Rate & Review Modal State
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const CANCEL_REASONS = [
    'Ordered by mistake',
    'Need to change delivery address or date',
    'Found a better price elsewhere',
    'Delivery time is too long',
    'Changed my mind / No longer needed',
    'Other reasons'
  ];

  const RETURN_REASONS = [
    'Damaged during transit',
    'Item defective / not working properly',
    'Received wrong product or variant',
    'Quality not as expected',
    'Missing items or accessories',
    'Other reason'
  ];

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchOrder() {
      try {
        const token = localStorage.getItem('store_token');
        const res = await fetch(`/api/store-auth/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
        } else {
          showToast.error(data.message || 'Order not found');
          router.push('/orders');
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
        showToast.error('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id, user, authLoading, router]);

  const handleReorder = async () => {
    if (!order || !order.items || order.items.length === 0) return;
    
    setIsReordering(true);
    try {
      for (const item of order.items) {
        await addItem({
          id: item.productId || item._id,
          title: item.title,
          price: item.price,
          thumbnail: item.thumbnail
        }, item.quantity || 1);
      }
      showToast.success('Items added to cart!');
      router.push('/cart');
    } catch (err) {
      console.error(err);
      showToast.error('Failed to reorder items');
    } finally {
      setIsReordering(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e?.preventDefault();
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('store_token');
      const res = await fetch(`/api/store-auth/orders/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: cancelReason, comment: cancelComment })
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Order has been cancelled successfully.');
        setOrder(prev => ({
          ...prev,
          status: 'cancelled',
          cancellationReason: cancelReason + (cancelComment ? ` - ${cancelComment}` : ''),
          timeline: data.order?.timeline || prev.timeline
        }));
        setShowCancelModal(false);
      } else {
        showToast.error(data.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error while cancelling order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturnOrder = async (e) => {
    e?.preventDefault();
    setIsSubmittingReturn(true);
    try {
      const token = localStorage.getItem('store_token');
      const res = await fetch(`/api/store-auth/orders/${id}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: returnReason,
          comment: returnComment,
          returnType,
          refundMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Return request submitted successfully!');
        setOrder(prev => ({
          ...prev,
          returnRequest: data.returnRequest,
          timeline: data.timeline || prev.timeline
        }));
        setShowReturnModal(false);
      } else {
        showToast.error(data.message || 'Failed to submit return request');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error while submitting return');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e?.preventDefault();
    if (!reviewingItem) return;
    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('store_token');
      const res = await fetch('/api/store-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: reviewingItem.productId || reviewingItem.id,
          rating: reviewRating,
          title: reviewTitle,
          body: reviewBody
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Thank you! Your review has been submitted.');
        setReviewingItem(null);
        setReviewTitle('');
        setReviewBody('');
      } else {
        showToast.error(data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error submitting review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (authLoading || loading) {
    return (
      <UserDashboardLayout title="Order Details">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (!order) return null;

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const rawPaymentMethod = String(order.paymentMethod || '').toLowerCase().trim();
  const hasStripe = Boolean(order.stripeSessionId);
  const isPaid = order.paymentStatus === 'paid' || order.status === 'paid' || hasStripe || (rawPaymentMethod !== 'cod' && order.status !== 'cancelled');
  const isStripe = hasStripe || rawPaymentMethod === 'stripe' || rawPaymentMethod === 'card' || rawPaymentMethod === 'credit_card' || rawPaymentMethod === 'debit_card' || (rawPaymentMethod === 'cod' && isPaid);
  const isUpi = rawPaymentMethod === 'upi';

  let paymentMethodLabel = 'Cash on Delivery (COD)';
  let PaymentIcon = Wallet;
  if (isStripe) {
    paymentMethodLabel = 'Credit / Debit Card (Stripe)';
    PaymentIcon = CreditCard;
  } else if (isUpi) {
    paymentMethodLabel = 'UPI / Instant QR Payment';
    PaymentIcon = Smartphone;
  }

  const getStepProgress = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return 0;
      default: return 1;
    }
  };

  const activeStep = getStepProgress(order.status);
  const statusLower = String(order.status || '').toLowerCase();
  const isCancelled = statusLower === 'cancelled';
  const isDelivered = statusLower === 'delivered';
  const canCancel = ['pending', 'processing'].includes(statusLower);
  const hasReturnRequest = Boolean(order.returnRequest && order.returnRequest.status);

  // Synthesized timeline if empty
  let timeline = Array.isArray(order.timeline) && order.timeline.length > 0 ? order.timeline : [];
  if (timeline.length === 0) {
    const createdTime = new Date(order.createdAt || Date.now());
    timeline = [
      {
        status: 'pending',
        title: 'Order Placed & Verified',
        description: 'Your order was successfully placed and recorded in our system.',
        time: createdTime
      }
    ];
    if (['processing', 'shipped', 'delivered'].includes(statusLower)) {
      timeline.push({
        status: 'processing',
        title: 'Order Packed & Quality Checked',
        description: 'Products prepared and packed for dispatch.',
        time: new Date(createdTime.getTime() + 2 * 3600 * 1000)
      });
    }
    if (['shipped', 'delivered'].includes(statusLower)) {
      timeline.push({
        status: 'shipped',
        title: order.courier ? `Dispatched via ${order.courier}` : 'Dispatched / Out for Delivery',
        description: order.trackingNumber ? `Handed over to courier partner. AWB: ${order.trackingNumber}` : 'Courier is on the way to recipient destination.',
        time: new Date(createdTime.getTime() + 6 * 3600 * 1000)
      });
    }
    if (statusLower === 'delivered') {
      timeline.push({
        status: 'delivered',
        title: 'Delivered to Recipient',
        description: 'Package handed over successfully. Thank you for shopping with us!',
        time: new Date(createdTime.getTime() + 12 * 3600 * 1000)
      });
    }
  }

  return (
    <UserDashboardLayout title={
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link href="/orders" style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        Order Details
      </div>
    }>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link 
          href="/orders" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: 'var(--fnp-gray-600)', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to all orders
        </Link>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Download Invoice */}
          <Link 
            href={`/orders/${id}/invoice`}
            target="_blank"
            className="order-action-btn invoice"
          >
            <Download size={15} /> Download Invoice
          </Link>

          {/* Cancel Order Button (Active only for pending / processing) */}
          {canCancel && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="order-action-btn cancel"
            >
              <XCircle size={15} /> Cancel Order
            </button>
          )}

          {/* Return / Replacement Button (Active for delivered orders) */}
          {isDelivered && !hasReturnRequest && (
            <button
              type="button"
              onClick={() => setShowReturnModal(true)}
              className="order-action-btn return"
            >
              <RotateCcw size={15} /> Return / Exchange
            </button>
          )}

          {/* Reorder Button */}
          <button 
            onClick={handleReorder}
            disabled={isReordering}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--fnp-green)', border: 'none', color: '#fff', padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: isReordering ? 'not-allowed' : 'pointer', opacity: isReordering ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(22,163,74,0.25)' }}
          >
            {isReordering ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            ) : (
              <RefreshCw size={15} />
            )}
            {isReordering ? 'Reordering...' : 'Buy Again'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Main Live Tracking Hero Box */}
        <div className="order-hero-card">
          
          {/* Header Strip */}
          <div className="order-hero-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--fnp-gray-900)' }}>
                  Order #{order._id.substring(order._id.length - 8).toUpperCase()}
                </h3>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isPaid ? '#15803d' : '#b45309', background: isPaid ? '#ecfdf5' : '#fffbeb', border: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`, padding: '2px 8px', borderRadius: '50px' }}>
                  {isPaid ? 'PAID' : 'PAY ON DELIVERY'} • {paymentMethodLabel.split(' ')[0].toUpperCase()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--fnp-gray-500)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CalendarClock size={14} /> Placed on {orderDate}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem', 
                background: statusLower === 'delivered' ? 'var(--fnp-green-pale)' : statusLower === 'cancelled' ? '#fdf5f5' : '#fff3cd', 
                color: statusLower === 'delivered' ? 'var(--fnp-green)' : statusLower === 'cancelled' ? 'var(--fnp-red)' : '#856404', 
                padding: '0.4rem 0.85rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase'
              }}>
                <span className="status-dot" style={{ background: statusLower === 'delivered' ? 'var(--fnp-green)' : statusLower === 'cancelled' ? 'var(--fnp-red)' : '#856404', margin: 0, width: 8, height: 8 }}></span>
                {order.status || 'Pending'}
              </span>
            </div>
          </div>

          {/* Courier & Tracking Banner (if available) */}
          {(order.courier || order.trackingNumber) && (
            <div className="order-hero-courier">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="order-hero-courier-icon">
                  <Truck size={18} />
                </div>
                <div>
                  <div className="order-hero-courier-title">
                    Shipped via {order.courier || 'Express Logistics'}
                  </div>
                  {order.trackingNumber && (
                    <div className="order-hero-courier-awb">
                      AWB / Tracking Number: <strong>{order.trackingNumber}</strong>
                    </div>
                  )}
                </div>
              </div>

              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="order-hero-courier-track-link"
                >
                  Track on Courier Site <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {/* 4-Stage Visual Progress Tracker */}
          {!isCancelled ? (
            <div style={{ padding: '2.5rem 1.5rem 1.5rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '0 auto', maxWidth: '600px' }}>
                {/* Background Line */}
                <div className="order-stepper-line-bg" />
                {/* Active Filled Line */}
                <div 
                  className="order-stepper-line-active"
                  style={{
                    width: `${((activeStep - 1) / 3) * 80}%`,
                  }} 
                />

                {[
                  { label: 'Order Placed', icon: Package, step: 1 },
                  { label: 'Processing', icon: Clock, step: 2 },
                  { label: 'Dispatched', icon: Truck, step: 3 },
                  { label: 'Delivered', icon: CheckCircle2, step: 4 },
                ].map((s, idx) => {
                  const isPassed = s.step <= activeStep;
                  const isCurrent = s.step === activeStep;

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 3, width: '25%' }}>
                      <div className={`order-stepper-node ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}>
                        <s.icon size={17} strokeWidth={isPassed ? 2.5 : 2} />
                      </div>
                      <span className={`order-stepper-label ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="order-cancelled-banner">
              <AlertCircle size={20} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>This order has been cancelled.</span>
            </div>
          )}

          {/* Shipment Activity Logs (Modern Vertical Timeline with Time Column) */}
          {timeline.length > 0 && (
            <div className="fnp-timeline-wrap">
              <div className="fnp-timeline-header-row">
                <h4 className="fnp-timeline-heading">
                  <Clock size={16} />
                  Shipment Activity Logs
                </h4>
                <span className="fnp-timeline-live-tag">
                  <span className="fnp-timeline-pulse-dot" />
                  Live Tracking Feed
                </span>
              </div>

              <div className="fnp-vtimeline">
                {timeline.slice().reverse().map((ev, idx) => {
                  const isLatest = idx === 0;
                  const evDate = new Date(ev.time);
                  const timeFormatted = evDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                  const dateFormatted = evDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  
                  const isEvCancelled = String(ev.status || ev.title || '').toLowerCase().includes('cancel');

                  const getEvIcon = (status, title) => {
                    const s = String(status || title || '').toLowerCase();
                    if (isEvCancelled) return <AlertCircle size={17} />;
                    if (s.includes('deliver')) return <CheckCircle2 size={17} strokeWidth={2.5} />;
                    if (s.includes('dispatch') || s.includes('courier') || s.includes('shipped') || s.includes('out for delivery')) return <Truck size={17} />;
                    if (s.includes('pack') || s.includes('process') || s.includes('prepared')) return <Package size={17} />;
                    return <Clock size={17} />;
                  };

                  return (
                    <div key={idx} className="fnp-vtimeline-item">
                      {/* Left: Time & Date Column */}
                      <div className="fnp-vtimeline-time-col">
                        <span className="fnp-vtimeline-time">{timeFormatted}</span>
                        <span className="fnp-vtimeline-date">{dateFormatted}</span>
                      </div>

                      {/* Center: Node & Vertical Progress Bar Line */}
                      <div className="fnp-vtimeline-node-col">
                        <div className={`fnp-vtimeline-node ${isLatest ? 'active' : 'completed'} ${isEvCancelled ? 'cancelled' : ''}`}>
                          {getEvIcon(ev.status, ev.title)}
                        </div>
                        {idx !== timeline.length - 1 && <div className="fnp-vtimeline-line" />}
                      </div>

                      {/* Right: Modern Event Card */}
                      <div className={`fnp-vtimeline-card ${isLatest ? 'active' : ''}`}>
                        <div className="fnp-vtimeline-card-header">
                          <h5 className="fnp-vtimeline-card-title">{ev.title || ev.status}</h5>
                          {isLatest && (
                            <span className="fnp-vtimeline-badge latest">Latest Update</span>
                          )}
                        </div>
                        {ev.description && (
                          <p className="fnp-vtimeline-card-desc">{ev.description}</p>
                        )}
                        {(order.courier || order.trackingNumber) && (String(ev.status || ev.title || '').toLowerCase().includes('dispatch') || String(ev.status || ev.title || '').toLowerCase().includes('shipped')) && (
                          <div className="fnp-vtimeline-card-meta">
                            {order.courier && <span>Partner: <strong>{order.courier}</strong></span>}
                            {order.trackingNumber && <span>AWB: <strong>{order.trackingNumber}</strong></span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Return Request Status Banner (if active) */}
        {hasReturnRequest && (() => {
          const retStatus = String(order.returnRequest.status || '').toLowerCase();
          const isRefundCompleted = retStatus.includes('refund') || retStatus.includes('complete');
          const isReplacement = order.returnRequest.returnType === 'replacement';

          return (
            <div className={`order-return-banner ${isRefundCompleted ? 'refunded' : 'pending'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="order-return-banner-icon">
                  {isRefundCompleted ? <CheckCircle2 size={22} /> : <RotateCcw size={20} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <h4 className="order-return-banner-title">
                      {isRefundCompleted 
                        ? (isReplacement ? 'Replacement Completed Successfully' : 'Refund Completed & Credited') 
                        : `Return & ${isReplacement ? 'Replacement' : 'Refund'} Request`}
                    </h4>
                    <span className="order-return-banner-badge">
                      {order.returnRequest.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="order-return-banner-desc">
                    {isRefundCompleted && !isReplacement
                      ? `Full refund of ₹${(order.total || 0).toLocaleString('en-IN')} has been initiated to your original payment mode${order.returnRequest.refundRefNumber ? ` (Bank Ref/UTR: ${order.returnRequest.refundRefNumber})` : ''}. Usually reflects in 2–4 business days.`
                      : `Reason: ${order.returnRequest.reason}${order.returnRequest.comment ? ` • "${order.returnRequest.comment}"` : ''}`}
                  </p>
                  {order.returnRequest.adminNote && (
                    <p className="order-return-banner-note">
                      Note from Team: {order.returnRequest.adminNote}
                    </p>
                  )}
                </div>
              </div>

              <span className="order-return-banner-date">
                Requested on {new Date(order.returnRequest.requestedAt || order.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          );
        })()}

        {/* Two-Column Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* Left Column: Order Items */}
          <div className="user-dashboard-card" style={{ marginBottom: 0, padding: '1.5rem', flex: 2 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--fnp-gray-900)' }}>
              Ordered Items ({order.items?.length || 0})
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items?.map((item, idx) => {
                const vAttrs = item.selectedVariantAttrs || item.variant?.attrs;
                return (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', paddingBottom: idx !== order.items.length - 1 ? '1rem' : 0, borderBottom: idx !== order.items.length - 1 ? '1px solid var(--store-border, #eaeaea)' : 'none' }}>
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt={item.title} style={{ width: '76px', height: '76px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--store-border, #eaeaea)' }} />
                    ) : (
                      <div className="order-item-thumb-placeholder">
                        <Package size={24} color="#94a3b8" />
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontWeight: 700, color: 'var(--fnp-gray-900)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--fnp-gray-500)' }}>
                        Qty: {item.quantity} • ₹{(item.price || 0).toLocaleString('en-IN')} each
                      </div>
                      
                      {vAttrs && typeof vAttrs === 'object' && Object.keys(vAttrs).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.35rem' }}>
                          {Object.entries(vAttrs).map(([k, v]) => (
                            <span key={k} className="order-item-attr-badge">
                              {k.replace(/_/g, ' ')}: {v}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.addons && item.addons.length > 0 && (
                        <div className="order-item-addons-box">
                          <span style={{ fontWeight: 700 }}>Addons: </span>
                          {item.addons.map(a => `${a.title} (₹${a.price})`).join(', ')}
                        </div>
                      )}

                      {/* Rate Item Button for Delivered Orders */}
                      {isDelivered && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewingItem(item);
                              setReviewRating(5);
                              setReviewTitle('');
                              setReviewBody('');
                            }}
                            className="dashboard-secondary-btn"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            <Star size={11} fill="#fbbf24" color="#fbbf24" /> Rate Product
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--fnp-gray-900)', fontSize: '1.05rem', textAlign: 'right' }}>
                      ₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bill Summary */}
            <div style={{ borderTop: '1px solid var(--store-border, #eaeaea)', marginTop: '1.25rem', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fnp-gray-600)' }}>
                <span>Subtotal</span>
                <span>₹{(order.total || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fnp-gray-600)' }}>
                <span>Delivery Charges</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fnp-gray-900)', fontWeight: 800, fontSize: '1.15rem', borderTop: '1px solid var(--store-border, #f0f0f0)', paddingTop: '0.6rem', marginTop: '0.25rem' }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--fnp-gray-900)' }}>₹{(order.total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Delivery & Payment Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            
            {/* Delivery Details Card */}
            <div className="user-dashboard-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--fnp-gray-900)' }}>Delivery Details</h4>
              
              {order.address ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--fnp-gray-900)', fontSize: '0.95rem' }}>
                    {order.address.name || order.customerName || (user?.name) || 'Recipient'}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    <MapPin size={18} className="order-delivery-icon" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      {typeof order.address === 'string' ? (
                        <span>{order.address}</span>
                      ) : (
                        <>
                          <span style={{ display: 'block', marginBottom: '0.2rem' }}>
                            {order.address.flat || order.address.address || ''}, {order.address.locality || ''}
                          </span>
                          <span>{order.address.city || order.city || ''}, {order.address.state || order.state || ''} - <strong>{order.address.pincode || order.address.postalCode || order.postalCode || ''}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, borderTop: '1px solid var(--store-border, #eaeaea)', paddingTop: '0.75rem' }}>
                    <Phone size={15} className="order-delivery-icon" />
                    {(typeof order.address === 'object' ? order.address.phone : null) || order.phone || user?.phone || 'Contact number saved'}
                  </div>

                  {(order.deliveryDate || order.deliverySlot) && (
                    <div className="order-delivery-slot-box">
                      <div className="order-delivery-slot-title">Scheduled Delivery Slot</div>
                      <div className="order-delivery-slot-val">
                        {order.deliveryDate} {order.deliverySlot ? `• ${order.deliverySlot}` : ''}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: '#888', fontSize: '0.9rem' }}>No delivery address provided.</p>
              )}
            </div>

            {/* Payment Mode Card */}
            <div className="user-dashboard-card" style={{ marginBottom: 0, padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--fnp-gray-900)' }}>Payment Method</h4>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '20px',
                  background: isPaid ? '#ecfdf5' : '#fffbeb',
                  color: isPaid ? '#15803d' : '#b45309',
                  border: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`
                }}>
                  {isPaid ? 'PAID' : 'PAY ON DELIVERY'}
                </span>
              </div>

              <div className="order-payment-box">
                <div className="order-payment-icon">
                  <PaymentIcon size={18} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                    Payment Mode
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--fnp-gray-900)' }}>
                    {paymentMethodLabel}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ── Cancel Order Modal ── */}
      {showCancelModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
          <div className="order-modal-card" style={{ maxWidth: '520px' }}>
            
            {/* Header */}
            <div className="order-modal-header cancel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                    Cancel Order
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#b91c1c' }}>Order #{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCancelModal(false)}
                className="order-modal-close-btn"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleCancelOrder} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="dashboard-label" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.45rem' }}>
                  Please select a reason for cancellation *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {CANCEL_REASONS.map(r => (
                    <label 
                      key={r} 
                      className={cancelReason === r ? 'order-modal-option selected-cancel' : 'order-modal-option'}
                    >
                      <input 
                        type="radio" 
                        name="cancelReason" 
                        value={r} 
                        checked={cancelReason === r} 
                        onChange={() => setCancelReason(r)}
                        style={{ accentColor: '#dc2626' }}
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="dashboard-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Additional Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={cancelComment}
                  onChange={e => setCancelComment(e.target.value)}
                  placeholder="Share details to help us improve..."
                  className="dashboard-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {isPaid && (
                <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem 0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#166534' }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span><strong>100% Refund Guaranteed:</strong> Payment of ₹{order.total?.toLocaleString('en-IN')} will be initiated back to your original source within 3-5 business days.</span>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--store-border, #f1f5f9)' }}>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="dashboard-secondary-btn"
                >
                  Keep My Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  style={{ background: '#dc2626', border: 'none', color: '#ffffff', padding: '0.6rem 1.4rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: isCancelling ? 'not-allowed' : 'pointer', opacity: isCancelling ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

      {/* ── Return / Replacement Modal ── */}
      {showReturnModal && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
          <div className="order-modal-card" style={{ maxWidth: '540px', maxHeight: '90vh' }}>
            
            {/* Header */}
            <div className="order-modal-header return">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#854d0e' }}>
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#854d0e', margin: 0 }}>
                    Request Return / Exchange
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#a16207' }}>Order #{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowReturnModal(false)}
                className="order-modal-close-btn"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleReturnOrder} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', overflowY: 'auto' }}>
              
              {/* Type Picker */}
              <div>
                <label className="dashboard-label" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.45rem' }}>
                  What would you like? *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setReturnType('refund')}
                    className={returnType === 'refund' ? 'order-modal-type-btn active' : 'order-modal-type-btn'}
                  >
                    💰 Refund Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnType('replacement')}
                    className={returnType === 'replacement' ? 'order-modal-type-btn active' : 'order-modal-type-btn'}
                  >
                    🔄 Replacement Item
                  </button>
                </div>
              </div>

              {/* Reason Picker */}
              <div>
                <label className="dashboard-label" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.45rem' }}>
                  Reason for Return *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {RETURN_REASONS.map(r => (
                    <label 
                      key={r} 
                      className={returnReason === r ? 'order-modal-option selected-return' : 'order-modal-option'}
                    >
                      <input 
                        type="radio" 
                        name="returnReason" 
                        value={r} 
                        checked={returnReason === r} 
                        onChange={() => setReturnReason(r)}
                        style={{ accentColor: '#ca8a04' }}
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="dashboard-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Describe the Issue in Detail
                </label>
                <textarea
                  rows={2}
                  value={returnComment}
                  onChange={e => setReturnComment(e.target.value)}
                  placeholder="Provide any specific details (e.g. broken seal, wrong shade, etc.)..."
                  className="dashboard-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--store-border, #f1f5f9)' }}>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="dashboard-secondary-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  style={{ background: '#854d0e', border: 'none', color: '#ffffff', padding: '0.6rem 1.4rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: isSubmittingReturn ? 'not-allowed' : 'pointer', opacity: isSubmittingReturn ? 0.7 : 1 }}
                >
                  {isSubmittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

      {/* ── Rate & Review Modal ── */}
      {reviewingItem && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
          <div className="order-modal-card" style={{ maxWidth: '520px' }}>
            
            {/* Header */}
            <div className="order-modal-header review">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {reviewingItem.thumbnail && (
                  <img src={reviewingItem.thumbnail} alt="" style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }} />
                )}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--fnp-gray-900)' }}>
                    Rate & Review
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', display: 'block', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {reviewingItem.title}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setReviewingItem(null)}
                className="order-modal-close-btn"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleReviewSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              {/* Star Rating */}
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <span className="dashboard-label" style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Overall Rating *
                </span>
                <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'none'}
                    >
                      <Star 
                        size={30} 
                        fill={star <= reviewRating ? '#fbbf24' : 'none'} 
                        color={star <= reviewRating ? '#fbbf24' : '#cbd5e1'} 
                      />
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginTop: '0.25rem' }}>
                  {reviewRating === 5 ? '⭐ Excellent! Loved it' : reviewRating === 4 ? '👍 Very Good' : reviewRating === 3 ? '👌 Average' : reviewRating === 2 ? '👎 Below Expectations' : '💔 Poor Experience'}
                </div>
              </div>

              <div>
                <label className="dashboard-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Headline / Title (e.g. Great quality and fresh!)
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={e => setReviewTitle(e.target.value)}
                  placeholder="Summarize your experience..."
                  className="dashboard-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label className="dashboard-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Written Review
                </label>
                <textarea
                  rows={3}
                  value={reviewBody}
                  onChange={e => setReviewBody(e.target.value)}
                  placeholder="What did you like or dislike? How was the packaging, freshness, and delivery?"
                  className="dashboard-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--store-border, #f1f5f9)' }}>
                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  className="dashboard-secondary-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="dashboard-primary-btn"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

    </UserDashboardLayout>
  );
}
