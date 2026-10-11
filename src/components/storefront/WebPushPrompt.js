'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { useWebPush } from '@/lib/useWebPush';
import showToast from '@/lib/storeToast';

export default function WebPushPrompt() {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => pathname?.startsWith(p));
  const { isSupported, isSubscribed, permission, loading, subscribe } = useWebPush('customer');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isAuthPage) return;
    if (!isSupported || isSubscribed || permission === 'denied' || permission === 'granted') {
      return;
    }

    try {
      const dismissed = localStorage.getItem('store_web_push_dismissed');
      if (dismissed) {
        const parsed = parseInt(dismissed, 10);
        // Show again after 5 days if dismissed
        if (Date.now() - parsed < 5 * 24 * 60 * 60 * 1000) {
          return;
        }
      }

      // Delay prompt slightly so page settles
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 4000);

      return () => clearTimeout(timer);
    } catch (e) {}
  }, [isSupported, isSubscribed, permission, isAuthPage]);

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem('store_web_push_dismissed', Date.now().toString());
    } catch (e) {}
  };

  const handleEnable = async () => {
    const res = await subscribe();
    if (res.success) {
      showToast.success('🔔 Instant lock-screen alerts activated!');
      setShowPrompt(false);
    } else {
      showToast.error(res.message || 'Notification permission was not granted.');
      setShowPrompt(false);
    }
  };

  if (!showPrompt || !isSupported || isSubscribed || isAuthPage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        zIndex: 9999,
        maxWidth: '380px',
        width: 'calc(100vw - 40px)',
        background: '#0f172a',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '1.15rem 1.25rem',
        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'slideUpFade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          color: '#94a3b8',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s'
        }}
        onMouseOver={e => e.currentTarget.style.color = '#ffffff'}
        onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
        aria-label="Close"
      >
        <X size={13} />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)'
        }}>
          <Bell size={18} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 750, color: '#ffffff' }}>
              Enable Instant Alerts
            </span>
            <span style={{
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>
              Free
            </span>
          </div>

          <p style={{ margin: '0 0 0.85rem', fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.45 }}>
            Get instant lock-screen alerts for order tracking, dispatch updates &amp; exclusive flash deals.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={handleEnable}
              disabled={loading}
              style={{
                flex: 1,
                background: '#ffffff',
                color: '#0f172a',
                border: 'none',
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                transition: 'all 0.15s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
            >
              {loading ? 'Activating…' : <><CheckCircle2 size={13} /> Allow Alerts</>}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
