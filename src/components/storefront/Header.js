'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useStoreAuth } from '@/context/StoreAuthContext';
import {
  ShoppingCart, Search, User, Menu, X, ChevronDown, ChevronRight, MapPin, Calendar, IndianRupee, Briefcase, MoreHorizontal, CheckCircle2, Package, LogOut, Plus, Home, Phone, Building2, Navigation, Map, Heart, Clock, ArrowRight, Truck, Bell, CheckCheck, Ticket, RotateCcw, ShieldCheck, Sun, Moon, Sparkles, Tag
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import { useStoreTheme } from '@/context/StoreThemeContext';

export default function StorefrontHeader({ categories = [] }) {
  const { itemCount, addresses, addAddress } = useCart();
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist?.length || 0;
  const { user, logout } = useStoreAuth();
  const { themeMode, toggleTheme, themeData, mounted: themeMounted } = useStoreTheme();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [openCategoryIndex, setOpenCategoryIndex] = useState(null);
  const [searchVal, setSearchVal] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationModalSource, setLocationModalSource] = useState('header');
  const [locationInput, setLocationInput] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ name: '', phone: '', flat: '', locality: '', city: '', state: '', pincode: '', type: 'home' });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const userMenuRef = useRef(null);

  // Close mobile drawer and search row on navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileOpen(false);
      setMobileSearchOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Lock body scroll and listen for Escape key when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setMobileOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileOpen]);

  // ── Notifications Popover State ───────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const notifMenuRef = useRef(null);

  const fetchHeaderNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadNotifCount(0);
      return;
    }
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/store-notifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch (e) { }
  }, [user]);

  useEffect(() => {
    fetchHeaderNotifications();
    const handleNotifUpdate = () => fetchHeaderNotifications();
    window.addEventListener('notificationsUpdated', handleNotifUpdate);
    window.addEventListener('focus', handleNotifUpdate);
    const interval = setInterval(fetchHeaderNotifications, 15000);
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotifUpdate);
      window.removeEventListener('focus', handleNotifUpdate);
      clearInterval(interval);
    };
  }, [fetchHeaderNotifications]);

  useEffect(() => {
    function handler(e) {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleQuickMarkAllRead(e) {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));

      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/store-notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: 'all' }),
        keepalive: true
      });
      const data = await res.json();
      if (data.success) {
        showToast.success('All marked as read');
      }
    } catch (e) { }
  }

  async function handleMarkSingleRead(id) {
    if (!id) return;
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadNotifCount(prev => Math.max(0, prev - 1));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      await fetch('/api/store-notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id }),
        keepalive: true
      });
    } catch (e) { }
  }

  // ── Search Autocomplete State ─────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // ── Load recent searches from localStorage ────────────────────────────────
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('store_recent_searches') || '[]');
      setRecentSearches(stored.slice(0, 6));
    } catch { setRecentSearches([]); }
  }, []);

  // ── Close search dropdown on outside click ────────────────────────────────
  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch search suggestions (debounced) ──────────────────────────────────
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    setIsSearchLoading(true);
    try {
      const res = await fetch(`/api/store-products?search=${encodeURIComponent(query.trim())}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.products || []);
      }
    } catch { setSuggestions([]); }
    finally { setIsSearchLoading(false); }
  }, []);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchVal(val);
    setSearchOpen(true);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
  }

  function saveRecentSearch(query) {
    if (!query || !query.trim()) return;
    try {
      const prev = JSON.parse(localStorage.getItem('store_recent_searches') || '[]');
      const updated = [query.trim(), ...prev.filter(s => s !== query.trim())].slice(0, 6);
      localStorage.setItem('store_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch { }
  }

  function clearRecentSearches() {
    localStorage.removeItem('store_recent_searches');
    setRecentSearches([]);
  }


  // Reset address form when modal closes
  useEffect(() => {
    if (!locationModalOpen) {
      setShowAddressForm(false);
      setAddressForm({ name: '', phone: '', flat: '', locality: '', city: '', state: '', pincode: '', type: 'home' });
    }
    // Auto-show address form for logged-in users with no addresses
    if (locationModalOpen && user && addresses && addresses.length === 0) {
      setShowAddressForm(true);
    }
  }, [locationModalOpen, user, addresses]);

  useEffect(() => {
    const handleLocationChange = () => {
      const stored = localStorage.getItem('deliveryLocation');
      if (stored) {
        try { setDeliveryLocation(JSON.parse(stored)); } catch (e) { }
      } else {
        setDeliveryLocation(null);
      }
    };
    handleLocationChange(); // initial load
    window.addEventListener('deliveryLocationUpdated', handleLocationChange);

    // Allow other components to trigger the location modal
    const handleOpenModal = (e) => {
      setLocationModalSource(e.detail?.source || 'header');
      setLocationModalOpen(true);
    };
    window.addEventListener('openLocationModal', handleOpenModal);

    return () => {
      window.removeEventListener('deliveryLocationUpdated', handleLocationChange);
      window.removeEventListener('openLocationModal', handleOpenModal);
    };
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handler(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const q = searchVal.trim();
    if (q) {
      saveRecentSearch(q);
      router.push(`/products?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setMobileSearchOpen(false);
    }
  }

  function handleConfirmLocation() {
    const pin = locationInput.replace(/\D/g, '').substring(0, 6);
    if (pin.length === 6) {
      const newLoc = {
        city: pin,
        full: `Pincode: ${pin}`,
        pincode: pin
      };
      setDeliveryLocation(newLoc);
      localStorage.setItem('deliveryLocation', JSON.stringify(newLoc));
      window.dispatchEvent(new CustomEvent('deliveryLocationUpdated', { detail: { source: 'header', pincode: pin } }));
      setLocationModalOpen(false);
      setLocationInput('');
    }
  }

  async function handleSaveFullAddress() {
    const { name, phone, flat, locality, city, state, pincode } = addressForm;
    if (!name || !phone || !flat || !locality || !city || !state || !pincode) {
      showToast.error('Please fill all fields');
      return;
    }
    if (pincode.length !== 6) { showToast.error('Enter a valid 6-digit pincode'); return; }
    setIsSavingAddress(true);
    try {
      // First address saved becomes default automatically
      const isFirst = !addresses || addresses.length === 0;
      const savedAddress = await addAddress({ ...addressForm, isDefault: isFirst });
      if (savedAddress) {
        // Use the real MongoDB _id from the API response so the delete handler
        // can correctly identify and clear this location later
        const realId = typeof savedAddress === 'object' ? savedAddress._id?.toString() : undefined;
        const fullText = `${locality}, ${city}, ${pincode}`;
        const newLoc = { name, city, full: fullText, pincode, addressId: realId };
        setDeliveryLocation(newLoc);
        localStorage.setItem('deliveryLocation', JSON.stringify(newLoc));
        window.dispatchEvent(new CustomEvent('deliveryLocationUpdated', { detail: { source: 'header', pincode } }));
        setShowAddressForm(false);
        setAddressForm({ name: '', phone: '', flat: '', locality: '', city: '', state: '', pincode: '', type: 'home' });
        setLocationModalOpen(false);
      }
    } finally {
      setIsSavingAddress(false);
    }
  }

  function handleSelectSavedAddress(addr) {
    const displayCity = addr.city || 'Location';
    const fullText = `${addr.locality ? addr.locality + ', ' : ''}${displayCity}, ${addr.pincode}`;
    const newLoc = { name: addr.name, city: displayCity, full: fullText, pincode: addr.pincode, addressId: addr._id };
    setDeliveryLocation(newLoc);
    localStorage.setItem('deliveryLocation', JSON.stringify(newLoc));
    window.dispatchEvent(new CustomEvent('deliveryLocationUpdated', { detail: { source: 'header', pincode: addr.pincode } }));
    setLocationModalOpen(false);
  }

  // Sync navLinks with actual database categories passed via props
  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'All Products', href: '/products' },
    ...categories.map((c) => ({
      label: c.title,
      href: `/category/${c.slug}`,
      megaMenu: (c.megaMenu && c.megaMenu.columns?.length > 0) ? c.megaMenu : {
        columns: [
          {
            title: 'Popular Types',
            links: [
              { label: 'Best Sellers', url: '#', badge: 'HOT' },
              { label: 'New Arrivals', url: '#' },
              { label: 'Premium Collection', url: '#', badge: 'PREMIUM' },
              { label: 'Trending', url: '#' },
            ]
          },
          {
            title: 'Shop by Price',
            links: [
              { label: 'Under ₹999', url: '#' },
              { label: '₹1000 - ₹1999', url: '#' },
              { label: '₹2000 - ₹2999', url: '#' },
              { label: 'Above ₹3000', url: '#' },
            ]
          }
        ],
        promo: {
          image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2000&auto=format&fit=crop',
          title: 'Curated For You',
          desc: 'Discover our premium hand-picked selection.',
          buttonText: 'Shop Now',
          url: '#'
        }
      }
    })),
  ];

  // Prevent redirect loops: if we are on an auth page, propagate its redirect (or fallback to /)
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => pathname?.startsWith(p));
  if (isAuthPage) return null;
  const safeRedirect = isAuthPage ? (searchParams.get('redirect') || '/') : pathname;

  return (
    <header className="fnp-header">
      {/* ── Top bar ── */}
      <div className="fnp-header-top">

        <div className="fnp-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            className="fnp-mobile-menu-toggle-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            id="mobile-menu-toggle"
          >
            <Menu size={22} />
          </button>

          {/* Dynamic Brand Logo */}
          <Link href="/" className="fnp-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img
              src={(themeMode === 'dark' && themeData?.darkLogo) ? themeData.darkLogo : (themeData?.logo || '/logo.png')}
              alt={themeData?.brandName || 'EShop'}
              style={{ height: themeData?.logoHeight ? `${Math.max(themeData.logoHeight, 56)}px` : '58px', width: 'auto', maxHeight: '68px', objectFit: 'contain' }}
            />
          </Link>

          {/* Location Delivery Widget */}
          <div className="fnp-delivery-widget" onClick={() => {
            setLocationModalSource('header');
            setLocationModalOpen(true);
          }}>
            <img src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" alt="India" className="fnp-flag" />
            <div className="fnp-delivery-text">
              {deliveryLocation ? (
                <>
                  <span className="fnp-delivery-title" style={{ color: 'var(--fnp-green)' }}>Deliver to {deliveryLocation.name || (deliveryLocation.city && deliveryLocation.city !== deliveryLocation.pincode ? deliveryLocation.city : deliveryLocation.pincode)} <ChevronDown size={12} color="var(--fnp-gray-900)" /></span>
                  <span className="fnp-delivery-sub" style={{ color: 'var(--fnp-gray-700)' }}>{deliveryLocation.full}</span>
                </>
              ) : (
                <>
                  <span className="fnp-delivery-title">Where to deliver?</span>
                  <span className="fnp-delivery-sub">Location missing <ChevronDown size={12} color="#ff5252" /></span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Location Modal */}
        {locationModalOpen && (
          <div className="fnp-modal-overlay" onClick={() => setLocationModalOpen(false)}>
            <div className="fnp-location-modal" onClick={e => e.stopPropagation()}>
              <div className="fnp-modal-header">
                <div className="fnp-modal-title">
                  <MapPin size={20} /> Let&apos;s Personalize Your Experience!
                </div>
                <button className="fnp-modal-close" onClick={() => setLocationModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <p className="fnp-modal-sub">Find the perfect gifts for you or your loved ones - it&apos;s like magic!</p>

              <div className="fnp-modal-body">
                {user && addresses && addresses.length > 0 && !showAddressForm && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 className="fnp-loc-section-title"><User size={16} /> Saved Addresses</h4>
                    <div className="fnp-loc-saved-list">
                      {addresses.map(addr => {
                        const fullText = `${addr.locality ? addr.locality + ', ' : ''}${addr.city || 'Location'}, ${addr.pincode}`;
                        const isActive = deliveryLocation?.addressId ? deliveryLocation.addressId === addr._id : (deliveryLocation?.pincode === addr.pincode && deliveryLocation?.full === fullText);

                        return (
                          <div
                            key={addr._id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`fnp-loc-address-card ${isActive ? 'active' : ''}`}
                          >
                            <MapPin size={20} className="fnp-loc-card-icon" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="fnp-loc-card-name">{addr.name} ({addr.type === 'home' ? 'Home' : addr.type === 'work' ? 'Work' : 'Other'})</div>
                              <div className="fnp-loc-card-sub">{addr.flat}, {addr.locality}, {addr.city} - {addr.pincode}</div>
                            </div>
                            <div className="fnp-loc-card-check">
                              {isActive && <CheckCircle2 size={18} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* + Add New Address button below saved list */}
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="fnp-loc-add-btn"
                    >
                      <Plus size={15} /> Add New Address
                    </button>

                    {/* Only show OR separator if we are also showing the pincode input */}
                    {(locationModalSource !== 'product' || !(user && addresses && addresses.length > 0)) && (
                      <div className="fnp-loc-or-divider">
                        <span>OR</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Inline Add Full Address Form — shown for logged-in users with no addresses OR when showAddressForm is toggled */}
                {user && showAddressForm && (
                  <div style={{ marginBottom: '1rem' }}>
                    {addresses && addresses.length > 0 && (
                      <button onClick={() => setShowAddressForm(false)} style={{ background: 'none', border: 'none', color: 'var(--fnp-gray-500)', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0, marginBottom: '1rem', fontFamily: 'inherit' }}>
                        ← Back to saved addresses
                      </button>
                    )}
                    <h4 className="fnp-loc-section-title">
                      <MapPin size={16} /> {addresses && addresses.length === 0 ? 'Add Your First Address' : 'Add New Address'}
                    </h4>

                    {/* Address type selector — Home / Work / Other */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {[
                        { val: 'home', label: 'Home', Icon: Home },
                        { val: 'work', label: 'Work', Icon: Briefcase },
                        { val: 'other', label: 'Other', Icon: MoreHorizontal },
                      ].map(({ val, label, Icon }) => {
                        const active = addressForm.type === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setAddressForm(f => ({ ...f, type: val }))}
                            className={`fnp-loc-type-pill ${active ? 'active' : ''}`}
                          >
                            <Icon size={13} />{label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Form fields — using auth-form-group / auth-input-wrapper / auth-form-input classes to match site theme */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

                      <div className="auth-form-group" style={{ margin: 0 }}>
                        <div className="auth-input-wrapper">
                          <User className="auth-input-icon" size={16} />
                          <input
                            type="text"
                            className="auth-form-input with-icon"
                            placeholder="Recipient Name *"
                            value={addressForm.name}
                            onChange={e => setAddressForm(f => ({ ...f, name: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="auth-form-group" style={{ margin: 0 }}>
                        <div className="auth-input-wrapper">
                          <Phone className="auth-input-icon" size={16} />
                          <input
                            type="text"
                            className="auth-form-input with-icon"
                            placeholder="Phone Number *"
                            value={addressForm.phone}
                            onChange={e => setAddressForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').substring(0, 10) }))}
                          />
                        </div>
                      </div>

                      <div className="auth-form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                        <div className="auth-input-wrapper">
                          <Building2 className="auth-input-icon" size={16} />
                          <input
                            type="text"
                            className="auth-form-input with-icon"
                            placeholder="Flat, House No., Building *"
                            value={addressForm.flat}
                            onChange={e => setAddressForm(f => ({ ...f, flat: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="auth-form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                        <div className="auth-input-wrapper">
                          <Navigation className="auth-input-icon" size={16} />
                          <input
                            type="text"
                            className="auth-form-input with-icon"
                            placeholder="Area, Street, Locality *"
                            value={addressForm.locality}
                            onChange={e => setAddressForm(f => ({ ...f, locality: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="auth-form-group" style={{ margin: 0 }}>
                        <div className="auth-input-wrapper">
                          <Map className="auth-input-icon" size={16} />
                          <input
                            type="text"
                            className="auth-form-input with-icon"
                            placeholder="City *"
                            value={addressForm.city}
                            onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="auth-form-group" style={{ margin: 0 }}>
                        <div className="auth-input-wrapper">
                          <Map className="auth-input-icon" size={16} />
                          <input
                            type="text"
                            className="auth-form-input with-icon"
                            placeholder="State *"
                            value={addressForm.state}
                            onChange={e => setAddressForm(f => ({ ...f, state: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="auth-form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                        <div className="auth-input-wrapper">
                          <MapPin className="auth-input-icon" size={16} />
                          <input
                            type="text"
                            className="auth-form-input with-icon"
                            placeholder="Pincode *"
                            value={addressForm.pincode}
                            onChange={e => setAddressForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').substring(0, 6) }))}
                          />
                        </div>
                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={handleSaveFullAddress}
                      disabled={isSavingAddress}
                      className="auth-btn-primary"
                      style={{ width: '100%', marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {isSavingAddress
                        ? <><span className="auth-spinner" /> Saving…</>
                        : <><CheckCircle2 size={16} /> Save as {addresses && addresses.length === 0 ? 'Default ' : ''}Address</>}
                    </button>
                  </div>
                )}

                {/* Pincode-only section — shown for guests OR for logged-in users who don't have the address form open AND have no existing addresses (fallback) */}
                {!user && (
                  <>
                    <h4 className="fnp-loc-section-title">Enter a Pincode</h4>
                    <div className="fnp-modal-input-group">
                      <div className="fnp-country-select">
                        <img src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" alt="India" />
                        <span>India</span>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    <div className="fnp-modal-input-group">
                      <input
                        type="text"
                        placeholder="Enter 6-digit pincode"
                        className="fnp-modal-input"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                    <button
                      className={`fnp-modal-confirm ${locationInput.trim().length === 6 ? 'active' : ''}`}
                      disabled={locationInput.trim().length !== 6}
                      onClick={handleConfirmLocation}
                    >
                      Confirm Pincode
                    </button>
                  </>
                )}

                {/* For logged-in users who are NOT showing the address form and have addresses — show pincode as extra option */}
                {user && !showAddressForm && addresses && addresses.length > 0 && (locationModalSource !== 'product') && (
                  <>
                    <h4 className="fnp-loc-section-title">Or Enter a Pincode</h4>
                    <div className="fnp-modal-input-group">
                      <div className="fnp-country-select">
                        <img src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" alt="India" />
                        <span>India</span>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    <div className="fnp-modal-input-group">
                      <input
                        type="text"
                        placeholder="Enter 6-digit pincode"
                        className="fnp-modal-input"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                    <button
                      className={`fnp-modal-confirm ${locationInput.trim().length === 6 ? 'active' : ''}`}
                      disabled={locationInput.trim().length !== 6}
                      onClick={handleConfirmLocation}
                    >
                      Confirm Pincode
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FNP Exact Search Bar */}
        <div className="fnp-search-wrapper" ref={searchRef}>
          <form className="fnp-search" onSubmit={handleSearch}>
            <Search size={18} className="fnp-search-icon" />
            <input
              type="text"
              placeholder="Search products, categories..."
              value={searchVal}
              onChange={handleSearchChange}
              onFocus={() => setSearchOpen(true)}
            />
            <button type="submit" className="fnp-search-btn" aria-label="Search">
              <Search size={16} />
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {searchOpen && (searchVal.length >= 1 || recentSearches.length > 0) && (
            <div className="fnp-search-dropdown">
              {/* Recent Searches */}
              {recentSearches.length > 0 && searchVal.length < 1 && (
                <div className="fnp-search-dropdown-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="fnp-search-section-label">Recent Searches</span>
                    <button className="fnp-search-clear-btn" onClick={clearRecentSearches}>Clear</button>
                  </div>
                  {recentSearches.map((s, i) => (
                    <div
                      key={i}
                      className="fnp-search-recent-row"
                      onClick={() => {
                        setSearchVal(s);
                        router.push(`/products?search=${encodeURIComponent(s)}`);
                        setSearchOpen(false);
                      }}
                    >
                      <Clock size={14} style={{ flexShrink: 0, color: 'var(--fnp-gray-300)' }} />
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Product Suggestions */}
              {searchVal.length >= 1 && (
                <div className="fnp-search-dropdown-section">
                  <span className="fnp-search-section-label">
                    {isSearchLoading ? 'Searching...' : suggestions.length > 0 ? `${suggestions.length} Products found` : 'No results'}
                  </span>
                  {suggestions.length > 0 ? suggestions.map((prod) => {
                    const thumb = prod.thumbnail || prod.images?.[0];
                    const price = prod.discountedPrice > 0 ? prod.discountedPrice : prod.price;
                    return (
                      <Link
                        key={prod.id || prod._id}
                        href={`/products/${prod.id || prod._id}`}
                        className="fnp-search-product-row"
                        onClick={() => {
                          saveRecentSearch(searchVal);
                          setSearchOpen(false);
                          setSearchVal('');
                        }}
                      >
                        {thumb
                          ? <img src={thumb.startsWith('http') ? thumb : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${thumb}`} alt="" className="fnp-search-product-thumb" />
                          : <div className="fnp-search-product-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🌸</div>
                        }
                        <div className="fnp-search-product-info">
                          <div className="fnp-search-product-title">{prod.title}</div>
                          <div className="fnp-search-product-price">₹{price?.toLocaleString('en-IN')}</div>
                        </div>
                        <ArrowRight size={14} style={{ flexShrink: 0, color: 'var(--fnp-gray-300)' }} />
                      </Link>
                    );
                  }) : !isSearchLoading && (
                    <div className="fnp-search-no-results">No products found for &quot;{searchVal}&quot;</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="fnp-header-actions">
          {/* Mobile Search Trigger Icon */}
          <button
            type="button"
            className="fnp-icon-btn fnp-mobile-search-trigger-btn"
            id="mobile-header-search-btn"
            onClick={() => setMobileSearchOpen(prev => !prev)}
            aria-label="Search products"
            title="Search"
          >
            <Search size={21} />
          </button>

          {/* Track Order Header Action */}
          <Link href="/track-order" className="fnp-icon-btn" id="track-order-icon-btn" title="Track Order">
            <Truck size={22} />
            <span>Track Order</span>
          </Link>

          {/* Notifications Header Action (for logged in users) */}
          {user && (
            <div style={{ position: 'relative', display: 'inline-block' }} ref={notifMenuRef}>
              <button
                type="button"
                className="fnp-icon-btn"
                onClick={() => setNotifMenuOpen(p => !p)}
                id="notif-menu-toggle"
                title="Notifications & Alerts"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div className="relative">
                  <Bell size={22} />
                  {unreadNotifCount > 0 && (
                    <span className="fnp-cart-badge">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </div>
                <span>Alerts</span>
              </button>

              {notifMenuOpen && (
                <div className="fnp-notif-dropdown">
                  {/* Upward pointer arrow positioned directly below the Alert Bell */}
                  <div className="fnp-notif-arrow" />

                  {/* Header */}
                  <div className="fnp-notif-header">
                    <div className="fnp-notif-header-title">
                      <Bell size={14} color="currentColor" strokeWidth={2.2} />
                      <span>Activity &amp; Alerts</span>
                      {unreadNotifCount > 0 && (
                        <span className="fnp-notif-badge">
                          {unreadNotifCount} new
                        </span>
                      )}
                    </div>

                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={handleQuickMarkAllRead}
                        className="fnp-notif-mark-btn"
                      >
                        <CheckCheck size={13} /> Mark read
                      </button>
                    )}
                  </div>

                  {/* List preview */}
                  <div className="fnp-notif-list">
                    {notifications.length === 0 ? (
                      <div className="fnp-notif-empty">
                        No notifications at this time
                      </div>
                    ) : (
                      notifications.slice(0, 4).map((n) => {
                        const isUnread = !n.read;
                        return (
                          <Link
                            key={n._id}
                            href={n.link || '/user/notifications'}
                            onClick={() => {
                              setNotifMenuOpen(false);
                              if (isUnread) handleMarkSingleRead(n._id);
                            }}
                            className={`fnp-notif-item ${isUnread ? 'unread' : ''}`}
                          >
                            <div className="fnp-notif-icon-box">
                              {n.type === 'alert' ? <Bell size={13} color="#ea580c" /> : n.type === 'order' ? <Package size={13} /> : n.type === 'promotion' ? <Ticket size={13} /> : n.type === 'return' ? <RotateCcw size={13} /> : <ShieldCheck size={13} />}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                                <span className="fnp-notif-title">
                                  {n.title}
                                </span>
                                {isUnread && (
                                  <span className="fnp-notif-dot" />
                                )}
                              </div>
                              <p className="fnp-notif-msg">
                                {n.message}
                              </p>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>

                  {/* Footer Link */}
                  <Link
                    href="/user/notifications"
                    onClick={() => setNotifMenuOpen(false)}
                    className="fnp-notif-footer"
                  >
                    View All Activity <ArrowRight size={13} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Storefront Luxury Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="fnp-icon-btn"
            id="storefront-theme-toggle-btn"
            title={themeMode === 'dark' ? 'Switch to Crisp Light Mode' : 'Switch to Luxury Dark Mode'}
            aria-label="Toggle Theme Mode"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)',
              color: themeMode === 'dark' ? '#fbbf24' : 'var(--fnp-gray-900)',
              transition: 'all 0.2s ease',
              border: themeMode === 'dark' ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              {themeMode === 'dark' ? (
                <Sun size={15} strokeWidth={2.2} />
              ) : (
                <Moon size={15} strokeWidth={2.2} />
              )}
            </div>
            <span>{themeMode === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Wishlist Header Action */}
          <Link href="/user/wishlist" className="fnp-icon-btn" id="wishlist-icon-btn" title="My Wishlist">
            <div className="relative">
              <Heart size={22} />
              {wishlistCount > 0 && (
                <span className="fnp-cart-badge">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </div>
            <span>Wishlist</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="fnp-icon-btn" id="cart-icon-btn">
            <div className="relative">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="fnp-cart-badge">{itemCount > 99 ? '99+' : itemCount}</span>
              )}
            </div>
            <span>Cart</span>
          </Link>

          {/* User Account / Guest */}
          <div style={{ position: 'relative', display: 'inline-block' }} ref={userMenuRef}>
            <button
              className="fnp-icon-btn"
              onClick={() => setUserMenuOpen((p) => !p)}
              id="user-menu-toggle"
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : user ? (
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--fnp-gray-900)', color: 'var(--fnp-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              ) : (
                <User size={22} />
              )}
              <span>{user ? `Hi, ${user.name?.split(' ')[0]}` : 'Account'}</span>
            </button>

            {userMenuOpen && (
              <div className="fnp-user-dropdown">
                {/* Pointer arrow aligning with avatar */}
                <div className="fnp-user-dropdown-arrow" />

                {user ? (
                  <>
                    {/* User Profile Header Card */}
                    <div className="fnp-user-header">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          className="fnp-user-header-avatar"
                        />
                      ) : (
                        <div className="fnp-user-header-avatar">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="fnp-user-header-info">
                        <div className="fnp-user-header-name">
                          {user.name}
                        </div>
                        <div className="fnp-user-header-email">{user.email}</div>
                      </div>
                    </div>

                    {/* Symmetrical Menu Items with Dynamic Store Styling */}
                    <div className="fnp-user-menu-list">
                      {[
                        {
                          label: 'My Profile & Account',
                          href: '/user',
                          icon: User
                        },
                        {
                          label: 'My Orders & History',
                          href: '/orders',
                          icon: Package
                        },
                        {
                          label: 'Track Live Shipment',
                          href: '/track-order',
                          icon: Truck
                        },
                        {
                          label: 'My Coupons & Rewards',
                          href: '/user/coupons',
                          icon: Ticket
                        }
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="fnp-user-menu-item"
                          >
                            <div className="fnp-user-menu-item-left">
                              <div className="fnp-user-icon-box">
                                <Icon size={16} strokeWidth={1.8} />
                              </div>
                              <span>{item.label}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <ChevronRight size={14} style={{ opacity: 0.4 }} />
                            </div>
                          </Link>
                        );
                      })}

                      <div className="fnp-user-divider" />

                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          showToast.success('Signed out successfully');
                          router.push('/');
                        }}
                        className="fnp-user-logout-btn"
                      >
                        <div className="fnp-user-icon-box logout">
                          <LogOut size={15} strokeWidth={1.8} />
                        </div>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest Greeting Header */}
                    <div className="fnp-guest-header">
                      <div className="fnp-guest-header-badge">
                        <User size={16} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h4 className="fnp-guest-title">Welcome Shopper! 👋</h4>
                        <p className="fnp-guest-subtitle">Sign in to track orders, saved items & checkout faster.</p>
                      </div>
                    </div>

                    {/* Primary & Secondary CTA Buttons */}
                    <div className="fnp-guest-actions">
                      <Link
                        href={`/login?redirect=${encodeURIComponent(safeRedirect)}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="fnp-guest-btn-primary"
                        id="header-login-link"
                      >
                        <User size={15} strokeWidth={2.2} />
                        <span>Sign In</span>
                      </Link>
                      <Link
                        href={`/register?redirect=${encodeURIComponent(safeRedirect)}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="fnp-guest-btn-secondary"
                        id="header-register-link"
                      >
                        <span>Create Free Account</span>
                      </Link>

                      <div className="fnp-user-divider" style={{ margin: '0.35rem 0' }} />

                      {/* Guest Quick Shortcuts */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <Link
                          href="/track-order"
                          onClick={() => setUserMenuOpen(false)}
                          className="fnp-user-menu-item"
                        >
                          <div className="fnp-user-menu-item-left">
                            <div className="fnp-user-icon-box">
                              <Truck size={15} strokeWidth={1.8} />
                            </div>
                            <span>Track Order Status</span>
                          </div>
                          <ChevronRight size={14} style={{ opacity: 0.4 }} />
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Collapsible Mobile Search Row ── */}
      {mobileSearchOpen && (
        <div className="fnp-mobile-header-search-row">
          <form className="fnp-mobile-search-form" onSubmit={handleSearch}>
            <Search size={18} className="fnp-mobile-search-input-icon" />
            <input
              type="text"
              placeholder="Search products, categories..."
              value={searchVal}
              onChange={handleSearchChange}
              autoFocus
              className="fnp-mobile-search-input"
            />
            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal('')}
                className="fnp-mobile-search-clear-btn"
                aria-label="Clear input"
              >
                <X size={15} />
              </button>
            )}
            <button type="submit" className="fnp-mobile-search-submit-btn" aria-label="Submit search">
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="fnp-mobile-search-close-btn"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          </form>

          {/* Autocomplete Dropdown for Mobile */}
          {(searchVal.length >= 1 || recentSearches.length > 0) && (
            <div className="fnp-mobile-search-dropdown">
              {recentSearches.length > 0 && searchVal.length < 1 && (
                <div className="fnp-search-dropdown-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px' }}>
                    <span className="fnp-search-section-label">Recent Searches</span>
                    <button className="fnp-search-clear-btn" onClick={clearRecentSearches}>Clear</button>
                  </div>
                  {recentSearches.map((s, i) => (
                    <div
                      key={i}
                      className="fnp-search-recent-row"
                      onClick={() => {
                        setSearchVal(s);
                        router.push(`/products?search=${encodeURIComponent(s)}`);
                        setMobileSearchOpen(false);
                      }}
                    >
                      <Clock size={14} style={{ flexShrink: 0, color: 'var(--fnp-gray-300)' }} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchVal.length >= 1 && (
                <div className="fnp-search-dropdown-section">
                  <span className="fnp-search-section-label" style={{ padding: '0 4px 6px', display: 'block' }}>
                    {isSearchLoading ? 'Searching...' : suggestions.length > 0 ? `${suggestions.length} Products found` : 'No results'}
                  </span>
                  {suggestions.length > 0 ? suggestions.map((prod) => {
                    const thumb = prod.thumbnail || prod.images?.[0];
                    const price = prod.discountedPrice > 0 ? prod.discountedPrice : prod.price;
                    return (
                      <Link
                        key={prod.id || prod._id}
                        href={`/products/${prod.id || prod._id}`}
                        className="fnp-search-product-row"
                        onClick={() => {
                          saveRecentSearch(searchVal);
                          setMobileSearchOpen(false);
                          setSearchVal('');
                        }}
                      >
                        {thumb
                          ? <img src={thumb.startsWith('http') ? thumb : `${process.env.NEXT_PUBLIC_BASE_URL || ''}${thumb}`} alt="" className="fnp-search-product-thumb" />
                          : <div className="fnp-search-product-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🌸</div>
                        }
                        <div className="fnp-search-product-info">
                          <div className="fnp-search-product-title">{prod.title}</div>
                          <div className="fnp-search-product-price">₹{price?.toLocaleString('en-IN')}</div>
                        </div>
                        <ArrowRight size={14} style={{ flexShrink: 0, color: 'var(--fnp-gray-300)' }} />
                      </Link>
                    );
                  }) : !isSearchLoading && (
                    <div className="fnp-search-no-results" style={{ padding: '8px' }}>No products found for &quot;{searchVal}&quot;</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Nav bar ── */}
      <nav className="fnp-navbar">
        <div className="fnp-navbar-inner" style={{ overflowX: 'visible' }}>
          {navLinks.map((link) => (
            <div key={link.href} className="fnp-nav-item">
              <Link
                href={link.href}
                className={`fnp-nav-link ${pathname === link.href ? 'active' : ''}`}
              >
                {link.label}
                {link.megaMenu && link.megaMenu.columns?.length > 0 && <ChevronDown size={14} />}
              </Link>

              {/* Dynamic Mega Menu Dropdown */}
              {link.megaMenu && link.megaMenu.columns?.length > 0 && (
                <div className="fnp-mega-menu">

                  {/* Left Side: Columns */}
                  <div className="fnp-mega-links-area">
                    {link.megaMenu.columns.map((col, colIdx) => (
                      <div key={colIdx} className="fnp-mega-column">
                        <div className="fnp-mega-title">{col.title}</div>
                        {col.links?.map((item, itemIdx) => (
                          <Link key={itemIdx} href={item.url || '#'} className="fnp-mega-link">
                            {item.label}
                            {item.badge && <span className="fnp-mega-new-badge">{item.badge}</span>}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Right Side: Promo that fills remaining space */}
                  {link.megaMenu.promo?.image ? (
                    <div className="fnp-mega-promo-area">
                      <div className="fnp-mega-promo-content">
                        <h4 className="fnp-mega-promo-title">Curated For You</h4>
                        <p className="fnp-mega-promo-desc">Discover our premium hand-picked selection.</p>
                        <Link href={link.megaMenu.promo.url || '#'} className="fnp-mega-promo-btn">
                          {link.megaMenu.promo.buttonText || 'Shop Now'}
                        </Link>
                      </div>
                      <img src={link.megaMenu.promo.image} alt="Promo" className="fnp-mega-promo-img" />
                    </div>
                  ) : (
                    /* If no promo image, just show an empty filler area to maintain the layout */
                    <div className="fnp-mega-promo-area empty-promo"></div>
                  )}

                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* ── Slide-Over Mobile Navigation Drawer ── */}
      {mobileOpen && (
        <div
          className="fnp-mobile-drawer-root"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* Backdrop */}
          <div
            className="fnp-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Sliding Panel */}
          <div className="fnp-drawer-panel">
            {/* Header: Brand & Close */}
            <div className="fnp-drawer-header">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="fnp-drawer-logo"
              >
                <img
                  src={(themeMode === 'dark' && themeData?.darkLogo) ? themeData.darkLogo : (themeData?.logo || '/logo.png')}
                  alt={themeData?.brandName || 'EShop'}
                  style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <button
                type="button"
                className="fnp-drawer-close-btn"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="fnp-drawer-body">
              {/* Delivery Location Card */}
              <div
                className="fnp-drawer-location-card"
                onClick={() => {
                  setMobileOpen(false);
                  setLocationModalSource('header');
                  setLocationModalOpen(true);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="fnp-drawer-location-icon">
                  <MapPin size={18} />
                </div>
                <div className="fnp-drawer-location-info">
                  <div className="fnp-drawer-location-title">
                    {deliveryLocation ? `Deliver to ${deliveryLocation.name || (deliveryLocation.city && deliveryLocation.city !== deliveryLocation.pincode ? deliveryLocation.city : deliveryLocation.pincode)}` : 'Where to deliver?'}
                  </div>
                  <div className="fnp-drawer-location-sub">
                    {deliveryLocation ? deliveryLocation.full : 'Tap to select pincode or address'}
                  </div>
                </div>
                <ChevronRight size={16} className="fnp-drawer-arrow" />
              </div>

              {/* User Account / Auth Card */}
              {user ? (
                <div className="fnp-drawer-user-card">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="fnp-drawer-user-avatar" />
                  ) : (
                    <div className="fnp-drawer-user-avatar fnp-drawer-user-avatar-initials">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="fnp-drawer-user-details">
                    <div className="fnp-drawer-user-name">{user.name}</div>
                    <div className="fnp-drawer-user-email">{user.email}</div>
                  </div>
                  <Link
                    href="/user"
                    onClick={() => setMobileOpen(false)}
                    className="fnp-drawer-user-view-btn"
                  >
                    Account
                  </Link>
                </div>
              ) : (
                <div className="fnp-drawer-guest-card">
                  <div className="fnp-drawer-guest-text">
                    <strong>Welcome to our store</strong>
                    <span>Sign in to manage orders &amp; wishlist</span>
                  </div>
                  <div className="fnp-drawer-guest-btns">
                    <Link
                      href={`/login?redirect=${encodeURIComponent(safeRedirect)}`}
                      onClick={() => setMobileOpen(false)}
                      className="fnp-drawer-btn-login"
                    >
                      Sign In
                    </Link>
                    <Link
                      href={`/register?redirect=${encodeURIComponent(safeRedirect)}`}
                      onClick={() => setMobileOpen(false)}
                      className="fnp-drawer-btn-register"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick Navigation Action Grid */}
              <div className="fnp-drawer-quick-grid">
                <Link href="/track-order" onClick={() => setMobileOpen(false)} className="fnp-drawer-quick-card">
                  <Truck size={18} />
                  <span>Track Order</span>
                </Link>
                <Link href="/user/wishlist" onClick={() => setMobileOpen(false)} className="fnp-drawer-quick-card">
                  <div className="relative" style={{ display: 'flex', alignItems: 'center' }}>
                    <Heart size={18} />
                    {wishlistCount > 0 && <span className="fnp-cart-badge" style={{ top: '-4px', right: '-8px' }}>{wishlistCount}</span>}
                  </div>
                  <span>Wishlist</span>
                </Link>
                <Link href="/orders" onClick={() => setMobileOpen(false)} className="fnp-drawer-quick-card">
                  <Package size={18} />
                  <span>My Orders</span>
                </Link>
                <Link href="/user/coupons" onClick={() => setMobileOpen(false)} className="fnp-drawer-quick-card">
                  <Ticket size={18} />
                  <span>Coupons</span>
                </Link>
              </div>

              {/* Category Accordion Navigation */}
              <div className="fnp-drawer-nav-section">
                <div className="fnp-drawer-section-heading">Categories &amp; Collections</div>
                <div className="fnp-drawer-accordion-list">
                  {navLinks.map((link, idx) => {
                    const hasSub = link.megaMenu && link.megaMenu.columns?.length > 0;
                    const isExpanded = openCategoryIndex === idx;

                    if (!hasSub) {
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`fnp-drawer-nav-link ${pathname === link.href ? 'active' : ''}`}
                        >
                          <span>{link.label}</span>
                          <ChevronRight size={16} className="fnp-drawer-arrow" />
                        </Link>
                      );
                    }

                    return (
                      <div key={link.href || idx} className="fnp-drawer-accordion-item">
                        <div className="fnp-drawer-accordion-header">
                          <Link
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`fnp-drawer-nav-link ${pathname === link.href ? 'active' : ''}`}
                            style={{ flex: 1 }}
                          >
                            <span>{link.label}</span>
                          </Link>
                          <button
                            type="button"
                            className={`fnp-drawer-chevron-btn ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => setOpenCategoryIndex(isExpanded ? null : idx)}
                            aria-label={isExpanded ? `Collapse ${link.label}` : `Expand ${link.label}`}
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="fnp-drawer-submenu">
                            {link.megaMenu.columns.map((col, colIdx) => (
                              <div key={colIdx} className="fnp-drawer-subcolumn">
                                <div className="fnp-drawer-subcolumn-title">{col.title}</div>
                                <div className="fnp-drawer-subcolumn-links">
                                  {col.links?.map((item, itemIdx) => (
                                    <Link
                                      key={itemIdx}
                                      href={item.url || '#'}
                                      onClick={() => setMobileOpen(false)}
                                      className="fnp-drawer-sublink"
                                    >
                                      <span>{item.label}</span>
                                      {item.badge && <span className="fnp-mega-new-badge">{item.badge}</span>}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="fnp-drawer-footer">
              <button
                type="button"
                onClick={toggleTheme}
                className="fnp-drawer-theme-btn"
                title={themeMode === 'dark' ? 'Switch to Crisp Light Mode' : 'Switch to Luxury Dark Mode'}
              >
                {themeMode === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} />}
                <span>{themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="fnp-drawer-logout-btn"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
