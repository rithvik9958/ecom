'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { 
  Heart, ShoppingBag, ArrowRight, Loader2, Trash2, 
  Search, Check, Sparkles, ExternalLink, Star, CheckSquare, Square,
  ShieldCheck, ArrowUpRight, Plus, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import CustomSelect from '@/components/storefront/StoreSelect';

function getImageUrl(url) {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingAll, setMovingAll] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchWishlistProducts = useCallback(async () => {
    if (wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fetches = wishlist.map((id) =>
        fetch(`/api/store-products/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      );
      const results = await Promise.all(fetches);
      const valid = results.filter((r) => r && (r.id || r._id));
      setProducts(valid);
    } catch (err) {
      console.error('[WishlistPage]', err);
    } finally {
      setLoading(false);
    }
  }, [wishlist]);

  useEffect(() => {
    fetchWishlistProducts();
  }, [fetchWishlistProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter((p) => {
      const title = (p.title || p.name || '').toLowerCase();
      const cat = (p.category?.title || p.category || '').toLowerCase();
      return title.includes(q) || cat.includes(q);
    });
  }, [products, searchQuery]);

  // Reset page when search or items change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Pagination Calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Calculate Total Estimated Value
  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const price = Number(p.discountedPrice > 0 ? p.discountedPrice : p.price) || 0;
      return sum + price;
    }, 0);
  }, [products]);

  // Selection Handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id || p._id)));
    }
  };

  // Add single item to cart
  const handleAddToCart = async (product) => {
    const pId = product.id || product._id;
    setAddingId(pId);
    try {
      const price = product.discountedPrice > 0 ? product.discountedPrice : product.price;
      await addItem(product, 1, { price });
      showToast.success(`Added "${product.title || product.name}" to cart!`);
    } catch (err) {
      console.error(err);
      showToast.error('Failed to add item to cart');
    } finally {
      setAddingId(null);
    }
  };

  // Move All to Cart
  const handleMoveAllToCart = async () => {
    if (products.length === 0) return;
    setMovingAll(true);
    try {
      for (const product of products) {
        const price = product.discountedPrice > 0 ? product.discountedPrice : product.price;
        await addItem(product, 1, { silent: true, price });
      }
      showToast.success(`All ${products.length} saved items added to your cart!`);
    } catch (err) {
      console.error(err);
      showToast.error('Failed to add some items');
    } finally {
      setMovingAll(false);
    }
  };

  // Bulk Add Selected to Cart
  const handleAddSelectedToCart = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const itemsToAdd = products.filter((p) => selectedIds.has(p.id || p._id));
      for (const product of itemsToAdd) {
        const price = product.discountedPrice > 0 ? product.discountedPrice : product.price;
        await addItem(product, 1, { silent: true, price });
      }
      showToast.success(`Added ${itemsToAdd.length} selected items to cart!`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      showToast.error('Failed to add selected items');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk Remove Selected from Wishlist
  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await toggleWishlist(id);
      }
      showToast.success(`Removed ${selectedIds.size} items from wishlist`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      showToast.error('Failed to remove selected items');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Single Item Remove
  const handleRemoveSingle = async (product) => {
    const id = product.id || product._id;
    try {
      await toggleWishlist(id);
      showToast.success('Removed from wishlist');
    } catch (err) {
      console.error(err);
      showToast.error('Failed to remove item');
    }
  };

  return (
    <UserDashboardLayout title="My Wishlist">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Luxury Dark Summary Banner */}
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
              <Heart size={20} color="#ffffff" strokeWidth={2} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Saved Wishlist Items
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Review, manage, and instantly move your curated favorite products to your shopping bag
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
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
                {wishlist.length}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
                Saved Items
              </span>
            </div>

            {products.length > 0 && (
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
                  ₹{totalValue.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
                  Est. Bag Value
                </span>
              </div>
            )}

            {products.length > 0 && (
              <button
                type="button"
                onClick={handleMoveAllToCart}
                disabled={movingAll}
                className="dashboard-primary-btn"
                style={{
                  height: '42px',
                  borderRadius: '12px',
                  fontSize: '0.86rem',
                  padding: '0 1.25rem'
                }}
              >
                {movingAll ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={15} strokeWidth={2} />}
                {movingAll ? 'Moving Items...' : 'Move All to Cart'}
              </button>
            )}
          </div>
        </div>

        {/* Wishlist Content Section */}
        {loading ? (
          /* Loading Skeletons */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  height: '96px',
                  animation: 'pulse 1.5s infinite',
                  opacity: 0.6
                }}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="user-dashboard-card" style={{
            borderRadius: '20px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Heart size={34} color="var(--store-accent, #fbbf24)" strokeWidth={1.75} />
            </div>
            
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Your Wishlist is Empty
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '440px', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              Save your favorite items by tapping the heart icon on any product in our catalog to easily access and order them whenever you want.
            </p>

            <Link
              href="/products"
              className="dashboard-primary-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.6rem',
                borderRadius: '12px',
                fontSize: '0.9rem',
                textDecoration: 'none'
              }}
            >
              Explore Products <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
        ) : (
          /* Modern Ledger / Interactive List Container */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* Toolbar: Search, Bulk Select, Actions & CustomSelect Page Size */}
            <div className="user-wishlist-toolbar">
              
              {/* Left: Select All Checkbox & Bulk Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="user-wishlist-select-all-btn"
                >
                  {selectedIds.size === filteredProducts.length && filteredProducts.length > 0 ? (
                    <CheckSquare size={18} color="var(--store-accent, #fbbf24)" />
                  ) : (
                    <Square size={18} color="#94a3b8" />
                  )}
                  <span>Select All ({filteredProducts.length})</span>
                </button>

                {/* Bulk Actions when selected */}
                {selectedIds.size > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={handleAddSelectedToCart}
                      disabled={bulkActionLoading}
                      className="dashboard-primary-btn"
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem'
                      }}
                    >
                      <ShoppingBag size={13} /> Add Selected ({selectedIds.size})
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveSelected}
                      disabled={bulkActionLoading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={13} /> Remove ({selectedIds.size})
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Quick Search Box & CustomSelect Page Size */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  minWidth: '200px'
                }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Filter saved items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="user-wishlist-search-input"
                  />
                </div>

                {totalItems > 0 && (
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
                )}
              </div>

            </div>

            {/* Item List Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {paginatedProducts.map((product) => {
                const id = product.id || product._id;
                const isSelected = selectedIds.has(id);
                const isAdding = addingId === id;
                const currentPrice = Number(product.discountedPrice > 0 ? product.discountedPrice : product.price) || 0;
                const originalPrice = Number(product.price) || currentPrice;
                const hasDiscount = product.discountedPrice > 0 && originalPrice > currentPrice;
                const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
                const img = product.images?.[0] || product.imageUrl || product.image;
                const categoryName = product.category?.title || product.category || 'General';
                const rating = product.rating || product.ratings?.average || 4.8;
                const isOutOfStock = product.stock === 0 || product.inStock === false;

                return (
                  <div
                    key={id}
                    className={`user-wishlist-item ${isSelected ? 'selected' : ''}`}
                  >
                    {/* Left: Checkbox, Thumbnail & Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px', flex: '1 1 340px' }}>
                      
                      {/* Select Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(id)}
                        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} color="var(--store-accent, #fbbf24)" />
                        ) : (
                          <Square size={18} color="#94a3b8" />
                        )}
                      </button>

                      {/* Product Thumbnail */}
                      <Link
                        href={`/products/${product.slug || id}`}
                        className="user-wishlist-thumb"
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={product.title || product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }}
                        />
                      </Link>

                      {/* Title & Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {categoryName}
                          </span>
                          
                          {isOutOfStock ? (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '4px' }}>
                              Out of Stock
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: '4px' }}>
                              In Stock
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/products/${product.slug || id}`}
                          className="user-wishlist-title"
                        >
                          {product.title || product.name}
                        </Link>

                        {/* Price & Rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span className="user-wishlist-price">
                            ₹{currentPrice.toLocaleString('en-IN')}
                          </span>
                          {hasDiscount && (
                            <span style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          {Number(rating) > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.74rem', fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '1px 5px', borderRadius: '4px' }}>
                              <Star size={10} fill="#f59e0b" /> {Number(rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {/* Add to Cart */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock || isAdding}
                        className="dashboard-primary-btn"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.82rem',
                          borderRadius: '8px'
                        }}
                      >
                        {isAdding ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ShoppingBag size={14} strokeWidth={2} />
                        )}
                        <span>{isOutOfStock ? 'Sold Out' : isAdding ? 'Adding...' : 'Add to Cart'}</span>
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        title="Remove from wishlist"
                        onClick={() => handleRemoveSingle(product)}
                        className="user-notif-delete-btn"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination Navigation Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1.15rem 1.25rem',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                marginTop: '0.5rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Showing <strong style={{ color: '#0f172a' }}>{startIndex + 1}</strong>–<strong style={{ color: '#0f172a' }}>{endIndex}</strong> of <strong style={{ color: '#0f172a' }}>{totalItems}</strong> items
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '0.45rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: currentPage === 1 ? '#f8fafc' : '#ffffff',
                      color: currentPage === 1 ? '#cbd5e1' : '#0f172a',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        border: p === currentPage ? '1px solid #111827' : '1px solid #e2e8f0',
                        background: p === currentPage ? '#111827' : '#ffffff',
                        color: p === currentPage ? '#ffffff' : '#0f172a',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '0.45rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: currentPage === totalPages ? '#f8fafc' : '#ffffff',
                      color: currentPage === totalPages ? '#cbd5e1' : '#0f172a',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </UserDashboardLayout>
  );
}
