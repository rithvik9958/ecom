'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  Building2,
  Headphones,
  ChevronRight,
  ThumbsUp,
  X,
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';
import showToast from '@/lib/storeToast';

const DYNAMIC_ICONS = {
  Package,
  Truck,
  RotateCcw,
  CreditCard,
  Building2,
  HelpCircle,
  Phone,
  Mail,
  Headphones,
  Sparkles
};

function DynamicCategoryIcon({ name, size = 15 }) {
  const IconComponent = DYNAMIC_ICONS[name] || HelpCircle;
  return <IconComponent size={size} />;
}

const DEFAULT_PAGE_CONFIG = {
  hero: {
    title: 'How Can We Assist You Today?',
    subtitle:
      'Search questions below or choose a topic to find fast answers regarding orders, delivery, slots, and refunds.',
    bannerImage: ''
  },
  supportDesk: {
    isVisible: true,
    title: 'Still Need Assistance?',
    subtitle: 'Our customer care specialists are available 24/7 to resolve your inquiries right away.',
    phone: '+91 11-26802680',
    email: 'support@cityshop.com',
    hours: 'Mon–Sun, 24 Hours Available'
  },
  categories: [
    { id: 'ordering', label: 'Orders & Tracking', icon: 'Package', order: 1 },
    { id: 'delivery', label: 'Delivery & Slots', icon: 'Truck', order: 2 },
    { id: 'refunds', label: 'Returns & Refunds', icon: 'RotateCcw', order: 3 },
    { id: 'payments', label: 'Payments & Offers', icon: 'CreditCard', order: 4 },
    { id: 'corporate', label: 'Corporate & Bulk', icon: 'Building2', order: 5 }
  ]
};

