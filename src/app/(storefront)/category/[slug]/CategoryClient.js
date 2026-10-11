'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowRight, Star, ArrowLeft, Search, SlidersHorizontal, 
  X, RotateCcw, ArrowUpDown, Filter, Sparkles, ArrowUp, CheckCircle2, PackageCheck 
} from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/storefront/ProductCard';
import RecentlyViewed from '@/components/storefront/RecentlyViewed';
import CustomSelect from '@/components/storefront/StoreSelect';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';

const ITEMS_PER_PAGE = 16;

const SORT_OPTIONS = [
  { value: '',           label: 'Recommended'       },
  { value: 'newest',     label: 'Newest First'      },
  { value: 'price-asc',  label: 'Price: Low to High'},
  { value: 'price-desc', label: 'Price: High to Low'},
  { value: 'rating',     label: 'Customer Rating'   },
];

export default function CategoryClient({ category, allCategories = [] }) {
  const [products, setProducts]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [sort, setSort]               = useState('');
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  // Dynamic Admin Filter Settings
  const [filterSettings, setFilterSettings] = useState(null);

  // Filters State
  const [minPrice, setMinPrice]       = useState('');
  const [maxPrice, setMaxPrice]       = useState('');
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [minRating, setMinRating]     = useState('');
  const [inStock, setInStock]         = useState('');
  const [discountOnly, setDiscountOnly] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(true);

  const observerTarget = useRef(null);

  // Fetch admin catalog filter settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/store-payment-settings');
        const data = await res.json();
        if (data.success && data.data?.catalogFilterSettings) {
          setFilterSettings(data.data.catalogFilterSettings);
        }
      } catch (err) {
        console.error('Failed to load filter settings:', err);
      }
    }
    loadSettings();
  }, []);

  const fetchProducts = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const params = new URLSearchParams({
        category: category.slug,
        limit:    ITEMS_PER_PAGE,
        skip:     (currentPage - 1) * ITEMS_PER_PAGE,
        ...(search && { search }),
        ...(sort && { sort }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(minRating && { minRating }),
        ...(inStock && { inStock }),
        ...(discountOnly && { discountOnly }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
        ...(Object.keys(selectedAttributes).some(k => selectedAttributes[k]?.length > 0) && {
          attributes: JSON.stringify(selectedAttributes)
        })
      });
      
      const res  = await fetch(`/api/store-products?${params}`);
      const data = await res.json();
      
      const newProducts = data.products || [];
      
      if (isLoadMore) {
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p._id || p.id));
          const uniqueNew = newProducts.filter(p => !existingIds.has(p._id || p.id));
          return [...prev, ...uniqueNew];
        });
        setPage(currentPage);
      } else {
        setProducts(newProducts);
        setPage(1);
      }
      
      setTotal(data.total || 0);
      setHasMore(newProducts.length === ITEMS_PER_PAGE);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category.slug, page, sort, minPrice, maxPrice, minRating, inStock, discountOnly, selectedTags, selectedAttributes, search]);

  useEffect(() => { 
    fetchProducts(); 
  }, [fetchProducts]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchProducts(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [observerTarget, hasMore, loading, loadingMore, fetchProducts]);

  const toggleAttributeOption = (key, opt) => {
    setSelectedAttributes(prev => {
      const current = prev[key] || [];
      const updated = current.includes(opt)
        ? current.filter(v => v !== opt)
        : [...current, opt];
      
      const next = { ...prev };
      if (updated.length === 0) {
        delete next[key];
      } else {
        next[key] = updated;
      }
      return next;
    });
    setPage(1);
  };

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setMinRating('');
    setInStock('');
    setDiscountOnly('');
    setSelectedTags([]);
    setSelectedAttributes({});
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Compute Active Filter Chips
  const activeChips = [];
  if (search) {
    activeChips.push({
      key: 'search',
      label: `"${search}"`,
      onRemove: () => { setSearchInput(''); setSearch(''); }
    });
  }
  if (minPrice || maxPrice) {
    activeChips.push({
      key: 'price',
      label: `₹${minPrice || '0'} - ₹${maxPrice || 'Any'}`,
      onRemove: () => { setMinPrice(''); setMaxPrice(''); setCustomMinPrice(''); setCustomMaxPrice(''); }
    });
  }
  if (minRating) {
    activeChips.push({
      key: 'rating',
      label: `${minRating}★ & Above`,
      onRemove: () => setMinRating('')
    });
  }
  if (inStock === 'true') {
    activeChips.push({
      key: 'inStock',
      label: 'In-Stock Only',
      onRemove: () => setInStock('')
    });
  }
  if (discountOnly === 'true') {
    activeChips.push({
      key: 'discountOnly',
      label: 'Discounted / Offers',
      onRemove: () => setDiscountOnly('')
    });
  }
  Object.entries(selectedAttributes).forEach(([k, vals]) => {
    if (Array.isArray(vals)) {
      vals.forEach((v) => {
        activeChips.push({
          key: `${k}:${v}`,
          label: `${k}: ${v}`,
          onRemove: () => toggleAttributeOption(k, v)
        });
      });
    }
  });

  const isCustomMode = category?.filterConfig?.mode === 'custom';
  const effectiveShowPrice = isCustomMode
    ? category?.filterConfig?.showPriceFilter !== false
    : filterSettings?.showPriceFilter !== false;
  const effectiveShowRating = isCustomMode
    ? category?.filterConfig?.showRatingFilter !== false
    : filterSettings?.showRatingFilter !== false;
  const effectiveShowInStock = isCustomMode
    ? category?.filterConfig?.showInStockFilter !== false
    : filterSettings?.showInStockFilter !== false;
  const effectiveShowDiscount = isCustomMode
    ? category?.filterConfig?.showDiscountFilter !== false
    : filterSettings?.showDiscountFilter !== false;

  const rawCustomFilters = filterSettings?.customFilters?.filter(f => f.isActive !== false) || [];
  const activeCustomFilters = (isCustomMode && Array.isArray(category?.filterConfig?.enabledGlobalFilters))
    ? rawCustomFilters.filter(f => category.filterConfig.enabledGlobalFilters.includes(f.id || f.key))
    : rawCustomFilters;

  const priceRanges = filterSettings?.priceRanges || [
    { label: 'Under ₹499', min: 0, max: 499 },
    { label: '₹500 - ₹999', min: 500, max: 999 },
    { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
    { label: '₹2,000 & Above', min: 2000, max: 999999 }
  ];

  const getImageUrl = (url) => {
    if (!url) return undefined;
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
  };

  const carouselSettings = category?.plpCarouselSettings || { 
    type: (category?.plpCarousel?.length > 0 && !category?.plpCarouselSettings) ? 'custom' : 'categories', 
    excludeCategories: [], 
    customSlides: category?.plpCarousel || [] 
  };
  
  let carouselItems = [];
  if (carouselSettings.type === 'categories' && allCategories?.length > 0) {
    const excludes = carouselSettings.excludeCategories || [];
    carouselItems = allCategories
      .filter(c => c.isActive && c.slug !== category.slug && !excludes.includes(c.slug))
      .map(c => ({ title: c.title, image: c.image, link: `/category/${c.slug}` }));
  } else {
    carouselItems = carouselSettings.customSlides || [];
  }

  // Render Filter Sidebar (Shared between Desktop and Mobile Drawer)
  const renderFilterSidebar = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e8e8e8' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SlidersHorizontal size={16} /> Filters
        </h3>
        {activeChips.length > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="fnp-clear-all-btn"
            title="Reset all applied filters"
          >
            <RotateCcw size={12} /> Clear ({activeChips.length})
          </button>
        )}
      </div>

      {/* 1. Price Range Filter Module with Range Slider */}
      {effectiveShowPrice && (
        <div className="fnp-filter-group" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fnp-gray-800)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Price Range
            </h4>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--fnp-green)' }}>
              ₹{customMinPrice || minPrice || '0'} — ₹{customMaxPrice || maxPrice || '5000+'}
            </span>
          </div>

          {/* Interactive Range Slider */}
          <div style={{ padding: '0.3rem 0.2rem 0.75rem' }}>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={customMaxPrice || maxPrice ? Math.min(Number(customMaxPrice || maxPrice), 5000) : 5000}
              onChange={(e) => {
                const val = e.target.value;
                const nextMax = val === '5000' ? '' : val;
                setCustomMaxPrice(nextMax);
                setMaxPrice(nextMax);
                setPage(1);
              }}
              style={{
                width: '100%',
                accentColor: 'var(--fnp-green)',
                cursor: 'pointer'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
              <span>₹0</span>
              <span>₹2,500</span>
              <span>₹5,000+</span>
            </div>
          </div>

          {/* Preset Price Brackets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px dashed #eaeaea', paddingTop: '0.6rem' }}>
            <label className="fnp-filter-option">
              <input
                type="radio"
                name="catPriceRange"
                checked={!minPrice && !maxPrice}
                onChange={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  setCustomMinPrice('');
                  setCustomMaxPrice('');
                  setPage(1);
                }}
                style={{ accentColor: 'var(--fnp-green)' }}
              />
              Any Price
            </label>
            {priceRanges.map((range, idx) => {
              const isMatch = Number(minPrice) === range.min && (range.max >= 99999 ? !maxPrice : Number(maxPrice) === range.max);
              return (
                <label key={idx} className="fnp-filter-option">
                  <input
                    type="radio"
                    name="catPriceRange"
                    checked={isMatch}
                    onChange={() => {
                      const minVal = range.min ? String(range.min) : '';
                      const maxVal = range.max && range.max < 99999 ? String(range.max) : '';
                      setMinPrice(minVal);
                      setMaxPrice(maxVal);
                      setCustomMinPrice(minVal);
                      setCustomMaxPrice(maxVal);
                      setPage(1);
                    }}
                    style={{ accentColor: 'var(--fnp-green)' }}
                  />
                  {range.label}
                </label>
              );
            })}
          </div>

          {/* Custom Min/Max Input Box */}
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              placeholder="Min ₹"
              value={customMinPrice}
              onChange={e => setCustomMinPrice(e.target.value)}
              style={{ width: '70px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>-</span>
            <input
              type="number"
              placeholder="Max ₹"
              value={customMaxPrice}
              onChange={e => setCustomMaxPrice(e.target.value)}
              style={{ width: '70px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
            <button
              type="button"
              onClick={() => {
                setMinPrice(customMinPrice);
                setMaxPrice(customMaxPrice);
                setPage(1);
              }}
              style={{ padding: '4px 10px', background: '#111', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Go
            </button>
          </div>
        </div>
      )}

      {/* 2. Customer Rating Filter Module */}
      {effectiveShowRating && (
        <div className="fnp-filter-group" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fnp-gray-800)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
            Customer Rating
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[
              { val: '4', label: '4★ & Above' },
              { val: '3', label: '3★ & Above' }
            ].map(r => (
              <label key={r.val} className="fnp-filter-option">
                <input
                  type="radio"
                  name="catRating"
                  checked={minRating === r.val}
                  onChange={() => {
                    setMinRating(minRating === r.val ? '' : r.val);
                    setPage(1);
                  }}
                  style={{ accentColor: 'var(--fnp-green)' }}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" /> {r.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 3. Availability & Discount Toggles */}
      {(effectiveShowInStock || effectiveShowDiscount) && (
        <div className="fnp-filter-group" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fnp-gray-800)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
            Availability &amp; Offers
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {effectiveShowInStock && (
              <label className="fnp-filter-option" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inStock === 'true'}
                  onChange={() => {
                    setInStock(inStock === 'true' ? '' : 'true');
                    setPage(1);
                  }}
                  style={{ accentColor: 'var(--fnp-green)' }}
                />
                <span>In-Stock Only</span>
              </label>
            )}

            {effectiveShowDiscount && (
              <label className="fnp-filter-option" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={discountOnly === 'true'}
                  onChange={() => {
                    setDiscountOnly(discountOnly === 'true' ? '' : 'true');
                    setPage(1);
                  }}
                  style={{ accentColor: 'var(--fnp-green)' }}
                />
                <span>Special Offers / Discounted</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* 4. Custom Dynamic Filters (Configured in Admin Control Center) */}
      {activeCustomFilters.map((flt) => (
        <div key={flt.id || flt.key} className="fnp-filter-group" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fnp-gray-800)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
            {flt.label}
          </h4>
          <div className="fnp-custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto' }}>
            {flt.options?.map((opt, optIdx) => {
              const isChecked = Array.isArray(selectedAttributes[flt.key]) && selectedAttributes[flt.key].includes(opt);
              return (
                <label key={optIdx} className="fnp-filter-option" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAttributeOption(flt.key, opt)}
                    style={{ accentColor: 'var(--fnp-green)' }}
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {/* 5. Category-Specific Custom Filter Groups (Configured in Category Manager) */}
      {Array.isArray(category?.filters) && category.filters.length > 0 && category.filters.map((fg, gIdx) => (
        <div key={`cat-fg-${gIdx}`} className="fnp-filter-group" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fnp-gray-800)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
            {fg.title}
          </h4>
          <div className="fnp-custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '180px', overflowY: 'auto' }}>
            {fg.options?.map((opt, optIdx) => {
              const isChecked = selectedTags.includes(opt.value);
              return (
                <label key={optIdx} className="fnp-filter-option" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedTags(prev => 
                        prev.includes(opt.value) ? prev.filter(t => t !== opt.value) : [...prev, opt.value]
                      );
                      setPage(1);
                    }}
                    style={{ accentColor: 'var(--fnp-green)' }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="fnp-section" style={{ paddingTop: '1rem' }}>
      {/* Breadcrumb */}
      <div className="fnp-breadcrumb" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e8e8e8', marginBottom: '1.5rem' }}>
        <Link href="/">Home</Link>
        <span className="fnp-breadcrumb-sep">/</span>
        <Link href="/products">Products</Link>
        <span className="fnp-breadcrumb-sep">/</span>
        <span style={{ color: '#111', fontWeight: 600 }}>{category.title}</span>
      </div>

      <div className="fnp-shop-layout">
        
        {/* Left Desktop Filter Sidebar */}
        <aside className="fnp-filters">
          {renderFilterSidebar()}
        </aside>

        {/* Mobile Slide-Over Drawer */}
        {mobileDrawerOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'flex-start'
            }}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div
              style={{
                width: '85%',
                maxWidth: '320px',
                height: '100%',
                background: '#fff',
                padding: '1.5rem',
                overflowY: 'auto',
                boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
              }}
              className="fnp-custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Filter Products</h3>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
              {renderFilterSidebar()}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '0.75rem',
                  background: 'var(--fnp-green)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                View {total} Products
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              
              {/* Mobile Filter Drawer Button */}
              <button
                type="button"
                className="fnp-mobile-filter-trigger"
                onClick={() => setMobileDrawerOpen(true)}
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#fff',
                  border: '1px solid var(--fnp-gray-300)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <SlidersHorizontal size={14} /> Filters {activeChips.length > 0 && `(${activeChips.length})`}
              </button>

              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--fnp-gray-900)', margin: '0 0 2px 0' }}>
                  {category.title}
                </h1>
                <p style={{ fontSize: '0.82rem', color: 'var(--fnp-gray-600)', margin: 0 }}>
                  {loading ? 'Loading items...' : `Showing ${products.length} of ${total} products`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--fnp-gray-300)', borderRadius: '8px', overflow: 'hidden', height: '36px' }}>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={`Search in ${category.title}…`}
                  style={{ border: 'none', outline: 'none', padding: '0 0.85rem', fontSize: '0.82rem', width: '160px' }}
                />
                <button
                  type="button"
                  onClick={() => { setSearch(searchInput); setPage(1); }}
                  style={{ background: '#111', border: 'none', padding: '0 0.75rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
                >
                  <Search size={14} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <CustomSelect
                prefix="Sort:"
                value={sort}
                onChange={(val) => { setSort(val); setPage(1); }}
                options={SORT_OPTIONS}
                size="sm"
                triggerStyle={{ height: '36px', background: '#ffffff', borderRadius: '8px' }}
              />
            </div>
          </div>

          {/* Sub-category PLP Carousel (if configured) */}
          {carouselItems.length > 0 && (
            <div className="fnp-plp-carousel-wrapper" style={{ marginBottom: '1.5rem' }}>
              <Swiper
                modules={[Navigation, FreeMode]}
                slidesPerView="auto"
                spaceBetween={15}
                freeMode={true}
                navigation={{
                  prevEl: '.fnp-plp-arrow.left',
                  nextEl: '.fnp-plp-arrow.right',
                }}
                className="fnp-plp-carousel"
              >
                {carouselItems.map((slide, idx) => (
                  <SwiperSlide key={idx} style={{ width: '110px' }}>
                    <Link href={slide.link || '#'} className="fnp-plp-slide-item">
                      <div className="fnp-plp-slide-img-wrap">
                        {slide.image ? (
                          <img src={getImageUrl(slide.image)} alt={slide.title} />
                        ) : (
                          <div className="fnp-plp-slide-placeholder" />
                        )}
                      </div>
                      <span className="fnp-plp-slide-title">{slide.title}</span>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
              <button className="fnp-plp-arrow left"><ArrowLeft size={16} /></button>
              <button className="fnp-plp-arrow right"><ArrowRight size={16} /></button>
            </div>
          )}

          {/* Active Filter Chips Row */}
          {activeChips.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--fnp-gray-600)' }}>
                Active Filters:
              </span>
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '50px',
                    padding: '3px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                    title={`Remove ${chip.label} filter`}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="fnp-clear-all-pill-btn"
                title="Reset all filters"
              >
                <RotateCcw size={12} /> Clear All
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading && !loadingMore ? (
            <div className="fnp-product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1px solid #e8e8e8' }}>
                  <div className="fnp-skeleton" style={{ aspectRatio: '1/1' }} />
                  <div style={{ padding: '0.85rem' }}>
                    <div className="fnp-skeleton" style={{ height: 12, marginBottom: 8, borderRadius: 4 }} />
                    <div className="fnp-skeleton" style={{ height: 12, width: '70%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="fnp-empty" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--fnp-gray-900)', margin: '0 0 0.5rem' }}>
                No products found
              </h3>
              <p style={{ color: 'var(--fnp-gray-500)', fontSize: '0.88rem', margin: '0 0 1.25rem' }}>
                Try adjusting your filters or search criteria.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="fnp-clear-all-pill-btn"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                <RotateCcw size={14} /> Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="fnp-product-grid">
                {products.map((p) => (
                  <ProductCard key={p._id || p.id} product={p} />
                ))}
              </div>
              
              {/* Infinite Scroll Target */}
              {hasMore && (
                <div ref={observerTarget} style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                  {loadingMore ? (
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div style={{ height: '24px' }}></div>
                  )}
                </div>
              )}

              {/* Sleek Compact "End of Collection" Banner */}
              {!hasMore && products.length > 0 && (
                <div style={{
                  margin: '2rem 0 1rem',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  {/* Subtle Gradient Divider Line */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, #e2e8f0 20%, #cbd5e1 50%, #e2e8f0 80%, transparent)',
                    zIndex: 1
                  }} />

                  {/* Compact Modern Pill Island */}
                  <div style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#ffffff',
                    padding: '6px 16px',
                    borderRadius: '50px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    zIndex: 2,
                    maxWidth: '92%',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--fnp-gray-800)'
                    }}>
                      <CheckCircle2 size={14} color="var(--fnp-green)" /> You've viewed all {total} products in {category.title}
                    </span>
                    
                    <span style={{ color: '#cbd5e1', fontSize: '0.75rem', display: 'inline-block' }}>•</span>

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '50px',
                          padding: '2px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--fnp-gray-700)',
                          cursor: 'pointer',
                          transition: 'all 0.18s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--fnp-green)'; e.currentTarget.style.color = 'var(--fnp-green)'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = 'var(--fnp-gray-700)'; }}
                      >
                        <ArrowUp size={11} /> Top
                      </button>
                      <Link
                        href="/products"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '50px',
                          padding: '2px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--fnp-green)',
                          textDecoration: 'none'
                        }}
                      >
                        All Products ➔
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Recently Viewed Products Swiper Carousel (Full-Width below layout) */}
      <RecentlyViewed />
    </div>
  );
}
