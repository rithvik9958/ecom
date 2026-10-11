'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useCompare } from '@/context/CompareContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import showToast from '@/lib/storeToast';
import { 
  ArrowLeftRight, 
  Trash2, 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  Check, 
  X, 
  ChevronRight, 
  SlidersHorizontal,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Search,
  Share2,
  Trophy,
  Tag,
  Zap,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

function getCategoryName(category) {
  if (!category) return 'Store';
  if (typeof category === 'string') return category;
  if (typeof category === 'object') return category.name || category.title || category.slug || 'Store';
  return String(category);
}

// Helper to normalize and safely extract attributes as string key-value pairs
function getProductAttributes(product) {
  if (!product) return {};
  const map = {};

  // 1. If product.attributes is an array of { key/name/title, value/content }
  if (Array.isArray(product.attributes)) {
    product.attributes.forEach(attr => {
      if (!attr) return;
      if (typeof attr === 'object') {
        const k = attr.key || attr.name || attr.title;
        const v = attr.value ?? attr.content;
        if (k && v !== undefined && v !== null) {
          map[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
        }
      } else if (typeof attr === 'string') {
        map[attr] = 'Yes';
      }
    });
  } else if (product.attributes && typeof product.attributes === 'object') {
    // 2. If product.attributes is a key-value object
    Object.entries(product.attributes).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        map[k] = typeof v === 'object' ? (v.value || v.content || JSON.stringify(v)) : String(v);
      }
    });
  }

  // 3. Dynamic attributes from product.attrs
  if (product.attrs && typeof product.attrs === 'object' && !Array.isArray(product.attrs)) {
    Object.entries(product.attrs).forEach(([k, v]) => {
      if (v !== undefined && v !== null && !map[k]) {
        map[k] = typeof v === 'object' ? (v.value || v.name || JSON.stringify(v)) : String(v);
      }
    });
  }

  // 4. productDetails (Array of { title, content })
  if (Array.isArray(product.productDetails)) {
    product.productDetails.forEach(detail => {
      if (detail && detail.title && detail.content && !map[detail.title]) {
        map[detail.title] = String(detail.content);
      }
    });
  }

  // 5. Common native fields
  if (product.brand && !map['Brand']) map['Brand'] = String(product.brand);
  if (product.weight && !map['Weight']) map['Weight'] = `${product.weight} kg`;
  if (product.warrantyInformation && !map['Warranty']) map['Warranty'] = String(product.warrantyInformation);
  if (product.availabilityStatus && !map['Status']) map['Status'] = String(product.availabilityStatus);

  return map;
}

