'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, TrendingDown, CheckCircle2, X, Sparkles, Mail, Phone, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useStoreAuth } from '@/context/StoreAuthContext';
import showToast from '@/lib/storeToast';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

export default function ProductAlertModal({
  isOpen,
  onClose,
  product,
  initialType = 'back_in_stock',
  currentPrice = 0
}) {
  const { user } = useStoreAuth();
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState(initialType);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState(10); // default 10%
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const prodPrice = currentPrice || product?.price || 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update initial type when modal opens and prefill credentials
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setIsSuccess(false);
      
      // Auto-calculate 10% discount target
      const tenPercentOff = Math.round(prodPrice * 0.9);
      setTargetPrice(tenPercentOff > 0 ? String(tenPercentOff) : '');
      setSelectedDiscount(10);

      // 1. Pre-fill from active auth session
      if (user?.email) setEmail(user.email);
      if (user?.phone) setPhone(user.phone);

      // 2. Fallback to localStorage if available
      if (!user?.email) {
        try {
          const storedUser = localStorage.getItem('ecom_customer_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (parsed?.email) setEmail(parsed.email);
            if (parsed?.phone) setPhone(parsed.phone);
          }
        } catch {
          // silent
        }
      }
    }
  }, [isOpen, initialType, prodPrice, user]);

  if (!isOpen || !mounted || typeof document === 'undefined' || !product) {
    return null;
  }

  const handleDiscountSelect = (pct) => {
    setSelectedDiscount(pct);
    const calculated = Math.round(prodPrice * (1 - pct / 100));
    setTargetPrice(String(calculated));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast.error('Please enter a valid email address');
      return;
    }

    if (type === 'price_drop' && (!targetPrice || Number(targetPrice) >= prodPrice)) {
      showToast.error(`Target price must be lower than the current price (₹${prodPrice.toLocaleString('en-IN')})`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/store-products/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id || String(product._id),
          productTitle: product.title,
          productThumbnail: product.thumbnail || product.images?.[0] || '',
          type,
          targetPrice: type === 'price_drop' ? Number(targetPrice) : 0,
          currentPrice: prodPrice,
          email: email.trim(),
          phone: phone.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setSuccessMessage(data.message || 'Alert set successfully!');
        showToast.success('🔔 Notification alert registered!');
      } else {
        showToast.error(data.message || 'Failed to set alert. Please try again.');
      }
    } catch {
      showToast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--fnp-white, #ffffff)',
          borderRadius: 'var(--fnp-radius-lg, 20px)',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid var(--fnp-gray-200, #eaeaea)',
          position: 'relative',
          animation: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: 'var(--fnp-font)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--fnp-gray-100, #f5f5f5)',
            border: '1px solid var(--fnp-gray-200, #eaeaea)',
            color: 'var(--fnp-gray-500, #777)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--fnp-red-pale, #fdecea)';
            e.currentTarget.style.borderColor = '#fca5a5';
            e.currentTarget.style.color = 'var(--fnp-red, #d32f2f)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--fnp-gray-100, #f5f5f5)';
            e.currentTarget.style.borderColor = 'var(--fnp-gray-200, #eaeaea)';
            e.currentTarget.style.color = 'var(--fnp-gray-500, #777)';
          }}
        >
          <X size={15} />
        </button>

        {isSuccess ? (
          /* ── SUCCESS STATE ── */
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                boxShadow: '0 8px 24px rgba(22, 163, 74, 0.2)'
              }}
            >
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)', margin: '0 0 0.5rem' }}>
              You're All Set!
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--fnp-gray-700, #555)', lineHeight: 1.5, margin: '0 auto 1.75rem', maxWidth: '380px' }}>
              {successMessage}
            </p>

            <div style={{ background: 'var(--fnp-gray-50, #fafafa)', border: '1px solid var(--fnp-gray-200, #eaeaea)', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', marginBottom: '1.75rem' }}>
              <img
                src={getImageUrl(product.thumbnail || product.images?.[0])}
                alt={product.title}
                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--fnp-gray-900, #111)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--fnp-gray-500, #777)', marginTop: '2px' }}>
                  Notification set for: <strong>{email}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: 'var(--fnp-radius-md, 10px)',
                background: 'var(--fnp-green, #111111)',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* ── FORM STATE ── */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.25rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: type === 'back_in_stock' ? '#fefce8' : '#eff6ff',
                    color: type === 'back_in_stock' ? '#a16207' : '#1d4ed8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {type === 'back_in_stock' ? <Bell size={18} /> : <TrendingDown size={18} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)' }}>
                    {type === 'back_in_stock' ? 'Back in Stock Alert' : 'Price Drop Alert'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--fnp-gray-500, #777)' }}>
                    Never miss when this product is available or on sale
                  </p>
                </div>
              </div>

              {/* Type Switch Tabs */}
              <div style={{ display: 'flex', background: 'var(--fnp-gray-100, #f5f5f5)', padding: '3px', borderRadius: '10px', marginTop: '1rem', border: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                <button
                  type="button"
                  onClick={() => setType('back_in_stock')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    background: type === 'back_in_stock' ? 'var(--fnp-white, #ffffff)' : 'transparent',
                    color: type === 'back_in_stock' ? 'var(--fnp-gray-900, #111)' : 'var(--fnp-gray-500, #777)',
                    boxShadow: type === 'back_in_stock' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <Bell size={13} /> Stock Alert
                </button>
                <button
                  type="button"
                  onClick={() => setType('price_drop')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    background: type === 'price_drop' ? 'var(--fnp-white, #ffffff)' : 'transparent',
                    color: type === 'price_drop' ? 'var(--fnp-gray-900, #111)' : 'var(--fnp-gray-500, #777)',
                    boxShadow: type === 'price_drop' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <TrendingDown size={13} /> Price Drop Alert
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Product Mini Preview */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'var(--fnp-gray-50, #fafafa)',
                  border: '1px solid var(--fnp-gray-200, #eaeaea)'
                }}
              >
                <img
                  src={getImageUrl(product.thumbnail || product.images?.[0])}
                  alt={product.title}
                  style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', background: '#fff' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--fnp-gray-900, #111)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)' }}>
                      ₹{prodPrice.toLocaleString('en-IN')}
                    </span>
                    {product.stock <= 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--fnp-red, #d32f2f)', background: 'var(--fnp-red-pale, #fdecea)', padding: '1px 6px', borderRadius: '4px' }}>
                        Currently Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Drop Customizer (Only for Price Drop type) */}
              {type === 'price_drop' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', marginBottom: '0.45rem' }}>
                    Notify me when price drops to:
                  </label>
                  
                  {/* Preset Pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '0.75rem' }}>
                    {[5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleDiscountSelect(pct)}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'center',
                          border: selectedDiscount === pct ? '1.5px solid var(--fnp-green, #111)' : '1px solid var(--fnp-gray-300, #d4d4d4)',
                          background: selectedDiscount === pct ? 'var(--fnp-gray-100, #f5f5f5)' : 'var(--fnp-white, #ffffff)',
                          color: selectedDiscount === pct ? 'var(--fnp-gray-900, #111)' : 'var(--fnp-gray-700, #555)',
                          transition: 'all 0.15s'
                        }}
                      >
                        -{pct}% (₹{Math.round(prodPrice * (1 - pct / 100)).toLocaleString('en-IN')})
                      </button>
                    ))}
                  </div>

                  {/* Custom Target Input */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--fnp-white, #ffffff)',
                      border: '1.5px solid var(--fnp-gray-300, #d4d4d4)',
                      borderRadius: '10px',
                      padding: '0.6rem 0.85rem',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)' }}>₹</span>
                    <input
                      type="number"
                      placeholder="Custom target price (₹)"
                      value={targetPrice}
                      onChange={(e) => {
                        setTargetPrice(e.target.value);
                        setSelectedDiscount(null);
                      }}
                      style={{
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: 'var(--fnp-gray-900, #111)'
                      }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Account Sync Pill */}
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--fnp-gray-100, #f5f5f5)', border: '1px solid var(--fnp-gray-200, #eaeaea)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.74rem', color: 'var(--fnp-gray-700, #555)' }}>
                  <UserCheck size={14} color="#16a34a" />
                  <span>Auto-filled from your account (<strong>{user.name || user.email}</strong>).</span>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', marginBottom: '0.45rem' }}>
                  Your Email Address <span style={{ color: 'var(--fnp-red, #d32f2f)' }}>*</span>
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--fnp-white, #ffffff)',
                    border: '1.5px solid var(--fnp-gray-300, #d4d4d4)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.85rem',
                    gap: '8px'
                  }}
                >
                  <Mail size={16} color="var(--fnp-gray-500, #777)" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.88rem',
                      color: 'var(--fnp-gray-900, #111)'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Optional Phone / SMS Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)' }}>
                    WhatsApp / Phone Number
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--fnp-gray-500, #777)' }}>Optional</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--fnp-white, #ffffff)',
                    border: '1.5px solid var(--fnp-gray-300, #d4d4d4)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.85rem',
                    gap: '8px'
                  }}
                >
                  <Phone size={16} color="var(--fnp-gray-500, #777)" />
                  <input
                    type="tel"
                    placeholder="Mobile number for WhatsApp / SMS"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.88rem',
                      color: 'var(--fnp-gray-900, #111)'
                    }}
                  />
                </div>
              </div>

              {/* Privacy badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--fnp-gray-500, #777)' }}>
                <ShieldCheck size={14} color="#16a34a" />
                <span>We strictly respect your privacy. No spam, only instant stock/price alerts.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--fnp-radius-md, 10px)',
                  background: 'var(--fnp-white, #ffffff)',
                  border: '1px solid var(--fnp-gray-300, #d4d4d4)',
                  color: 'var(--fnp-gray-700, #555)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--fnp-radius-md, 10px)',
                  background: 'var(--fnp-green, #111111)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  if (!loading) e.currentTarget.style.background = 'var(--fnp-green-dark, #000000)';
                }}
                onMouseOut={(e) => {
                  if (!loading) e.currentTarget.style.background = 'var(--fnp-green, #111111)';
                }}
              >
                {loading ? (
                  <span>Setting Alert…</span>
                ) : (
                  <>
                    <span>{type === 'back_in_stock' ? 'Notify Me When Available' : 'Set Price Drop Alert'}</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
