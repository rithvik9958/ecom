'use client';
import Link from 'next/link';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Star, Truck, ChevronDown, Check, ArrowLeftRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCompare } from '@/context/CompareContext';
import showToast from '@/lib/storeToast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { useEarliestDelivery } from '@/hooks/useEarliestDelivery';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

// Smart Curated Tag Palettes
const TAG_PALETTES = [
  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }, // Indigo / Blue
  { bg: '#fefce8', color: '#a16207', border: '#fef08a' }, // Amber / Gold
  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' }, // Emerald / Green
  { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' }, // Coral / Rose
  { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' }, // Violet / Purple
  { bg: '#f4f4f5', color: '#18181b', border: '#e4e4e7' }, // Slate / Neutral
  { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' }, // Cyan / Teal
  { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' }, // Peach / Orange
];

function getTagDetails(tag) {
  if (!tag) return { name: '', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  
  // Custom object from Dashboard
  if (typeof tag === 'object') {
    const name = tag.name || tag.label || tag.text || '';
    if (tag.bg && tag.color) {
      return { name, bg: tag.bg, color: tag.color, border: tag.border || 'transparent' };
    }
    return getTagDetails(name);
  }

  const str = String(tag).trim();
  if (str.includes('|')) {
    const [name, bg, color, border] = str.split('|');
    return { name: name?.trim() || '', bg: bg?.trim() || '#eff6ff', color: color?.trim() || '#1d4ed8', border: border?.trim() || 'transparent' };
  }

  // Keyword special presets
  const lower = str.toLowerCase();
  if (lower.includes('same day')) return { name: str, bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
  if (lower.includes('best seller') || lower.includes('bestseller')) return { name: str, bg: '#fefce8', color: '#a16207', border: '#fef08a' };
  if (lower.includes('trending')) return { name: str, bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
  if (lower.includes('fresh') || lower.includes('organic')) return { name: str, bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
  if (lower.includes('sale') || lower.includes('offer') || lower.includes('discount')) return { name: str, bg: '#fff1f2', color: '#be123c', border: '#fecdd3' };

  // Deterministic string hash algorithm
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % TAG_PALETTES.length;
  return { name: str, ...TAG_PALETTES[idx] };
}

export default function ProductCard({ product }) {
  const router = useRouter();
  const { addItem, items, updateQuantity } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addToCompare, isInCompare } = useCompare();
  const [adding, setAdding] = useState(false);
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const swiperRef = useRef(null);
  const productId = product.id || String(product._id);
  const wishlisted = isWishlisted(productId);
  const compared = isInCompare(product) || isInCompare(productId);

  const handleMouseEnter = () => {
    if (swiperRef.current && swiperRef.current.autoplay) {
      try {
        swiperRef.current.autoplay.start();
      } catch (e) {}
    }
  };

  const handleMouseLeave = () => {
    if (swiperRef.current) {
      try {
        if (swiperRef.current.autoplay) {
          swiperRef.current.autoplay.stop();
        }
        swiperRef.current.slideTo(0);
      } catch (e) {}
    }
  };

  const handleWishlist = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId);
    showToast.success(wishlisted ? 'Removed from wishlist' : '❤️ Added to wishlist');
  }, [toggleWishlist, productId, wishlisted]);

  const handleCompare = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCompare(product);
  }, [addToCompare, product]);
  const earliestDeliveryText = useEarliestDelivery(product);

  // Variant logic: Sort active variants ascending so the lowest-price variant is default
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const activeVariants = useMemo(() => {
    if (!hasVariants) return [];
    return [...product.variants]
      .filter(v => v.isActive !== false)
      .sort((a, b) => (a.price || 0) - (b.price || 0));
  }, [hasVariants, product.variants]);

  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (!activeVariants || activeVariants.length === 0) return null;
    return activeVariants[0]; // Lowest price variant
  });

  // Keep selectedVariant in sync if product prop updates
  useEffect(() => {
    if (activeVariants && activeVariants.length > 0 && !selectedVariant) {
      setSelectedVariant(activeVariants[0]);
    }
  }, [activeVariants, selectedVariant]);

  // Click outside to close variant dropdown
  useEffect(() => {
    if (!showVariantDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowVariantDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVariantDropdown]);

  // Helper for variant label
  const getVariantLabel = (v) => {
    if (!v) return '';
    const attrVals = Object.values(v.attrs || {}).filter(Boolean);
    if (attrVals.length > 0) return attrVals.join(' / ');
    return v.sku || 'Option';
  };
  const currentVariantLabel = getVariantLabel(selectedVariant);

  // Cart item matching for the specifically selected variant
  const cartItem = useMemo(() => {
    if (!items || items.length === 0) return null;
    const prodId = product.id || product._id;

    if (hasVariants && selectedVariant) {
      return items.find(i =>
        !i.isAddon &&
        i.productId === prodId &&
        (
          (selectedVariant.sku && (i.sku === selectedVariant.sku || i.variant?.sku === selectedVariant.sku)) ||
          (i.variant?.price === selectedVariant.price && JSON.stringify(i.selectedVariantAttrs || i.variant?.attrs || {}) === JSON.stringify(selectedVariant.attrs || {}))
        )
      );
    }

    return items.find(i => i.productId === prodId && !i.isAddon);
  }, [items, product.id, product._id, hasVariants, selectedVariant]);

  // Price calculations respecting selected variant
  const variantPrice = selectedVariant ? (selectedVariant.price || 0) : 0;
  const variantMrp = selectedVariant ? (selectedVariant.mrp || 0) : 0;
  const basePrice = product.discountedPrice > 0 ? product.discountedPrice : product.price;
  const displayPrice = hasVariants && variantPrice > 0 ? variantPrice : basePrice;
  const displayMrp = hasVariants && variantMrp > 0 ? variantMrp : (product.mrp || 0);
  const hasMrp = displayMrp > 0 && displayMrp > displayPrice;
  const discount = hasMrp ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : (product.discountPercentage || 0);

  const defaultTags = ['Same Day', 'Best Seller', 'Trending'];
  const tags = (product.tags && product.tags.length > 0) ? product.tags : defaultTags;
  const [currentTagIdx, setCurrentTagIdx] = useState(0);
  const [prevTagIdx, setPrevTagIdx] = useState(-1);

  useEffect(() => {
    if (tags.length <= 1) return;
    const interval = setInterval(() => {
      setPrevTagIdx(currentTagIdx);
      setCurrentTagIdx(prev => (prev + 1) % tags.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [tags.length, currentTagIdx]);

  // Stock and Order Limit calculations
  const availableStock = Number(selectedVariant ? (selectedVariant.stock ?? product.stock) : (product.stock ?? 99999));
  const maxOrderLimit = Number(selectedVariant?.maxQuantityPerOrder || product.maxQuantityPerOrder || 0);

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;

    if (availableStock <= 0) {
      showToast.error('Sorry, this product is currently out of stock.');
      return;
    }

    if (maxOrderLimit > 0 && 1 > maxOrderLimit) {
      showToast.warning(`Maximum order limit for this item is ${maxOrderLimit} units.`);
      return;
    }

    setAdding(true);

    try {
      await addItem(product, 1, {
        silent: false,
        price: displayPrice,
        mrp: displayMrp,
        sku: selectedVariant?.sku || '',
        variant: selectedVariant ? {
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          mrp: selectedVariant.mrp,
          stock: selectedVariant.stock,
          attrs: selectedVariant.attrs || {}
        } : null,
        selectedVariantAttrs: selectedVariant?.attrs || null
      });
    } catch {
      // silent
    } finally {
      setAdding(false);
    }
  }

  async function handleIncrement(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem || adding) return;

    const currentQty = cartItem.quantity || 0;

    // Check if reached max order limit
    if (maxOrderLimit > 0 && currentQty >= maxOrderLimit) {
      showToast.warning(`Maximum limit of ${maxOrderLimit} units per order reached for this item.`);
      return;
    }

    // Check if reached available stock
    if (currentQty >= availableStock) {
      showToast.warning(`Only ${availableStock} ${availableStock === 1 ? 'unit' : 'units'} available in stock!`);
      return;
    }

    setAdding(true);
    try {
      await updateQuantity(cartItem._id, currentQty + 1);
    } catch {
      // silent
    } finally {
      setAdding(false);
    }
  }

  async function handleDecrement(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem || adding) return;
    setAdding(true);
    try {
      await updateQuantity(cartItem._id, cartItem.quantity - 1);
    } catch {
      // silent
    } finally {
      setAdding(false);
    }
  }

  // Calculate rating & reviews count — respect manual override if set by admin
  const ratingVal = product.useManualRating && product.manualRating != null
    ? product.manualRating
    : (product.rating || (Array.isArray(product.reviews) && product.reviews.length > 0
        ? (product.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / product.reviews.length)
        : 0));
  const reviewsCount = product.useManualRating && product.manualRating != null
    ? (product.manualReviewsCount || 0)
    : (product.reviewsCount || (Array.isArray(product.reviews) ? product.reviews.length : 0));


  // Combine thumbnail and images
  const allImages = [];
  if (product.thumbnail) allImages.push(product.thumbnail);
  if (product.images && product.images.length > 0) {
    product.images.forEach(img => {
      if (img !== product.thumbnail) allImages.push(img);
    });
  }

  return (
    <div
      className="fnp-product-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/products/${product.id || product._id}`} className="fnp-product-img-wrap" style={{ display: 'block', textDecoration: 'none' }}>
        {allImages.length > 0 ? (
          allImages.length > 1 ? (
            <Swiper
              modules={[Pagination, Autoplay]}
              pagination={{ clickable: true }}
              autoplay={{
                delay: 1200,
                disableOnInteraction: false,
                pauseOnMouseEnter: false
              }}
              loop={allImages.length > 1}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                try {
                  swiper.autoplay?.stop();
                } catch (e) {}
              }}
              className="fnp-card-swiper"
            >
              {allImages.slice(0, 4).map((img, idx) => (
                <SwiperSlide key={idx}>
                  <img src={getImageUrl(img)} alt={product.title} loading="lazy" />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <img src={getImageUrl(allImages[0])} alt={product.title} loading="lazy" />
          )
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', opacity: .3 }}>
            🌸
          </div>
        )}
        {discount > 0 && (
          <span className="fnp-discount-badge">-{discount}%</span>
        )}
        <button
          type="button"
          className={`fnp-wishlist-btn ${wishlisted ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            size={16}
            fill={wishlisted ? '#ef4444' : 'none'}
            color={wishlisted ? '#ef4444' : 'currentColor'}
            strokeWidth={2.2}
          />
        </button>
        <button
          type="button"
          className={`fnp-compare-btn ${compared ? 'active is-compared' : ''}`}
          onClick={handleCompare}
          aria-label={compared ? 'Remove from comparison' : 'Compare product'}
          title={compared ? 'Remove from comparison' : 'Compare product'}
        >
          <ArrowLeftRight
            size={14}
            className={`fnp-compare-icon ${compared ? 'active-icon' : ''}`}
            color={compared ? '#22c55e' : 'currentColor'}
            strokeWidth={compared ? 2.6 : 2.2}
          />
          {compared && (
            <span
              className="fnp-compare-check-dot"
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          )}
        </button>
      </Link>

      <div className="fnp-product-body">
        <Link href={`/products/${product.id || product._id}`} className="fnp-product-title">
          {product.title}
        </Link>

        {/* ── Product Full 5-Star Rating + Colored Score & Customer Count ── */}
        {ratingVal > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.05rem', marginBottom: '0.3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5px' }}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  fill={i < Math.round(ratingVal) ? '#f59e0b' : '#e5e7eb'}
                  color={i < Math.round(ratingVal) ? '#f59e0b' : '#e5e7eb'}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#15803d', marginLeft: '0.1rem' }}>
              {Number(ratingVal).toFixed(1)}
            </span>
            {reviewsCount > 0 && (
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#666' }}>
                ({reviewsCount >= 1000 ? `${(reviewsCount / 1000).toFixed(1).replace(/\.0$/, '')}k` : reviewsCount})
              </span>
            )}
          </div>
        )}

        {tags.length > 0 && (
          <div className="fnp-tag-rotator">
            {tags.map((rawTag, idx) => {
              const tagInfo = getTagDetails(rawTag);
              if (!tagInfo.name) return null;

              let tagStyle = 'fnp-animated-tag';
              if (idx === currentTagIdx) tagStyle += ' active';
              if (idx === prevTagIdx) tagStyle += ' prev';

              return (
                <span
                  key={idx}
                  className={tagStyle}
                  style={{
                    background: tagInfo.bg,
                    color: tagInfo.color,
                    border: tagInfo.border ? `1px solid ${tagInfo.border}` : 'none',
                    borderRadius: '4px',
                    padding: '2px 7px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    lineHeight: '1.2'
                  }}
                >
                  {tagInfo.name}
                </span>
              );
            })}
          </div>
        )}

        <div className="fnp-product-price-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: '0.4rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="fnp-price-current">₹{displayPrice.toLocaleString('en-IN')}</span>
            {hasMrp && (
              <span className="fnp-price-mrp">₹{displayMrp.toLocaleString('en-IN')}</span>
            )}
            {discount > 0 && (
              <span className="fnp-price-discount">{discount}% OFF</span>
            )}
          </div>

          {/* ── Modern Sleek Variant Selector on the Right of Price ── */}
          {hasVariants && activeVariants.length > 0 && (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              {activeVariants.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="fnp-card-variant-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowVariantDropdown(prev => !prev);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.28rem',
                      borderRadius: '6px',
                      padding: '0.18rem 0.45rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: showVariantDropdown ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
                    }}
                  >
                    <ChevronDown size={11} className="fnp-variant-chevron" style={{ transform: showVariantDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} />
                    <span>{currentVariantLabel}</span>
                  </button>

                  {showVariantDropdown && (
                    <div
                      className="fnp-card-variant-menu"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                      <div className="fnp-card-variant-header" style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '0.25rem 0.45rem',
                        borderBottom: '1px solid var(--store-border, #f0f0f0)',
                        marginBottom: '0.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>Select Size</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.7, fontWeight: 500 }}>{activeVariants.length} Total</span>
                      </div>
                      {activeVariants.map((v, vIdx) => {
                        const isSel = selectedVariant?.sku === v.sku || JSON.stringify(selectedVariant?.attrs) === JSON.stringify(v.attrs);
                        const optLabel = getVariantLabel(v);
                        return (
                          <div
                            key={v.sku || vIdx}
                            className={`fnp-card-variant-option ${isSel ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedVariant(v);
                              setShowVariantDropdown(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              padding: '0.38rem 0.5rem',
                              borderRadius: '5px',
                              fontWeight: isSel ? 700 : 500,
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              transition: 'background 0.12s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              {isSel && <Check size={11} strokeWidth={3} />}
                              <span>{optLabel}</span>
                            </div>
                            <span style={{ fontWeight: 700 }}>
                              ₹{v.price}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <span className="fnp-single-variant-label" style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--store-muted, #777)'
                }}>
                  {currentVariantLabel}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="fnp-delivery-info">
          <Truck size={12} className="fnp-truck-icon" />
          <span>Earliest Delivery: <strong>{earliestDeliveryText}</strong></span>
        </div>
      </div>

      {cartItem && cartItem.quantity > 0 ? (
        <div className="fnp-cart-active-bar" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <Link
            href="/cart"
            onClick={(e) => e.stopPropagation()}
            className="fnp-view-cart-link"
          >
            <span>VIEW CART</span>
            <span style={{ fontSize: '0.85rem', lineHeight: 1 }}>→</span>
          </Link>

          <div className="fnp-stepper-dark">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={adding}
              className="fnp-stepper-btn"
              title="Decrease quantity"
            >
              -
            </button>
            <span className="fnp-stepper-count">{cartItem.quantity}</span>
            <button
              type="button"
              onClick={handleIncrement}
              disabled={adding}
              className="fnp-stepper-btn"
              title="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={adding || (selectedVariant ? selectedVariant.stock === 0 : product.stock === 0)}
          className="fnp-add-cart-btn uppercase"
        >
          <ShoppingCart size={14} />
          {adding ? 'ADDING...' : (selectedVariant ? selectedVariant.stock === 0 : product.stock === 0) ? 'OUT OF STOCK' : 'ADD TO CART'}
        </button>
      )}
    </div>
  );
}
