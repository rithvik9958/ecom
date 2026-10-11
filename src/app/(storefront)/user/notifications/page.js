'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { 
  Bell, Check, Trash2, Package, Ticket, RotateCcw, 
  ShieldCheck, Sparkles, ArrowRight, CheckCheck, 
  Search, ChevronLeft, ChevronRight, Loader2, Clock
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import CustomSelect from '@/components/storefront/StoreSelect';
import StorefrontConfirmModal from '@/components/storefront/StorefrontConfirmModal';
import { useWebPush } from '@/lib/useWebPush';

export default function UserNotificationsPage() {
  const { user } = useStoreAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Clear modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Web Push State
  const { isSupported: isPushSupported, isSubscribed: isPushSubscribed, subscribe: subscribePush, unsubscribe: unsubscribePush, loading: pushLoading } = useWebPush('customer');

  async function fetchNotifications() {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/store-notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Counts for tabs
  const orderCount = notifications.filter(n => n.type === 'order').length;
  const promoCount = notifications.filter(n => n.type === 'promotion').length;
  const alertCount = notifications.filter(n => n.type === 'alert').length;
  const returnCount = notifications.filter(n => n.type === 'return').length;
  const accountCount = notifications.filter(n => n.type === 'account' || n.type === 'system').length;

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Tab filter
      if (activeFilter === 'alert' && n.type !== 'alert') return false;
      if (activeFilter === 'order' && n.type !== 'order') return false;
      if (activeFilter === 'promotion' && n.type !== 'promotion') return false;
      if (activeFilter === 'return' && n.type !== 'return') return false;
      if (activeFilter === 'account' && n.type !== 'account' && n.type !== 'system') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (n.title || '').toLowerCase().includes(q);
        const matchMsg = (n.message || '').toLowerCase().includes(q);
        return matchTitle || matchMsg;
      }
      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  // Auto reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, pageSize]);

  // Pagination calculations
  const totalItems = filteredNotifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedList = filteredNotifications.slice(startIndex, endIndex);

  // Mark single as read
  async function handleMarkAsRead(id) {
    if (!id) return;
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/store-notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id }),
        keepalive: true
      });
      const data = await res.json();
      if (data.success && data.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    } catch (e) {
      console.error('Failed to update notification', e);
    }
  }

  // Mark all as read
  async function handleMarkAllAsRead() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/store-notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: 'all' })
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        showToast.success('All notifications marked as read');
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      }
    } catch (e) {
      showToast.error('Failed to update notifications');
    }
  }

  // Delete notification
  async function handleDelete(id) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch(`/api/store-notifications?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        if (id === 'all') {
          setNotifications([]);
          setUnreadCount(0);
          showToast.success('All notifications cleared');
        } else {
          setNotifications(prev => prev.filter(n => n._id !== id));
          setUnreadCount(data.unreadCount);
          showToast.success('Notification removed');
        }
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      }
    } catch (e) {
      showToast.error('Failed to delete notification');
    } finally {
      setIsClearModalOpen(false);
      setDeletingId(null);
    }
  }

  // Helper for icon based on type
  function getCategoryIcon(type) {
    switch (type) {
      case 'alert':
        return <Bell size={17} strokeWidth={2} color="#ea580c" />;
      case 'order':
        return <Package size={17} strokeWidth={2} />;
      case 'promotion':
        return <Ticket size={17} strokeWidth={2} />;
      case 'return':
        return <RotateCcw size={17} strokeWidth={2} />;
      case 'account':
        return <ShieldCheck size={17} strokeWidth={2} />;
      default:
        return <Bell size={17} strokeWidth={2} />;
    }
  }

  // Format relative timestamp
  function formatRelativeTime(dateStr) {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <UserDashboardLayout title="Notifications & Alerts">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
        
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
              <Bell size={20} color="#ffffff" strokeWidth={2} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Notifications &amp; Activity
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Stay updated on your live order shipments, exclusive promotions, returns status, and security alerts
            </p>
          </div>

          {/* Right single-line pills & actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
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
                {unreadCount}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
                Unread Alerts
              </span>
            </div>

            {/* Web Push Notification Toggle */}
            {isPushSupported && (
              <button
                type="button"
                onClick={async () => {
                  if (isPushSubscribed) {
                    await unsubscribePush();
                    showToast.success('Web push notifications disabled');
                  } else {
                    const res = await subscribePush(user?.email);
                    if (res.success) showToast.success('🔔 Instant lock-screen alerts enabled!');
                    else showToast.error(res.message || 'Permission not granted');
                  }
                }}
                disabled={pushLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: isPushSubscribed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: isPushSubscribed ? '#86efac' : '#ffffff',
                  border: isPushSubscribed ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0 1rem',
                  height: '42px',
                  borderRadius: '12px',
                  fontWeight: 650,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxSizing: 'border-box'
                }}
                onMouseOver={e => { e.currentTarget.style.background = isPushSubscribed ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255, 255, 255, 0.15)'; }}
                onMouseOut={e => { e.currentTarget.style.background = isPushSubscribed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)'; }}
              >
                <Bell size={14} color={isPushSubscribed ? '#86efac' : '#ffffff'} />
                {pushLoading ? 'Updating…' : isPushSubscribed ? 'Device Push: ON' : 'Enable Device Push'}
              </button>
            )}

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  padding: '0 1.15rem',
                  height: '42px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'all 0.15s',
                  boxSizing: 'border-box'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'none'; }}
              >
                <CheckCheck size={15} strokeWidth={2} /> Mark All as Read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => { setDeletingId('all'); setIsClearModalOpen(true); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fca5a5',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '0 1rem',
                  height: '42px',
                  borderRadius: '12px',
                  fontWeight: 650,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxSizing: 'border-box'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.borderColor = '#f87171'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
              >
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Toolbar: Category Segment Tabs, Search Filter & CustomSelect Page Size */}
        {notifications.length > 0 && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem'
          }}>
            
            {/* Segment Filter Pills */}
            <div style={{ background: '#f8fafc', padding: '3px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '3px', overflowX: 'auto', maxWidth: '100%' }}>
              {[
                { id: 'all', label: 'All Activity', count: notifications.length },
                { id: 'alert', label: 'Product Alerts', count: alertCount },
                { id: 'order', label: 'Orders', count: orderCount },
                { id: 'promotion', label: 'Promotions', count: promoCount },
                { id: 'return', label: 'Returns', count: returnCount },
                { id: 'account', label: 'Account', count: accountCount }
              ].map(tab => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '9px',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 650 : 500,
                      border: 'none',
                      background: isActive ? '#0f172a' : 'transparent',
                      color: isActive ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '5px',
                      background: isActive ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                      color: isActive ? '#ffffff' : '#475569'
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Search Filter + Page Size Selector */}
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
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    fontSize: '0.82rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    color: '#1e293b',
                    outline: 'none',
                    fontWeight: 500
                  }}
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
        )}

        {/* Notifications List Container */}
        {loading ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '3.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 size={28} className="animate-spin" color="#0f172a" />
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Loading activity feed...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
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
              <Bell size={34} color="#0f172a" strokeWidth={1.75} />
            </div>
            
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              No Notifications Yet
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '440px', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              You are all caught up! Updates regarding your order milestones, new coupons, and returns will appear here.
            </p>

            <Link
              href="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '0.8rem 1.6rem',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                transition: 'all 0.15s ease'
              }}
            >
              Explore Products <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>No notifications match your current filter or search.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {paginatedList.map((item) => {
              const isUnread = !item.read;

              return (
                <div
                  key={item._id}
                  className={`user-notif-item ${isUnread ? 'unread' : 'read'}`}
                >
                  
                  {/* Left Section: Category Avatar & Details */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: '1 1 450px', minWidth: '280px' }}>
                    
                    {/* Category Icon Avatar */}
                    <div className="user-notif-avatar" style={{ position: 'relative' }}>
                      {getCategoryIcon(item.type)}
                      {isUnread && (
                        <span style={{
                          position: 'absolute',
                          top: '-3px',
                          right: '-3px',
                          width: '9px',
                          height: '9px',
                          borderRadius: '50%',
                          background: 'var(--store-accent, #3b82f6)',
                          border: '2px solid #ffffff'
                        }} />
                      )}
                    </div>

                    {/* Text Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {item.link ? (
                          <Link
                            href={item.link}
                            onClick={() => { if (isUnread) handleMarkAsRead(item._id); }}
                            className="user-notif-title"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="user-notif-title">
                            {item.title}
                          </span>
                        )}

                        <span className="user-notif-badge">
                          {item.type}
                        </span>

                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.72rem',
                          color: '#94a3b8',
                          fontWeight: 500
                        }}>
                          <Clock size={11} /> {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <p className="user-notif-message">
                        {item.message}
                      </p>
                    </div>

                  </div>

                  {/* Right Section: Action Link, Read Toggle & Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => {
                          if (isUnread) handleMarkAsRead(item._id);
                        }}
                        className="user-notif-action-btn"
                      >
                        View Details <ArrowRight size={13} />
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item._id)}
                        title="Mark as read"
                        className="user-notif-read-btn"
                      >
                        <Check size={12} strokeWidth={2.2} /> Mark Read
                      </button>
                    )}

                    <button
                      type="button"
                      title="Remove notification"
                      onClick={() => { setDeletingId(item._id); setIsClearModalOpen(true); }}
                      className="user-notif-delete-btn"
                    >
                      <Trash2 size={13} />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

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
            marginTop: '0.25rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>
              Showing <strong style={{ color: '#0f172a', fontWeight: 650 }}>{startIndex + 1}</strong>–<strong style={{ color: '#0f172a', fontWeight: 650 }}>{endIndex}</strong> of <strong style={{ color: '#0f172a', fontWeight: 650 }}>{totalItems}</strong> notifications
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
                  fontWeight: 650,
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
                    fontWeight: 700,
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
                  fontWeight: 650,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Clear/Delete Confirmation Modal */}
      <StorefrontConfirmModal 
        isOpen={isClearModalOpen}
        onClose={() => { setIsClearModalOpen(false); setDeletingId(null); }}
        onConfirm={() => handleDelete(deletingId)}
        title={deletingId === 'all' ? 'Clear All Notifications?' : 'Delete Notification?'}
        message={deletingId === 'all' ? 'Are you sure you want to permanently clear all notifications from your account?' : 'Are you sure you want to delete this notification?'}
      />

    </UserDashboardLayout>
  );
}
