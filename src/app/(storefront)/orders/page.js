'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { useCart } from '@/context/CartContext';
import { Package, SearchX, ShoppingBag, Truck, MapPin, ChevronDown, ChevronUp, Wallet, CreditCard, Smartphone, RotateCcw, ExternalLink, ChevronLeft, ChevronRight, ArrowDown, Layers } from 'lucide-react';
import CustomSelect from '@/components/storefront/StoreSelect';

function getOrderPaymentInfo(order) {
  const rawMethod = String(order?.paymentMethod || '').toLowerCase().trim();
  const hasStripe = Boolean(order?.stripeSessionId);
  const isPaid = order?.paymentStatus === 'paid' || order?.status === 'paid' || hasStripe || (rawMethod !== 'cod' && order?.status !== 'cancelled');
  const isStripe = hasStripe || rawMethod === 'stripe' || rawMethod === 'card' || rawMethod === 'credit_card' || rawMethod === 'debit_card' || (rawMethod === 'cod' && isPaid);
  const isUpi = rawMethod === 'upi';

  if (isStripe) {
    return {
      type: 'stripe',
      label: 'Card',
      fullLabel: 'Credit / Debit Card (Stripe)',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      badgeBorder: '#bfdbfe',
      isPaid: true,
      statusLabel: 'Paid',
      Icon: CreditCard
    };
  }

  if (isUpi) {
    return {
      type: 'upi',
      label: 'UPI',
      fullLabel: 'UPI / Instant QR Payment',
      badgeBg: '#f5f3ff',
      badgeColor: '#6d28d9',
      badgeBorder: '#ddd6fe',
      isPaid: true,
      statusLabel: 'Paid',
      Icon: Smartphone
    };
  }

  return {
    type: 'cod',
    label: 'COD',
    fullLabel: 'Cash on Delivery (COD)',
    badgeBg: '#f8fafc',
    badgeColor: '#475569',
    badgeBorder: '#cbd5e1',
    isPaid: false,
    statusLabel: 'Pay on Delivery',
    Icon: Wallet
  };
}

