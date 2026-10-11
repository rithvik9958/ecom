'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, History, Sparkles } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import ProductCard from '@/components/storefront/ProductCard';

const STORAGE_KEY = 'fnp_recently_viewed';
const MAX_ITEMS = 12;

/**
 * Helper to record a product view into localStorage
 */
export function recordProductView(product) {
  if (!product || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const prodId = String(product._id || product.id || '');
    if (!prodId) return;

    // Filter out previous occurrence and put newest first
    const updated = [product, ...list.filter(item => String(item._id || item.id) !== prodId)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch event so other components on page update immediately
    window.dispatchEvent(new CustomEvent('recentlyViewedUpdated'));
  } catch (err) {
    console.warn('[RecentlyViewed] Error saving history:', err);
  }
}

export default function RecentlyViewed({ 
  currentProductId = null, 
  badgeText: propBadgeText, 
  title: propTitle, 
  subtitle: propSubtitle 
}) {
  const [items, setItems] = useState([]);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [config, setConfig] = useState({
    badgeText: 'Pick Up Where You Left Off',
    title: 'Recently Viewed by You',
    subtitle: 'Products you browsed during your recent visits'
  });

  const loadItems = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setItems([]);
        return;
      }
      const list = JSON.parse(raw);
      // Exclude current product if on its detail page
      const filtered = currentProductId
        ? list.filter(item => String(item._id || item.id) !== String(currentProductId) && String(item.slug) !== String(currentProductId))
        : list;
      setItems(filtered);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
    const handleUpdate = () => loadItems();
    window.addEventListener('recentlyViewedUpdated', handleUpdate);
    return () => window.removeEventListener('recentlyViewedUpdated', handleUpdate);
  }, [currentProductId]);

  useEffect(() => {
    fetch('/api/store-payment-settings')
      .then(r => r.json())
      .then(data => {
        if (data.data?.recentlyViewedSettings) {
          setConfig(data.data.recentlyViewedSettings);
        }
      })
      .catch(() => {});
  }, []);

  const effectiveBadge = propBadgeText !== undefined ? propBadgeText : (config.badgeText || 'Pick Up Where You Left Off');
  const effectiveTitle = propTitle !== undefined ? propTitle : (config.title || 'Recently Viewed by You');
  const effectiveSubtitle = propSubtitle !== undefined ? propSubtitle : (config.subtitle || 'Products you browsed during your recent visits');

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="fnp-recently-viewed-section" style={{ marginTop: '4rem', marginBottom: '3rem' }}>
      
      {/* Centered Divider with Integrated Heading & Subheading */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: '2rem' }}>
        {/* Horizontal Gradient Divider Line */}
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: 0, 
          right: 0, 
          height: '1px', 
          background: 'linear-gradient(90deg, transparent, var(--store-border, #e2e8f0) 15%, var(--store-border, #cbd5e1) 50%, var(--store-border, #e2e8f0) 85%, transparent)', 
          zIndex: 1 
        }} />
        
        {/* Centered Content Island */}
        <div style={{ 
          position: 'relative', 
          display: 'inline-block', 
          background: 'var(--store-bg, var(--fnp-cream))', 
          padding: '0 1.75rem', 
          zIndex: 2 
        }}>
          {effectiveBadge && (
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.8px', 
              color: 'var(--store-accent, #c59b27)', 
              background: 'rgba(197, 155, 39, 0.14)', 
              border: '1px solid rgba(197, 155, 39, 0.35)', 
              padding: '3px 12px', 
              borderRadius: '50px', 
              marginBottom: '6px' 
            }}>
              <Sparkles size={11} /> {effectiveBadge}
            </div>
          )}
          <h3 style={{ 
            fontSize: '1.4rem', 
            fontWeight: 800, 
            color: 'var(--store-text, var(--fnp-gray-900))', 
            margin: '2px 0 0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px' 
          }}>
            <History size={20} color="var(--store-accent, #c59b27)" /> {effectiveTitle}
          </h3>
          {effectiveSubtitle && (
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--store-muted, var(--fnp-gray-500))' }}>
              {effectiveSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Swiper Carousel Container & Custom Controls */}
      <div style={{ position: 'relative' }}>
        
        {/* Carousel Navigation Buttons */}
        {items.length > 2 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '0.85rem' }}>
            <button
              type="button"
              onClick={() => swiperInstance?.slidePrev()}
              disabled={isBeginning}
              className="fnp-carousel-nav-btn"
              aria-label="Previous products"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid var(--store-border, rgba(255, 255, 255, 0.18))',
                background: 'var(--store-surface, #111827)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isBeginning ? 'not-allowed' : 'pointer',
                opacity: isBeginning ? 0.35 : 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s',
                color: 'var(--store-text, #ffffff)'
              }}
            >
              <ChevronLeft size={20} color="currentColor" />
            </button>
            <button
              type="button"
              onClick={() => swiperInstance?.slideNext()}
              disabled={isEnd}
              className="fnp-carousel-nav-btn"
              aria-label="Next products"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid var(--store-border, rgba(255, 255, 255, 0.18))',
                background: 'var(--store-surface, #111827)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isEnd ? 'not-allowed' : 'pointer',
                opacity: isEnd ? 0.35 : 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s',
                color: 'var(--store-text, #ffffff)'
              }}
            >
              <ChevronRight size={20} color="currentColor" />
            </button>
          </div>
        )}

        {/* Swiper Carousel Track */}
        <Swiper
          modules={[Navigation, FreeMode]}
          onSwiper={(swiper) => {
            setSwiperInstance(swiper);
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onSlideChange={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          spaceBetween={16}
          slidesPerView={1.3}
          freeMode={false}
          breakpoints={{
            480: {
              slidesPerView: 2,
              spaceBetween: 14,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 16,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 18,
            },
            1280: {
              slidesPerView: 5,
              spaceBetween: 20,
            },
          }}
          style={{ paddingBottom: '0.5rem', overflow: 'hidden' }}
        >
          {items.map((prod) => (
            <SwiperSlide key={prod._id || prod.id} style={{ height: 'auto', display: 'flex' }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <ProductCard product={prod} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

      </div>

    </section>
  );
}
