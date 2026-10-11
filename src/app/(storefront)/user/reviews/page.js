'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { 
  Star, MessageSquare, CheckCircle2, Trash2, Edit3, 
  ExternalLink, Package, AlertCircle, Sparkles, Plus, Clock, X, Check,
  ChevronLeft, ChevronRight, ChevronDown, ArrowRight
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import CustomSelect from '@/components/storefront/StoreSelect';

export default function MyReviewsPage() {
  const { user, loading: authLoading } = useStoreAuth();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'submitted'
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, totalPending: 0, avgGivenRating: 0 });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modal State for Reviewing / Editing
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [modalRating, setModalRating] = useState(5);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const fetchReviewsData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('store_token');
      const res = await fetch('/api/store-reviews/my-reviews', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setPendingReviews(data.pendingReviews || []);
        setStats(data.stats || { totalReviews: 0, totalPending: 0, avgGivenRating: 0 });
        if ((data.pendingReviews?.length || 0) === 0 && (data.reviews?.length || 0) > 0) {
          setActiveTab('submitted');
        }
      }
    } catch (err) {
      console.error(err);
      showToast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchReviewsData();
    }
  }, [user, authLoading, fetchReviewsData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleOpenReviewModal = (item, existingReview = null) => {
    setActiveModalItem(item);
    if (existingReview) {
      setIsEditing(true);
      setEditingReviewId(existingReview._id);
      setModalRating(existingReview.rating || 5);
      setModalTitle(existingReview.title || '');
      setModalBody(existingReview.body || '');
    } else {
      setIsEditing(false);
      setEditingReviewId(null);
      setModalRating(5);
      setModalTitle('');
      setModalBody('');
    }
  };

  const handleCloseModal = () => {
    setActiveModalItem(null);
    setIsEditing(false);
    setEditingReviewId(null);
  };

  const handleSubmitReview = async (e) => {
    e?.preventDefault();
    if (!activeModalItem) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('store_token');
      const method = isEditing ? 'PUT' : 'POST';
      const payload = {
        productId: activeModalItem.productId || activeModalItem.id,
        rating: modalRating,
        title: modalTitle,
        body: modalBody,
        ...(isEditing && editingReviewId && { reviewId: editingReviewId })
      };

      const res = await fetch('/api/store-reviews', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast.success(isEditing ? 'Review updated successfully!' : 'Thank you! Review published.');
        handleCloseModal();
        fetchReviewsData();
      } else {
        showToast.error(data.message || 'Failed to save review');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Network error saving review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const token = localStorage.getItem('store_token');
      const res = await fetch(`/api/store-reviews/my-reviews?id=${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('Review deleted.');
        fetchReviewsData();
      } else {
        showToast.error(data.message || 'Failed to delete review');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Error deleting review');
    }
  };

  // Pagination Calculations
  const currentList = activeTab === 'pending' ? pendingReviews : reviews;
  const totalItems = currentList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedList = currentList.slice(startIndex, endIndex);

  return (
    <UserDashboardLayout title="My Reviews & Ratings">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Summary Banner */}
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
              <Star size={20} color="#ffffff" strokeWidth={2} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Ratings &amp; Customer Reviews
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Your genuine reviews and ratings help fellow shoppers discover top-quality products across our catalog
            </p>
          </div>

          {/* Quick Metrics */}
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
                {stats.totalReviews}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
                Published
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
                {stats.totalPending}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
                To Review
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar & Page Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem', width: '100%' }}>
          
          <div className="user-tab-nav-bar">
            <button
              type="button"
              onClick={() => handleTabChange('pending')}
              className={`user-tab-nav-btn ${activeTab === 'pending' ? 'active' : ''}`}
            >
              Delivered Items to Review
              <span className="user-tab-nav-badge">
                {stats.totalPending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('submitted')}
              className={`user-tab-nav-btn ${activeTab === 'submitted' ? 'active' : ''}`}
            >
              My Submitted Reviews
              <span className="user-tab-nav-badge">
                {stats.totalReviews}
              </span>
            </button>
          </div>

          {/* Show Per Page Custom Select */}
          {totalItems > 0 && (
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
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}

        {/* ── TAB 1: Delivered Items Pending Review ── */}
        {!loading && activeTab === 'pending' && (
          <div>
            {pendingReviews.length === 0 ? (
              <div className="user-dashboard-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.15)' }}>
                  <CheckCircle2 size={30} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
                  You're all caught up!
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
                  You have shared feedback for all your delivered products. As soon as your next package arrives, you can rate it right here.
                </p>
                <Link 
                  href="/products" 
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
                  <Sparkles size={16} color="#fbbf24" />
                  Explore New Arrivals
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {paginatedList.map((item, idx) => (
                    <div
                      key={idx}
                      className="user-pending-review-card"
                    >
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.title} style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={22} color="#94a3b8" />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 800, color: '#16a34a', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', marginBottom: '3px' }}>
                            <CheckCircle2 size={10} /> DELIVERED
                          </span>
                          <h4 className="user-review-title" style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            ₹{(item.price || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(item)}
                        className="dashboard-primary-btn"
                        style={{
                          width: '100%',
                          padding: '0.55rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Star size={13} fill="#fbbf24" color="#fbbf24" />
                        Write a Review
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="user-dashboard-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                      Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalItems}</strong> items
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

        {/* ── TAB 2: My Submitted Reviews ── */}
        {!loading && activeTab === 'submitted' && (
          <div>
            {reviews.length === 0 ? (
              <div className="user-dashboard-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f8fafc', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid #e2e8f0' }}>
                  <Star size={26} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
                  No reviews submitted yet
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
                  Share your genuine shopping experiences on delivered items to help other customers discover top quality products.
                </p>
                {pendingReviews.length > 0 ? (
                  <button 
                    onClick={() => handleTabChange('pending')} 
                    className="dashboard-primary-btn"
                    style={{ padding: '0.75rem 1.75rem', borderRadius: '12px' }}
                  >
                    <Star size={16} fill="#fbbf24" color="#fbbf24" />
                    Review Delivered Items ({pendingReviews.length})
                  </button>
                ) : (
                  <Link 
                    href="/products" 
                    className="dashboard-primary-btn"
                    style={{ padding: '0.75rem 1.75rem', borderRadius: '12px', textDecoration: 'none' }}
                  >
                    <Sparkles size={16} color="#fbbf24" />
                    Explore New Arrivals
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {paginatedList.map((r) => (
                  <div
                    key={r._id}
                    className="user-review-card"
                  >
                    {/* Header: Product preview & Rating */}
                    <div className="user-review-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                        {r.productThumbnail && (
                          <img src={r.productThumbnail} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Link href={`/products/${r.productSlug}`} className="user-review-title">
                            <span>{r.productTitle}</span> <ExternalLink size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                          </Link>
                          <span className="user-review-date">
                            Reviewed on {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {r.isEdited && ' • Edited'}
                          </span>
                        </div>
                      </div>

                      {/* Stars badge */}
                      <div className="user-review-rating-badge">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            fill={i < r.rating ? '#fbbf24' : 'none'}
                            color={i < r.rating ? '#fbbf24' : '#d1d5db'}
                          />
                        ))}
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, marginLeft: '4px' }}>
                          {r.rating}.0
                        </span>
                      </div>
                    </div>

                    {/* Review Title & Body */}
                    <div className="user-review-content">
                      {r.title && (
                        <h4 className="user-review-headline">
                          {r.title}
                        </h4>
                      )}
                      <p className="user-review-body">
                        {r.body || 'No written comment provided.'}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="user-review-footer">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                        <CheckCircle2 size={12} color="#16a34a" /> Verified Customer Review
                      </span>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal({ productId: r.productId, title: r.productTitle, thumbnail: r.productThumbnail }, r)}
                          className="user-address-edit-btn"
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(r._id)}
                          className="user-address-delete-btn"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="user-dashboard-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                      Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalItems}</strong> reviews
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

      </div>

      {/* ── WRITE / EDIT REVIEW MODAL ── */}
      {activeModalItem && typeof document !== 'undefined' && createPortal(
        <div className="fnp-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxSizing: 'border-box' }}>
          <div className="fnp-review-modal" style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            
            {/* Header */}
            <div className="fnp-review-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {activeModalItem.thumbnail && (
                  <img src={activeModalItem.thumbnail} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                )}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {isEditing ? 'Edit Your Review' : 'Rate & Review Product'}
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', display: 'block', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeModalItem.title}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCloseModal}
                className="fnp-modal-close-btn"
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitReview} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              {/* Star Rating */}
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>
                  Select Rating *
                </span>
                <div style={{ display: 'inline-flex', gap: '0.45rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setModalRating(star)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'none'}
                    >
                      <Star 
                        size={30} 
                        fill={star <= modalRating ? '#fbbf24' : 'none'} 
                        color={star <= modalRating ? '#fbbf24' : '#cbd5e1'} 
                      />
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginTop: '0.25rem' }}>
                  {modalRating === 5 ? '⭐ Excellent! Loved it' : modalRating === 4 ? '👍 Very Good' : modalRating === 3 ? '👌 Average' : modalRating === 2 ? '👎 Below Expectations' : '💔 Poor Experience'}
                </div>
              </div>

              <div>
                <label className="dashboard-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Headline / Title (e.g. Great quality and fresh!)
                </label>
                <input
                  type="text"
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  placeholder="Summarize your experience..."
                  className="dashboard-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <div>
                <label className="dashboard-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Written Review
                </label>
                <textarea
                  rows={3}
                  value={modalBody}
                  onChange={e => setModalBody(e.target.value)}
                  placeholder="What did you like or dislike? How was the packaging, freshness, and delivery?"
                  className="dashboard-input"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="dashboard-secondary-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="dashboard-primary-btn"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Review' : 'Submit Review'}
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