export default function ComparePage() {
  const { compareItems, addToCompare, removeFromCompare, clearCompare, isInCompare, maxItems } = useCompare();
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [mounted, setMounted] = useState(false);
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [addingId, setAddingId] = useState(null);

  // Hydration mount check for portals
  useEffect(() => {
    setMounted(true);
  }, []);

  // Quick Add Modal & Store catalog search
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Collapsible section states
  const [openSections, setOpenSections] = useState({
    pricing: true,
    ratings: true,
    delivery: true,
    specs: true,
    overview: true
  });

  const toggleSection = (sectionKey) => {
    setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Fetch catalog for Quick Add Modal
  useEffect(() => {
    if (showAddModal && catalogProducts.length === 0) {
      setLoadingCatalog(true);
      fetch('/api/store-products?limit=24')
        .then(res => res.json())
        .then(data => {
          if (data.products) setCatalogProducts(data.products);
        })
        .catch(err => console.error('Failed to load catalog products', err))
        .finally(() => setLoadingCatalog(false));
    }
  }, [showAddModal, catalogProducts.length]);

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalogProducts;
    const q = searchQuery.toLowerCase();
    return catalogProducts.filter(p => 
      p.title?.toLowerCase().includes(q) || 
      p.category?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  }, [catalogProducts, searchQuery]);

  const handleAddToCart = async (product) => {
    const prodId = product._id || product.id;
    setAddingId(prodId);
    try {
      await addItem({
        _id: prodId,
        title: product.title,
        price: product.price,
        mrp: product.mrp,
        thumbnail: product.thumbnail,
      }, 1);
      showToast.success(`Added "${product.title}" to cart!`);
    } catch {
      showToast.error('Could not add to cart');
    } finally {
      setAddingId(null);
    }
  };

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Product Comparison',
          text: `Check out this product comparison on ${document.title}!`,
          url: url,
        });
        return;
      } catch {
        // User cancelled or fallback
      }
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        showToast.success('🔗 Comparison link copied to clipboard!');
      } catch {
        showToast.error('Could not copy link');
      }
    }
  }, []);

  // Collect all unique attribute keys across all compared products safely
  const allAttributeKeys = useMemo(() => {
    const keySet = new Set();
    compareItems.forEach(item => {
      const attrMap = getProductAttributes(item);
      Object.keys(attrMap).forEach(k => keySet.add(k));
    });
    return Array.from(keySet);
  }, [compareItems]);

  // Helper to check if row values differ across compared products
  const checkRowDiffers = (getValueFn) => {
    if (compareItems.length <= 1) return false;
    const firstVal = getValueFn(compareItems[0]);
    return compareItems.some(item => getValueFn(item) !== firstVal);
  };

  // Pre-calculate differing rows for difference highlighting
  const isDiff = {
    price: checkRowDiffers(item => item.price),
    mrp: checkRowDiffers(item => item.mrp),
    discount: checkRowDiffers(item => Math.round(((item.mrp - item.price) / (item.mrp || 1)) * 100)),
    rating: checkRowDiffers(item => item.rating || 0),
    stock: checkRowDiffers(item => item.stock > 0),
    category: checkRowDiffers(item => getCategoryName(item.category)),
    delivery: checkRowDiffers(item => item.isSameDay ? 'Same Day' : 'Standard'),
    attributes: (key) => checkRowDiffers(item => getProductAttributes(item)[key] || '—')
  };

  // Count total number of differences
  const diffCount = useMemo(() => {
    let count = 0;
    if (isDiff.price) count++;
    if (isDiff.mrp) count++;
    if (isDiff.discount) count++;
    if (isDiff.rating) count++;
    if (isDiff.stock) count++;
    if (isDiff.category) count++;
    if (isDiff.delivery) count++;
    allAttributeKeys.forEach(k => {
      if (isDiff.attributes(k)) count++;
    });
    return count;
  }, [isDiff, allAttributeKeys]);

  // Best Value / Winner calculations
  const highestRatedId = useMemo(() => {
    if (compareItems.length < 2) return null;
    const sorted = [...compareItems].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted[0]?._id || sorted[0]?.id;
  }, [compareItems]);

  const lowestPriceId = useMemo(() => {
    if (compareItems.length < 2) return null;
    const sorted = [...compareItems].sort((a, b) => (a.price || 0) - (b.price || 0));
    return sorted[0]?._id || sorted[0]?.id;
  }, [compareItems]);

  const maxDiscountId = useMemo(() => {
    if (compareItems.length < 2) return null;
    const sorted = [...compareItems].sort((a, b) => {
      const discA = a.mrp > a.price ? (a.mrp - a.price) / a.mrp : 0;
      const discB = b.mrp > b.price ? (b.mrp - b.price) / b.mrp : 0;
      return discB - discA;
    });
    const best = sorted[0];
    if (best && best.mrp > best.price) {
      return best._id || best.id;
    }
    return null;
  }, [compareItems]);

  // Empty State (< 1 product)
  if (!compareItems || compareItems.length === 0) {
    return (
      <div className="storefront-body" style={{ minHeight: '80vh', padding: '4rem 1rem 6rem', background: 'var(--fnp-cream, #ffffff)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', fontFamily: 'var(--fnp-font)' }}>
          
          {/* Animated Hero Icon */}
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: 'var(--fnp-radius-lg, 24px)',
              background: 'var(--fnp-gray-100, #f5f5f5)',
              border: '1px solid var(--fnp-gray-300, #d4d4d4)',
              color: 'var(--fnp-green, #111111)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.75rem',
              boxShadow: 'var(--fnp-shadow-sm)',
              position: 'relative'
            }}
          >
            <ArrowLeftRight size={40} strokeWidth={2.2} />
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--fnp-green, #111111)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              0
            </div>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--fnp-gray-100, #f5f5f5)',
              border: '1px solid var(--fnp-gray-200, #eaeaea)',
              color: 'var(--fnp-gray-700, #555)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '4px 12px',
              borderRadius: 'var(--fnp-radius-full, 9999px)',
              marginBottom: '1rem'
            }}
          >
            <Sparkles size={13} /> Side-by-Side Comparison
          </span>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)', margin: '0 0 0.75rem', letterSpacing: '-0.02em', fontFamily: 'var(--fnp-font)' }}>
            No Products in Comparison
          </h1>
          <p style={{ fontSize: '0.94rem', color: 'var(--fnp-gray-500, #777)', margin: '0 auto 2rem', lineHeight: 1.6, maxWidth: '500px' }}>
            Add up to {maxItems} products from the catalog to compare prices, discounts, technical specs, customer ratings, and delivery speeds side by side.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--fnp-green, #111111)',
                color: '#ffffff',
                padding: '0.85rem 1.75rem',
                borderRadius: 'var(--fnp-radius-md, 10px)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'var(--fnp-green-dark, #000000)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'var(--fnp-green, #111111)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Package size={17} /> Explore Products <ArrowRight size={15} />
            </Link>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--fnp-white, #ffffff)',
                border: '1px solid var(--fnp-gray-300, #d4d4d4)',
                color: 'var(--fnp-gray-900, #111)',
                padding: '0.85rem 1.75rem',
                borderRadius: 'var(--fnp-radius-md, 10px)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: 'var(--fnp-shadow-sm)',
                transition: 'all 0.15s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--fnp-gray-500, #777)';
                e.currentTarget.style.background = 'var(--fnp-gray-50, #fafafa)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--fnp-gray-300, #d4d4d4)';
                e.currentTarget.style.background = 'var(--fnp-white, #ffffff)';
              }}
            >
              <Search size={15} /> Quick Search & Add
            </button>
          </div>
        </div>

        {/* Quick Add Modal */}
        {showAddModal && renderAddModal()}
      </div>
    );
  }

  // Render Quick Add Modal with createPortal to guarantee exact viewport centering
  function renderAddModal() {
    if (!mounted || typeof document === 'undefined') return null;

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
          margin: 0,
          boxSizing: 'border-box',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={() => setShowAddModal(false)}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '580px',
            width: '100%',
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            margin: 'auto',
            position: 'relative',
            animation: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Add Product to Compare
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                Select up to {maxItems} items ({compareItems.length} currently selected)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = '#fee2e2';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Bar */}
          <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.55rem 0.85rem'
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search products by title, category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.86rem',
                  color: '#0f172a',
                  background: 'transparent'
                }}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Product Items List */}
          <div style={{ padding: '0.85rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px' }}>
            {loadingCatalog ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                <ArrowLeftRight size={22} className="spin-animation" style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: '0.84rem' }}>Loading store catalog…</p>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>No products found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredCatalog.map(prod => {
                const prodId = prod._id || prod.id;
                const isSelected = isInCompare(prod) || isInCompare(prodId);

                return (
                  <div
                    key={prodId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '12px',
                      background: isSelected ? 'var(--fnp-cream, #f4f4f5)' : '#ffffff',
                      border: isSelected ? '1.5px solid var(--fnp-gray-900, #18181b)' : '1px solid #f1f5f9',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={getImageUrl(prod.thumbnail || prod.images?.[0])}
                        alt={prod.title}
                        style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', background: '#f8fafc' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{prod.title}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>₹{prod.price?.toLocaleString('en-IN')}</span>
                          {prod.category && <span>• {getCategoryName(prod.category)}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          removeFromCompare(prodId);
                        } else {
                          if (compareItems.length >= maxItems) {
                            showToast.error(`Maximum ${maxItems} products allowed`);
                            return;
                          }
                          addToCompare(prod);
                        }
                      }}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: isSelected ? 'var(--fnp-green, #18181b)' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        border: isSelected ? 'none' : '1px solid #cbd5e1',
                        transition: 'all 0.15s'
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check size={13} strokeWidth={3} /> Selected
                        </>
                      ) : (
                        <>
                          <Plus size={13} /> Add
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#fafbfc', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              style={{
                background: 'var(--fnp-green, #18181b)',
                color: '#ffffff',
                padding: '0.6rem 1.4rem',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Done Comparing ({compareItems.length}/{maxItems})
            </button>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  }

  return (
    <div className="storefront-body" style={{ minHeight: '85vh', padding: '1.75rem 1rem 5rem', background: 'var(--fnp-cream, #ffffff)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── Breadcrumbs ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--fnp-gray-500, #777)', marginBottom: '1.25rem' }}>
          <Link href="/" style={{ color: 'var(--fnp-gray-500, #777)', textDecoration: 'none', transition: 'color 0.15s' }}>Home</Link>
          <ChevronRight size={13} />
          <Link href="/products" style={{ color: 'var(--fnp-gray-500, #777)', textDecoration: 'none', transition: 'color 0.15s' }}>All Products</Link>
          <ChevronRight size={13} />
          <span style={{ color: 'var(--fnp-gray-900, #333)', fontWeight: 600 }}>Compare Products</span>
        </div>

        {/* ── Top Hero Banner & Controls Bar ── */}
        <div
          style={{
            background: 'var(--fnp-white, #ffffff)',
            borderRadius: 'var(--fnp-radius-lg, 20px)',
            border: '1px solid var(--fnp-gray-200, #eaeaea)',
            padding: '1.5rem 1.75rem',
            marginBottom: '1.75rem',
            boxShadow: 'var(--fnp-shadow-sm, 0 1px 4px rgba(0, 0, 0, .08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem'
          }}
        >
          {/* Left: Title & Subtitle */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--fnp-gray-900, #18181b)', margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--fnp-font)' }}>
                Product Comparison
              </h1>
              <span
                style={{
                  background: 'var(--fnp-gray-100, #f5f5f5)',
                  border: '1px solid var(--fnp-gray-200, #eaeaea)',
                  color: 'var(--fnp-gray-700, #555)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 'var(--fnp-radius-full, 9999px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Layers size={13} /> {compareItems.length} of {maxItems} Selected
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--fnp-gray-500, #777)', maxWidth: '640px', lineHeight: 1.5 }}>
              Compare specifications, live prices, verified ratings, and delivery options side by side.
            </p>
          </div>

          {/* Right: Action Buttons Cluster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Highlight Differences Switch */}
            <button
              type="button"
              onClick={() => setHighlightDifferences(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.6rem 1.15rem',
                borderRadius: 'var(--fnp-radius-md, 12px)',
                background: highlightDifferences ? '#fefce8' : 'var(--fnp-white, #ffffff)',
                border: highlightDifferences ? '1.5px solid #eab308' : '1px solid var(--fnp-gray-300, #d4d4d4)',
                color: highlightDifferences ? '#854d0e' : 'var(--fnp-gray-700, #555)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: highlightDifferences ? '0 4px 12px rgba(234, 179, 8, 0.2)' : 'var(--fnp-shadow-sm)'
              }}
            >
              <Sparkles size={15} color={highlightDifferences ? '#ca8a04' : 'var(--fnp-gray-500, #777)'} />
              <span>Highlight Differences</span>
              {diffCount > 0 && (
                <span
                  style={{
                    background: highlightDifferences ? '#ca8a04' : 'var(--fnp-gray-100, #f5f5f5)',
                    color: highlightDifferences ? '#ffffff' : 'var(--fnp-gray-700, #555)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px'
                  }}
                >
                  {diffCount}
                </span>
              )}
              <span
                style={{
                  display: 'inline-block',
                  width: '28px',
                  height: '16px',
                  borderRadius: '999px',
                  background: highlightDifferences ? '#ca8a04' : 'var(--fnp-gray-300, #d4d4d4)',
                  position: 'relative',
                  transition: 'background 0.2s',
                  marginLeft: '2px'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: highlightDifferences ? '14px' : '2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s ease'
                  }}
                />
              </span>
            </button>

            {/* Add Product Button */}
            {compareItems.length < maxItems && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.6rem 1.15rem',
                  borderRadius: 'var(--fnp-radius-md, 12px)',
                  background: 'var(--fnp-green, #111111)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'var(--fnp-green-dark, #000000)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'var(--fnp-green, #111111)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Plus size={15} /> Add Product
              </button>
            )}

            {/* Share Matrix Button */}
            <button
              type="button"
              onClick={handleShare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.6rem 0.95rem',
                borderRadius: 'var(--fnp-radius-md, 12px)',
                background: 'var(--fnp-white, #ffffff)',
                border: '1px solid var(--fnp-gray-300, #d4d4d4)',
                color: 'var(--fnp-gray-700, #555)',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--fnp-gray-500, #777)';
                e.currentTarget.style.color = 'var(--fnp-gray-900, #111)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--fnp-gray-300, #d4d4d4)';
                e.currentTarget.style.color = 'var(--fnp-gray-700, #555)';
              }}
              title="Share comparison link"
            >
              <Share2 size={14} /> Share
            </button>

            {/* Clear All */}
            <button
              type="button"
              onClick={clearCompare}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.6rem 0.95rem',
                borderRadius: 'var(--fnp-radius-md, 12px)',
                background: 'var(--fnp-white, #ffffff)',
                border: '1px solid var(--fnp-gray-300, #d4d4d4)',
                color: 'var(--fnp-gray-500, #777)',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.color = 'var(--fnp-red, #d32f2f)';
                e.currentTarget.style.borderColor = '#fca5a5';
                e.currentTarget.style.background = '#fef2f2';
              }}
              onMouseOut={e => {
                e.currentTarget.style.color = 'var(--fnp-gray-500, #777)';
                e.currentTarget.style.borderColor = 'var(--fnp-gray-300, #d4d4d4)';
                e.currentTarget.style.background = 'var(--fnp-white, #ffffff)';
              }}
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Notice Banner if only 1 item */}
        {compareItems.length === 1 && (
          <div
            style={{
              marginBottom: '1.75rem',
              padding: '1rem 1.5rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Info size={20} color="#d97706" />
              <span><strong>1 product selected:</strong> Add at least 1 more product to unlock side-by-side spec comparison and contrast highlighting.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#d97706',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)'
              }}
            >
              + Quick Add Product
            </button>
          </div>
        )}

        {/* ── Main Comparison Matrix Card & Table ── */}
        <div
          style={{
            background: 'var(--fnp-white, #ffffff)',
            borderRadius: 'var(--fnp-radius-lg, 20px)',
            border: '1px solid var(--fnp-gray-200, #eaeaea)',
            boxShadow: 'var(--fnp-shadow-sm, 0 1px 4px rgba(0, 0, 0, .08))',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                minWidth: `${(compareItems.length + (compareItems.length < maxItems ? 1 : 0)) * 260 + 220}px`,
                fontFamily: 'var(--fnp-font)'
              }}
            >
              {/* Sticky Top Column Header: Product Cards & Primary CTAs */}
              <thead>
                <tr style={{ borderBottom: '2px solid var(--fnp-gray-200, #eaeaea)' }}>
                  
                  {/* Left Legend Column: Clean Matrix Control Anchor */}
                  <th
                    style={{
                      width: '230px',
                      minWidth: '230px',
                      padding: '1.25rem 0.85rem',
                      background: 'var(--fnp-gray-50, #fafafa)',
                      borderRight: '1px solid var(--fnp-gray-200, #eaeaea)',
                      verticalAlign: 'top',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        minHeight: '440px',
                        background: 'var(--fnp-white, #ffffff)',
                        border: '1px solid var(--fnp-gray-200, #eaeaea)',
                        borderRadius: 'var(--fnp-radius-md, 12px)',
                        padding: '1.5rem 1.25rem',
                        boxShadow: 'var(--fnp-shadow-sm)',
                      }}
                    >
                      {/* Top: Icon & Heading */}
                      <div>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--fnp-radius-md, 10px)',
                            background: 'var(--fnp-green, #111111)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1rem',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          <SlidersHorizontal size={18} />
                        </div>

                        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)', letterSpacing: '-0.02em', fontFamily: 'var(--fnp-font)' }}>
                          Compare Specs
                        </h3>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'var(--fnp-gray-500, #777)', lineHeight: 1.45 }}>
                          Side-by-side technical and feature analysis.
                        </p>

                        {/* Clean Differences Tag */}
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: highlightDifferences ? '#fef9c3' : 'var(--fnp-gray-100, #f5f5f5)',
                            color: highlightDifferences ? '#854d0e' : 'var(--fnp-gray-700, #555)',
                            border: highlightDifferences ? '1px solid #fde047' : '1px solid var(--fnp-gray-200, #eaeaea)',
                            padding: '4px 10px',
                            borderRadius: 'var(--fnp-radius-sm, 6px)',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            marginBottom: '1rem'
                          }}
                        >
                          <Sparkles size={13} color={highlightDifferences ? '#ca8a04' : 'var(--fnp-gray-500, #777)'} />
                          <span>{diffCount} Differences</span>
                        </div>
                      </div>

                      {/* Bottom: Quick Add & Specs Indicator */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {compareItems.length < maxItems && (
                          <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            style={{
                              width: '100%',
                              padding: '0.65rem 0.85rem',
                              background: 'var(--fnp-white, #ffffff)',
                              border: '1.5px dashed var(--fnp-gray-300, #d4d4d4)',
                              borderRadius: 'var(--fnp-radius-sm, 6px)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: 'var(--fnp-gray-900, #111)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.borderColor = 'var(--fnp-green, #111111)';
                              e.currentTarget.style.background = 'var(--fnp-gray-50, #fafafa)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.borderColor = 'var(--fnp-gray-300, #d4d4d4)';
                              e.currentTarget.style.background = 'var(--fnp-white, #ffffff)';
                            }}
                          >
                            <Plus size={14} /> Add Product ({compareItems.length}/{maxItems})
                          </button>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            paddingTop: '0.6rem',
                            borderTop: '1px solid var(--fnp-gray-200, #eaeaea)',
                            color: 'var(--fnp-gray-700, #555)',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          <ArrowLeftRight size={13} /> Specifications ↓
                        </div>
                      </div>
                    </div>
                  </th>

                  {/* Product Cards Columns (Rich Elevated Cards) */}
                  {compareItems.map((product) => {
                    const prodId = product._id || product.id;
                    const isAdding = addingId === prodId;
                    const isWish = isWishlisted(prodId);
                    const discountPercent = product.mrp > product.price 
                      ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
                      : 0;

                    const isTopRated = highestRatedId === prodId;
                    const isLowestPrice = lowestPriceId === prodId;

                    return (
                      <th
                        key={prodId}
                        style={{
                          padding: '1.25rem 0.85rem',
                          verticalAlign: 'top',
                          width: `${80 / (compareItems.length + (compareItems.length < maxItems ? 1 : 0))}%`,
                          borderRight: '1px solid var(--fnp-gray-200, #eaeaea)',
                          background: 'var(--fnp-gray-50, #fafafa)'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '100%',
                            minHeight: '440px',
                            background: 'var(--fnp-white, #ffffff)',
                            border: '1px solid var(--fnp-gray-200, #eaeaea)',
                            borderRadius: 'var(--fnp-radius-md, 12px)',
                            padding: '1.25rem',
                            boxShadow: 'var(--fnp-shadow-sm)',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}
                        >
                          <div>
                            {/* Absolute Top-Right Close Button */}
                            <button
                              type="button"
                              onClick={() => removeFromCompare(prodId)}
                              style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'var(--fnp-gray-100, #f5f5f5)',
                                border: '1px solid var(--fnp-gray-200, #eaeaea)',
                                color: 'var(--fnp-gray-500, #777)',
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 2,
                                transition: 'all 0.15s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                              }}
                              onMouseOver={e => {
                                e.currentTarget.style.background = 'var(--fnp-red-pale, #fdecea)';
                                e.currentTarget.style.borderColor = '#fca5a5';
                                e.currentTarget.style.color = 'var(--fnp-red, #d32f2f)';
                                e.currentTarget.style.transform = 'scale(1.08)';
                              }}
                              onMouseOut={e => {
                                e.currentTarget.style.background = 'var(--fnp-gray-100, #f5f5f5)';
                                e.currentTarget.style.borderColor = 'var(--fnp-gray-200, #eaeaea)';
                                e.currentTarget.style.color = 'var(--fnp-gray-500, #777)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                              title="Remove from comparison"
                            >
                              <X size={13} strokeWidth={2.5} />
                            </button>

                            {/* Top Card Badge Bar */}
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.85rem', paddingRight: '28px', minHeight: '26px' }}>
                              {isTopRated ? (
                                <span
                                  style={{
                                    background: '#fef9c3',
                                    color: '#854d0e',
                                    border: '1px solid #fde047',
                                    padding: '3px 8px',
                                    borderRadius: 'var(--fnp-radius-sm, 6px)',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Trophy size={12} /> Top Rated
                                </span>
                              ) : isLowestPrice ? (
                                <span
                                  style={{
                                    background: '#dcfce7',
                                    color: '#166534',
                                    border: '1px solid #86efac',
                                    padding: '3px 8px',
                                    borderRadius: 'var(--fnp-radius-sm, 6px)',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Tag size={12} /> Best Price
                                </span>
                              ) : (
                                <span
                                  style={{
                                    background: 'var(--fnp-gray-100, #f5f5f5)',
                                    color: 'var(--fnp-gray-700, #555)',
                                    border: '1px solid var(--fnp-gray-200, #eaeaea)',
                                    padding: '3px 8px',
                                    borderRadius: 'var(--fnp-radius-sm, 6px)',
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em',
                                    maxWidth: '100%',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {getCategoryName(product.category)}
                                </span>
                              )}
                            </div>

                            {/* Product Image Frame */}
                            <div
                              style={{
                                width: '100%',
                                height: '160px',
                                borderRadius: 'var(--fnp-radius-md, 10px)',
                                background: 'var(--fnp-gray-50, #fafafa)',
                                border: '1px solid var(--fnp-gray-200, #eaeaea)',
                                overflow: 'hidden',
                                marginBottom: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Link href={`/products/${prodId}`}>
                                <img
                                  src={getImageUrl(product.thumbnail)}
                                  alt={product.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                />
                              </Link>
                            </div>

                            {/* Rating & Reviews Score Pill */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  background: '#fefce8',
                                  color: '#a16207',
                                  border: '1px solid #fef08a',
                                  padding: '2px 7px',
                                  borderRadius: 'var(--fnp-radius-sm, 6px)',
                                  fontSize: '0.74rem',
                                  fontWeight: 800
                                }}
                              >
                                <Star size={12} fill="#eab308" color="#eab308" />
                                <span>{Number(product.rating || 4.5).toFixed(1)}</span>
                              </div>
                              <span style={{ fontSize: '0.74rem', color: 'var(--fnp-gray-500, #777)', fontWeight: 500 }}>
                                ({product.numReviews || 0} reviews)
                              </span>
                            </div>

                            {/* Product Title */}
                            <Link
                              href={`/products/${prodId}`}
                              style={{
                                display: 'block',
                                fontSize: '0.94rem',
                                fontWeight: 700,
                                color: 'var(--fnp-gray-900, #111)',
                                textDecoration: 'none',
                                lineHeight: 1.35,
                                marginBottom: '0.65rem',
                                minHeight: '2.6rem',
                                fontFamily: 'var(--fnp-font)',
                                transition: 'color 0.15s'
                              }}
                              onMouseOver={e => e.currentTarget.style.color = 'var(--fnp-green, #111)'}
                              onMouseOut={e => e.currentTarget.style.color = 'var(--fnp-gray-900, #111)'}
                            >
                              {product.title}
                            </Link>

                            {/* Price & Savings Pill Row */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)', letterSpacing: '-0.02em' }}>
                                ₹{product.price?.toLocaleString('en-IN')}
                              </span>
                              {product.mrp > product.price && (
                                <span style={{ fontSize: '0.82rem', color: 'var(--fnp-gray-500, #777)', textDecoration: 'line-through' }}>
                                  ₹{product.mrp?.toLocaleString('en-IN')}
                                </span>
                              )}
                              {discountPercent > 0 && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    color: 'var(--fnp-red, #d32f2f)',
                                    background: 'var(--fnp-red-pale, #fdecea)',
                                    border: '1px solid #fecdd3',
                                    padding: '1px 6px',
                                    borderRadius: 'var(--fnp-radius-sm, 4px)'
                                  }}
                                >
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>

                            {/* Delivery Speed Badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: 'var(--fnp-gray-700, #555)', marginBottom: '1rem' }}>
                              <Truck size={13} color="var(--fnp-green, #111)" />
                              <span>{product.isSameDay ? '⚡ Same-Day Delivery' : 'Standard Express Delivery'}</span>
                            </div>
                          </div>

                          {/* Dual Action CTAs: Add to Cart & Wishlist */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              disabled={isAdding || product.stock <= 0}
                              style={{
                                flex: 1,
                                padding: '0.7rem 0.85rem',
                                background: product.stock > 0 ? 'var(--fnp-green, #111111)' : 'var(--fnp-gray-200, #eaeaea)',
                                color: product.stock > 0 ? '#ffffff' : 'var(--fnp-gray-500, #777)',
                                border: 'none',
                                borderRadius: 'var(--fnp-radius-md, 8px)',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: product.stock > 0 ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={e => {
                                if (product.stock > 0) {
                                  e.currentTarget.style.background = 'var(--fnp-green-dark, #000000)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }
                              }}
                              onMouseOut={e => {
                                if (product.stock > 0) {
                                  e.currentTarget.style.background = 'var(--fnp-green, #111111)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }
                              }}
                            >
                              <ShoppingCart size={14} />
                              {isAdding ? 'Adding…' : product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                await toggleWishlist(prodId);
                                showToast.success(isWish ? 'Removed from wishlist' : '❤️ Added to wishlist');
                              }}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: 'var(--fnp-radius-md, 8px)',
                                background: isWish ? 'var(--fnp-red-pale, #fdecea)' : 'var(--fnp-white, #ffffff)',
                                border: isWish ? '1px solid #fca5a5' : '1px solid var(--fnp-gray-300, #d4d4d4)',
                                color: isWish ? 'var(--fnp-red, #d32f2f)' : 'var(--fnp-gray-500, #777)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseOver={e => {
                                if (!isWish) {
                                  e.currentTarget.style.borderColor = 'var(--fnp-gray-500, #777)';
                                  e.currentTarget.style.background = 'var(--fnp-gray-50, #fafafa)';
                                }
                              }}
                              onMouseOut={e => {
                                if (!isWish) {
                                  e.currentTarget.style.borderColor = 'var(--fnp-gray-300, #d4d4d4)';
                                  e.currentTarget.style.background = 'var(--fnp-white, #ffffff)';
                                }
                              }}
                              title={isWish ? 'Wishlisted' : 'Save to Wishlist'}
                            >
                              <Heart size={16} fill={isWish ? 'var(--fnp-red, #d32f2f)' : 'none'} color={isWish ? 'var(--fnp-red, #d32f2f)' : 'var(--fnp-gray-500, #777)'} />
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}

                  {/* Add Product Slot Column */}
                  {compareItems.length < maxItems && (
                    <th
                      style={{
                        padding: '1.25rem 0.85rem',
                        verticalAlign: 'top',
                        background: 'var(--fnp-gray-50, #fafafa)'
                      }}
                    >
                      <div
                        onClick={() => setShowAddModal(true)}
                        style={{
                          height: '100%',
                          minHeight: '440px',
                          border: '2px dashed var(--fnp-gray-300, #d4d4d4)',
                          borderRadius: 'var(--fnp-radius-md, 12px)',
                          background: 'var(--fnp-white, #ffffff)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          padding: '2rem 1.25rem',
                          transition: 'all 0.2s ease',
                          boxShadow: 'var(--fnp-shadow-sm)'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.borderColor = 'var(--fnp-green, #111111)';
                          e.currentTarget.style.background = 'var(--fnp-gray-50, #fafafa)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.borderColor = 'var(--fnp-gray-300, #d4d4d4)';
                          e.currentTarget.style.background = 'var(--fnp-white, #ffffff)';
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'var(--fnp-gray-100, #f5f5f5)',
                            border: '1px solid var(--fnp-gray-200, #eaeaea)',
                            color: 'var(--fnp-gray-900, #111111)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--fnp-shadow-sm)'
                          }}
                        >
                          <Plus size={22} strokeWidth={2.5} />
                        </div>
                        <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)' }}>
                          Add Product
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--fnp-gray-500, #777)', margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
                          Compare up to {maxItems} products side by side
                        </p>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '0.5rem',
                            padding: '6px 14px',
                            borderRadius: 'var(--fnp-radius-sm, 6px)',
                            background: 'var(--fnp-gray-100, #f5f5f5)',
                            border: '1px solid var(--fnp-gray-200, #eaeaea)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--fnp-gray-900, #111)'
                          }}
                        >
                          + Browse Catalog
                        </span>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              {/* ── Specification Matrix Body ── */}
              <tbody>

                {/* ── 1. SECTION: PRICING & SAVINGS ── */}
                <tr onClick={() => toggleSection('pricing')} style={{ cursor: 'pointer' }}>
                  <td
                    colSpan={compareItems.length + (compareItems.length < maxItems ? 2 : 1)}
                    style={{
                      padding: '0.85rem 1.5rem',
                      background: 'var(--fnp-gray-100, #f5f5f5)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--fnp-gray-800, #333333)',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>💰 Pricing, Value & Instant Savings</span>
                      </div>
                      {openSections.pricing ? <ChevronUp size={16} color="var(--fnp-gray-500, #777)" /> : <ChevronDown size={16} color="var(--fnp-gray-500, #777)" />}
                    </div>
                  </td>
                </tr>

                {openSections.pricing && (
                  <>
                    {/* Row: Selling Price */}
                    <tr style={{ background: highlightDifferences && isDiff.price ? '#fefce8' : 'var(--fnp-white, #ffffff)', borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                        Selling Price
                      </td>
                      {compareItems.map(p => (
                        <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', fontSize: '0.96rem', fontWeight: 800, color: 'var(--fnp-gray-900, #111)', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                          ₹{p.price?.toLocaleString('en-IN')}
                        </td>
                      ))}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>

                    {/* Row: Original MRP */}
                    <tr style={{ background: highlightDifferences && isDiff.mrp ? '#fefce8' : 'var(--fnp-white, #ffffff)', borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                        MRP (Maximum Retail Price)
                      </td>
                      {compareItems.map(p => (
                        <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', fontSize: '0.88rem', color: 'var(--fnp-gray-500, #777)', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                          ₹{(p.mrp || p.price)?.toLocaleString('en-IN')}
                        </td>
                      ))}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>

                    {/* Row: Total Savings */}
                    <tr style={{ background: highlightDifferences && isDiff.discount ? '#fefce8' : 'var(--fnp-white, #ffffff)', borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                        Instant Savings
                      </td>
                      {compareItems.map(p => {
                        const savings = Math.max(0, (p.mrp || p.price) - p.price);
                        const disc = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                        return (
                          <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                            {savings > 0 ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--fnp-red-pale, #fdecea)', color: 'var(--fnp-red, #d32f2f)', border: '1px solid #fecdd3', padding: '3px 8px', borderRadius: 'var(--fnp-radius-sm, 6px)', fontSize: '0.84rem', fontWeight: 800 }}>
                                <Zap size={13} /> Save ₹{savings.toLocaleString('en-IN')} ({disc}% OFF)
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.84rem', color: 'var(--fnp-gray-500, #777)', fontWeight: 600 }}>Best Store Price</span>
                            )}
                          </td>
                        );
                      })}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>
                  </>
                )}

                {/* ── 2. SECTION: RATINGS & QUALITY ── */}
                <tr onClick={() => toggleSection('ratings')} style={{ cursor: 'pointer' }}>
                  <td
                    colSpan={compareItems.length + (compareItems.length < maxItems ? 2 : 1)}
                    style={{
                      padding: '0.85rem 1.5rem',
                      background: 'var(--fnp-gray-100, #f5f5f5)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--fnp-gray-800, #333333)',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⭐ Ratings & Customer Satisfaction</span>
                      </div>
                      {openSections.ratings ? <ChevronUp size={16} color="var(--fnp-gray-500, #777)" /> : <ChevronDown size={16} color="var(--fnp-gray-500, #777)" />}
                    </div>
                  </td>
                </tr>

                {openSections.ratings && (
                  <>
                    {/* Row: Customer Rating Score */}
                    <tr style={{ background: highlightDifferences && isDiff.rating ? '#fefce8' : 'var(--fnp-white, #ffffff)', borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                        Overall Rating
                      </td>
                      {compareItems.map(p => (
                        <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fefce8', color: '#a16207', border: '1px solid #fef08a', padding: '3px 10px', borderRadius: 'var(--fnp-radius-sm, 6px)', fontSize: '0.86rem', fontWeight: 800 }}>
                            <Star size={14} fill="#eab308" color="#eab308" />
                            {Number(p.rating || 4.5).toFixed(1)} / 5.0
                          </div>
                        </td>
                      ))}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>

                    {/* Row: Verified Reviews Count */}
                    <tr style={{ borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                        Verified Reviews
                      </td>
                      {compareItems.map(p => (
                        <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', fontSize: '0.86rem', color: 'var(--fnp-gray-700, #555)', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                          <strong style={{ color: 'var(--fnp-gray-900, #111)' }}>{p.numReviews || 0}</strong> verified reviews
                        </td>
                      ))}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>
                  </>
                )}

                {/* ── 3. SECTION: AVAILABILITY & DELIVERY ── */}
                <tr onClick={() => toggleSection('delivery')} style={{ cursor: 'pointer' }}>
                  <td
                    colSpan={compareItems.length + (compareItems.length < maxItems ? 2 : 1)}
                    style={{
                      padding: '0.85rem 1.5rem',
                      background: 'var(--fnp-gray-100, #f5f5f5)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--fnp-gray-800, #333333)',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🚚 Delivery, Stock & Buyer Assurance</span>
                      </div>
                      {openSections.delivery ? <ChevronUp size={16} color="var(--fnp-gray-500, #777)" /> : <ChevronDown size={16} color="var(--fnp-gray-500, #777)" />}
                    </div>
                  </td>
                </tr>

                {openSections.delivery && (
                  <>
                    {/* Row: Stock Status */}
                    <tr style={{ background: highlightDifferences && isDiff.stock ? '#fefce8' : 'var(--fnp-white, #ffffff)', borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                        Availability
                      </td>
                      {compareItems.map(p => (
                        <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                          {p.stock > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#16a34a', fontSize: '0.84rem', fontWeight: 700 }}>
                              <CheckCircle2 size={16} strokeWidth={2.5} /> In Stock ({p.stock} units)
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--fnp-red, #d32f2f)', fontSize: '0.84rem', fontWeight: 700 }}>
                              <X size={16} strokeWidth={2.5} /> Out of Stock
                            </span>
                          )}
                        </td>
                      ))}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>

                    {/* Row: Delivery Mode */}
                    <tr style={{ background: highlightDifferences && isDiff.delivery ? '#fefce8' : 'var(--fnp-white, #ffffff)', borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                        Delivery Speed
                      </td>
                      {compareItems.map(p => (
                        <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', fontSize: '0.86rem', color: 'var(--fnp-gray-700, #555)', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Truck size={16} color="var(--fnp-green, #111)" />
                            <span>{p.isSameDay ? '⚡ Same-Day Delivery' : 'Standard Express Delivery'}</span>
                          </div>
                        </td>
                      ))}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>

                    {/* Row: Return Guarantee */}
                    <tr style={{ borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                        Buyer Protection
                      </td>
                      {compareItems.map(p => (
                        <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', fontSize: '0.86rem', color: 'var(--fnp-gray-700, #555)', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={16} color="#16a34a" />
                            <span>100% Genuine • 7 Days Easy Return</span>
                          </div>
                        </td>
                      ))}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>
                  </>
                )}

                {/* ── 4. SECTION: DYNAMIC ATTRIBUTES / SPECIFICATIONS ── */}
                {allAttributeKeys.length > 0 && (
                  <>
                    <tr onClick={() => toggleSection('specs')} style={{ cursor: 'pointer' }}>
                      <td
                        colSpan={compareItems.length + (compareItems.length < maxItems ? 2 : 1)}
                        style={{
                          padding: '0.85rem 1.5rem',
                          background: 'var(--fnp-gray-100, #f5f5f5)',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: 'var(--fnp-gray-800, #333333)',
                          letterSpacing: '0.05em',
                          borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📐 Technical Specifications & Features</span>
                          </div>
                          {openSections.specs ? <ChevronUp size={16} color="var(--fnp-gray-500, #777)" /> : <ChevronDown size={16} color="var(--fnp-gray-500, #777)" />}
                        </div>
                      </td>
                    </tr>

                    {openSections.specs && allAttributeKeys.map((attrKey) => {
                      const differs = isDiff.attributes(attrKey);
                      const label = attrKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                      return (
                        <tr key={attrKey} style={{ background: highlightDifferences && differs ? '#fefce8' : 'var(--fnp-white, #ffffff)', borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                            {label}
                          </td>
                          {compareItems.map(p => {
                            const attrMap = getProductAttributes(p);
                            const val = attrMap[attrKey];
                            return (
                              <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', fontSize: '0.86rem', color: 'var(--fnp-gray-800, #333)', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                                {val || '—'}
                              </td>
                            );
                          })}
                          {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                        </tr>
                      );
                    })}
                  </>
                )}

                {/* ── 5. SECTION: OVERVIEW & SKU ── */}
                <tr onClick={() => toggleSection('overview')} style={{ cursor: 'pointer' }}>
                  <td
                    colSpan={compareItems.length + (compareItems.length < maxItems ? 2 : 1)}
                    style={{
                      padding: '0.85rem 1.5rem',
                      background: 'var(--fnp-gray-100, #f5f5f5)',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--fnp-gray-800, #333333)',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📝 Overview & Product Description</span>
                      </div>
                      {openSections.overview ? <ChevronUp size={16} color="var(--fnp-gray-500, #777)" /> : <ChevronDown size={16} color="var(--fnp-gray-500, #777)" />}
                    </div>
                  </td>
                </tr>

                {openSections.overview && (
                  <>
                    {/* Row: SKU */}
                    <tr style={{ borderBottom: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)' }}>
                        SKU Reference
                      </td>
                      {compareItems.map(p => (
                        <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--fnp-gray-500, #777)', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)' }}>
                          {p.sku || p._id?.slice(-8).toUpperCase() || '—'}
                        </td>
                      ))}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>

                    {/* Row: Description */}
                    <tr>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--fnp-gray-700, #555)', fontSize: '0.86rem', borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', background: 'var(--fnp-gray-50, #fafafa)', verticalAlign: 'top' }}>
                        Description
                      </td>
                      {compareItems.map(p => (
                        <td key={p._id || p.id} style={{ padding: '1rem 1.5rem', fontSize: '0.84rem', color: 'var(--fnp-gray-700, #555)', lineHeight: 1.6, borderRight: '1px solid var(--fnp-gray-200, #eaeaea)', verticalAlign: 'top' }}>
                          {p.description ? (
                            <div dangerouslySetInnerHTML={{ __html: p.description.slice(0, 220) + (p.description.length > 220 ? '…' : '') }} />
                          ) : (
                            'Premium authentic product crafted for high satisfaction.'
                          )}
                        </td>
                      ))}
                      {compareItems.length < maxItems && <td style={{ background: 'var(--fnp-gray-50, #fafafa)' }} />}
                    </tr>
                  </>
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Add Modal */}
        {showAddModal && renderAddModal()}

      </div>
    </div>
  );
}