export default function UserOrdersPage() {
  const { user, loading: authLoading } = useStoreAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const handleReorder = async (orderToReorder) => {
    if (!orderToReorder?.items?.length) return;
    setReorderingId(orderToReorder._id);
    try {
      for (const item of orderToReorder.items) {
        await addItem({
          id: item.id || item.productId || item._id,
          title: item.title,
          price: item.price,
          thumbnail: item.thumbnail
        }, item.quantity || 1);
      }
      showToast.success('Items added to cart!');
      router.push('/cart');
    } catch {
      showToast.error('Failed to add items to cart.');
    } finally {
      setReorderingId(null);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchOrders() {
      try {
        const token = localStorage.getItem('store_token');
        const res = await fetch('/api/store-auth/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user, authLoading]);

  // Reset page on tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
    setExpandedOrderId(null);
  };

  // Tab Filtering logic
  const filteredOrders = orders.filter(order => {
    const status = order.status?.toLowerCase() || 'pending';
    if (activeTab === 'on_shipping') return ['pending', 'paid', 'shipped', 'processing', 'out_for_delivery'].includes(status);
    if (activeTab === 'arrived') return status === 'delivered';
    if (activeTab === 'canceled') return status === 'cancelled';
    return true;
  });

  const activeCount = orders.filter(o => ['pending', 'paid', 'shipped', 'processing', 'out_for_delivery'].includes(o.status?.toLowerCase())).length;
  const deliveredCount = orders.filter(o => o.status?.toLowerCase() === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status?.toLowerCase() === 'cancelled').length;

  // Pagination Calculations
  const totalOrders = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalOrders);
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (p) => {
    const pageNum = Math.max(1, Math.min(p, totalPages));
    setCurrentPage(pageNum);
    setExpandedOrderId(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <UserDashboardLayout title="My Orders">
        <div style={{ padding: '4rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <span className="auth-spinner auth-spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <p style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>Loading your orders...</p>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout title="My Orders">
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
              <Package size={22} color="#ffffff" strokeWidth={2} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                My Orders &amp; Shipments
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Track live shipments, download tax invoices, view order history, and request returns.
            </p>
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
              {orders.length}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
              Total Orders
            </span>
          </div>
        </div>

        {/* Modern Segmented Filter Tabs & Show Per Page Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem', width: '100%', boxSizing: 'border-box' }}>
          
          {/* Segmented Filter Pills */}
          <div className="orders-filter-pills-bar">
            {[
              { id: 'all', label: 'All Orders', count: orders.length },
              { id: 'on_shipping', label: 'Active & In-Transit', count: activeCount },
              { id: 'arrived', label: 'Delivered', count: deliveredCount },
              { id: 'canceled', label: 'Cancelled', count: cancelledCount }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`orders-filter-tab ${isActive ? 'active' : ''}`}
                >
                  {tab.label}
                  <span className="orders-filter-tab-count">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Modern Show Per Page Dropdown */}
          {totalOrders > 0 && (
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

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="user-dashboard-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', marginBottom: '0.5rem' }}>
              <SearchX size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>No orders found</h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0, maxWidth: '400px' }}>
              {activeTab === 'all' 
                ? 'You have not placed any orders yet. Browse our collections and treat someone today!' 
                : `You currently have no orders under the "${activeTab.replace('_', ' ')}" filter.`}
            </p>
            <Link
              href="/"
              style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#111827', color: '#ffffff', padding: '0.72rem 1.6rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}
            >
              <ShoppingBag size={16} /> Explore Catalog
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {currentOrders.map((order) => {
              const isExpanded = expandedOrderId === order._id;
              const paymentInfo = getOrderPaymentInfo(order);
              const isDelivered = order.status?.toLowerCase() === 'delivered';
              const isCancelled = order.status?.toLowerCase() === 'cancelled';
              const PaymentIcon = paymentInfo.Icon;

              return (
                <div key={order._id} className="user-dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
                  
                  {/* Order Card Header */}
                  <div className="orders-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'inherit' }}>
                        Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Payment Method Badge */}
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        background: paymentInfo.badgeBg, 
                        color: paymentInfo.badgeColor, 
                        border: `1px solid ${paymentInfo.badgeBorder}` 
                      }}>
                        <PaymentIcon size={12} /> {paymentInfo.label}
                      </span>

                      {/* Status Pill */}
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        fontSize: '0.72rem', 
                        fontWeight: 800, 
                        padding: '3px 9px', 
                        borderRadius: '6px', 
                        textTransform: 'uppercase',
                        background: isDelivered ? '#ecfdf5' : isCancelled ? '#fef2f2' : '#eff6ff',
                        color: isDelivered ? '#166534' : isCancelled ? '#991b1b' : '#1e40af',
                        border: `1px solid ${isDelivered ? '#bbf7d0' : isCancelled ? '#fecaca' : '#bfdbfe'}`
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isDelivered ? '#16a34a' : isCancelled ? '#dc2626' : '#2563eb' }} />
                        {order.status?.replace('_', ' ') || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Order Route / Delivery Summary */}
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
                      <div className="orders-card-route-node">
                        <Package size={13} color="currentColor" /> <span>Dispatch Hub</span>
                      </div>
                      <div style={{ flex: 1, borderTop: '2px dashed rgba(128, 128, 128, 0.25)' }}></div>
                      <div className="orders-card-route-eta">
                        {isDelivered 
                          ? `Delivered on ${new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                          : `Est. Delivery: ${new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                      </div>
                      <div style={{ flex: 1, borderTop: '2px dashed rgba(128, 128, 128, 0.25)' }}></div>
                      <div className="orders-card-route-node">
                        <MapPin size={13} color="currentColor" /> <span>{order.address?.city || 'Destination'}</span>
                      </div>
                    </div>

                    {/* Accordion Toggle Bar */}
                    <div 
                      onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                      className="orders-card-accordion-toggle"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex' }}>
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <div key={idx} style={{ width: '38px', height: '38px', borderRadius: '8px', border: '2px solid rgba(128, 128, 128, 0.2)', overflow: 'hidden', background: 'rgba(128, 128, 128, 0.1)', marginLeft: idx > 0 ? '-10px' : '0', zIndex: 3 - idx, position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
                              {item.thumbnail ? (
                                <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={13} color="#94a3b8" /></div>
                              )}
                            </div>
                          ))}
                        </div>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#64748b' }}>
                          {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'} in this order
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'inherit' }}>
                          ₹{order.total?.toLocaleString('en-IN')}
                        </span>
                        <div style={{ width: '26px', height: '26px', background: 'rgba(128, 128, 128, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(128, 128, 128, 0.2)' }}>
                          {isExpanded ? <ChevronUp size={14} color="currentColor" /> : <ChevronDown size={14} color="currentColor" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Items Details */}
                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem', animation: 'fadeIn 0.2s ease-in-out' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="orders-card-item-row">
                            <div style={{ width: '70px', height: '70px', borderRadius: '10px', background: 'rgba(128, 128, 128, 0.08)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(128, 128, 128, 0.15)' }}>
                              {item.thumbnail ? (
                                <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} />
                              ) : (
                                <Package size={22} color="#94a3b8" />
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.title}
                              </div>
                              {(() => {
                                const vAttrs = item.selectedVariantAttrs || item.variant?.attrs;
                                if (vAttrs && typeof vAttrs === 'object' && Object.keys(vAttrs).length > 0) {
                                  return (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', margin: '0.1rem 0' }}>
                                      {Object.entries(vAttrs).map(([k, v]) => (
                                        <span key={k} style={{ fontSize: '0.7rem', background: 'rgba(128, 128, 128, 0.1)', color: '#64748b', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                          {k.replace(/_/g, ' ')}: {v}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'inherit' }}>
                                ₹{item.price?.toLocaleString('en-IN')} <span style={{ fontSize: '0.76rem', fontWeight: 500, color: '#64748b' }}>× {item.quantity}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(128, 128, 128, 0.15)', paddingTop: '0.9rem', marginTop: '0.25rem' }}>
                      <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                        Order Total: <strong style={{ color: 'inherit', fontSize: '1rem' }}>₹{order.total?.toLocaleString('en-IN')}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          disabled={reorderingId === order._id}
                          className="orders-card-reorder-btn"
                        >
                          <RotateCcw size={13} />
                          {reorderingId === order._id ? 'Adding...' : 'Buy Again'}
                        </button>

                        <Link 
                          href={`/orders/${order._id}`} 
                          style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none', 
                            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', 
                            color: '#ffffff', 
                            padding: '0.52rem 1.15rem', 
                            borderRadius: '8px', 
                            fontWeight: 700, 
                            fontSize: '0.82rem', 
                            transition: 'all 0.15s', 
                            border: 'none',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }} 
                          onMouseOver={e => e.currentTarget.style.background = '#000000'} 
                          onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, #111827 0%, #1f2937 100%)'}
                        >
                          <Truck size={13} />
                          Track Order
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}

            {/* Modern Pagination & Load More Controls */}
            {totalPages > 1 && (
              <div className="user-dashboard-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                
                {/* Result count summary */}
                <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Showing <strong style={{ color: '#0f172a' }}>{startIndex + 1}</strong>–<strong style={{ color: '#0f172a' }}>{endIndex}</strong> of <strong style={{ color: '#0f172a' }}>{totalOrders}</strong> orders
                </div>

                {/* Page Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
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
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isCurrent = p === currentPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => goToPage(p)}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          border: isCurrent ? '1px solid #111827' : '1px solid #e2e8f0',
                          background: isCurrent ? '#111827' : '#ffffff',
                          color: isCurrent ? '#ffffff' : '#0f172a',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
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
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s'
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