export default function FAQsPage() {
  const [loading, setLoading] = useState(true);
  const [faqsList, setFaqsList] = useState([]);
  const [pageConfig, setPageConfig] = useState(DEFAULT_PAGE_CONFIG);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndices, setOpenIndices] = useState([0]); // first FAQ open by default
  const [likedFaqs, setLikedFaqs] = useState({});

  useEffect(() => {
    fetchFaqs();
    try {
      const saved = JSON.parse(localStorage.getItem('liked_faqs') || '{}');
      setLikedFaqs(saved);
    } catch (e) {}
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/store-faqs');
      const data = await res.json();
      if (data.success) {
        setFaqsList(data.faqs || []);
        if (data.config) {
          setPageConfig((prev) => ({
            ...prev,
            ...data.config,
            hero: { ...prev.hero, ...(data.config.hero || {}) },
            supportDesk: { ...prev.supportDesk, ...(data.config.supportDesk || {}) },
            categories: data.config.categories?.length > 0 ? data.config.categories : prev.categories
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const list = pageConfig.categories || DEFAULT_PAGE_CONFIG.categories;
    return [{ id: 'all', label: 'All Questions', icon: 'HelpCircle' }, ...list];
  }, [pageConfig.categories]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqsList.filter((faq) => {
      const matchCat =
        activeCategory === 'all' ||
        (faq.category || '').toLowerCase() === activeCategory.toLowerCase();

      const matchSearch =
        !searchQuery.trim() ||
        (faq.question || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (faq.answer || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery, faqsList]);

  // Toggle Accordion item
  const toggleAccordion = (idx) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Upvote Helpful FAQ with one-vote per user persistence
  const handleUpvoteHelpful = async (id, e) => {
    e.stopPropagation();
    const isCurrentlyLiked = !!likedFaqs[id];
    const action = isCurrentlyLiked ? 'unlike' : 'like';
    const nextLikedState = { ...likedFaqs };

    if (isCurrentlyLiked) {
      delete nextLikedState[id];
    } else {
      nextLikedState[id] = true;
    }

    setLikedFaqs(nextLikedState);
    try {
      localStorage.setItem('liked_faqs', JSON.stringify(nextLikedState));
    } catch (e) {}

    setFaqsList((prev) =>
      prev.map((f) => {
        if (f._id === id || f.id === id) {
          const currentCount = f.helpfulCount || 0;
          return {
            ...f,
            helpfulCount: isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1
          };
        }
        return f;
      })
    );

    if (isCurrentlyLiked) {
      showToast.info('Removed helpful vote');
    } else {
      showToast.success('Thanks for your feedback!');
    }

    try {
      await fetch('/api/store-faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
    } catch (err) {
      console.error('Error updating helpful vote:', err);
    }
  };

  const { hero, supportDesk } = pageConfig;

  return (
    <div className="store-faqs-page">
      
      {/* ── 1. Hero Header Banner (Consistent Luxury Dark Banner) ── */}
      <section className="store-about-hero-banner store-faqs-hero-banner">
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
            <span className="store-about-bc-current">Help Center & FAQs</span>
          </div>

          <div className="store-faqs-hero-content">
            <h1 className="store-about-title">{hero.title || DEFAULT_PAGE_CONFIG.hero.title}</h1>
            <p className="store-about-subtitle">
              {hero.subtitle || DEFAULT_PAGE_CONFIG.hero.subtitle}
            </p>

            {/* Live Search Bar */}
            <div className="store-faqs-search-box">
              <Search size={18} className="store-faqs-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. tracking, midnight delivery, refund, coupon)..."
                className="store-faqs-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="store-faqs-search-clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Category Selector Pills ── */}
      <section className="store-faqs-categories-section">
        <div className="store-container">
          <div className="store-faqs-pills-cluster">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? faqsList.length
                  : faqsList.filter((f) => (f.category || '').toLowerCase() === cat.id.toLowerCase()).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`store-faqs-pill-btn ${isActive ? 'is-active' : ''}`}
                >
                  <DynamicCategoryIcon name={cat.icon} size={14} />
                  <span>{cat.label}</span>
                  {count > 0 && <span className="store-faqs-pill-count">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. Accordion List & Support Concierge Sidebar ── */}
      <section className="store-faqs-list-section">
        <div className="store-container">
          <div className="store-faqs-grid">
            
            {/* Left: Accordion Questions Column */}
            <div className="store-faqs-accordion-col">
              {loading ? (
                <div className="store-faqs-empty-card">
                  <Loader2 size={32} className="animate-spin text-amber-500 mb-2 mx-auto" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading knowledge base...</p>
                </div>
              ) : filteredFaqs.length === 0 ? (
                <div className="store-faqs-empty-card">
                  <HelpCircle size={40} className="text-slate-300 dark:text-slate-700 mb-2 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">No questions found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No answers matched your keywords. Try searching for other terms or contact our support team.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                    className="store-testimonials-reset-btn mt-4 mx-auto"
                  >
                    <span>Reset Search</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredFaqs.map((faq, idx) => {
                    const id = faq._id || faq.id || idx;
                    const isOpen = openIndices.includes(idx);
                    const isLiked = likedFaqs[id];
                    const helpfulCount = faq.helpfulCount || 0;

                    return (
                      <div
                        key={id}
                        className={`store-faq-item ${isOpen ? 'is-open' : ''}`}
                      >
                        <button
                          type="button"
                          className="store-faq-question-btn"
                          onClick={() => toggleAccordion(idx)}
                          aria-expanded={isOpen}
                        >
                          <span className="store-faq-q-text">{faq.question}</span>
                          <span className="store-faq-q-icon">
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="store-faq-answer-box">
                            <p className="store-faq-a-text">{faq.answer}</p>

                            <div className="store-faq-helpful-row">
                              <span className="store-faq-helpful-text">Was this answer helpful?</span>
                              <button
                                type="button"
                                onClick={(e) => handleUpvoteHelpful(id, e)}
                                className={`store-faq-helpful-btn ${isLiked ? 'is-liked' : ''}`}
                              >
                                <ThumbsUp size={12} />
                                <span>{helpfulCount > 0 ? `Helpful (${helpfulCount})` : 'Helpful'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Modern Support Concierge Sidebar */}
            {supportDesk.isVisible !== false && (
              <div className="store-faqs-sidebar-col">
                <div className="store-faqs-support-card">
                  
                  {/* Header */}
                  <div className="store-faqs-support-header">
                    <div className="store-faqs-support-avatar">
                      <Headphones size={22} />
                    </div>
                    <div>
                      <h3 className="store-faqs-support-title">{supportDesk.title || 'Still Need Assistance?'}</h3>
                      <p className="store-faqs-support-subtitle">
                        {supportDesk.subtitle || 'Our customer care specialists are available 24/7 to resolve your inquiries right away.'}
                      </p>
                    </div>
                  </div>

                  {/* Clean Separated Action Cards */}
                  <div className="store-faqs-support-actions">
                    
                    {/* Call Hotline */}
                    <a
                      href={`tel:${(supportDesk.phone || '+91 11-26802680').replace(/[^0-9+]/g, '')}`}
                      className="store-faqs-action-link phone-action"
                    >
                      <div className="store-faqs-action-icon-box">
                        <Phone size={17} />
                      </div>
                      <div className="store-faqs-action-info">
                        <span className="store-faqs-action-label">Call Priority Helpline</span>
                        <span className="store-faqs-action-val">{supportDesk.phone || '+91 11-26802680'}</span>
                      </div>
                      <ChevronRight size={14} className="store-faqs-action-arrow" />
                    </a>

                    {/* Submit Message / Ticket */}
                    <Link
                      href="/contact"
                      className="store-faqs-action-link message-action"
                    >
                      <div className="store-faqs-action-icon-box">
                        <Mail size={17} />
                      </div>
                      <div className="store-faqs-action-info">
                        <span className="store-faqs-action-label">Submit a Helpdesk Message</span>
                        <span className="store-faqs-action-val">{supportDesk.email || 'support@cityshop.com'}</span>
                      </div>
                      <ChevronRight size={14} className="store-faqs-action-arrow" />
                    </Link>

                    {/* Track Active Order */}
                    <Link
                      href="/track-order"
                      className="store-faqs-action-link track-action"
                    >
                      <div className="store-faqs-action-icon-box">
                        <Package size={17} />
                      </div>
                      <div className="store-faqs-action-info">
                        <span className="store-faqs-action-label">Track Live Delivery</span>
                        <span className="store-faqs-action-val">Real-time Order Updates</span>
                      </div>
                      <ChevronRight size={14} className="store-faqs-action-arrow" />
                    </Link>

                  </div>

                  {/* Hours Badge Strip */}
                  <div className="store-faqs-hours-strip">
                    <Clock size={14} className="text-amber-500" />
                    <span>{supportDesk.hours || 'Mon–Sun, 24 Hours Available'}</span>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      </section>

    </div>
  );
}
