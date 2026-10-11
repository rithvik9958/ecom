'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Download, X, Sparkles, Smartphone, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

export default function PwaInstallPrompt() {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => pathname?.startsWith(p));
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isAuthPage) return;
    // Check if already installed in standalone mode
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (isStandalone) {
        setInstalled(true);
        return;
      }

      // Check dismissal cooldown
      const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed_until');
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }

      // Detect iOS Safari
      const ua = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(ua);
      const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
      if (isIosDevice && isSafari && !isStandalone) {
        setIsIos(true);
        // Delay showing on iOS so it doesn't interrupt immediate browsing
        const timer = setTimeout(() => setShowPrompt(true), 4000);
        return () => clearTimeout(timer);
      }

      // Android / Desktop Chrome beforeinstallprompt handler
      const handleBeforeInstall = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Show banner after brief delay
        setTimeout(() => setShowPrompt(true), 3000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      window.addEventListener('appinstalled', () => {
        setInstalled(true);
        setShowPrompt(false);
        setDeferredPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Dismiss for 7 days
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa_prompt_dismissed_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  if (!showPrompt || installed || isAuthPage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '84px',
        left: '16px',
        right: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        zIndex: 9998,
        fontFamily: 'var(--fnp-font)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className="pwa-install-prompt-box"
        style={{
          background: 'var(--fnp-white, #ffffff)',
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          border: '1px solid var(--fnp-gray-200, #eaeaea)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'var(--fnp-gray-100, #f5f5f5)',
            border: 'none',
            color: 'var(--fnp-gray-500, #777)',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          aria-label="Dismiss app install banner"
        >
          <X size={14} />
        </button>

        {/* Content Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '24px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'var(--fnp-green, #111111)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <Smartphone size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)' }}>
                Install Store App
              </h4>
              <span style={{ fontSize: '0.66rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px' }}>
                Fast &amp; Free
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--fnp-gray-600, #666)', lineHeight: 1.35 }}>
              1-tap checkout, instant order tracking &amp; exclusive app deals on your home screen.
            </p>
          </div>
        </div>

        {/* Actions / Instructions */}
        {isIos ? (
          <div
            style={{
              background: 'var(--fnp-gray-50, #fafafa)',
              border: '1px dashed var(--fnp-gray-300, #d4d4d4)',
              borderRadius: '10px',
              padding: '8px 10px',
              fontSize: '0.76rem',
              color: 'var(--fnp-gray-700, #555)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Tap <Share size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Share below, then select <strong>"Add to Home Screen"</strong> <PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleInstallClick}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: 'var(--fnp-radius-md, 10px)',
                background: 'var(--fnp-green, #111111)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <Download size={15} /> Install App
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: 'var(--fnp-radius-md, 10px)',
                background: 'transparent',
                border: '1px solid var(--fnp-gray-200, #eaeaea)',
                color: 'var(--fnp-gray-700, #555)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Later
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
