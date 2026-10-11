'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Maximize2, Volume2, VolumeX, Share2, Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Scrollbar, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/scrollbar';
import 'swiper/css/free-mode';
import ProductCard from '@/components/storefront/ProductCard';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

/* ══════════════════════════════════════
   Hero Carousel (unchanged)
══════════════════════════════════════ */
function HeroCarousel({ slides }) {
  const [idx, setIdx]       = useState(0);
  const [paused, setPaused] = useState(false);

  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = useCallback(() => setIdx((i) => (i + 1) % slides.length), [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [paused, next, slides.length]);

  if (!slides.length) {
    return null;
  }

  const slide = slides[idx];
  const isDark = !!(slide.bgImage || slide.bgColor?.startsWith('#0') || slide.bgColor?.startsWith('#1'));

  return (
    <div
      className="fnp-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ display: 'flex', transition: 'none', height: '100%' }}>
        <div
          className={isDark ? 'fnp-hero-slide-dark' : 'fnp-hero-slide'}
          style={{
            backgroundColor: slide.bgColor || (isDark ? '#0f2418' : '#faf8f3'),
            backgroundImage: slide.bgImage ? `url(${getImageUrl(slide.bgImage)})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {isDark && <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.5)', zIndex:1 }} />}
          <div className="fnp-hero-content" style={{ position:'relative', zIndex:2 }}>
            {slide.subtitle && (
              <p className="fnp-hero-subtitle" style={{ color: isDark ? 'rgba(200,168,75,.9)' : undefined }}>
                {slide.subtitle}
              </p>
            )}
            <h1 className={`fnp-hero-title ${isDark ? 'fnp-hero-title-light' : ''}`}>
              {slide.title || 'Discover Your Next Favourite Gift'}
            </h1>
            {slide.description && (
              <p className={`fnp-hero-desc ${isDark ? 'fnp-hero-desc-light' : ''}`}>
                {slide.description}
              </p>
            )}
            <Link
              href={slide.link || '/products'}
              style={{ display:'inline-flex', alignItems:'center', gap:'.5rem', background: isDark ? '#c8a84b' : '#111111', color:'#fff', padding:'.75rem 1.75rem', borderRadius:'9999px', fontWeight:600, textDecoration:'none', fontSize:'.875rem' }}
            >
              {slide.buttonText || 'Shop Now'} <ArrowRight size={16} />
            </Link>
          </div>
          {slide.image && (
            <div className="fnp-hero-image" style={{ position:'relative', zIndex:2 }}>
              <img src={getImageUrl(slide.image)} alt={slide.title || 'Banner'} />
            </div>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button className="fnp-arrow fnp-arrow-left" onClick={prev} aria-label="Previous">
            <ArrowLeft size={18} />
          </button>
          <button className="fnp-arrow fnp-arrow-right" onClick={next} aria-label="Next">
            <ArrowRight size={18} />
          </button>
          <div className="fnp-carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`fnp-dot ${i === idx ? 'active' : ''}`}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   Category Carousel (unchanged)
══════════════════════════════════════ */
function CategoryCarousel({ categories }) {
  if (!categories?.length) return null;

  return (
    <div className="fnp-category-carousel-wrapper">
      <div style={{ paddingBottom: '20px' }}>
        <Swiper
          modules={[Navigation, Scrollbar, FreeMode]}
          slidesPerView={categories.length > 11 ? 11 : categories.length}
          spaceBetween={20}
          freeMode={true}
          loop={categories.length > 3}
          scrollbar={{ draggable: true, hide: false }}
          navigation={{
            prevEl: '.fnp-cat-arrow.left',
            nextEl: '.fnp-cat-arrow.right',
          }}
          breakpoints={{
            320: { slidesPerView: Math.min(categories.length, 3) },
            640: { slidesPerView: Math.min(categories.length, 5) },
            1024: { slidesPerView: Math.min(categories.length, 8) },
            1280: { slidesPerView: categories.length > 11 ? 11 : categories.length }
          }}
          className="fnp-category-swiper"
        >
          {categories.map((cat) => (
            <SwiperSlide key={cat._id} style={{ display: 'flex', justifyContent: 'center' }}>
              <Link href={`/category/${cat.slug}`} className="fnp-cat-item">
                <div className="fnp-cat-icon">
                  {cat.image
                    ? <img src={getImageUrl(cat.image)} alt={cat.title} />
                    : <span style={{ fontSize: '2rem' }}>🌸</span>
                  }
                </div>
                <span className="fnp-cat-name">{cat.title}</span>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <button className="fnp-cat-arrow left"><ArrowLeft size={18} /></button>
      <button className="fnp-cat-arrow right"><ArrowRight size={18} /></button>
    </div>
  );
}

/* ══════════════════════════════════════
   SECTION: Mini Cards (Occasion Cards)
══════════════════════════════════════ */
function OccasionCardsSection({ config }) {
  const scrollRef = useRef(null);
  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });

  const { title = 'Gift Categories', subtitle, titleColor, cards = [] } = config;
  const visibleCards = cards.filter(c => c.isVisible !== false);
  if (!visibleCards.length) return null;

  return (
    <section className="fnp-section" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem', backgroundColor: config.bgColor || 'transparent' }}>
      <div className="fnp-section-header">
        <h2 className="fnp-section-title" style={{ color: titleColor || undefined }}>{title}</h2>
        {subtitle && <p className="text-sm mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="fnp-occasion-carousel-wrapper">
        <Swiper
          modules={[Navigation, FreeMode]}
          slidesPerView="auto"
          spaceBetween={20}
          freeMode={true}
          loop={visibleCards.length > 3}
          navigation={{
            prevEl: '.fnp-cat-arrow.occ-left',
            nextEl: '.fnp-cat-arrow.occ-right',
          }}
          className="fnp-occasion-carousel"
          style={{ overflow: 'visible' }}
        >
          {visibleCards.map((card, i) => {
            const isImageOnly = !card.title && !card.badge && card.image;
            const textOnRight  = card.textAlign  === 'right';
            const imageOnRight = card.imageAlign !== 'left';

            return (
              <SwiperSlide key={i} style={{ width: 'auto' }}>
                <Link
                  href={card.link || '#'}
                  className="fnp-occasion-card"
                  style={{ backgroundColor: card.bgColor || undefined }}
                >
                  {isImageOnly ? (
                    /* Image-only layout */
                    <div className="w-full h-full">
                      <img src={getImageUrl(card.image)} alt="Card" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    /* Standard text + image layout */
                    <>
                      {card.badge && <div className="fnp-occasion-badge">{card.badge}</div>}

                      {/* Text block */}
                      <div
                        className="fnp-occasion-content"
                        style={{
                          order: textOnRight ? 2 : 1,
                          textAlign: textOnRight ? 'right' : 'left',
                        }}
                      >
                        <h3 className="fnp-occasion-title" style={{ color: card.textColor || undefined }}>{card.title}</h3>
                      </div>

                      {/* Image block */}
                      {card.image && (
                        <div
                          className="fnp-occasion-img-wrap"
                          style={{
                            order: imageOnRight ? 2 : 1,
                            [imageOnRight ? 'right' : 'left']: 0,
                            [imageOnRight ? 'left' : 'right']: 'unset',
                          }}
                        >
                          <img src={getImageUrl(card.image)} alt={card.title || 'Card'} />
                        </div>
                      )}
                    </>
                  )}
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
        <button className="fnp-cat-arrow occ-left left"><ArrowLeft size={18} /></button>
        <button className="fnp-cat-arrow occ-right right"><ArrowRight size={18} /></button>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   SECTION: Banner Slider (Swiper peek)
══════════════════════════════════════ */
function BannerSliderSection({ config }) {
  const [swiper, setSwiper] = useState(null);
  const { slides = [], autoPlay = true, autoPlayDelay = 4000, slidesPerView = 1.1 } = config;
  const visibleSlides = slides.filter(s => s.isVisible !== false);
  if (!visibleSlides.length) return null;

  // Swiper loop needs at least 3 slides to show left and right peeks seamlessly
  const displaySlides = visibleSlides.length === 2 ? [...visibleSlides, ...visibleSlides] : visibleSlides;

  return (
    <section className="fnp-banner-slider-section" style={{ backgroundColor: config.bgColor || 'transparent' }}>
      <div style={{ position: 'relative' }}>
        <Swiper
          onSwiper={setSwiper}
          modules={[Autoplay]}
          slidesPerView={slidesPerView}
          centeredSlides={slidesPerView < 2}
          spaceBetween={16}
          loop={displaySlides.length > 1}
          autoplay={autoPlay && displaySlides.length > 1
            ? { delay: autoPlayDelay, disableOnInteraction: false }
            : false}
          className="fnp-banner-swiper"
        >
          {displaySlides.map((slide, i) => (
            <SwiperSlide key={i}>
              <div className="fnp-banner-slide" style={{ backgroundColor: slide.bgColor || undefined }}>
                {(() => {
                  const isImageOnly = !slide.title && !slide.description && !slide.overtitle && !slide.buttonText && slide.image;
                  
                  if (isImageOnly) {
                    return (
                      <Link href={slide.link || '#'} style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 10 }}>
                        <img src={getImageUrl(slide.image)} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Link>
                    );
                  }

                  return (
                    <>
                      {/* Text side */}
                      <div className="fnp-banner-text">
                        {slide.overtitle && (
                          <p className="fnp-banner-overtitle" style={{ color: slide.overtitleColor || slide.textColor || undefined }}>
                            {slide.overtitle}
                          </p>
                        )}
                        {slide.title && (
                          <h2 className="fnp-banner-title" style={{ color: slide.titleColor || slide.textColor || undefined }}>
                            {slide.title}
                          </h2>
                        )}
                        {slide.description && (
                          <p className="fnp-banner-desc" style={{ color: slide.descColor || slide.textColor || undefined }}>
                            {slide.description}
                          </p>
                        )}
                        {slide.buttonText && (
                          <Link href={slide.link || '#'} className="fnp-banner-btn">
                            {slide.buttonText} <span style={{ marginLeft: '0.25rem' }}>›</span>
                          </Link>
                        )}
                      </div>

                      {/* Image side */}
                      {slide.image && (
                        <div className="fnp-banner-img">
                          <img src={getImageUrl(slide.image)} alt={slide.title || 'Banner'} />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom arrows */}
        {displaySlides.length > 1 && (
          <>
            <button
              className="fnp-banner-arrow fnp-banner-arrow-left"
              onClick={() => swiper?.slidePrev()}
              aria-label="Previous slide"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              className="fnp-banner-arrow fnp-banner-arrow-right"
              onClick={() => swiper?.slideNext()}
              aria-label="Next slide"
            >
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
/* ══════════════════════════════════════
   SECTION: Category Carousel (New Design)
══════════════════════════════════════ */
function CategoryCarouselSection({ config }) {
  const { title = 'Pick their favourite Flower', categories = [], slidesPerView = 4, autoPlay, autoPlayDelay } = config;
  const visibleCategories = categories.filter(c => c.isVisible !== false);
  if (!visibleCategories.length) return null;

  return (
    <section className="fnp-section relative" style={{ paddingTop: '2rem', paddingBottom: '2rem', backgroundColor: config.bgColor || 'transparent' }}>
      {title && (
        <div className="fnp-section-header mb-6">
          <h2 className="fnp-section-title">{title}</h2>
        </div>
      )}
      <div className="fnp-new-category-carousel">
        <Swiper
          modules={[Navigation, Autoplay, FreeMode]}
          slidesPerView={1.5}
          spaceBetween={16}
          freeMode={true}
          loop={visibleCategories.length > slidesPerView}
          autoplay={autoPlay ? { delay: autoPlayDelay || 4000, disableOnInteraction: false } : false}
          navigation={{
            prevEl: '.fnp-cat-new-arrow.left',
            nextEl: '.fnp-cat-new-arrow.right',
          }}
          breakpoints={{
            480: { slidesPerView: 2.5 },
            768: { slidesPerView: 3.5 },
            1024: { slidesPerView: slidesPerView },
          }}
          style={{ paddingBottom: '10px' }}
        >
          {visibleCategories.map((cat, i) => (
            <SwiperSlide key={i}>
              <Link href={cat.link || '#'} className="fnp-new-cat-item">
                <div className="fnp-new-cat-image-wrapper">
                  {cat.image ? (
                    <img src={getImageUrl(cat.image)} alt={cat.title} className="fnp-new-cat-image" />
                  ) : (
                    <div className="fnp-new-cat-placeholder" />
                  )}
                </div>
                <span className="fnp-new-cat-title">{cat.title}</span>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
        <button className="fnp-cat-new-arrow left"><ArrowLeft size={18} /></button>
        <button className="fnp-cat-new-arrow right"><ArrowRight size={18} /></button>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   SECTION: Product Showcase
══════════════════════════════════════ */
function ProductShowcaseSection({ config }) {
  const { title = 'Newly Launched', products = [], slidesPerView = 4, autoPlay, autoPlayDelay } = config;
  const visibleProducts = products.filter(p => p.isVisible !== false);
  if (!visibleProducts.length) return null;

  return (
    <div className="fnp-product-showcase-bg" style={{ backgroundColor: config.bgColor || undefined }}>
      <section className="fnp-section" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        {title && (
          <div className="fnp-section-header mb-8">
            <h2 className="fnp-section-title">{title}</h2>
          </div>
        )}
        <div className="fnp-product-showcase-wrapper">
          <Swiper
            modules={[Navigation, Autoplay, FreeMode]}
            slidesPerView={1.2}
            spaceBetween={20}
            freeMode={true}
            loop={visibleProducts.length > slidesPerView}
            autoplay={autoPlay ? { delay: autoPlayDelay || 4000, disableOnInteraction: false } : false}
            navigation={{
              prevEl: '.fnp-showcase-arrow.left',
              nextEl: '.fnp-showcase-arrow.right',
            }}
            breakpoints={{
              480: { slidesPerView: 2.2 },
              768: { slidesPerView: 3.2 },
              1024: { slidesPerView: slidesPerView },
            }}
            style={{ padding: '0 0 20px 0' }}
          >
            {visibleProducts.map((prod, i) => (
              <SwiperSlide key={i} style={{ height: 'auto' }}>
                <Link href={prod.link || '#'} className="fnp-premium-product-card">
                  <div className="fnp-ppc-image-wrapper">
                    {prod.image ? (
                      <img src={getImageUrl(prod.image)} alt={prod.title} className="fnp-ppc-image" />
                    ) : (
                      <div className="fnp-ppc-placeholder" />
                    )}
                    {prod.badgeText && (
                      <div className="fnp-ppc-badge">
                        {prod.badgeText}
                      </div>
                    )}
                  </div>
                  <div className="fnp-ppc-content">
                    <h3 className="fnp-ppc-title">{prod.title}</h3>
                    <div className="fnp-ppc-price-row">
                      <span className="fnp-ppc-current-price">₹{prod.currentPrice}</span>
                      {prod.originalPrice && (
                        <span className="fnp-ppc-original-price">₹{prod.originalPrice}</span>
                      )}
                      {prod.discountLabel && (
                        <span className="fnp-ppc-discount">{prod.discountLabel}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
          <button className="fnp-showcase-arrow left"><ArrowLeft size={20} /></button>
          <button className="fnp-showcase-arrow right"><ArrowRight size={20} /></button>
        </div>
        <div className="fnp-view-all-wrapper">
          <Link href="/products" className="fnp-view-all-btn">
            View All Launches <ArrowRight size={16} style={{ marginLeft: '6px' }} />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ══════════════════════════════════════
   SECTION: Video Stories
══════════════════════════════════════ */
function VideoCard({ slide, onExpand }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(()=>{});
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fnp-video-card" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={() => onExpand()}>
      <video ref={videoRef} src={getImageUrl(slide.video)} muted={isMuted} loop playsInline className="fnp-video-element" />
      {!isPlaying && <div className="fnp-video-play-icon"><Play fill="white" size={24} /></div>}
      
      <div className="fnp-video-actions">
        <button onClick={(e) => { e.stopPropagation(); onExpand(); }}><Maximize2 size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}>
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {slide.products && slide.products.length > 0 && (
        <div className="fnp-video-snippet">
          <img src={getImageUrl(slide.products[0].image)} alt="" />
          <div className="fnp-video-snippet-info">
            <h4 className="line-clamp-2">{slide.products[0].title}</h4>
            <p>₹{slide.products[0].currentPrice}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoStoriesSection({ config }) {
  const { title = 'Joyful Gifting Stories', bgColor = 'transparent', slides = [] } = config;
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [modalMuted, setModalMuted] = useState(false);

  const visibleSlides = slides.filter(s => s.isVisible !== false);
  if (!visibleSlides.length) return null;

  const nextVideo = () => setExpandedIndex(i => (i + 1) % visibleSlides.length);
  const prevVideo = () => setExpandedIndex(i => (i - 1 + visibleSlides.length) % visibleSlides.length);

  return (
    <>
      <section className="fnp-section fnp-video-stories-section" style={{ backgroundColor: bgColor }}>
        <div className="fnp-section-header">
        <h2 className="fnp-section-title">{title}</h2>
      </div>
      <div className="fnp-video-carousel-wrapper">
        <Swiper
          modules={[Navigation, FreeMode]}
          slidesPerView="auto"
          spaceBetween={16}
          freeMode={true}
          navigation={{
            prevEl: '.fnp-vs-arrow.left',
            nextEl: '.fnp-vs-arrow.right',
          }}
          className="fnp-video-carousel"
        >
          {visibleSlides.map((slide, i) => (
            <SwiperSlide key={i} style={{ width: '220px' }}>
              <VideoCard slide={slide} onExpand={() => setExpandedIndex(i)} />
            </SwiperSlide>
          ))}
        </Swiper>
        <button className="fnp-vs-arrow left"><ArrowLeft size={18} /></button>
        <button className="fnp-vs-arrow right"><ArrowRight size={18} /></button>
      </div>
    </section>

    {expandedIndex !== null && typeof document !== 'undefined' && createPortal(
        <div className="fnp-video-modal-overlay" onClick={() => setExpandedIndex(null)}>
          <div className="fnp-video-modal-wrapper">
            <button className="fnp-quickview-close" onClick={() => setExpandedIndex(null)}><X size={24} /></button>
            
            {visibleSlides.length > 1 && (
              <>
                <button className="fnp-modal-nav prev" onClick={(e) => { e.stopPropagation(); prevVideo(); }}><ChevronLeft size={28} /></button>
                <button className="fnp-modal-nav next" onClick={(e) => { e.stopPropagation(); nextVideo(); }}><ChevronRight size={28} /></button>
              </>
            )}

            <div className="fnp-video-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fnp-modal-video-side">
              <video 
                src={getImageUrl(visibleSlides[expandedIndex]?.video)} 
                autoPlay 
                loop 
                muted={modalMuted}
                playsInline 
                className="fnp-modal-video" 
              />
              <div className="fnp-modal-video-actions">
                 <button onClick={(e) => { e.stopPropagation(); setModalMuted(!modalMuted); }}>
                   {modalMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                 </button>
              </div>
            </div>
            <div className="fnp-modal-products-side">
              <div className="fnp-modal-products-list">
                {(visibleSlides[expandedIndex]?.products || []).map((prod, i) => (
                  <Link key={i} href={prod.link || '#'} className="fnp-modal-product-card" onClick={(e) => e.stopPropagation()}>
                    <div className="fnp-modal-product-img-wrap">
                      <img src={getImageUrl(prod.image)} alt="" className="fnp-modal-product-img" />
                    </div>
                    <div className="fnp-modal-product-info">
                      <h4 className="line-clamp-2">{prod.title}</h4>
                      <p>₹{prod.currentPrice}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>,
        document.body
      )}
    </>
  );
}

/* ══════════════════════════════════════
   Stats Counter Section
══════════════════════════════════════ */
function StatsCounterSection({ config }) {
  const stats = (config.stats || []).filter(s => s.isVisible !== false);
  const bgColor = config.bgColor || undefined;
  const accentColor = config.accentColor || 'var(--store-accent, #6a8f4b)';
  if (stats.length === 0) return null;

  return (
    <section className="fnp-stats-section" style={{ backgroundColor: bgColor }}>
      <div className="fnp-stats-container">
        {stats.map((stat, i) => (
          <div key={i} className="fnp-stat-item">
            <span className="fnp-stat-value" style={{ color: accentColor }}>
              {stat.value}
            </span>
            <span className="fnp-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   Trust Badges Section
══════════════════════════════════════ */
function TrustBadgesSection({ config }) {
  const badges = (config.badges || []).filter(b => b.isVisible !== false);
  if (badges.length === 0) return null;

  return (
    <section className="fnp-section fnp-trust-badges-section">
      <div className="fnp-trust-badges-container">
        {badges.map((badge, i) => (
          <div key={i} className="fnp-badge-item">
            <div className="fnp-badge-icon">
              {badge.image && <img src={getImageUrl(badge.image)} alt="" />}
            </div>
            <div className="fnp-badge-text-wrap">
              <h3 className="fnp-badge-title">{badge.title}</h3>
              <p className="fnp-badge-subtext">{badge.subtext}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   Dynamic section router
══════════════════════════════════════ */
function DynamicSection({ section }) {
  if (!section.isVisible) return null;
  switch (section.type) {
    case 'occasion_cards':
      return <OccasionCardsSection config={section.config} />;
    case 'banner_slider':
      return <BannerSliderSection config={section.config} />;
    case 'category_carousel':
      return <CategoryCarouselSection config={section.config} />;
    case 'product_showcase':
      return <ProductShowcaseSection config={section.config} />;
    case 'video_stories':
      return <VideoStoriesSection config={section.config} />;
    case 'trust_badges':
      return <TrustBadgesSection config={section.config} />;
    case 'stats_counter':
      return <StatsCounterSection config={section.config} />;
    default:
      return null;
  }
}

import RecentlyViewed from '@/components/storefront/RecentlyViewed';

/* ══════════════════════════════════════
   Main HomeClient
══════════════════════════════════════ */
export default function HomeClient({ banners, categories, sections }) {
  const sorted = (sections || []).slice().sort((a, b) => a.order - b.order);

  return (
    <>
      {/* Dynamic Homepage Sections */}
      {sorted.map((section) => (
        <DynamicSection key={section.id} section={section} />
      ))}

      {/* Recently Viewed Carousel Section */}
      <div className="fnp-section" style={{ paddingTop: 0 }}>
        <RecentlyViewed />
      </div>
    </>
  );
}
