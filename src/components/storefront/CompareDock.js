'use client';
import { useCompare } from '@/context/CompareContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeftRight, X, ArrowRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

export default function CompareDock() {
  const { compareItems, removeFromCompare, clearCompare, isDockOpen, toggleDock, maxItems } = useCompare();
  const pathname = usePathname();

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => pathname?.startsWith(p));

  // Don't show dock if no items, on compare page, or on auth pages
  if (!compareItems || compareItems.length === 0 || pathname === '/compare' || isAuthPage) {
    return null;
  }

  // Collapsed Floating Button
  if (!isDockOpen) {
    return (
      <aside
        aria-label="Product comparison dock"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        <button
          type="button"
          onClick={toggleDock}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--fnp-gray-900, #18181b)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '999px',
            padding: '12px 22px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.88rem',
            letterSpacing: '0.01em',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ArrowLeftRight size={18} color="#ffffff" />
            <span
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-10px',
                background: 'var(--fnp-green, #111827)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            >
              {compareItems.length}
            </span>
          </div>
          <span>Compare Items</span>
          <ChevronUp size={16} color="#a1a1aa" />
        </button>
      </aside>
    );
  }

  // Expanded Floating Dock
  return (
    <aside
      aria-label="Product comparison dock"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: '860px',
        animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(24, 24, 27, 0.98) 0%, rgba(9, 9, 11, 0.99) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '14px 20px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45), 0 0 24px rgba(0, 0, 0, 0.3)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left Side: Header & Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              flexShrink: 0
            }}
          >
            <ArrowLeftRight size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#fafafa', letterSpacing: '-0.01em' }}>
                Compare Products
              </h3>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                {compareItems.length}/{maxItems}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#a1a1aa' }}>
              {compareItems.length === 1 ? 'Add at least 1 more product' : 'Side-by-side specs comparison'}
            </p>
          </div>
        </div>

        {/* Center: Selected Products Thumbnails (Clean, No Scrollbar) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'nowrap',
            overflow: 'visible',
            padding: '4px 0',
          }}
        >
          {compareItems.map((item) => (
            <div
              key={item._id || item.id}
              style={{
                position: 'relative',
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: '#27272a',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                overflow: 'visible',
                flexShrink: 0,
                transition: 'transform 0.2s',
              }}
              title={item.title}
            >
              <img
                src={getImageUrl(item.thumbnail)}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => removeFromCompare(item._id || item.id)}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: '2px solid #18181b',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  transition: 'transform 0.15s',
                  zIndex: 2,
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                title="Remove"
              >
                <X size={11} strokeWidth={3} />
              </button>
            </div>
          ))}

          {/* Empty Placeholder Slots */}
          {Array.from({ length: maxItems - compareItems.length }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                border: '1.5px dashed rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.35)',
                fontSize: '0.75rem',
                flexShrink: 0,
              }}
              title="Add another product to compare"
            >
              +
            </div>
          ))}
        </div>

        {/* Right Side: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={clearCompare}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = '#a1a1aa';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Trash2 size={14} /> Clear
          </button>

          <Link
            href="/compare"
            style={{
              background: 'var(--fnp-green, #111827)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'var(--fnp-green-dark, #27272a)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'var(--fnp-green, #111827)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Compare ({compareItems.length}) <ArrowRight size={15} />
          </Link>

          <button
            type="button"
            onClick={toggleDock}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#a1a1aa',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: '2px',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            title="Minimize Dock"
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
