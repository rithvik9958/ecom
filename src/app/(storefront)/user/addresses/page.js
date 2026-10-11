'use client';
import { useState, useMemo, useEffect } from 'react';
import UserDashboardLayout from '@/components/storefront/UserDashboardLayout';
import { useCart } from '@/context/CartContext';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { 
  Plus, Loader2, Trash2, MapPin, User, Phone, Home, 
  Building2, Map, Navigation, Pencil, Briefcase, X, Check, 
  Star, Search, ChevronLeft, ChevronRight, CheckCircle2
} from 'lucide-react';
import showToast from '@/lib/storeToast';
import { createPortal } from 'react-dom';
import StorefrontConfirmModal from '@/components/storefront/StorefrontConfirmModal';
import CustomSelect from '@/components/storefront/StoreSelect';

export default function UserAddressesPage() {
  const { loadUser } = useStoreAuth();
  const { addresses, addAddress: contextAddAddress, updateAddress: contextUpdateAddress, deleteAddress: contextDeleteAddress } = useCart();
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({
    name: '', phone: '', flat: '', locality: '', city: '', state: '', pincode: '', type: 'home', isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  // Address counts for filters
  const homeCount = addresses?.filter(a => a.type === 'home').length || 0;
  const workCount = addresses?.filter(a => a.type === 'work').length || 0;
  const otherCount = addresses?.filter(a => a.type === 'other').length || 0;

  // Filtered Addresses based on Tab and Search
  const filteredAddresses = useMemo(() => {
    return (addresses || []).filter(addr => {
      // Tab filter
      if (activeFilter !== 'all' && addr.type !== activeFilter) return false;
      
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (addr.name || '').toLowerCase().includes(q);
        const matchFlat = (addr.flat || '').toLowerCase().includes(q);
        const matchLoc = (addr.locality || '').toLowerCase().includes(q);
        const matchCity = (addr.city || '').toLowerCase().includes(q);
        const matchPin = (addr.pincode || '').toLowerCase().includes(q);
        const matchPhone = (addr.phone || '').toLowerCase().includes(q);
        return matchName || matchFlat || matchLoc || matchCity || matchPin || matchPhone;
      }
      return true;
    });
  }, [addresses, activeFilter, searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, pageSize]);

  // Pagination Calculations
  const totalItems = filteredAddresses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedAddresses = filteredAddresses.slice(startIndex, endIndex);

  function handleEditAddress(addr) {
    setEditingAddressId(addr._id);
    setAddrForm({
      name: addr.name || '',
      phone: addr.phone || '',
      flat: addr.flat || '',
      locality: addr.locality || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      type: addr.type || 'home',
      isDefault: addr.isDefault || false
    });
    setShowAddressForm(true);
  }

  function handleCancelForm() {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddrForm({ name: '', phone: '', flat: '', locality: '', city: '', state: '', pincode: '', type: 'home', isDefault: false });
  }

  async function handleAddAddress(e) {
    e.preventDefault();
    setAddingAddress(true);
    try {
      let success = false;
      if (editingAddressId) {
        success = await contextUpdateAddress(editingAddressId, addrForm);
        if (success) {
          const activeLoc = localStorage.getItem('deliveryLocation');
          if (activeLoc) {
            try {
              const parsed = JSON.parse(activeLoc);
              if (parsed.addressId === editingAddressId) {
                const newLoc = { 
                  name: addrForm.name, 
                  city: addrForm.city || 'Location', 
                  full: `${addrForm.locality ? addrForm.locality + ', ' : ''}${addrForm.city || 'Location'}, ${addrForm.pincode}`, 
                  pincode: addrForm.pincode, 
                  addressId: editingAddressId 
                };
                localStorage.setItem('deliveryLocation', JSON.stringify(newLoc));
                window.dispatchEvent(new CustomEvent('deliveryLocationUpdated', { detail: { source: 'dashboard', pincode: addrForm.pincode } }));
              }
            } catch (e) {}
          }
        }
      } else {
        success = await contextAddAddress(addrForm);
      }
      
      if (success) {
        handleCancelForm();
        loadUser();
      }
    } catch {
      showToast.error('Network error');
    } finally {
      setAddingAddress(false);
    }
  }

  function triggerDeleteAddress(addr) {
    setAddressToDelete(addr);
    setIsDeleteModalOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!addressToDelete) return;
    try {
      await contextDeleteAddress(addressToDelete._id);
      
      // Fallback logic for active session address
      const activeLoc = localStorage.getItem('deliveryLocation');
      if (activeLoc) {
        try {
          const parsed = JSON.parse(activeLoc);
          if (parsed.addressId === addressToDelete._id) {
            localStorage.removeItem('deliveryLocation');
            window.dispatchEvent(new CustomEvent('deliveryLocationUpdated'));
          }
        } catch (e) {}
      }

      loadUser();
      showToast.success('Address removed');
    } catch {
      showToast.error('Network error');
    } finally {
      setIsDeleteModalOpen(false);
      setAddressToDelete(null);
    }
  }

  async function handleSetDefault(addr) {
    try {
      await contextUpdateAddress(addr._id, { ...addr, isDefault: true });
      loadUser();
      showToast.success('Default delivery address updated');
    } catch {
      showToast.error('Failed to set default address');
    }
  }

  return (
    <UserDashboardLayout title="Saved Addresses">
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
              <MapPin size={20} color="#ffffff" strokeWidth={2} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Saved Delivery Addresses
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Manage your home, office, and gifting delivery locations for swift, 1-click checkout
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
                {addresses?.length || 0}
              </span>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
                Saved Places
              </span>
            </div>

            <button 
              type="button"
              onClick={() => {
                setEditingAddressId(null);
                setAddrForm({ name: '', phone: '', flat: '', locality: '', city: '', state: '', pincode: '', type: 'home', isDefault: !addresses || addresses.length === 0 });
                setShowAddressForm(true);
              }}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                background: '#ffffff', 
                color: '#0f172a', 
                border: 'none', 
                padding: '0 1.25rem', 
                height: '42px',
                borderRadius: '12px', 
                fontWeight: 800, 
                fontSize: '0.86rem', 
                cursor: 'pointer', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)', 
                transition: 'all 0.15s',
                boxSizing: 'border-box'
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'none'; }}
            >
              <Plus size={16} strokeWidth={2.5} /> Add New Address
            </button>
          </div>
        </div>

        {/* Toolbar: Category Segment Tabs, Search Filter & CustomSelect Page Size */}
        {addresses && addresses.length > 0 && (
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
                { id: 'all', label: 'All Places', count: addresses.length },
                { id: 'home', label: 'Home', count: homeCount },
                { id: 'work', label: 'Work', count: workCount },
                { id: 'other', label: 'Other', count: otherCount }
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
                      fontWeight: isActive ? 800 : 600,
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
                      fontWeight: 800,
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
                  placeholder="Search saved addresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.75rem 0.45rem 2rem',
                    fontSize: '0.82rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    color: '#0f172a',
                    outline: 'none',
                    fontWeight: 600
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
                    { value: 4, label: '4 per page' },
                    { value: 8, label: '8 per page' },
                    { value: 16, label: '16 per page' }
                  ]}
                  size="md"
                />
              )}
            </div>

          </div>
        )}

        {/* Address Directory Rows Container */}
        {(!addresses || addresses.length === 0) ? (
          /* Empty State */
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
              <MapPin size={34} color="#0f172a" strokeWidth={1.75} />
            </div>
            
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              No Saved Addresses Found
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '440px', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              Save your delivery addresses for seamless, lightning-fast ordering and automatic address filling at checkout.
            </p>

            <button
              type="button"
              onClick={() => {
                setEditingAddressId(null);
                setAddrForm({ name: '', phone: '', flat: '', locality: '', city: '', state: '', pincode: '', type: 'home', isDefault: true });
                setShowAddressForm(true);
              }}
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
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} strokeWidth={2.5} /> Add Your First Address
            </button>
          </div>
        ) : filteredAddresses.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No addresses match your filter or search query.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {paginatedAddresses.map((addr) => {
              const isDefault = addr.isDefault;
              const TypeIcon = addr.type === 'work' ? Briefcase : addr.type === 'other' ? Navigation : Home;

              return (
                <div
                  key={addr._id}
                  className={`user-address-card ${isDefault ? 'default' : ''}`}
                >
                  
                  {/* Left: Location Avatar, Type Badge & Recipient Info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: '280px', flex: '1 1 420px' }}>
                    
                    {/* Location Icon Circle */}
                    <div className="user-address-avatar">
                      <TypeIcon size={18} strokeWidth={2} />
                    </div>

                    {/* Recipient Details & Structured Address */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                      
                      {/* Name, Phone & Type Pill Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="user-address-name">
                          {addr.name}
                        </span>

                        <span className="user-address-badge">
                          <TypeIcon size={11} strokeWidth={2.2} />
                          {addr.type || 'home'}
                        </span>

                        {isDefault && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#ecfdf5',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            <CheckCircle2 size={11} /> Primary Default
                          </span>
                        )}
                      </div>

                      {/* Full Street Address with Landmark */}
                      <p className="user-address-text">
                        {addr.flat && <span>{addr.flat}, </span>}
                        {addr.locality && <span>{addr.locality}, </span>}
                        {addr.city && <span>{addr.city}, </span>}
                        {addr.state && <span>{addr.state} </span>}
                        {addr.pincode && <strong style={{ color: '#0f172a' }}>- {addr.pincode}</strong>}
                      </p>

                      {/* Phone Number Strip */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                        <Phone size={12} /> {addr.phone}
                      </div>

                    </div>

                  </div>

                  {/* Right: Quick Action Buttons (Set Default, Edit, Delete) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    
                    {/* Set Default Button */}
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr._id)}
                        className="user-address-default-btn"
                      >
                        <Star size={12} /> Set as default
                      </button>
                    )}

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleEditAddress(addr)}
                      className="user-address-edit-btn"
                    >
                      <Pencil size={13} /> Edit
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      title="Remove address"
                      onClick={() => triggerDeleteAddress(addr)}
                      className="user-address-delete-btn"
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
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              Showing <strong style={{ color: '#0f172a' }}>{startIndex + 1}</strong>–<strong style={{ color: '#0f172a' }}>{endIndex}</strong> of <strong style={{ color: '#0f172a' }}>{totalItems}</strong> saved addresses
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

      </div>      {/* Address Form Modal */}
      {showAddressForm && typeof document !== 'undefined' && createPortal(
        <div className="fnp-modal-overlay">
          <div className="fnp-address-modal">
            
            {/* Modal Fixed Header */}
            <div className="fnp-address-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="fnp-address-modal-header-icon">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="fnp-address-modal-title">
                    {editingAddressId ? 'Edit Delivery Address' : 'Add New Address'}
                  </h3>
                  <span className="fnp-address-modal-sub">Accurate details ensure prompt doorstep arrival</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleCancelForm} 
                className="fnp-modal-close-btn"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddAddress} style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, boxSizing: 'border-box' }}>
              
              {/* Address Type Interactive Segmented Pills */}
              <div className="dashboard-form-group">
                <label className="dashboard-label">Address Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { id: 'home', label: 'Home', icon: Home, sub: 'All-Day' },
                    { id: 'work', label: 'Work', icon: Briefcase, sub: '10AM - 6PM' },
                    { id: 'other', label: 'Other', icon: MapPin, sub: 'Friends/Family' }
                  ].map(t => {
                    const isSelected = addrForm.type === t.id;
                    const IconComp = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAddrForm({ ...addrForm, type: t.id })}
                        className={`fnp-address-type-btn ${isSelected ? 'selected' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '0.82rem' }}>
                          <IconComp size={13} />
                          {t.label}
                        </div>
                        <span style={{ fontSize: '0.65rem', opacity: isSelected ? 0.8 : 0.6 }}>{t.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                
                {/* Full Name */}
                <div className="dashboard-form-group">
                  <label className="dashboard-label">Recipient Name</label>
                  <div className="dashboard-input-wrapper">
                    <User className="dashboard-input-icon" size={15} />
                    <input type="text" className="dashboard-input with-icon" placeholder="Full Name" required value={addrForm.name} onChange={e => setAddrForm({...addrForm, name: e.target.value})} />
                  </div>
                </div>
                
                {/* Phone */}
                <div className="dashboard-form-group">
                  <label className="dashboard-label">Phone Number</label>
                  <div className="dashboard-input-wrapper">
                    <Phone className="dashboard-input-icon" size={15} />
                    <input type="tel" className="dashboard-input with-icon" placeholder="10-digit Mobile" required value={addrForm.phone} onChange={e => setAddrForm({...addrForm, phone: e.target.value})} />
                  </div>
                </div>

                {/* Flat / Building */}
                <div className="dashboard-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="dashboard-label">House / Flat / Building No.</label>
                  <div className="dashboard-input-wrapper">
                    <Building2 className="dashboard-input-icon" size={15} />
                    <input type="text" className="dashboard-input with-icon" placeholder="Flat, Floor, Building Name" required value={addrForm.flat} onChange={e => setAddrForm({...addrForm, flat: e.target.value})} />
                  </div>
                </div>

                {/* Street / Landmark */}
                <div className="dashboard-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="dashboard-label">Street / Locality / Landmark</label>
                  <div className="dashboard-input-wrapper">
                    <Navigation className="dashboard-input-icon" size={15} />
                    <input type="text" className="dashboard-input with-icon" placeholder="Road, Area, Near Landmark" required value={addrForm.locality} onChange={e => setAddrForm({...addrForm, locality: e.target.value})} />
                  </div>
                </div>

              </div>

              {/* 3-Column City, State, PIN */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '0.75rem' }}>
                
                {/* Pincode */}
                <div className="dashboard-form-group">
                  <label className="dashboard-label">Pincode</label>
                  <div className="dashboard-input-wrapper">
                    <MapPin className="dashboard-input-icon" size={15} />
                    <input type="text" className="dashboard-input with-icon" placeholder="6-digit PIN" required value={addrForm.pincode} onChange={e => setAddrForm({...addrForm, pincode: e.target.value})} />
                  </div>
                </div>

                {/* City */}
                <div className="dashboard-form-group">
                  <label className="dashboard-label">City</label>
                  <div className="dashboard-input-wrapper">
                    <Map className="dashboard-input-icon" size={15} />
                    <input type="text" className="dashboard-input with-icon" placeholder="City" required value={addrForm.city} onChange={e => setAddrForm({...addrForm, city: e.target.value})} />
                  </div>
                </div>

                {/* State */}
                <div className="dashboard-form-group">
                  <label className="dashboard-label">State</label>
                  <div className="dashboard-input-wrapper">
                    <Map className="dashboard-input-icon" size={15} />
                    <input type="text" className="dashboard-input with-icon" placeholder="State" value={addrForm.state} onChange={e => setAddrForm({...addrForm, state: e.target.value})} />
                  </div>
                </div>

              </div>

              {/* Default Address Checkbox Card */}
              <div className="fnp-address-default-card">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', cursor: 'pointer', fontWeight: 700 }}>
                  <input 
                    type="checkbox" 
                    checked={addrForm.isDefault} 
                    onChange={e => setAddrForm({...addrForm, isDefault: e.target.checked})} 
                    style={{ width: 16, height: 16, accentColor: '#111827', cursor: 'pointer' }} 
                  />
                  Set as my primary default delivery address
                </label>
              </div>

              {/* Footer Actions inside form */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem', paddingTop: '0.85rem', borderTop: '1px solid #e2e8f0' }}>
                <button 
                  type="button" 
                  onClick={handleCancelForm}
                  className="dashboard-secondary-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addingAddress} 
                  className="dashboard-primary-btn"
                >
                  {addingAddress ? <Loader2 size={15} className="animate-spin" /> : (editingAddressId ? 'Save Changes' : 'Save Address')}
                </button>
              </div>

            </form>
          </div>
        </div>, document.body)}

      <StorefrontConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Address?"
        message={addressToDelete ? `Are you sure you want to remove the address for ${addressToDelete.name}? This action cannot be undone.` : ''}
      />
      
    </UserDashboardLayout>
  );
}
