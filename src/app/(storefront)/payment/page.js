'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Loader2, ShieldCheck, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const sessionId    = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [status, setStatus] = useState('loading'); // loading | error

  useEffect(() => {
    if (!sessionId) { 
      setStatus('error'); 
      return; 
    }
    const token = localStorage.getItem('store_token');
    fetch(`/api/store-payments?session_id=${sessionId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.paymentStatus === 'paid' || data._id) {
          clearCart();
          // Redirect immediately to the unified order success page
          router.replace(`/checkout/success?orderId=${data._id}&session_id=${sessionId}`);
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [sessionId, router, clearCart]);

  if (status === 'error') {
    return (
      <div className="fnp-cart-page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', padding: '2rem 1.25rem' }}>
        <div className="fnp-cart-card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Payment Status Unconfirmed</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            We could not verify your transaction confirmation with the payment gateway. If any amount was deducted, please don&apos;t worry—our team will assist you promptly.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', width: '100%' }}>
            <Link
              href="/cart"
              className="fnp-summary-cta-btn"
              style={{ textDecoration: 'none', background: '#111827', fontSize: '0.9rem', padding: '0.85rem' }}
            >
              <ArrowLeft size={16} /> Return to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fnp-cart-page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', padding: '2rem 1.25rem' }}>
      <div className="fnp-cart-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '56px', height: '56px', border: '3.5px solid #e2e8f0', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
          <div style={{ position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', background: '#111827' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>
            Finalizing Your Order
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
            Securely confirming transaction details with the bank…
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#334155', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
          <ShieldCheck size={14} /> 256-Bit SSL Encrypted
        </div>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="fnp-cart-page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '75vh' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #e2e8f0', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { to { transform: rotate(360deg); } }`}} />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}

