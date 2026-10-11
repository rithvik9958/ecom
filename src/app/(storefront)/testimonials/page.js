'use client';
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Quote,
  Plus,
  MessageSquare,
  ThumbsUp,
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  ShoppingBag,
  Search,
  Clock,
  Loader2,
  RotateCcw
} from 'lucide-react';
import showToast from '@/lib/storeToast';

function getInitials(name) {
  if (!name) return 'CS';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const ITEMS_PER_PAGE = 6;

const DEFAULT_PAGE_CONFIG = {
  hero: {
    title: 'Over 8 Million+ Celebrations Delivered',
    subtitle:
      'Read authentic, heartfelt experiences from delighted customers across 19,000+ PIN codes who trust City Shop for their most cherished moments.',
    bannerImage: ''
  },
  metrics: {
    overallScore: '4.9',
    scoreSubtext: 'Based on 12,450+ Verified Orders',
    metric1Value: '99.4%',
    metric1Label: 'On-Time Delivery Rate',
    metric2Value: '100%',
    metric2Label: 'Freshness & Quality Guarantee',
    allowSubmissions: true
  }
};

export default function TestimonialsPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedReviews, setLikedReviews] = useState({});

  const [reviewsList, setReviewsList] = useState([]);
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [pageConfig, setPageConfig] = useState(DEFAULT_PAGE_CONFIG);

  const [newReview, setNewReview] = useState({
    name: '',
    city: '',
    rating: 5,
    category: '',
    item: '',
    text: ''
  });

  useEffect(() => {
    setMounted(true);
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/store-testimonials');
      const data = await res.json();
      if (data.success) {
        setReviewsList(data.testimonials || []);
        if (data.config) {
          setPageConfig((prev) => ({
            ...prev,
            ...data.config,
            hero: { ...prev.hero, ...(data.config.hero || {}) },
            metrics: { ...prev.metrics, ...(data.config.metrics || {}) }
          }));
        }
        if (data.categories && data.categories.length > 0) {
          setDynamicCategories(data.categories);
          setNewReview((prev) => ({
            ...prev,
            category: data.categories[0]?.label || data.categories[0]?.id || 'General'
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // Reset to page 1 whenever search query or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  // Compute category list with real review counts
  const categoryPills = useMemo(() => {
    const allCount = reviewsList.length;
    const list = [{ id: 'all', label: 'All Reviews', count: `${allCount}` }];

    dynamicCategories.forEach((cat) => {
      const cLabel = cat.label || cat.id;
      const cCount = reviewsList.filter((r) => {
        const rCat = (r.category || '').toLowerCase();
        return rCat === cLabel.toLowerCase() || rCat === (cat.id || '').toLowerCase();
      }).length;
      list.push({ id: cat.id, label: cLabel, count: `${cCount}` });
    });

    return list;
  }, [dynamicCategories, reviewsList]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((rev) => {
      let matchCat = activeCategory === 'all';
      if (!matchCat) {
        const revCat = (rev.category || '').toLowerCase();
        const activeItem = dynamicCategories.find((c) => c.id === activeCategory);
        const activeLabel = (activeItem?.label || activeCategory).toLowerCase();
        matchCat = revCat === activeCategory.toLowerCase() || revCat === activeLabel;
      }

      const matchSearch =
        !searchQuery.trim() ||
        (rev.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rev.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rev.text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rev.item && rev.item.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery, reviewsList, dynamicCategories]);

  // Paginated Sliced Reviews
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / ITEMS_PER_PAGE));
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  // Like review with one-vote per user persistence
  const handleLike = async (id) => {
    const isCurrentlyLiked = !!likedReviews[id];
    const action = isCurrentlyLiked ? 'unlike' : 'like';
    const nextLikedState = { ...likedReviews };

    if (isCurrentlyLiked) {
      delete nextLikedState[id];
    } else {
      nextLikedState[id] = true;
    }

    setLikedReviews(nextLikedState);
    try {
      localStorage.setItem('liked_testimonials', JSON.stringify(nextLikedState));
    } catch (e) {}

    setReviewsList((prev) =>
      prev.map((r) => {
        if (r._id === id || r.id === id) {
          const currentLikes = r.likes || 0;
          return {
            ...r,
            likes: isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
          };
        }
        return r;
      })
    );

    if (isCurrentlyLiked) {
      showToast.info('Removed helpful vote');
    } else {
      showToast.success('Thanks for your feedback!');
    }

    try {
      await fetch('/api/store-testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
    } catch (err) {
      console.error('Error recording like:', err);
    }
  };

  // Submit review with permanent MongoDB saving
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.city.trim() || !newReview.text.trim()) {
      showToast.error('Please complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/store-testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newReview.name.trim(),
          city: newReview.city.trim(),
          rating: Number(newReview.rating) || 5,
          category: newReview.category || (dynamicCategories[0]?.label || 'General'),
          item: newReview.item.trim() || 'Handcrafted Luxury Gift Experience',
          text: newReview.text.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.testimonial) {
        setReviewsList([data.testimonial, ...reviewsList]);
        setIsModalOpen(false);
        setNewReview({
          name: '',
          city: '',
          rating: 5,
          category: dynamicCategories[0]?.label || 'General',
          item: '',
          text: ''
        });
        showToast.success('Thank you for sharing your experience! Your review is saved & published. 🌟');
      } else {
        throw new Error(data.message || 'Failed to save review');
      }
    } catch (err) {
      showToast.error(err.message || 'Error saving review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const { hero, metrics } = pageConfig;

  return (
    <div className="store-testimonials-page">
      
      {/* ── 1. Hero Header Banner (Dynamic CMS Driven) ── */}
      <section className="store-about-hero-banner store-testimonials-hero-banner">
        {hero.bannerImage ? (
          <>
            <div
              className="store-about-bg-img"
              style={{ backgroundImage: `url('${hero.bannerImage}')` }}
            />
            <div className="store-about-bg-overlay" />
          </>
        ) : (
          <div className="store-about-ambient-glow" />
        )}

        <div className="store-about-header-container relative z-10">
          {/* Frosted Glass Breadcrumb */}
          <div className="store-about-breadcrumb">
            <Link href="/" className="store-about-bc-link">Home</Link>
            <ChevronRight size={12} className="store-about-bc-sep" />
            <span className="store-about-bc-current">Customer Reviews & Stories</span>
          </div>

          <div className="store-testimonials-hero-content">
            <h1 className="store-about-title">{hero.title || DEFAULT_PAGE_CONFIG.hero.title}</h1>
            <p className="store-about-subtitle">
              {hero.subtitle || DEFAULT_PAGE_CONFIG.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. Ratings Overview & Trust Metric Strip (Dynamic CMS Driven) ── */}
      <section className="store-testimonials-metrics-section">
        <div className="store-container">
          <div className="store-testimonials-metrics-card">
            
            {/* Overall Rating Spotlight */}
            <div className="store-testimonials-metric-col score-spotlight">
              <div className="store-testimonials-big-score">{metrics.overallScore || '4.9'}</div>
              <div className="store-testimonials-stars-group">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={22}
                    style={{ fill: '#f59e0b', color: '#f59e0b' }}
                  />
                ))}
              </div>
              <p className="store-testimonials-score-label">{metrics.scoreSubtext || 'Based on 12,450+ Verified Orders'}</p>
            </div>

            <div className="store-testimonials-metric-divider" />

            {/* Metric 1 */}
            <div className="store-testimonials-metric-col">
              <div className="store-testimonials-metric-icon-box">
                <Clock size={22} />
              </div>
              <div className="store-testimonials-metric-info">
                <h4 className="store-testimonials-metric-val">{metrics.metric1Value || '99.4%'}</h4>
                <p className="store-testimonials-metric-lbl">{metrics.metric1Label || 'On-Time Delivery Rate'}</p>
              </div>
            </div>

            <div className="store-testimonials-metric-divider" />

            {/* Metric 2 */}
            <div className="store-testimonials-metric-col">
              <div className="store-testimonials-metric-icon-box">
                <ShieldCheck size={22} />
              </div>
              <div className="store-testimonials-metric-info">
                <h4 className="store-testimonials-metric-val">{metrics.metric2Value || '100%'}</h4>
                <p className="store-testimonials-metric-lbl">{metrics.metric2Label || 'Freshness & Quality Guarantee'}</p>
              </div>
            </div>

            {metrics.allowSubmissions !== false && (
              <>
                <div className="store-testimonials-metric-divider" />
                {/* Write Review Action */}
                <div className="store-testimonials-metric-col action-col">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="store-testimonials-write-btn"
                  >
                    <Plus size={16} />
                    <span>Write a Customer Review</span>
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </section>

      {/* ── 3. Dynamic Filter Categories & Search Bar ── */}
      <section className="store-testimonials-controls-section" id="testimonials-reviews-grid">
        <div className="store-container">
          
          <div className="store-testimonials-controls-wrap">
            {/* Dynamic Category Pills */}
            <div className="store-testimonials-pills-row">
              {categoryPills.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`store-testimonials-pill-btn ${activeCategory === cat.id ? 'is-active' : ''}`}
                >
                  <span>{cat.label}</span>
                  <span className="store-testimonials-pill-count">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="store-testimonials-search-box">
              <Search size={16} className="store-testimonials-search-icon" />
              <input
                type="text"
                placeholder="Search reviews by name, city, gift item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="store-testimonials-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="store-testimonials-search-clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. Reviews Grid (Multi-Column Layout with Pagination) ── */}
      <section className="store-testimonials-grid-section">
        <div className="store-container">
          
          {loading ? (
            <div className="store-testimonials-empty">
              <Loader2 size={36} className="animate-spin text-amber-500 mb-3" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading verified customer reviews...</p>
            </div>
          ) : paginatedReviews.length === 0 ? (
            <div className="store-testimonials-empty">
              <div className="store-testimonials-empty-icon-box">
                <MessageSquare size={30} className="text-amber-500" />
              </div>
              <h3 className="store-testimonials-empty-title">No Customer Stories Found</h3>
              <p className="store-testimonials-empty-desc">
                We couldn’t find any verified customer reviews matching your current category filter or search keywords.
              </p>
              <button
                type="button"
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                className="store-testimonials-reset-btn"
              >
                <RotateCcw size={14} />
                <span>Reset Search & Filters</span>
              </button>
            </div>
          ) : (
            <>
              <div className="store-testimonials-grid">
                {paginatedReviews.map((rev, idx) => {
                  const id = rev._id || rev.id || idx;
                  const initials = getInitials(rev.name);
                  const isLiked = likedReviews[id];
                  const likeCount = rev.likes || 0;

                  return (
                    <div key={id} className="store-testimonial-card">
                      
                      {/* Background Decorative Quote */}
                      <Quote className="store-testimonial-watermark" />

                      {/* Card Top: Stars & Timestamp */}
                      <div className="store-testimonial-card-header">
                        <div className="store-testimonial-stars">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              style={{ fill: '#f59e0b', color: '#f59e0b' }}
                            />
                          ))}
                        </div>
                        <span className="store-testimonial-date">
                          {rev.date || (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent')}
                        </span>
                      </div>

                      {/* Review Body */}
                      <blockquote className="store-testimonial-quote">
                        “{rev.text}”
                      </blockquote>

                      {/* Purchased Item Pill */}
                      {rev.item && (
                        <div className="store-testimonial-item-pill">
                          <ShoppingBag size={12} className="text-amber-500 flex-shrink-0" />
                          <span className="truncate">Purchased: <strong>{rev.item}</strong></span>
                        </div>
                      )}

                      {/* Author Profile Footer & Helpful Counter */}
                      <div className="store-testimonial-footer">
                        <div className="store-testimonial-author-box">
                          <div className="store-testimonial-avatar">
                            {initials}
                          </div>
                          <div className="store-testimonial-author-meta">
                            <div className="store-testimonial-name-row">
                              <h4 className="store-testimonial-author-name">{rev.name}</h4>
                              <span className="store-testimonial-verified-badge" title="Verified Customer">
                                <CheckCircle2 size={11} className="text-emerald-500" /> Verified
                              </span>
                            </div>
                            <p className="store-testimonial-author-city">
                              <MapPin size={11} className="inline text-slate-400 mr-0.5" />
                              {rev.city}
                            </p>
                          </div>
                        </div>

                        {/* Helpful Button */}
                        <button
                          type="button"
                          onClick={() => handleLike(id)}
                          className={`store-testimonial-like-btn ${isLiked ? 'is-liked' : ''}`}
                          title="Helpful Review"
                        >
                          <ThumbsUp size={13} />
                          <span>{likeCount}</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* ── Dynamic Luxury Storefront Pagination ── */}
              {totalPages > 1 && (
                <div className="store-testimonials-pagination-wrap">
                  <p className="store-testimonials-pagination-info">
                    Showing <strong>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredReviews.length)}</strong> of <strong>{filteredReviews.length}</strong> verified reviews
                  </p>

                  <div className="store-testimonials-pagination-controls">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        const el = document.getElementById('testimonials-reviews-grid');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="store-testimonials-page-btn nav-btn"
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    <div className="store-testimonials-page-numbers">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        const isActive = currentPage === pageNum;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => {
                              setCurrentPage(pageNum);
                              const el = document.getElementById('testimonials-reviews-grid');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`store-testimonials-page-number ${isActive ? 'is-active' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        const el = document.getElementById('testimonials-reviews-grid');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="store-testimonials-page-btn nav-btn"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* ── 5. Write a Review Modal (Rendered to Body Portal) ── */}
      {mounted && isModalOpen && createPortal(
        <div
          className="store-testimonials-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setIsModalOpen(false);
          }}
        >
          <div className="store-testimonials-modal-card">
            
            {/* Modal Header */}
            <div className="store-testimonials-modal-header">
              <div>
                <h3 className="store-testimonials-modal-title">
                  <Star size={20} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                  Share Your Gifting Story
                </h3>
                <p className="store-testimonials-modal-subtitle">
                  Your feedback helps us craft even more unforgettable celebrations.
                </p>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsModalOpen(false)}
                className="store-testimonials-modal-close"
                title="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} className="store-testimonials-form">
              
              {/* Star Rating Interactive Selector */}
              <div className="store-testimonials-form-group">
                <label className="store-testimonials-form-label">
                  Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="store-testimonials-stars-picker">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: num })}
                      className="store-testimonials-star-btn"
                    >
                      <Star
                        size={28}
                        style={{
                          fill: num <= newReview.rating ? '#f59e0b' : 'none',
                          color: num <= newReview.rating ? '#f59e0b' : '#94a3b8'
                        }}
                      />
                    </button>
                  ))}
                  <span className="store-testimonials-star-desc">
                    {newReview.rating === 5 ? '5 Stars — Outstanding ⭐' : `${newReview.rating} Stars`}
                  </span>
                </div>
              </div>

              {/* Name & City */}
              <div className="store-testimonials-form-row">
                <div className="store-testimonials-form-group">
                  <label className="store-testimonials-form-label">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shalini Roy"
                    value={newReview.name}
                    onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                    className="store-testimonials-input"
                  />
                </div>
                <div className="store-testimonials-form-group">
                  <label className="store-testimonials-form-label">
                    City & State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, MH"
                    value={newReview.city}
                    onChange={(e) => setNewReview({ ...newReview, city: e.target.value })}
                    className="store-testimonials-input"
                  />
                </div>
              </div>

              {/* Category & Purchased Item */}
              <div className="store-testimonials-form-row">
                <div className="store-testimonials-form-group">
                  <label className="store-testimonials-form-label">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newReview.category}
                    onChange={(e) => setNewReview({ ...newReview, category: e.target.value })}
                    className="store-testimonials-select"
                  >
                    {dynamicCategories.map((c) => (
                      <option key={c.id} value={c.label || c.id}>
                        {c.label || c.id}
                      </option>
                    ))}
                    {dynamicCategories.length === 0 && (
                      <>
                        <option value="Flowers">Fresh Flowers</option>
                        <option value="Cakes">Artisan Cakes</option>
                        <option value="Hampers">Luxury Hampers</option>
                        <option value="Express Delivery">Midnight & Express</option>
                        <option value="Corporate Gifting">Corporate Gifting</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="store-testimonials-form-group">
                  <label className="store-testimonials-form-label">
                    Purchased Item (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50 Red Rose Bouquet"
                    value={newReview.item}
                    onChange={(e) => setNewReview({ ...newReview, item: e.target.value })}
                    className="store-testimonials-input"
                  />
                </div>
              </div>

              {/* Review Text */}
              <div className="store-testimonials-form-group">
                <label className="store-testimonials-form-label">
                  Your Story / Review <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share details about the freshness, packaging quality, delivery punctuality, and recipient reaction..."
                  value={newReview.text}
                  onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                  className="store-testimonials-textarea"
                />
              </div>

              {/* Modal Actions */}
              <div className="store-testimonials-modal-actions">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="store-testimonials-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="store-testimonials-submit-btn flex items-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{submitting ? 'Publishing...' : 'Publish Story'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
