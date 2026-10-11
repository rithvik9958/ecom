'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  CheckCircle2, Package, Calendar, ArrowRight, ShoppingBag, 
  Download, Wallet, CreditCard, Smartphone, MapPin, Clock, 
  Copy, Check, ShieldCheck, Truck, Sparkles
} from 'lucide-react';
import { useCart } from '@/context/CartContext';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdParam = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart immediately on arriving at success page
    clearCart();

    // Trigger confetti cannons
    const triggerConfetti = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default;
        
        // Initial double cannon
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x: 0.2, y: 0.65 },
          colors: ['#10b981', '#111111', '#f59e0b', '#3b82f6', '#ec4899']
        });
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x: 0.8, y: 0.65 },
          colors: ['#10b981', '#111111', '#f59e0b', '#3b82f6', '#ec4899']
        });

        // Center celebration shower
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#10b981', '#22c55e', '#fbbf24', '#111827']
          });
        }, 300);
      } catch (err) {
        // Confetti failed silently
      }
    };
    triggerConfetti();

    // Fetch order details
    async function loadOrder() {
      try {
        const token = localStorage.getItem('store_token');

        // 1. If redirected from Stripe session
        if (sessionId) {
          const res = await fetch(`/api/store-payments?session_id=${sessionId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await res.json();
          if (data && (data._id || data.paymentStatus === 'paid')) {
            setOrder(data);
            setLoading(false);
            return;
          }
        }

        // 2. If orderId is provided
        if (orderIdParam) {
          const res = await fetch(`/api/store-auth/orders/${orderIdParam}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await res.json();
          if (data.success && data.order) {
            setOrder(data.order);
          } else {
            // Fallback object if lookup fails
            setOrder({ _id: orderIdParam, status: 'pending', paymentMethod: 'cod', total: 0 });
          }
        }
      } catch (err) {
        console.error('Error fetching success order details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderIdParam, sessionId, clearCart]);

  const activeOrderId = order?._id || orderIdParam || '';

  const copyOrderId = () => {
    if (!activeOrderId) return;
    navigator.clipboard.writeText(activeOrderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawMethod = String(order?.paymentMethod || '').toLowerCase().trim();
  const hasStripe = Boolean(order?.stripeSessionId);

  let paymentMethodLabel = 'Cash on Delivery (COD)';
  let PaymentIcon = Wallet;

  if (hasStripe || rawMethod === 'stripe' || rawMethod === 'card' || rawMethod === 'credit_card' || rawMethod === 'debit_card') {
    paymentMethodLabel = 'Credit / Debit Card (Stripe)';
    PaymentIcon = CreditCard;
  } else if (rawMethod === 'upi') {
    paymentMethodLabel = 'UPI / QR Payment';
    PaymentIcon = Smartphone;
  } else if (rawMethod === 'razorpay') {
    paymentMethodLabel = 'Online Payment (Razorpay)';
    PaymentIcon = CreditCard;
  } else if (rawMethod && rawMethod !== 'cod') {
    paymentMethodLabel = order?.paymentMethod ? order.paymentMethod.toUpperCase() : 'Online Payment';
    PaymentIcon = CreditCard;
  }

  const isPaid = order?.paymentStatus === 'paid' || hasStripe || (rawMethod !== 'cod' && order?.status !== 'cancelled' && order?.paymentStatus !== 'failed');

  const orderDate = order?.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="fnp-success-wrap">
      <div className="fnp-success-card">

        {/* Animated Celebration Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          <div className="fnp-success-icon-wrap">
            <CheckCircle2 size={52} color="currentColor" strokeWidth={2.3} />
          </div>
        </div>

        {/* Header Capsule */}
        <div className="fnp-success-badge">
          <Sparkles size={14} color="currentColor" /> Order Placed Successfully
        </div>

        <h1 className="fnp-success-title">
          Order Confirmed!
        </h1>
        <p className="fnp-success-sub">
          Thank you for your order. We&apos;ve sent an order confirmation & receipt to{' '}
          <strong className="fnp-success-sub-highlight">{order?.email || 'your registered email'}</strong>.
        </p>

        {/* Main Receipt Card */}
        <div className="fnp-success-receipt">
          {/* Top Section: Order ID & Date */}
          <div className="fnp-success-receipt-divider" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingBottom: '1.25rem' }}>
            <div>
              <div className="fnp-success-receipt-label">
                Order ID
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="fnp-success-receipt-val-bold">
                  {activeOrderId ? `#${activeOrderId.slice(-8).toUpperCase()}` : 'Generating...'}
                </span>
                {activeOrderId && (
                  <button
                    onClick={copyOrderId}
                    title="Copy Order ID"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: copied ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center' }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="fnp-success-receipt-label">
                Date & Time
              </div>
              <div className="fnp-success-receipt-val-sub">
                {orderDate}
              </div>
            </div>
          </div>

          {/* Middle Section: Payment Mode & Amount */}
          <div className={(order?.deliveryDate || order?.deliverySlot || order?.address) ? 'fnp-success-receipt-divider' : ''} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', padding: '1.25rem 0' }}>
            <div>
              <div className="fnp-success-receipt-label" style={{ marginBottom: '0.35rem' }}>
                Payment Mode
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="fnp-success-receipt-icon-box">
                  <PaymentIcon size={16} color="currentColor" />
                </div>
                <div>
                  <div className="fnp-success-receipt-method-name">
                    {paymentMethodLabel}
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: isPaid ? '#10b981' : '#f59e0b',
                    marginTop: '0.1rem'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPaid ? '#10b981' : '#f59e0b' }} />
                    {isPaid ? 'Paid' : 'Pay on Delivery'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="fnp-success-receipt-label">
                Total Amount
              </div>
              <div className="fnp-success-receipt-total">
                ₹{order?.total ? order.total.toLocaleString('en-IN') : '...'}
              </div>
            </div>
          </div>

          {/* Delivery & Schedule details (if present) */}
          {(order?.deliveryDate || order?.deliverySlot || order?.address) && (
            <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {(order?.deliveryDate || order?.deliverySlot) && (
                <div className="fnp-success-receipt-row">
                  <Clock size={16} color="#10b981" style={{ flexShrink: 0 }} />
                  <div>
                    <span style={{ color: '#64748b' }}>Delivery Slot: </span>
                    <strong>
                      {order.deliveryDate === 'today' ? 'Today' : order.deliveryDate === 'tomorrow' ? 'Tomorrow' : order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Standard'}
                      {order.deliverySlot ? ` • ${order.deliverySlot}` : ''}
                    </strong>
                  </div>
                </div>
              )}

              {order?.address && (
                <div className="fnp-success-receipt-row" style={{ alignItems: 'flex-start' }}>
                  <MapPin size={16} color="#10b981" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  <div>
                    <span style={{ color: '#64748b' }}>Deliver to: </span>
                    <strong>
                      {typeof order.address === 'object' ? `${order.address.name || order.customerName || 'Recipient'} (${order.address.city || ''} ${order.address.pincode || ''})` : order.address}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <Link
            href={activeOrderId ? `/orders/${activeOrderId}` : '/orders'}
            className="fnp-success-main-btn"
          >
            <Truck size={18} /> Track / View Order Details
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Link
              href={activeOrderId ? `/orders/${activeOrderId}/invoice` : '/orders'}
              target="_blank"
              className="fnp-success-sec-btn"
            >
              <Download size={16} /> Invoice
            </Link>

            <Link
              href="/products"
              className="fnp-success-sec-btn"
            >
              <ShoppingBag size={16} /> Shop More
            </Link>
          </div>
        </div>

        {/* Security & Support Note */}
        <div className="fnp-success-security">
          <ShieldCheck size={16} color="#10b981" /> 100% Safe & Secure Order Processing
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 16px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}} />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
