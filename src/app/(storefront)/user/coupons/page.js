'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { 
  Ticket, Copy, Check, ShoppingBag, Sparkles, 
  Clock, ArrowRight, Tag, HelpCircle, AlertCircle, Percent,
  ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import CustomSelect from '@/components/storefront/StoreSelect';

export default function MyCouponsPage() {
  const { user, loading: authLoading } = useStoreAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    async function loadCoupons() {
      try {
        setLoading(true);
        const res = await fetch('/api/store-coupons');
        const data = await res.json();
        if (data.success) {
          setCoupons(data.coupons || []);
        }
      } catch (err) {
        console.error('Failed to load coupons:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCoupons();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast.success(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  const handleUseInCart = (code) => {
    handleCopyCode(code);
    router.push('/cart');
  };

  // Pagination Calculations
  const totalCoupons = coupons.length;
  const totalPages = Math.max(1, Math.ceil(totalCoupons / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCoupons);
  const paginatedCoupons = coupons.slice(startIndex, endIndex);

  return (
    <UserDashboardLayout title="My Coupons & Offers">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)',
          borderRadius: '18px',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 28px rgba(17, 24, 39, 0.12)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Ticket size={20} color="#ffffff" strokeWidth={2} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Coupons &amp; Exclusive Discounts
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Apply these promo codes at checkout to unlock instant discounts and savings on your orders
            </p>
          </div>

          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255,255,255,0.08)', 
            padding: '0 1rem', 
            borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.12)',
            height: '42px',
            boxSizing: 'border-box'
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
              {coupons.length}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
              Available Coupons
            </span>
          </div>
        </div>

        {/* Action / Show Per Page Bar */}
        {totalCoupons > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              Showing verified and active coupons valid on your account
            </div>

            <CustomSelect
              prefix="Show:"
              value={pageSize}
              onChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
              options={[
                { value: 4, label: '4 per page' },
                { value: 6, label: '6 per page' },
                { value: 12, label: '12 per page' },
                { value: 24, label: '24 per page' }
              ]}
              size="md"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Coupons Grid */}
        {!loading && (
          <div>
            {coupons.length === 0 ? (
              <div className="user-dashboard-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#ffffff', borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.85)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f8fafc', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid #e2e8f0' }}>
                  <Ticket size={26} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                  No active coupons right now
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
                  Check back soon or subscribe to our newsletter for exclusive seasonal promo codes and flash offers.
                </p>
                <Link 
                  href="/products" 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                    color: '#ffffff',
                    padding: '0.75rem 1.75rem',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.22)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'; }}
                >
                  <Sparkles size={16} color="#ffffff" strokeWidth={1.75} />
                  Start Shopping
                  <ArrowRight size={15} strokeWidth={2} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {paginatedCoupons.map((coupon) => {
                    const isPercentage = coupon.discountType === 'percentage';
                    const savingsBadge = isPercentage ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`;
                    const isCopied = copiedCode === coupon.code;

                    return (
                      <div
                        key={coupon._id || coupon.code}
                        className="user-coupon-card"
                      >
                        {/* Top Header: Badge & Expiry */}
                        <div className="user-coupon-header">
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#0f172a',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.76rem',
                            padding: '3px 9px',
                            borderRadius: '8px',
                            letterSpacing: '0.3px'
                          }}>
                            <Tag size={12} strokeWidth={2} /> {savingsBadge}
                          </span>

                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} strokeWidth={2} /> Verified &amp; Active
                          </span>
                        </div>

                        {/* Middle Body */}
                        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                          
                          {/* Promo Code Box */}
                          <div className="user-coupon-code-box">
                            <div>
                              <span style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                                Promo Code
                              </span>
                              <span className="user-coupon-code-txt">
                                {coupon.code}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyCode(coupon.code)}
                              className={`user-coupon-copy-btn ${isCopied ? 'copied' : ''}`}
                            >
                              {isCopied ? <Check size={12} /> : <Copy size={12} />}
                              {isCopied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>

                          {/* Description */}
                          <div>
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.86rem', color: '#334155', fontWeight: 600, lineHeight: 1.4 }}>
                              {coupon.description || `Enjoy ${savingsBadge} on your entire order`}
                            </p>
                            {coupon.minOrderValue > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Minimum order value: <strong>₹{coupon.minOrderValue.toLocaleString('en-IN')}</strong>
                              </span>
                            )}
                          </div>

                        </div>

                        {/* Footer Actions */}
                        <div className="user-coupon-footer">
                          <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} strokeWidth={2.5} color="#0f172a" /> Ready to Redeem
                          </span>

                          <button
                            type="button"
                            onClick={() => handleUseInCart(coupon.code)}
                            className="dashboard-primary-btn"
                            style={{ padding: '0.45rem 0.95rem', fontSize: '0.78rem' }}
                          >
                            Apply in Cart <ArrowRight size={13} strokeWidth={2.5} />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="user-dashboard-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                      Showing <strong style={{ color: '#0f172a' }}>{startIndex + 1}</strong>–<strong style={{ color: '#0f172a' }}>{endIndex}</strong> of <strong style={{ color: '#0f172a' }}>{totalCoupons}</strong> coupons
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0.45rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                          color: currentPage === 1 ? '#cbd5e1' : '#0f172a',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <ChevronLeft size={14} /> Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            border: p === currentPage ? '1px solid #111827' : '1px solid #e2e8f0',
                            background: p === currentPage ? '#111827' : '#ffffff',
                            color: p === currentPage ? '#ffffff' : '#0f172a',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '0.45rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                          color: currentPage === totalPages ? '#cbd5e1' : '#0f172a',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* How to Redeem Help Container */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={16} color="#0f172a" />
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
              How to apply coupons on your cart
            </h4>
          </div>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
            <li>Copy your preferred promo code from above or tap <strong>"Use in Cart"</strong>.</li>
            <li>Add your favourite products or items to your shopping cart.</li>
            <li>In the Order Summary section of your cart, click <strong>"Apply Coupon Code"</strong>.</li>
            <li>Paste your code or select from the available quick-apply chips and watch the instant discount apply!</li>
          </ol>
        </div>

      </div>
    </UserDashboardLayout>
  );
}
