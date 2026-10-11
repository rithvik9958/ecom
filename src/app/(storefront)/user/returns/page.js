'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { 
  RotateCcw, Package, Clock, CheckCircle2, 
  AlertCircle, ArrowRight, ExternalLink, ShieldCheck, ChevronRight, HelpCircle,
  ChevronLeft, ChevronDown, Sparkles
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import CustomSelect from '@/components/storefront/StoreSelect';

export default function MyReturnsPage() {
  const { user, loading: authLoading } = useStoreAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalReturns: 0, pendingReview: 0, completed: 0 });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    async function loadReturns() {
      try {
        setLoading(true);
        const token = localStorage.getItem('store_token');
        const res = await fetch('/api/store-auth/returns', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setReturns(data.returns || []);
          setStats(data.stats || { totalReturns: 0, pendingReview: 0, completed: 0 });
        }
      } catch (err) {
        console.error('Failed to load returns:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadReturns();
    }
  }, [user, authLoading]);

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approve') || s.includes('picked') || s.includes('complete') || s.includes('refund')) {
      return {
        label: s.replace(/_/g, ' ').toUpperCase(),
        bg: '#ecfdf5',
        color: '#15803d',
        border: '#bbf7d0'
      };
    }
    if (s.includes('reject') || s.includes('cancel')) {
      return {
        label: s.replace(/_/g, ' ').toUpperCase(),
        bg: '#fef2f2',
        color: '#dc2626',
        border: '#fecaca'
      };
    }
    return {
      label: s.replace(/_/g, ' ').toUpperCase() || 'UNDER REVIEW',
      bg: '#fefce8',
      color: '#854d0e',
      border: '#fef08a'
    };
  };

  // Pagination calculations
  const totalReturns = returns.length;
  const totalPages = Math.max(1, Math.ceil(totalReturns / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalReturns);
  const paginatedReturns = returns.slice(startIndex, endIndex);

  return (
    <UserDashboardLayout title="Returns & Refunds">
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
              <RotateCcw size={20} color="#ffffff" strokeWidth={2} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Returns &amp; Replacement Tracker
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Track real-time inspection, reverse pickup scheduling, and refund status for your returns
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                {stats.totalReturns}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
                Total Requests
              </span>
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
                {stats.pendingReview}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
                In Progress
              </span>
            </div>
          </div>
        </div>

        {/* Action / Show Per Page Bar */}
        {totalReturns > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              Showing return &amp; replacement history for your account
            </div>

            <CustomSelect
              prefix="Show:"
              value={pageSize}
              onChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: '5 per page' },
                { value: 10, label: '10 per page' },
                { value: 20, label: '20 per page' }
              ]}
              size="md"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* Returns List */}
        {!loading && (
          <div>
            {returns.length === 0 ? (
              <div className="user-dashboard-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.15)' }}>
                  <ShieldCheck size={30} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
                  No active return requests
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
                  All your purchases are in good standing. If you ever receive a damaged or incorrect product, you can request a replacement directly from your order details page.
                </p>
                <Link 
                  href="/orders" 
                  className="dashboard-primary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.75rem 1.75rem',
                    borderRadius: '12px',
                    textDecoration: 'none'
                  }}
                >
                  <Package size={16} />
                  View Delivered Orders
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {paginatedReturns.map((item) => {
                  const ret = item.returnRequest;
                  const badge = getStatusBadge(ret.status);

                  return (
                    <div
                      key={item.orderId}
                      className="user-return-card"
                    >
                      {/* Top Header */}
                      <div className="user-return-header">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <h3 className="user-return-title">
                              Order #{item.orderNumber}
                            </h3>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              padding: '2px 8px',
                              borderRadius: '20px'
                            }}>
                              {badge.label}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            Requested on {new Date(ret.requestedAt || item.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        <Link
                          href={`/orders/${item.orderId}`}
                          className="user-notif-action-btn"
                        >
                          View Order Timeline <ChevronRight size={13} />
                        </Link>
                      </div>

                      {/* Return Details Grid */}
                      <div className="user-return-grid">
                        <div className="user-return-grid-item">
                          <span className="user-return-grid-label">
                            Resolution Mode
                          </span>
                          <span className="user-return-grid-val" style={{ fontWeight: 800 }}>
                            {ret.returnType === 'replacement' ? 'Replacement Item' : 'Full Refund to Source'}
                          </span>
                        </div>

                        <div className="user-return-grid-item">
                          <span className="user-return-grid-label">
                            Reported Reason
                          </span>
                          <span className="user-return-grid-val">
                            {ret.reason}
                          </span>
                        </div>

                        {ret.refundRefNumber && (
                          <div className="user-return-grid-item">
                            <span className="user-return-grid-label user-return-bank-label">
                              Bank Reference / UTR
                            </span>
                            <span className="user-return-grid-val user-return-bank-val">
                              {ret.refundRefNumber}
                            </span>
                          </div>
                        )}

                        {ret.adminNote && (
                          <div className="user-return-grid-item" style={{ gridColumn: '1 / -1' }}>
                            <span className="user-return-grid-label">
                              Fulfillment Team Note
                            </span>
                            <span className="user-return-grid-val">
                              {ret.adminNote}
                            </span>
                          </div>
                        )}

                        {ret.comment && (
                          <div className="user-return-grid-item" style={{ gridColumn: '1 / -1' }}>
                            <span className="user-return-grid-label">
                              Your Reported Note
                            </span>
                            <span className="user-return-grid-val" style={{ fontStyle: 'italic' }}>
                              "{ret.comment}"
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Items to return */}
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                          Returned Items:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {item.items.map((prod, idx) => (
                            <div key={idx} className="user-return-item-pill">
                              <Package size={13} style={{ opacity: 0.7 }} />
                              <span>{prod.title} (x{prod.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="user-dashboard-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                      Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalReturns}</strong> requests
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="dashboard-secondary-btn"
                        style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
                      >
                        <ChevronLeft size={14} /> Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={p === currentPage ? 'dashboard-primary-btn' : 'dashboard-secondary-btn'}
                          style={{
                            width: '34px',
                            height: '34px',
                            padding: 0,
                            borderRadius: '8px',
                            fontSize: '0.82rem'
                          }}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="dashboard-secondary-btn"
                        style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
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

        {/* Return Policy Notice */}
        <div className="user-return-policy-box">
          <HelpCircle size={18} className="order-delivery-icon" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
            <strong style={{ display: 'inline-block', marginRight: '4px' }}>Standard Replacement &amp; Return Policy:</strong> Items eligible for return or exchange must be reported within our standard return window from the date of delivery. Products should be unused, with all original tags, packaging, and accessories intact. Reverse pickup or doorstep inspection will be scheduled upon approval.
          </div>
        </div>

      </div>
    </UserDashboardLayout>
  );
}
