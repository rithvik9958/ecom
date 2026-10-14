'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, SlidersHorizontal, X, Star, Check, ArrowUpDown, 
  ChevronDown, ChevronUp, RotateCcw, Filter, Sparkles, ArrowUp, CheckCircle2 
} from 'lucide-react';
import ProductCard from '@/components/storefront/ProductCard';
import RecentlyViewed from '@/components/storefront/RecentlyViewed';
import CustomSelect from '@/components/storefront/StoreSelect';

const SORT_OPTIONS = [
  { value: '',           label: 'Relevance'    },
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating',     label: 'Customer Rating' },
];

const ITEMS_PER_PAGE = 16;

function ProductsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const search       = searchParams.get('search')       || '';
  const category     = searchParams.get('category')     || '';
  const sort         = searchParams.get('sort')         || '';
  const minPrice     = searchParams.get('minPrice')     || '';
  const maxPrice     = searchParams.get('maxPrice')     || '';
  const minRating    = searchParams.get('minRating')    || '';
  const inStock      = searchParams.get('inStock')      || '';
  const discountOnly = searchParams.get('discountOnly') || '';
  const page         = parseInt(searchParams.get('page') || '1', 10);
  const attributesParam = searchParams.get('attributes') || '';

  const [products, setProducts]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchInput, setSearchInput]   = useState(search);
  const [filterSettings, setFilterSettings] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [customMinPrice, setCustomMinPrice] = useState(minPrice);
  const [customMaxPrice, setCustomMaxPrice] = useState(maxPrice);

  // Parse active custom attributes
  let selectedAttributes = {};
  try {
    if (attributesParam) selectedAttributes = JSON.parse(attributesParam);
  } catch {
    selectedAttributes = {};
  }

  // Load filter settings from backend
  useEffect(() => {
    fetch('/api/store-payment-settings')
      .then(res => res.json())
      .then(data => {
        if (data?.data?.catalogFilterSettings) {
          setFilterSettings(data.data.catalogFilterSettings);
        }
      })
      .catch(() => {});
  }, []);

  // Load categories
  useEffect(() => {
    fetch('/api/store-categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  function updateMultipleParams(paramUpdates) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(paramUpdates)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  }

  function toggleAttributeOption(attrKey, optionVal) {
    const nextAttr = { ...selectedAttributes };
    const currentList = Array.isArray(nextAttr[attrKey]) ? [...nextAttr[attrKey]] : [];

    if (currentList.includes(optionVal)) {
      const filtered = currentList.filter(v => v !== optionVal);
      if (filtered.length === 0) delete nextAttr[attrKey];
      else nextAttr[attrKey] = filtered;
    } else {
      nextAttr[attrKey] = [...currentList, optionVal];
    }

    const hasAttrs = Object.keys(nextAttr).length > 0;
    updateParam('attributes', hasAttrs ? JSON.stringify(nextAttr) : '');
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(search       && { search }),
        ...(category     && { category }),
        ...(sort         && { sort }),
        ...(minPrice     && { minPrice }),
        ...(maxPrice     && { maxPrice }),
        ...(minRating    && { minRating }),
        ...(inStock      && { inStock }),
        ...(discountOnly && { discountOnly }),
        ...(attributesParam && { attributes: attributesParam }),
        limit: ITEMS_PER_PAGE,
        skip:  (page - 1) * ITEMS_PER_PAGE,
      });
      const res = await fetch(`/api/store-products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, minPrice, maxPrice, minRating, inStock, discountOnly, attributesParam, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchInput !== search) {
        updateParam('search', searchInput);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, search]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Active Filter Badges computation
  const activeChips = [];
  if (category) {
    const matchedCat = categories.find(c => c.slug === category);
    activeChips.push({
      key: 'category',
      label: `Category: ${matchedCat ? matchedCat.title : category}`,
      onRemove: () => updateParam('category', '')
    });
  }
  if (minPrice || maxPrice) {
    let label = '';
    if (minPrice && maxPrice) label = `Price: ₹${minPrice} - ₹${maxPrice}`;
    else if (minPrice) label = `Price: Above ₹${minPrice}`;
    else if (maxPrice) label = `Price: Under ₹${maxPrice}`;
    activeChips.push({
      key: 'price',
      label,
      onRemove: () => updateMultipleParams({ minPrice: '', maxPrice: '' })
    });
  }
  if (minRating) {
    activeChips.push({
      key: 'rating',
      label: `${minRating}★ & Above`,
      onRemove: () => updateParam('minRating', '')
    });
  }
  if (inStock === 'true') {
    activeChips.push({
      key: 'inStock',
      label: 'In-Stock Only',
      onRemove: () => updateParam('inStock', '')
    });
  }
  if (discountOnly === 'true') {
    activeChips.push({
      key: 'discountOnly',
      label: 'On Sale / Discounted',
      onRemove: () => updateParam('discountOnly', '')
    });
  }
  if (search) {
    activeChips.push({
      key: 'search',
      label: `Search: "${search}"`,
      onRemove: () => { setSearchInput(''); updateParam('search', ''); }
    });
  }
  Object.entries(selectedAttributes).forEach(([attrKey, vals]) => {
    vals.forEach(val => {
      activeChips.push({
        key: `attr_${attrKey}_${val}`,
        label: `${attrKey.replace(/_/g, ' ')}: ${val}`,
        onRemove: () => toggleAttributeOption(attrKey, val)
      });
    });
  });

  const clearAllFilters = () => {
    setSearchInput('');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    router.push('/products');
  };

  const activeCustomFilters = filterSettings?.customFilters?.filter(f => f.isActive !== false) || [];
  const priceRanges = filterSettings?.priceRanges || [
    { label: 'Under ₹499', min: 0, max: 499 },
    { label: '₹500 - ₹999', min: 500, max: 999 },
    { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
    { label: '₹2,000 & Above', min: 2000, max: 999999 }
  ];

  // Render Filter Sidebar Content (Shared between Desktop and Mobile Drawer)
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

      {/* 1. Category Filter Module */}
      {(filterSettings?.showCategoryFilter !== false) && (
        <div className="fnp-filter-group" style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fnp-gray-800)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
            Category
          </h4>
          <div className="fnp-custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: categories.length > 8 ? '240px' : 'none', overflowY: categories.length > 8 ? 'auto' : 'visible' }}>
            <label className="fnp-filter-option">
              <input
                type="radio"
                name="category"
                checked={!category}
                onChange={() => updateParam('category', '')}
                style={{ accentColor: 'var(--fnp-green)' }}
              />
              All Categories
            </label>
            {categories.map((cat) => (
              <label key={cat._id} className="fnp-filter-option">
                <input
                  type="radio"
                  name="category"
                  checked={category === cat.slug}
                  onChange={() => updateParam('category', cat.slug)}
                  style={{ accentColor: 'var(--fnp-green)' }}
                />
                {cat.title}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 2. Price Range Filter Module with Range Slider */}
      {(filterSettings?.showPriceFilter !== false) && (
        <div className="fnp-filter-group" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fnp-gray-800)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
              Price Range
            </h4>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--fnp-green)' }}>
              ₹{customMinPrice || '0'} — ₹{customMaxPrice || '5000+'}
            </span>
          </div>

          {/* Interactive Range Slider */}
          <div style={{ padding: '0.3rem 0.2rem 0.75rem' }}>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={customMaxPrice ? Math.min(Number(customMaxPrice), 5000) : 5000}
              onChange={(e) => {
                const val = e.target.value;
                const nextMax = val === '5000' ? '' : val;
                setCustomMaxPrice(nextMax);
                updateMultipleParams({ minPrice: customMinPrice, maxPrice: nextMax });
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
                name="priceRange"
                checked={!minPrice && !maxPrice}
                onChange={() => {
                  setCustomMinPrice('');
                  setCustomMaxPrice('');
                  updateMultipleParams({ minPrice: '', maxPrice: '' });
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
                    name="priceRange"
                    checked={isMatch}
                    onChange={() => {
                      const minVal = range.min ? String(range.min) : '';
                      const maxVal = range.max && range.max < 99999 ? String(range.max) : '';
                      setCustomMinPrice(minVal);
                      setCustomMaxPrice(maxVal);
                      updateMultipleParams({ minPrice: minVal, maxPrice: maxVal });
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
              onClick={() => updateMultipleParams({ minPrice: customMinPrice, maxPrice: customMaxPrice })}
              style={{ padding: '4px 10px', background: '#111', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Go
            </button>
          </div>
        </div>
      )}

      {/* 3. Customer Rating Filter Module */}
      {(filterSettings?.showRatingFilter !== false) && (
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
                  name="rating"
                  checked={minRating === r.val}
                  onChange={() => updateParam('minRating', minRating === r.val ? '' : r.val)}
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

      {/* 4. Availability & Discount Toggles */}
      <div className="fnp-filter-group" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--fnp-gray-800)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.6rem' }}>
          Availability &amp; Offers
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(filterSettings?.showInStockFilter !== false) && (
            <label className="fnp-filter-option" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inStock === 'true'}
                onChange={() => updateParam('inStock', inStock === 'true' ? '' : 'true')}
                style={{ accentColor: 'var(--fnp-green)' }}
              />
              <span>In-Stock Only</span>
            </label>
          )}

          {(filterSettings?.showDiscountFilter !== false) && (
            <label className="fnp-filter-option" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={discountOnly === 'true'}
                onChange={() => updateParam('discountOnly', discountOnly === 'true' ? '' : 'true')}
                style={{ accentColor: 'var(--fnp-green)' }}
              />
              <span>Special Offers / Discounted</span>
            </label>
          )}
        </div>
      </div>

      {/* 5. Custom Dynamic Category / Product Filters */}
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
    </>
  );

  return (
    <div className="fnp-section" style={{ paddingTop: '1rem' }}>
      {/* Breadcrumb with Divider */}
      <div className="fnp-breadcrumb" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #e8e8e8', marginBottom: '1.5rem' }}>
        <a href="/">Home</a>
        <span className="fnp-breadcrumb-sep">/</span>
        <span>All Products</span>
        {category && (
          <>
            <span className="fnp-breadcrumb-sep">/</span>
            <span style={{ textTransform: 'capitalize' }}>{category}</span>
          </>
        )}
      </div>

      <div className="fnp-shop-layout">
        {/* Desktop Sidebar Filters */}
        <aside className="fnp-filters">
          {renderFilterSidebar()}
        </aside>

        {/* Product Grid & Controls */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top Control Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Mobile Filter Drawer Button */}
              <button
                type="button"
                className="fnp-mobile-filter-trigger"
                onClick={() => setMobileFiltersOpen(true)}
                style={{
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

              <p style={{ fontSize: '0.85rem', color: 'var(--fnp-gray-600)', margin: 0, fontWeight: 500 }}>
                {loading ? 'Loading products...' : `Showing ${products.length} of ${total} products`}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--fnp-gray-300)', borderRadius: '8px', overflow: 'hidden', height: '36px' }}>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search in catalog…"
                  style={{ border: 'none', outline: 'none', padding: '0 0.85rem', fontSize: '0.82rem', width: '160px' }}
                />
                <button
                  type="button"
                  onClick={() => updateParam('search', searchInput)}
                  style={{ background: '#111', border: 'none', padding: '0 0.75rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
                >
                  <Search size={14} />
                </button>
              </div>

              {/* Sort Dropdown */}
              <CustomSelect
                prefix="Sort:"
                value={sort}
                onChange={(val) => updateParam('sort', val)}
                options={SORT_OPTIONS}
                size="sm"
                triggerStyle={{ height: '36px', background: '#ffffff', borderRadius: '8px' }}
              />
            </div>
          </div>

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
          {loading ? (
            <div className="fnp-product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1px solid #e8e8e8' }}>
                  <div className="fnp-skeleton" style={{ aspectRatio: '1/1' }} />
                  <div style={{ padding: '.85rem' }}>
                    <div className="fnp-skeleton" style={{ height: 12, marginBottom: 8, borderRadius: 4 }} />
                    <div className="fnp-skeleton" style={{ height: 12, width: '70%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="fnp-product-grid">
                {products.map((p) => <ProductCard key={p._id || p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="fnp-pagination" style={{ marginTop: '2.5rem' }}>
                  <button
                    className="fnp-page-btn"
                    disabled={page <= 1}
                    onClick={() => updateParam('page', page - 1)}
                  >
                    ‹
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      className={`fnp-page-btn ${page === i + 1 ? 'active' : ''}`}
                      onClick={() => updateParam('page', i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="fnp-page-btn"
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', page + 1)}
                  >
                    ›
                  </button>
                </div>
              )}

              {/* Sleek Compact "End of Catalog" Banner */}
              {products.length > 0 && page >= totalPages && (
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
                      <CheckCircle2 size={14} color="var(--fnp-green)" /> You've reached the end of the catalog ({total} products)
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
                        <ArrowUp size={11} /> Back to Top
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="fnp-empty" style={{ background: '#fff', borderRadius: '16px', padding: '3.5rem 2rem', textAlign: 'center', border: '1px solid var(--fnp-gray-200)' }}>
              <div className="fnp-empty-icon" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem' }}>No products match your filters</h3>
              <p style={{ color: 'var(--fnp-gray-500)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Try clearing some filters or searching for different keywords.</p>
              <button
                onClick={clearAllFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--fnp-green)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '50px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={14} /> Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Slide-over Drawer */}
      {mobileFiltersOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setMobileFiltersOpen(false)}>
          <div style={{ width: '85%', maxWidth: '340px', height: '100%', background: '#fff', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #eaeaea' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SlidersHorizontal size={18} /> Filters
              </h3>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderFilterSidebar()}
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid #eaeaea', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { clearAllFilters(); setMobileFiltersOpen(false); }}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                style={{ flex: 1, padding: '10px', background: 'var(--fnp-green)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Apply ({total})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recently Viewed Products strip */}
      <RecentlyViewed />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="fnp-section">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          Loading products catalog...
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
