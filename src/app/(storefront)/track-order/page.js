'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Package, MapPin, CheckCircle2, Truck, 
  Clock, ExternalLink, CalendarClock, RotateCcw, 
  AlertCircle, Mail, Hash, Bell, Headphones, Sparkles, 
  ArrowRight, User, ChevronRight, Layers, Check 
} from 'lucide-react';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { useCart } from '@/context/CartContext';
import { showToast } from '@/lib/storeToast';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useStoreAuth();
  const { addItem } = useCart();

  const [form, setForm] = useState({ orderId: '', contact: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Auto-fetch recent orders for logged-in user and pre-fill contact info
  useEffect(() => {
    if (!user) return;

    if (!form.contact) {
      setForm(prev => ({ ...prev, contact: user.email || user.phone || '' }));
    }

    async function fetchUserOrders() {
      try {
        setLoadingUserOrders(true);
        const token = localStorage.getItem('store_token');
        const res = await fetch('/api/store-auth/orders', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setUserOrders(data.orders.slice(0, 4)); // Show up to 4 recent orders
        }
      } catch (err) {
        console.error('Failed to fetch user orders for tracking', err);
      } finally {
        setLoadingUserOrders(false);
      }
    }

    fetchUserOrders();
  }, [user]);

  // Execute tracking call
  async function executeTrack(orderIdVal, contactVal) {
    const cleanId = (orderIdVal || '').trim();
    const cleanContact = (contactVal || '').trim();

    if (!cleanId) {
      setError('Please enter your Order ID.');
      return;
    }
    if (!cleanContact) {
      setError('Please enter your Email or Phone number.');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    const isEmail = cleanContact.includes('@');

    try {
      const res = await fetch('/api/store-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cleanId,
          ...(isEmail ? { email: cleanContact } : { phone: cleanContact })
        })
      });
      const data = await res.json();
      
      if (data.success && data.order) {
        setOrder(data.order);
        setTimeout(() => {
          const el = document.getElementById('live-tracking-result');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setError(data.message || 'No matching order found. Please verify your Order ID and contact details.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handle URL query parameters for auto tracking from SMS/Email links
  useEffect(() => {
    const qOrderId = searchParams.get('orderId') || searchParams.get('id');
    const qContact = searchParams.get('contact') || searchParams.get('email') || searchParams.get('phone');
    if (qOrderId) {
      const contactVal = qContact || form.contact || (user?.email || user?.phone || '');
      setForm({ orderId: qOrderId, contact: contactVal });
      if (contactVal) {
        executeTrack(qOrderId, contactVal);
      }
    }
  }, [searchParams, user]);

  async function handleTrack(e) {
    e.preventDefault();
    executeTrack(form.orderId, form.contact);
  }

  // 1-Click Track from Recent User Order Card
  const handleQuickTrackOrder = (uOrder) => {
    setOrder(uOrder);
    setForm(f => ({ ...f, orderId: uOrder.orderNumber || uOrder._id }));
    setError('');
    setTimeout(() => {
      const el = document.getElementById('live-tracking-result');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleReorder = async () => {
    if (!order?.items?.length) return;
    setIsReordering(true);
    try {
      for (const item of order.items) {
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
      showToast.error('Could not reorder items.');
    } finally {
      setIsReordering(false);
    }
  };

  const getStepProgress = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return 0;
      default: return 1;
    }
  };

  const activeStep = order ? getStepProgress(order.status) : 1;
  const isCancelled = order?.status?.toLowerCase() === 'cancelled';

  return (
    <div className="fnp-track-wrap">
      <div className="fnp-track-container">
        
        {/* Header Hero */}
        <div className="fnp-track-hero">
          <h1 className="fnp-track-title">
            Track Your Order
          </h1>
          <p className="fnp-track-sub">
            {user 
              ? 'Select any of your recent orders below for instant tracking or look up an order.' 
              : 'Enter your Order ID along with the email or phone number used during checkout.'}
          </p>
        </div>

        {/* Logged-In User Banner & Quick Dashboard Shortcut */}
        {user && (
          <div className="fnp-track-user-banner">
            <div className="fnp-track-user-info">
              <div className="fnp-track-user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
              </div>
              <div>
                <h3 className="fnp-track-user-name">
                  Welcome back, {user.name || 'Shopper'}
                </h3>
                <p className="fnp-track-user-desc">
                  Tracking shipments for <strong>{user.email || user.phone}</strong>
                </p>
              </div>
            </div>
            <Link href="/orders" className="fnp-track-dashboard-btn">
              <Layers size={15} /> My Orders Dashboard &rarr;
            </Link>
          </div>
        )}

        {/* Logged-In User Recent Active Orders (1-Click Instant Tracking) */}
        {user && userOrders.length > 0 && (
          <div className="fnp-track-recent-section">
            <div className="fnp-track-recent-header">
              <h2 className="fnp-track-recent-title">
                <Package size={18} color="currentColor" /> Your Recent Orders
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                Click any order to track live
              </span>
            </div>

            <div className="fnp-track-recent-grid">
              {userOrders.map((uOrder) => {
                const uDate = new Date(uOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const isSelected = Boolean(
                  order && (
                    (order._id && uOrder._id && String(order._id) === String(uOrder._id)) ||
                    (order.orderNumber && uOrder.orderNumber && String(order.orderNumber) === String(uOrder.orderNumber))
                  )
                );
                const statusLower = String(uOrder.status || '').toLowerCase();
                const isDelivered = statusLower === 'delivered';
                const isCancelledStatus = statusLower === 'cancelled';

                return (
                  <div
                    key={uOrder._id}
                    onClick={() => handleQuickTrackOrder(uOrder)}
                    className={`fnp-track-recent-card ${isSelected ? 'active' : ''}`}
                  >
                    <div className="fnp-track-recent-top">
                      <div>
                        <h4 className="fnp-track-recent-id">
                          Order #{uOrder.orderNumber || (uOrder._id ? uOrder._id.slice(-8).toUpperCase() : '')}
                        </h4>
                        <p className="fnp-track-recent-date">
                          Placed on {uDate}
                        </p>
                      </div>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        background: isDelivered ? '#ecfdf5' : isCancelledStatus ? '#fef2f2' : '#eff6ff',
                        color: isDelivered ? '#059669' : isCancelledStatus ? '#dc2626' : '#2563eb',
                        border: `1px solid ${isDelivered ? '#a7f3d0' : isCancelledStatus ? '#fecaca' : '#bfdbfe'}`
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {uOrder.status || 'Pending'}
                      </span>
                    </div>

                    {/* Item Thumbnails Preview */}
                    <div className="fnp-track-recent-thumbs">
                      {uOrder.items?.slice(0, 3).map((it, i) => (
                        <img
                          key={i}
                          src={it.thumbnail || '/placeholder.png'}
                          alt={it.title}
                          className="fnp-track-recent-thumb"
                          onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                        />
                      ))}
                      {uOrder.items?.length > 3 && (
                        <div className="fnp-track-recent-thumbs-more">
                          +{uOrder.items.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="fnp-track-recent-footer">
                      <div className="fnp-track-recent-total">
                        ₹{uOrder.total?.toLocaleString('en-IN')}
                      </div>
                      <button
                        type="button"
                        className={`fnp-track-quick-track-btn ${isSelected ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickTrackOrder(uOrder);
                        }}
                      >
                        {isSelected ? <><Check size={14} /> Tracking Below</> : <><Truck size={14} /> Track Live</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider for custom search */}
            <div className="fnp-track-or-divider">
              <span>Or Track Any Other Order ID</span>
            </div>
          </div>
        )}

        {/* Public / Manual Search Card */}
        <div className="fnp-track-card">
          <form onSubmit={handleTrack} className="fnp-track-form-grid">
            <div className="fnp-track-field">
              <label className="fnp-track-label">
                Order ID / Number
              </label>
              <div className="fnp-track-input-wrap">
                <Hash size={17} className="fnp-track-input-icon" />
                <input
                  type="text"
                  required
                  className="fnp-track-input"
                  placeholder="e.g. 64b8f... or last 8 digits"
                  value={form.orderId}
                  onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                />
              </div>
            </div>

            <div className="fnp-track-field">
              <label className="fnp-track-label">
                Email Address or Phone
              </label>
              <div className="fnp-track-input-wrap">
                <Mail size={17} className="fnp-track-input-icon" />
                <input
                  type="text"
                  required
                  className="fnp-track-input"
                  placeholder="e.g. rahul@example.com or 9876543210"
                  value={form.contact}
                  onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fnp-track-btn"
            >
              {loading ? (
                <><span className="auth-spinner" /> Searching...</>
              ) : (
                <><Search size={17} /> Track Order</>
              )}
            </button>
          </form>

          {error && (
            <div className="fnp-track-err">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Symmetric 3-Pillar Feature Highlights (Shown when no active search result) */}
        {!order && (
          <div className="fnp-track-features-grid">
            <div className="fnp-track-feature-card">
              <div className="fnp-track-feature-icon-wrap">
                <Truck size={22} />
              </div>
              <h3 className="fnp-track-feature-title">Real-Time Tracking</h3>
              <p className="fnp-track-feature-desc">
                Follow your shipment at every stage from dispatch to recipient doorstep.
              </p>
            </div>

            <div className="fnp-track-feature-card">
              <div className="fnp-track-feature-icon-wrap">
                <Bell size={22} />
              </div>
              <h3 className="fnp-track-feature-title">Instant Alerts</h3>
              <p className="fnp-track-feature-desc">
                Receive proactive SMS &amp; email milestone updates for out-for-delivery &amp; handover.
              </p>
            </div>

            <div className="fnp-track-feature-card">
              <div className="fnp-track-feature-icon-wrap">
                <Headphones size={22} />
              </div>
              <h3 className="fnp-track-feature-title">24/7 Priority Help</h3>
              <p className="fnp-track-feature-desc">
                Need to change delivery timing or address? Our concierge support team is ready.
              </p>
            </div>
          </div>
        )}

        {/* Live Order Results Section */}
        {order && (
          <div className="fnp-track-result-card" id="live-tracking-result">
            
            {/* Top Bar */}
            <div className="fnp-track-result-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <h3 className="fnp-track-result-ord-title">
                    Order #{order.orderNumber || (order._id ? order._id.slice(-8).toUpperCase() : '')}
                  </h3>
                  <span className={`fnp-track-payment-badge ${order.paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                    {order.paymentStatus?.toUpperCase()} • {String(order.paymentMethod || 'COD').toUpperCase()}
                  </span>
                </div>
                <p className="fnp-track-result-ord-sub">
                  <CalendarClock size={14} /> Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleReorder}
                  disabled={isReordering}
                  className="fnp-track-reorder-btn"
                >
                  <RotateCcw size={14} /> {isReordering ? 'Adding...' : 'Buy Again'}
                </button>
              </div>
            </div>

            {/* Courier & Tracking Banner (if available) */}
            {(order.courier || order.trackingNumber) && (
              <div className="fnp-track-courier-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                    <Truck size={18} />
                  </div>
                  <div>
                    <div className="fnp-track-courier-title">
                      Shipped via {order.courier || 'Express Logistics'}
                    </div>
                    {order.trackingNumber && (
                      <div className="fnp-track-courier-sub">
                        AWB / Tracking Number: <strong style={{ color: 'inherit' }}>{order.trackingNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="fnp-track-courier-link"
                  >
                    Track on Courier Site <ExternalLink size={13} />
                  </a>
                )}
              </div>
            )}

            {/* Visual 4-Stage Progress Tracker */}
            {!isCancelled ? (
              <div className="fnp-track-stepper-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '0 auto', maxWidth: '600px' }}>
                  {/* Background Line */}
                  <div style={{ position: 'absolute', top: '16px', left: 0, right: 0, height: '4px', background: '#e5e7eb', zIndex: 1 }} />
                  {/* Active Filled Line */}
                  <div style={{
                    position: 'absolute',
                    top: '18px',
                    left: '10%',
                    width: `${((activeStep - 1) / 3) * 80}%`,
                    height: '3px',
                    background: '#10b981',
                    zIndex: 2,
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />

                  {[
                    { label: 'Order Placed', icon: Package, step: 1 },
                    { label: 'Processing', icon: Clock, step: 2 },
                    { label: 'Dispatched', icon: Truck, step: 3 },
                    { label: 'Delivered', icon: CheckCircle2, step: 4 },
                  ].map((s, idx) => {
                    const isPassed = s.step <= activeStep;
                    const isCurrent = s.step === activeStep;

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 3, width: '25%' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: isPassed ? '#10b981' : '#ffffff',
                          border: `2px solid ${isPassed ? '#10b981' : '#cbd5e1'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isPassed ? '#ffffff' : '#94a3b8',
                          marginBottom: '0.5rem',
                          boxShadow: isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.25), 0 4px 10px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}>
                          <s.icon size={17} strokeWidth={isPassed ? 2.5 : 2} />
                        </div>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: isCurrent ? 800 : isPassed ? 700 : 500,
                          color: isPassed ? '#10b981' : '#94a3b8',
                          textAlign: 'center',
                          letterSpacing: '0.01em'
                        }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="fnp-track-cancelled-banner">
                <AlertCircle size={20} />
                <span>This order has been cancelled.</span>
              </div>
            )}

            {/* Event Timeline Logs (Modern Vertical Flow) */}
            {Array.isArray(order.timeline) && order.timeline.length > 0 && (
              <div className="fnp-timeline-wrap">
                <div className="fnp-timeline-header-row">
                  <h4 className="fnp-timeline-heading" style={{ color: 'inherit' }}>
                    <Clock size={16} color="currentColor" />
                    Shipment Activity Logs
                  </h4>
                  <span className="fnp-timeline-live-tag">
                    <span className="fnp-timeline-pulse-dot" />
                    Live Tracking Feed
                  </span>
                </div>

                <div className="fnp-vtimeline">
                  {order.timeline.slice().reverse().map((ev, idx) => {
                    const isLatest = idx === 0;
                    const evDate = new Date(ev.time);
                    const timeFormatted = evDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const dateFormatted = evDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    const isEvCancelled = String(ev.status || ev.title || '').toLowerCase().includes('cancel');

                    const getEvIcon = (status, title) => {
                      const s = String(status || title || '').toLowerCase();
                      if (isEvCancelled) return <AlertCircle size={17} />;
                      if (s.includes('deliver')) return <CheckCircle2 size={17} strokeWidth={2.5} />;
                      if (s.includes('dispatch') || s.includes('courier') || s.includes('shipped') || s.includes('out for delivery')) return <Truck size={17} />;
                      if (s.includes('pack') || s.includes('process') || s.includes('prepared')) return <Package size={17} />;
                      return <Clock size={17} />;
                    };

                    return (
                      <div key={idx} className="fnp-vtimeline-item">
                        {/* Left: Time & Date Column */}
                        <div className="fnp-vtimeline-time-col">
                          <span className="fnp-vtimeline-time">{timeFormatted}</span>
                          <span className="fnp-vtimeline-date">{dateFormatted}</span>
                        </div>

                        {/* Center: Node & Vertical Progress Bar Line */}
                        <div className="fnp-vtimeline-node-col">
                          <div className={`fnp-vtimeline-node ${isLatest ? 'active' : 'completed'} ${isEvCancelled ? 'cancelled' : ''}`}>
                            {getEvIcon(ev.status, ev.title)}
                          </div>
                          {idx !== order.timeline.length - 1 && <div className="fnp-vtimeline-line" />}
                        </div>

                        {/* Right: Modern Event Card */}
                        <div className={`fnp-vtimeline-card ${isLatest ? 'active' : ''}`}>
                          <div className="fnp-vtimeline-card-header">
                            <h5 className="fnp-vtimeline-card-title">{ev.title || ev.status}</h5>
                            {isLatest && (
                              <span className="fnp-vtimeline-badge latest">Latest Update</span>
                            )}
                          </div>
                          {ev.description && (
                            <p className="fnp-vtimeline-card-desc">{ev.description}</p>
                          )}
                          {(order.courier || order.trackingNumber) && (String(ev.status || ev.title || '').toLowerCase().includes('dispatch') || String(ev.status || ev.title || '').toLowerCase().includes('shipped')) && (
                            <div className="fnp-vtimeline-card-meta">
                              {order.courier && <span>Partner: <strong>{order.courier}</strong></span>}
                              {order.trackingNumber && <span>AWB: <strong>{order.trackingNumber}</strong></span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Order Items & Summary */}
            <div className="fnp-track-items-box">
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'inherit', marginBottom: '1rem' }}>
                Items in This Order ({order.items?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '0.75rem', borderBottom: idx !== order.items.length - 1 ? '1px solid rgba(128, 128, 128, 0.15)' : 'none' }}>
                    <img src={item.thumbnail || '/placeholder.png'} alt={item.title} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(128, 128, 128, 0.2)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'inherit', fontSize: '0.9rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Qty: {item.quantity} • ₹{(item.price || 0).toLocaleString('en-IN')} each</div>
                    </div>
                    <div style={{ fontWeight: 800, color: 'inherit', fontSize: '0.95rem' }}>
                      ₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '2px solid rgba(128, 128, 128, 0.2)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#94a3b8' }}>Grand Total</span>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'inherit' }}>₹{order.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Delivery Destination Card */}
            {order.address && (
              <div className="fnp-track-dest-box">
                <MapPin size={18} className="fnp-track-dest-icon" />
                <div>
                  <strong style={{ color: 'inherit' }}>Delivering to: </strong>
                  <span style={{ color: '#94a3b8' }}>
                    {typeof order.address === 'string' ? order.address : `${order.address.address || order.address.flat || ''}, ${order.address.city || order.city || ''} ${order.address.pincode || order.postalCode || ''}`}
                  </span>
                  {(order.deliveryDate || order.deliverySlot) && (
                    <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.78rem', marginTop: '2px' }}>
                      Delivery Slot: <strong style={{ color: 'inherit' }}>
                        {(() => {
                          const rawDate = order.deliveryDate || order.deliverySlot;
                          if (rawDate && typeof rawDate === 'string' && rawDate.includes('T')) {
                            const d = new Date(rawDate);
                            if (!isNaN(d.getTime())) {
                              return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                            }
                          }
                          return rawDate;
                        })()}
                        {order.deliveryDate && order.deliverySlot && !String(order.deliverySlot).includes('T') ? ` • ${order.deliverySlot}` : ''}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="fnp-track-wrap" style={{ justifyContent: 'center' }}>
        <span className="auth-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}

