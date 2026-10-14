'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, MapPin, Clock, CreditCard, User, CheckCircle2, ChevronDown, Tag, Wallet, X, ChevronLeft, ChevronRight, LocateFixed, Loader2, Pencil, ChevronUp, Percent, Receipt, Truck, Sparkles, ShieldCheck } from 'lucide-react';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { useCart } from '@/context/CartContext';
import showToast from '@/lib/storeToast';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';

function getImageUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${process.env.NEXT_PUBLIC_BASE_URL || ''}${url}`;
}

const StepperItem = ({ icon: Icon, label, active, completed, isLast }) => (
  <div className="fnp-cart-stepper-node">
    <div className="fnp-cart-stepper-item">
      <div className={`fnp-cart-stepper-circle ${completed ? 'completed' : active ? 'active' : ''}`}>
        {completed ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <Icon size={18} />}
      </div>
      <span className={`fnp-cart-stepper-label ${completed ? 'completed' : active ? 'active' : ''}`}>
        {label}
      </span>
    </div>
    {!isLast && (
      <div className={`fnp-cart-stepper-line ${completed ? 'completed' : ''}`} />
    )}
  </div>
);

const CartItemRow = ({ item, updateQuantity, removeItem, isAddon = false, loading = false }) => {
  const itemMrp = Number(item.mrp) || 0;
  const itemPrice = Number(item.price) || 0;
  const discountPercent = itemMrp > itemPrice ? Math.round(((itemMrp - itemPrice) / itemMrp) * 100) : 0;
  const isUnavailable = item.isUnavailable;

  return (
    <div className="fnp-cart-item-row" style={{ opacity: isUnavailable ? 0.6 : 1, filter: isUnavailable ? 'grayscale(100%)' : 'none' }}>
      <div className={`fnp-cart-item-thumb-box ${isAddon ? 'addon' : ''}`}>
        {item.thumbnail ? (
          <img src={getImageUrl(item.thumbnail)} alt={item.title} className="fnp-cart-item-thumb" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎁</div>
        )}
      </div>

      <div className="fnp-cart-item-details">
        <div className="fnp-cart-item-title-row">
          <h4 className="fnp-cart-item-title">
            <span>{item.title}</span>
            {isUnavailable && (
              <span style={{ marginLeft: '6px', background: '#fee2e2', color: '#ef4444', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {item.unavailableReason || 'Out of Stock'}
              </span>
            )}
          </h4>
          <button
            type="button"
            className="fnp-cart-item-remove-btn"
            onClick={() => removeItem(item)}
            title="Remove item"
            aria-label="Remove item"
          >
            <X size={16} />
          </button>
        </div>

        {/* Variant Attributes Badge */}
        {(() => {
          const vAttrs = item.selectedVariantAttrs || item.variant?.attrs;
          if (vAttrs && typeof vAttrs === 'object' && Object.keys(vAttrs).length > 0) {
            return (
              <div className="fnp-cart-item-attrs">
                {Object.entries(vAttrs).map(([k, v]) => (
                  <span key={k} className="fnp-cart-item-attr-pill">
                    {k.replace(/_/g, ' ')}: <strong className="fnp-cart-item-attr-val">{v}</strong>
                  </span>
                ))}
                {item.sku && (
                  <span className="fnp-cart-item-sku">
                    SKU: {item.sku}
                  </span>
                )}
              </div>
            );
          }
          return null;
        })()}

        <div className="fnp-cart-item-price-row">
          <span className="fnp-cart-item-price">₹{itemPrice.toLocaleString('en-IN')}</span>
          {discountPercent > 0 && !isUnavailable && (
            <>
              <span className="fnp-cart-item-mrp">₹{itemMrp.toLocaleString('en-IN')}</span>
              <span className="fnp-cart-item-discount">{discountPercent}% OFF</span>
            </>
          )}
        </div>

        <div className="fnp-cart-item-stepper-wrap">
          <span className="fnp-cart-item-qty-label">Qty:</span>
          {!isUnavailable && (
            <div className="fnp-cart-item-stepper" style={{ opacity: loading ? 0.5 : 1 }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)}
                className="fnp-cart-item-stepper-btn"
                aria-label="Decrease quantity"
              >
                <Minus size={12} color="currentColor" />
              </button>
              <span className="fnp-cart-item-stepper-val">{item.quantity || 1}</span>
              <button
                type="button"
                disabled={loading}
                onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                className="fnp-cart-item-stepper-btn"
                aria-label="Increase quantity"
              >
                <Plus size={12} color="currentColor" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CartPage() {
  const { user } = useStoreAuth();
  const router = useRouter();
  const { items, itemCount, cartTotal, updateQuantity, removeItem, addItem, addresses, addAddress, updateAddress, deleteAddress, messageCard, setMessageCard, appliedCoupon, setAppliedCoupon, senderDetails, setSenderDetails, updateDeliverySlot, clearCart, loading, isInitialized } = useCart();

  // Dynamic CTA States
  const [addressFilled, setAddressFilled] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' or 'payment'
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [upiConfig, setUpiConfig] = useState({ upiId: 'dummyupi@ybl', merchantName: 'City Shop Demo', merchantCode: '0000' });
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Modals
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSelectAddressModal, setShowSelectAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Coupon Modal State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Order Summary State
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [shippingRules, setShippingRules] = useState([]);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);
  const bannerRef = useRef(null);

  // Message Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [prebuiltMessages, setPrebuiltMessages] = useState([]);
  const [showPrebuiltDropdown, setShowPrebuiltDropdown] = useState(false);
  const [localMessageCard, setLocalMessageCard] = useState({ message: '', senderName: '', hideName: false });

  // Sender Details Modal State
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [localSenderDetails, setLocalSenderDetails] = useState({ name: '', phone: '', email: '', city: '', sameAsRecipientCity: false });

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);


  // Time Slot Modal State
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [activeGiftIdForSlot, setActiveGiftIdForSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);
  const [localSelectedSlot, setLocalSelectedSlot] = useState(null); // stores { type, label, charge, id }

  const handleOpenSlotModal = (gift) => {
    setActiveGiftIdForSlot(gift.groupId);
    if (gift.main?.deliveryDate) {
      const d = new Date(gift.main.deliveryDate);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${day}`);
    } else {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${day}`);
    }
    setLocalSelectedSlot(gift.main?.deliverySlot || null);
    setShowSlotModal(true);
  };

  const fetchTimeSlots = async (dateStr) => {
    setIsFetchingSlots(true);
    const pin = selectedAddress?.pincode;
    if (!pin) {
      setIsFetchingSlots(false);
      return;
    }
    try {
      const res = await fetch(`/api/store-shipping-options?pincode=${pin}`);
      const data = await res.json();
      if (data.success && data.options) {
        const rules = data.options.filter(r => r.type !== 'STANDARD');

        const groupedRules = {};
        rules.forEach(rule => {
          const mType = rule.type;
          const groupName = mType === 'FIXED_TIME' ? 'Fixed Time Delivery' : mType === 'MIDNIGHT' ? 'Midnight Delivery' : mType === 'SAME_DAY' ? 'Same Day Delivery' : rule.name;
          
          if (!groupedRules[mType]) {
            groupedRules[mType] = {
              _id: mType,
              type: groupName,
              methodType: mType,
              baseCharge: rule.baseCharge || 0,
              slots: []
            };
          }
          
          groupedRules[mType].slots.push({
            _id: rule.ruleId,
            label: rule.startTime ? `${rule.startTime} - ${rule.endTime}` : rule.name,
            startTime: rule.startTime,
            endTime: rule.endTime,
            cutoffTime: rule.cutoffTime,
            charge: rule.baseCharge || 0
          });
        });
        
        const formattedTypes = Object.values(groupedRules);

        // Apply cutoff time if today
        const selDate = new Date(dateStr);
        const today = new Date();
        const isToday =
          selDate.getDate() === today.getDate() &&
          selDate.getMonth() === today.getMonth() &&
          selDate.getFullYear() === today.getFullYear();

        const currentHour = today.getHours().toString().padStart(2, '0');
        const currentMinute = today.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${currentHour}:${currentMinute}`;

        const validTypes = formattedTypes.map(type => {
          if (isToday) {
            type.slots = type.slots.filter(s => {
              if (s.cutoffTime && currentTimeStr > s.cutoffTime) return false;
              return true;
            });
          }
          return type;
        }).filter(type => type.slots.length > 0);

        setAvailableSlots(validTypes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingSlots(false);
    }
  };

  useEffect(() => {
    if (showSlotModal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate, showSlotModal]);

  useEffect(() => {
    fetch('/api/store-message-templates')
      .then(res => res.json())
      .then(data => {
        if (data.success) setPrebuiltMessages(data.templates);
      })
      .catch(err => console.error(err));

    fetch('/api/store-payment-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setUpiConfig(data.data);
        }
      })
      .catch(err => console.error(err));

    const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
    fetch('/api/store-coupons', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setAvailableCoupons(data.coupons);
      })
      .catch(err => console.error(err));
  }, [user]);

  useEffect(() => {
    if (user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      fetch('/api/store-wallet', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.wallet) {
            setWalletBalance(data.wallet.balance || 0);
          }
        })
        .catch(() => {});
    } else {
      setWalletBalance(0);
      setUseWallet(false);
    }
  }, [user]);




  const handleApplyCoupon = async (code) => {
    setCouponError('');
    setIsApplyingCoupon(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
      const res = await fetch('/api/store-coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ code, cartTotal, email: user?.email })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon({ ...data.coupon, discountAmount: data.discountAmount });
        setShowCouponModal(false);
        setCelebrationText('🎉 Coupon Applied! 🎉');
        setTimeout(() => setCelebrationText(null), 1000);
        try {
          const confetti = (await import('canvas-confetti')).default;
          const colors = ['#111111', '#f59e0b', '#10b981'];
          confetti({ particleCount: 100, spread: 80, origin: { x: 0, y: 0.5 }, angle: 60, colors, zIndex: 99999 });
          confetti({ particleCount: 100, spread: 80, origin: { x: 1, y: 0.5 }, angle: 120, colors, zIndex: 99999 });
        } catch (e) { }
      } else {
        setCouponError(data.message || 'Invalid coupon');
      }
    } catch (err) {
      setCouponError('Something went wrong. Please try again.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = (e) => {
    if (e) e.stopPropagation();
    setAppliedCoupon(null);
    setCouponInput('');
  };

  // When modal opens, sync local state
  useEffect(() => {
    if (showMessageModal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalMessageCard({
        message: messageCard.message || '',
        senderName: messageCard.senderName || (user?.name || ''),
        hideName: messageCard.hideName || false
      });
      setShowPrebuiltDropdown(false);
    }
  }, [showMessageModal, messageCard, user]);

  useEffect(() => {
    if (localSenderDetails.sameAsRecipientCity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSenderDetails(prev => ({
        ...prev,
        name: senderDetails.name || user?.name || '',
        phone: senderDetails.phone || user?.phone || '',
        email: senderDetails.email || user?.email || '',
        city: senderDetails.city || '',
        sameAsRecipientCity: senderDetails.sameAsRecipientCity || false
      }));
    }
  }, [localSenderDetails.sameAsRecipientCity, senderDetails, user]);

  useEffect(() => {
    if (showSenderModal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalSenderDetails({
        name: senderDetails.name || user?.name || '',
        phone: senderDetails.phone || user?.phone || '',
        email: senderDetails.email || user?.email || '',
        city: senderDetails.city || '',
        sameAsRecipientCity: senderDetails.sameAsRecipientCity || false
      });
    }
  }, [showSenderModal, senderDetails, user]);

  // Address Form State
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('deliveryLocation');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.addressId) return parsed.addressId;
        } catch (e) {}
      }
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUpdate = (e) => {
      // Ignore events dispatched by the cart itself to prevent loops
      if (e.detail?.source === 'cart') return;
      
      const stored = localStorage.getItem('deliveryLocation');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.addressId) {
            setSelectedAddressId(parsed.addressId);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('deliveryLocationUpdated', handleUpdate);
    return () => window.removeEventListener('deliveryLocationUpdated', handleUpdate);
  }, []);

  const selectedAddress = useMemo(() => {
    if (addresses.length === 0) return null;
    if (selectedAddressId) return addresses.find(a => a._id === selectedAddressId) || addresses[0];
    return addresses.find(a => a.isDefault) || addresses[0];
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedAddress) {
      setAddressFilled(true);
      // Sync with global header to make cart address the single source of truth
      if (typeof window !== 'undefined' && selectedAddress.pincode) {
        const displayCity = selectedAddress.city || 'Location';
        const fullText = `${selectedAddress.locality ? selectedAddress.locality + ', ' : ''}${displayCity}, ${selectedAddress.pincode}`;
        const newLoc = { name: selectedAddress.name, city: displayCity, full: fullText, pincode: selectedAddress.pincode, addressId: selectedAddress._id };
        localStorage.setItem('deliveryLocation', JSON.stringify(newLoc));
        window.dispatchEvent(new CustomEvent('deliveryLocationUpdated', { detail: { source: 'cart', pincode: selectedAddress.pincode } }));
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddressFilled(false);
    }
  }, [selectedAddress]);

  // Calculate shipping thresholds needed for hooks
  const standardRule = shippingRules.find(r => r.type === 'STANDARD');
  let freeShippingThreshold = null;
  if (standardRule) {
    if (standardRule.freeAbove) {
      freeShippingThreshold = standardRule.freeAbove;
    }
  }

  const prevCartTotalRef = useRef(cartTotal);
  const [celebrationText, setCelebrationText] = useState(null);

  // Confetti Effect for Free Shipping
  useEffect(() => {
    if (freeShippingThreshold !== null) {
      if (cartTotal >= freeShippingThreshold && prevCartTotalRef.current < freeShippingThreshold) {
        if (!hasFiredConfetti) {
          setHasFiredConfetti(true);
          setCelebrationText(' Free Delivery Unlocked! ');
          setTimeout(() => setCelebrationText(null), 1000);

          const loadConfetti = async () => {
            try {
              const confetti = (await import('canvas-confetti')).default;
              const colors = ['#16a34a', '#22c55e', '#bbf7d0', '#111111', '#c59b27'];
              confetti({ particleCount: 100, spread: 80, origin: { x: 0, y: 0.5 }, angle: 60, colors, zIndex: 99999 });
              confetti({ particleCount: 100, spread: 80, origin: { x: 1, y: 0.5 }, angle: 120, colors, zIndex: 99999 });
            } catch (err) { }
          };
          loadConfetti();
        }
      } else if (cartTotal < freeShippingThreshold) {
        setHasFiredConfetti(false);
      }
      prevCartTotalRef.current = cartTotal;
    }
  }, [cartTotal, freeShippingThreshold, hasFiredConfetti]);

  useEffect(() => {
    // Fetch dynamic shipping rules based on selected address
    const pin = selectedAddress?.pincode || '';
    fetch(`/api/store-shipping-options?pincode=${pin}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.options) {
          setShippingRules(data.options);
        }
      })
      .catch(err => console.error(err));
  }, [selectedAddress?.pincode]);


  const [addressForm, setAddressForm] = useState({
    name: '', phone: '', email: '', flat: '', locality: '', pincode: '', city: 'New Delhi', state: 'Delhi', type: 'home'
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (editingAddress) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddressForm({
        name: editingAddress.name || '',
        phone: editingAddress.phone || '',
        email: editingAddress.email || '',
        flat: editingAddress.flat || '',
        locality: editingAddress.locality || '',
        pincode: editingAddress.pincode || '',
        city: editingAddress.city || 'New Delhi',
        state: editingAddress.state || 'Delhi',
        type: editingAddress.type || 'home'
      });
    } else {
      setAddressForm({ name: '', phone: '', email: '', flat: '', locality: '', pincode: '', city: 'New Delhi', state: 'Delhi', type: 'home' });
    }
  }, [editingAddress, showAddressModal]);

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            const newCity = addr.city || addr.town || addr.village || addr.county || '';
            const newState = addr.state || '';
            const newPincode = addr.postcode || '';
            const localityParts = [addr.suburb, addr.neighbourhood, addr.road].filter(Boolean);
            const newLocality = localityParts.join(', ');

            setAddressForm(prev => ({
              ...prev,
              locality: newLocality || prev.locality,
              pincode: newPincode || prev.pincode,
              city: newCity || prev.city,
              state: newState || prev.state
            }));
          }
        } catch (error) {
          setLocationError('Failed to fetch address');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setLocationError('Location permission denied');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveAddress = async () => {
    if (!addressForm.name || !addressForm.phone || !addressForm.flat || !addressForm.locality || !addressForm.pincode) {
      showToast.error("Please fill all required fields");
      return;
    }

    setIsSavingAddress(true);
    try {
      let success = false;
      if (editingAddress?._id) {
        success = await updateAddress(editingAddress._id, addressForm);
      } else {
        success = await addAddress(addressForm);
      }

      if (success) {
        setAddressFilled(true);
        setShowAddressModal(false);
        setEditingAddress(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingAddress(false);
    }
  };

  const confirmRemoveItem = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeletingItem(true);
    try {
      if (itemToDelete) {
        // Check if this item is the main item of any group
        const group = groupedGifts.find(g => g.main && g.main._id === itemToDelete._id);
        
        // If it's the main item, explicitly delete all its addons first
        if (group && group.addons && group.addons.length > 0) {
          for (const addon of group.addons) {
            await removeItem(addon._id);
          }
        }
        
        // Finally, delete the item itself
        await removeItem(itemToDelete._id);
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Delete Address Modal State
  const [showDeleteAddressModal, setShowDeleteAddressModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  const confirmRemoveAddress = (addr) => {
    setAddressToDelete(addr);
    setShowDeleteAddressModal(true);
  };

  const handleConfirmDeleteAddress = async () => {
    setIsDeletingAddress(true);
    try {
      if (addressToDelete) {
        await deleteAddress(addressToDelete._id);
        if (selectedAddressId === addressToDelete._id) {
          setSelectedAddressId(null);
          setAddressFilled(false);
        }
      }
      setShowDeleteAddressModal(false);
      setAddressToDelete(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeletingAddress(false);
    }
  };

  // Addons State
  const [globalAddons, setGlobalAddons] = useState([]);
  const [expandedGiftId, setExpandedGiftId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetch('/api/store-addons')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGlobalAddons(data.addons);
        }
      })
      .catch(console.error);
  }, []);

  const addonCategories = useMemo(() => {
    const cats = new Set(globalAddons.map(a => a.category?.name).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [globalAddons]);

  const filteredAddons = useMemo(() => {
    if (activeCategory === 'All') return globalAddons;
    return globalAddons.filter(a => a.category?.name === activeCategory);
  }, [globalAddons, activeCategory]);

  const handleAddon = (addon, groupId) => {
    addItem({
      _id: addon._id,
      title: addon.name,
      price: addon.price,
      thumbnail: addon.image,
      category: addon.category?.name || 'Addon'
    }, 1, { silent: true, groupId, isAddon: true });
  };

  // Group Items Logic
  const groupedGifts = useMemo(() => {
    const map = new Map();
    items.forEach(item => {
      const gId = item.groupId || item._id; // Fallback to item ID if no groupId
      if (!map.has(gId)) {
        map.set(gId, { groupId: gId, main: null, addons: [] });
      }
      const group = map.get(gId);
      if (item.isAddon) {
        group.addons.push(item);
      } else if (!group.main) {
        group.main = item;
      } else {
        group.addons.push(item); // Fallback if multiple mains exist
      }
    });
    // Promote first addon to main if main is missing (user deleted main product but kept addon)
    return Array.from(map.values()).map(g => {
      if (!g.main && g.addons.length > 0) {
        g.main = { ...g.addons[0], isPromotedAddon: true };
        g.addons = g.addons.slice(1);
      }
      return g;
    }).filter(g => g.main);
  }, [items]);

  const timeSlotFilled = useMemo(() => {
    if (groupedGifts.length === 0) return false;
    return groupedGifts.every(gift => {
      if (gift.main?.deliveryMode === 'courier') return true;
      if (gift.main?.deliveryMode === 'date_only') return !!gift.main?.deliveryDate;
      return !!(gift.main?.deliverySlot && gift.main.deliverySlot.label);
    });
  }, [groupedGifts]);

  if (loading || !isInitialized || isRedirecting) {
    return (
      <div className="fnp-section" style={{ minHeight: '80vh', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ height: '40px', width: '200px', background: '#e0e0e0', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: '160px', width: '100%', background: '#e5e5e5', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: '160px', width: '100%', background: '#e5e5e5', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ height: '300px', width: '100%', background: '#e5e5e5', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ height: '200px', width: '100%', background: '#e5e5e5', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="fnp-section">
        <div className="fnp-empty" style={{ textAlign: 'center', padding: '4rem 1rem', background: '#fcfcfc', borderRadius: '16px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111' }}>Your cart is empty</h3>
          <p style={{ color: '#666', marginBottom: '2rem' }}>Looks like you haven&apos;t added anything yet. Start shopping!</p>
          <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: '#111', color: '#fff', padding: '1rem 2rem', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#000'} onMouseOut={e => e.currentTarget.style.background = '#111'}>
            <ShoppingBag size={18} /> Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const totalMrp = items.reduce((total, item) => total + ((item.mrp || item.price) * item.quantity), 0);
  const mrpDiscount = totalMrp - cartTotal;

  let SHIPPING = 49; // fallback
  if (standardRule) {
    if (standardRule.freeAbove) {
      SHIPPING = cartTotal >= standardRule.freeAbove ? 0 : (standardRule.baseCharge || 0);
    } else {
      SHIPPING = standardRule.baseCharge || 0;
    }
  } else {
    SHIPPING = cartTotal >= 499 ? 0 : 49;
  }

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const totalDeliveryCharge = groupedGifts.reduce((acc, gift) => acc + (gift.main?.deliverySlot?.charge || 0), 0);

  // Waive standard shipping fee if they are paying for a premium timeslot
  if (totalDeliveryCharge > 0) {
    SHIPPING = 0;
  }

  const grandTotal = cartTotal + SHIPPING + totalDeliveryCharge - discountAmount;
  const totalSavings = mrpDiscount + discountAmount;

  const createOrder = async (method = 'cod') => {
    try {
      const token = localStorage.getItem('store_token');
      const mainGift = groupedGifts[0]?.main;
      const slotVal = (mainGift?.deliverySlot && typeof mainGift.deliverySlot === 'object' ? mainGift.deliverySlot.label : mainGift?.deliverySlot) || null;

      const res = await fetch('/api/store-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerName: selectedAddress?.name || user?.name || 'Guest',
          email: user?.email || 'guest@example.com',
          phone: selectedAddress?.phone || '',
          address: `${selectedAddress?.flat || ''}, ${selectedAddress?.locality || ''}`,
          city: selectedAddress?.city || '',
          state: selectedAddress?.state || '',
          country: 'India',
          postalCode: selectedAddress?.pincode || '',
          items: items.map((i) => ({
            id: i.productId, title: i.title, price: i.price, quantity: i.quantity, thumbnail: i.thumbnail,
          })),
          total: grandTotal,
          couponCode: appliedCoupon?.code || null,
          discountAmount: discountAmount || 0,
          paymentMethod: method,
          paymentStatus: method === 'cod' ? 'pending' : 'paid',
          deliverySlot: slotVal,
          deliveryDate: mainGift?.deliveryDate || null,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setIsRedirecting(true);
        clearCart();
        window.location.href = `/checkout/success?orderId=${data.order._id}`;
      } else {
        showToast.error(data.message || 'Failed to place order.');
      }
    } catch (err) {
      console.error(err);
      showToast.error('Error placing order.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleProcessPayment = async () => {
    // Second line of defence — should not normally be reached since button is gated
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/cart')}`);
      return;
    }
    if (paymentMethod === 'cod') {
      setIsProcessingPayment(true);
      await createOrder('cod');
      return;
    }

    if (paymentMethod === 'upi') {
      setShowUpiModal(true);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem('store_token');
      const mainGift = groupedGifts[0]?.main;
      const slotVal = (mainGift?.deliverySlot && typeof mainGift.deliverySlot === 'object' ? mainGift.deliverySlot.label : mainGift?.deliverySlot) || null;

      const res = await fetch('/api/store-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerName: selectedAddress?.name || user?.name || 'Guest',
          email: user?.email || 'guest@example.com',
          phone: selectedAddress?.phone || '',
          address: `${selectedAddress?.flat || ''}, ${selectedAddress?.locality || ''}`,
          city: selectedAddress?.city || '',
          state: selectedAddress?.state || '',
          country: 'India',
          postalCode: selectedAddress?.pincode || '',
          items: items.map((i) => ({
            id: i.productId, title: i.title, price: i.price, quantity: i.quantity, thumbnail: i.thumbnail,
          })),
          total: grandTotal,
          paymentMethod: 'stripe',
          deliverySlot: slotVal,
          deliveryDate: mainGift?.deliveryDate || null,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast.error(data.message || 'Payment setup failed.');
      }
    } catch {
      showToast.error('Network error. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="fnp-cart-page-wrap">

      {/* Stepper Header */}
      <div className="fnp-cart-stepper-bar">
        <div className="fnp-cart-stepper-inner">
          <StepperItem icon={User} label="1. Login" completed={!!user} active={!user} />
          <StepperItem icon={MapPin} label="2. Address" completed={addressFilled} active={!addressFilled && checkoutStep === 'cart'} />
          <StepperItem icon={Clock} label="3. Time Slot" completed={timeSlotFilled} active={addressFilled && !timeSlotFilled && checkoutStep === 'cart'} />
          <StepperItem icon={CreditCard} label="4. Payment" completed={false} active={checkoutStep === 'payment'} isLast={true} />
        </div>
      </div>

      <div className="fnp-cart-container">
        <h1 className="fnp-cart-page-title">
          Shopping Cart <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>• {itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
        </h1>

        <div className="fnp-cart-grid">

          {/* Left Main Column */}
          <div className="fnp-cart-main-col">
            {checkoutStep === 'cart' ? (
              <>
                {/* Global Delivery Address Banner */}
                <div className="fnp-cart-card">
                  <div className="fnp-cart-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                      <div className="fnp-cart-banner-icon">
                        <MapPin size={22} color="currentColor" />
                      </div>
                      <div className="fnp-cart-banner-content">
                        <h3 className="fnp-cart-banner-title">
                          {addressFilled && selectedAddress ? (
                            <>Deliver to: <span className="fnp-cart-banner-highlight">{selectedAddress.name}</span></>
                          ) : (
                            'Where should we deliver?'
                          )}
                        </h3>
                        <p className="fnp-cart-banner-sub">
                          {addressFilled && selectedAddress
                            ? `${selectedAddress.flat}, ${selectedAddress.locality}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`
                            : 'Please add your delivery address to choose preferred time slots.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          router.push(`/login?redirect=${encodeURIComponent('/cart')}`);
                          return;
                        }
                        setEditingAddress(null);
                        addressFilled ? setShowSelectAddressModal(true) : setShowAddressModal(true);
                      }}
                      className={`fnp-cart-banner-btn ${addressFilled ? 'outline' : 'primary'}`}
                    >
                      {addressFilled ? 'Change' : 'Add Address'}
                    </button>
                  </div>
                </div>

                {/* Free Shipping Progress Banner */}
                {freeShippingThreshold && (
                  <div ref={bannerRef} className="fnp-cart-card fnp-cart-free-shipping">
                    <div className="fnp-cart-free-shipping-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {cartTotal >= freeShippingThreshold ? <CheckCircle2 size={18} color="currentColor" /> : <Truck size={18} color="currentColor" />}
                        {cartTotal >= freeShippingThreshold
                          ? '🎉 Free Delivery Unlocked!'
                          : `Add ₹${(freeShippingThreshold - cartTotal).toLocaleString('en-IN')} more for Free Delivery`}
                      </div>
                      <span className="fnp-cart-free-shipping-sub">
                        {cartTotal >= freeShippingThreshold ? '₹0 Shipping' : `Target: ₹${freeShippingThreshold.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    <div className="fnp-cart-free-shipping-track">
                      <div
                        className="fnp-cart-free-shipping-fill"
                        style={{
                          width: `${Math.min(100, (cartTotal / freeShippingThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Gifts Loop */}
                {groupedGifts.map((gift, idx) => (
                  <div key={idx} className="fnp-cart-card">
                    {gift.main?.deliveryMode === 'courier' ? (
                      <div className="fnp-cart-gift-head">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="fnp-cart-gift-icon-box">
                            <Truck size={15} color="currentColor" />
                          </div>
                          <div>
                            <span className="fnp-cart-gift-mode-title">Standard Courier Delivery</span>
                            <span className="fnp-cart-gift-mode-sub">Delivered in {gift.main?.courierDays || '2-3'} Business Days</span>
                          </div>
                        </div>
                        {(gift.main?.allowExpressUpgrade || gift.main?.isPromotedAddon) && (
                          <button
                            type="button"
                            onClick={() => handleOpenSlotModal(gift)}
                            className="fnp-cart-faster-btn"
                          >
                            <Truck size={14} /> Need it faster?
                          </button>
                        )}
                      </div>
                    ) : gift.main?.deliveryDate ? (
                      <div className="fnp-cart-gift-head">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="fnp-cart-gift-icon-box">
                            <Clock size={15} color="currentColor" />
                          </div>
                          <div>
                            <span className="fnp-cart-gift-mode-title">
                              Delivery on {new Date(gift.main.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                            {gift.main?.deliveryMode === 'date_only' ? (
                              <span className="fnp-cart-gift-slot-sub">Standard Date Delivery</span>
                            ) : gift.main?.deliverySlot && gift.main.deliverySlot.type && gift.main.deliverySlot.label ? (
                              <span className="fnp-cart-gift-slot-sub">{gift.main.deliverySlot.type} ({gift.main.deliverySlot.label})</span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>Time slot pending</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenSlotModal(gift)}
                          className="fnp-cart-slot-change-btn"
                        >
                          Change Slot
                        </button>
                      </div>
                    ) : (
                      <div className="fnp-cart-gift-head fnp-cart-gift-head-alert">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="fnp-cart-gift-icon-box-alert">
                            <Clock size={15} color="#ef4444" />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#b91c1c', display: 'block' }}>Delivery Slot Needed</span>
                            <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 500 }}>Please select delivery date &amp; preferred time</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenSlotModal(gift)}
                          style={{ padding: '0.45rem 0.95rem', background: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(220,38,38,0.25)' }}
                        >
                          Select Slot
                        </button>
                      </div>
                    )}

                    <div style={{ padding: '0' }}>
                      <div style={{ padding: '0.85rem 1.4rem 0.4rem', display: 'flex', alignItems: 'center' }}>
                        <div className="fnp-cart-gift-badge">Gift #{idx + 1}</div>
                      </div>

                      <div>
                        {gift.main && <CartItemRow item={gift.main} updateQuantity={updateQuantity} removeItem={confirmRemoveItem} />}
                      </div>

                      {gift.addons.length > 0 && (
                        <div className="fnp-cart-gift-addons-wrap">
                          {gift.addons.map(addon => (
                            <div key={addon._id} style={{ paddingLeft: '1.5rem' }}>
                              <CartItemRow item={addon} updateQuantity={updateQuantity} removeItem={confirmRemoveItem} isAddon={true} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Make It Extra Special Strip inside Gift */}
                    <div
                      onClick={() => setExpandedGiftId(expandedGiftId === gift.groupId ? null : gift.groupId)}
                      className="fnp-cart-extra-special-head"
                    >
                      <span className="fnp-cart-extra-special-title">
                        <Sparkles size={17} color="currentColor" /> Make It Extra Special!
                      </span>
                      <ChevronDown size={17} color="currentColor" style={{ transform: expandedGiftId === gift.groupId ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                    </div>

                    {expandedGiftId === gift.groupId && (
                      <div className="fnp-cart-extra-special-body">
                        {/* Categories */}
                        <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', padding: '0.85rem 0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                          {addonCategories.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setActiveCategory(cat)}
                              className={`fnp-cart-addon-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Addons List */}
                        <div style={{ position: 'relative' }}>
                          {filteredAddons.length > 2 && (
                            <button
                              type="button"
                              onClick={() => { const el = document.getElementById(`carousel-${gift.groupId}`); if (el) el.scrollBy({ left: -200, behavior: 'smooth' }); }}
                              className="fnp-cart-addon-nav-btn left"
                            >
                              <ChevronLeft size={16} color="currentColor" />
                            </button>
                          )}
                          <div id={`carousel-${gift.groupId}`} style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none', width: '100%', scrollBehavior: 'smooth' }}>
                            {filteredAddons.map(addon => {
                              const addedItem = gift.addons.find(a => a.productId === addon._id || a.productId?._id === addon._id || a.productId?.toString() === addon._id?.toString());
                              const qty = addedItem ? addedItem.quantity : 0;

                              return (
                                <div key={addon._id} className="fnp-cart-addon-item">
                                  <div className="fnp-cart-addon-img-wrap">
                                    {addon.image ? <img src={getImageUrl(addon.image)} alt={addon.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                                  </div>
                                  <h5 className="fnp-cart-addon-name">{addon.name}</h5>
                                  <div className="fnp-cart-addon-price">₹{addon.price}</div>

                                  {qty > 0 ? (
                                    <div className="fnp-cart-addon-stepper">
                                      <button type="button" onClick={() => updateQuantity(addedItem._id, qty - 1)} className="fnp-cart-addon-stepper-btn"><Minus size={10} color="currentColor" /></button>
                                      <span className="fnp-cart-addon-stepper-qty">{qty}</span>
                                      <button type="button" onClick={() => updateQuantity(addedItem._id, qty + 1)} className="fnp-cart-addon-stepper-btn"><Plus size={10} color="currentColor" /></button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAddon(addon, gift.groupId)}
                                      className="fnp-cart-addon-add-btn"
                                      aria-label={`Add ${addon.name}`}
                                    >
                                      <Plus size={13} strokeWidth={3} color="currentColor" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                            {filteredAddons.length === 0 && <div style={{ fontSize: '0.82rem', color: '#64748b', padding: '1rem 0' }}>No add-ons found.</div>}
                          </div>
                          {filteredAddons.length > 2 && (
                            <button
                              type="button"
                              onClick={() => { const el = document.getElementById(`carousel-${gift.groupId}`); if (el) el.scrollBy({ left: 200, behavior: 'smooth' }); }}
                              className="fnp-cart-addon-nav-btn right"
                            >
                              <ChevronRight size={16} color="currentColor" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Sender Details Banner */}
                <div className="fnp-cart-card">
                  <div className="fnp-cart-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                      <div className="fnp-cart-banner-icon">
                        <User size={22} color="currentColor" />
                      </div>
                      <div className="fnp-cart-banner-content">
                        <h3 className="fnp-cart-banner-title">
                          {senderDetails.name ? (
                            <>Sender: <span className="fnp-cart-banner-highlight">{senderDetails.name}</span></>
                          ) : (
                            'Sender’s Information'
                          )}
                        </h3>
                        <p className="fnp-cart-banner-sub">
                          {senderDetails.email
                            ? `${senderDetails.email} ${senderDetails.phone ? `• ${senderDetails.phone}` : ''}`
                            : 'Order tracking and updates will be delivered to these contact details.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSenderModal(true)}
                      className={`fnp-cart-banner-btn ${senderDetails.name ? 'outline' : 'primary'}`}
                    >
                      {senderDetails.name ? 'Edit' : 'Add Details'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Payment Method Selection Card */}
                <div className="fnp-cart-card fnp-cart-payment-card">
                  <div className="fnp-payment-header-row">
                    <h3 className="fnp-payment-header-title">
                      <CreditCard size={20} color="currentColor" /> Choose Payment Method
                    </h3>
                    <span className="fnp-payment-header-badge">
                      🔒 100% Secure Checkout
                    </span>
                  </div>

                  <div className="fnp-payment-methods-box">
                    {/* Stripe / Cards */}
                    <label className={`fnp-payment-method-card ${paymentMethod === 'stripe' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={() => setPaymentMethod('stripe')}
                        className="fnp-payment-method-radio"
                      />
                      <div className="fnp-payment-method-text">
                        <span className="fnp-payment-method-name">Credit / Debit Card</span>
                        <span className="fnp-payment-method-sub">Visa, MasterCard, Amex, RuPay, Maestro</span>
                      </div>
                      <CreditCard size={24} className="fnp-payment-method-icon" />
                    </label>

                    {/* UPI */}
                    <label className={`fnp-payment-method-card ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="fnp-payment-method-radio"
                      />
                      <div className="fnp-payment-method-text">
                        <span className="fnp-payment-method-name">Instant UPI Payment</span>
                        <span className="fnp-payment-method-sub">Google Pay, PhonePe, Paytm, QR Code scan</span>
                      </div>
                      <span className={`fnp-payment-upi-pill ${paymentMethod === 'upi' ? 'active' : ''}`}>
                        UPI
                      </span>
                    </label>

                    {/* COD */}
                    <label className={`fnp-payment-method-card ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="fnp-payment-method-radio"
                      />
                      <div className="fnp-payment-method-text">
                        <span className="fnp-payment-method-name">Cash on Delivery</span>
                        <span className="fnp-payment-method-sub">Pay safely in cash when your gift arrives</span>
                      </div>
                      <Wallet size={24} className="fnp-payment-method-icon" />
                    </label>
                  </div>

                  <div className="fnp-payment-trust-badge">
                    <ShieldCheck size={18} />
                    <span>Encrypted with 256-bit SSL security · Instant refund guarantee</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="fnp-cart-back-btn"
                >
                  <ChevronLeft size={16} color="currentColor" /> Back to Cart Items
                </button>
              </>
            )}
          </div>

          {/* Right Sticky Column */}
          <div className="fnp-cart-side-col">

            {/* Message Card */}
            <div
              onClick={() => setShowMessageModal(true)}
              className="fnp-cart-card fnp-cart-side-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', overflow: 'hidden' }}>
                <div className="fnp-cart-side-icon-box">
                  <Tag size={17} color="currentColor" />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h4 className="fnp-cart-side-title">
                    {messageCard.message ? 'Message Saved' : 'Add Greeting Message Card'}
                    {!messageCard.message && <span className="fnp-cart-side-free-tag">FREE</span>}
                  </h4>
                  <p className="fnp-cart-side-sub">
                    {messageCard.message ? `"${messageCard.message}"` : 'Add your warm personal wishes'}
                  </p>
                </div>
              </div>
              {messageCard.message ? <CheckCircle2 size={18} className="fnp-cart-side-saved-icon" /> : <ChevronDown size={16} color="currentColor" style={{ transform: 'rotate(-90deg)' }} />}
            </div>

            {/* Coupon Module */}
            <div className="fnp-cart-card fnp-cart-coupon-box">
              {/* Top row — clickable header */}
              <div
                onClick={() => !appliedCoupon && setShowCouponModal(true)}
                className="fnp-cart-coupon-header"
                style={{ cursor: appliedCoupon ? 'default' : 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div className="fnp-cart-side-icon-box">
                    <Percent size={17} color="currentColor" />
                  </div>
                  <div>
                    <h4 className="fnp-cart-side-title">
                      {appliedCoupon ? `Applied: ${appliedCoupon.code}` : 'Apply Coupon Code'}
                    </h4>
                    {appliedCoupon
                      ? <p className="fnp-cart-coupon-saved-sub">Saved ₹{appliedCoupon.discountAmount}</p>
                      : availableCoupons.length > 0 && <p className="fnp-cart-side-sub">{availableCoupons.length} coupon{availableCoupons.length > 1 ? 's' : ''} available</p>
                    }
                  </div>
                </div>
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="fnp-cart-coupon-remove-btn"
                  >
                    Remove
                  </button>
                ) : (
                  <ChevronDown size={16} color="currentColor" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} />
                )}
              </div>

              {/* Quick-apply chips */}
              {!appliedCoupon && availableCoupons.length > 0 && (
                <div className="fnp-cart-coupon-quick-apply">
                  <div className="fnp-cart-quick-apply-title">Quick Apply</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {availableCoupons.slice(0, 4).map((coupon) => {
                      const savingsLabel = coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}% OFF`
                        : `Save ₹${coupon.discountValue}`;
                      return (
                        <button
                          key={coupon._id || coupon.code}
                          type="button"
                          className="fnp-coupon-chip"
                          onClick={() => handleApplyCoupon(coupon.code)}
                          title={coupon.description || ''}
                        >
                          {coupon.code}
                          <span className="fnp-coupon-chip-savings">{savingsLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Card */}
            <div className="fnp-cart-card fnp-cart-summary-card">
              {/* Header */}
              <div onClick={() => setShowOrderSummary(!showOrderSummary)} className="fnp-summary-header">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div className="fnp-summary-icon-box">
                    <Receipt size={18} color="currentColor" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <h3 className="fnp-summary-title">Total: ₹{grandTotal.toLocaleString('en-IN')}</h3>
                      {totalSavings > 0 && <span className="fnp-summary-mrp-crossed">₹{(totalMrp + SHIPPING).toLocaleString('en-IN')}</span>}
                    </div>
                    <p className="fnp-summary-tax-sub">Incl. of all taxes</p>
                  </div>
                </div>
                <div style={{ padding: '0.2rem', transition: 'transform 0.3s', transform: showOrderSummary ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDown size={18} color="currentColor" />
                </div>
              </div>

              {/* Accordion Body */}
              {showOrderSummary && (
                <div className="fnp-summary-breakdown-body">
                  <div className="fnp-summary-row">
                    <span>Total MRP</span>
                    <span className="fnp-summary-row-val">₹{totalMrp.toLocaleString('en-IN')}</span>
                  </div>
                  {mrpDiscount > 0 && (
                    <div className="fnp-summary-row discount">
                      <span>Discount on MRP</span>
                      <span className="fnp-summary-row-val discount">- ₹{mrpDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="fnp-summary-row discount">
                      <span>Coupon Savings ({appliedCoupon.code})</span>
                      <span className="fnp-summary-row-val discount">- ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="fnp-summary-row">
                    <span>Delivery Charge</span>
                    <span className="fnp-summary-row-val">{SHIPPING === 0 ? 'FREE' : `₹${SHIPPING}`}</span>
                  </div>
                  {totalDeliveryCharge > 0 && (
                    <div className="fnp-summary-row">
                      <span>Time Slot Charge</span>
                      <span className="fnp-summary-row-val">₹{totalDeliveryCharge.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Savings Banner */}
              {totalSavings > 0 && (
                <div className="fnp-summary-savings-banner">
                  <Tag size={14} color="currentColor" /> You saved ₹{totalSavings.toLocaleString('en-IN')} on this order!
                </div>
              )}

              {/* Checkout CTA */}
              <div className="fnp-summary-checkout-wrap">
                {items.some(item => item.isUnavailable) && (
                  <div className="fnp-cart-unavailable-warning">
                    <X size={16} /> Remove unavailable items to checkout
                  </div>
                )}

                {checkoutStep === 'cart' ? (
                  <button
                    type="button"
                    disabled={items.some(item => item.isUnavailable)}
                    onClick={() => {
                      if (!user) {
                        router.push(`/login?redirect=${encodeURIComponent('/cart')}`);
                        return;
                      }
                      if (!addressFilled) {
                        setShowAddressModal(true);
                      } else if (!timeSlotFilled) {
                        const giftWithoutSlot = groupedGifts.find(g => {
                          if (g.main?.deliveryMode === 'courier') return false;
                          if (g.main?.deliveryMode === 'date_only') return !g.main?.deliveryDate;
                          return !(g.main?.deliverySlot && g.main.deliverySlot.label);
                        });
                        if (giftWithoutSlot) {
                          setActiveGiftIdForSlot(giftWithoutSlot.groupId);
                          setShowSlotModal(true);
                        }
                      } else {
                        setCheckoutStep('payment');
                      }
                    }}
                    className="fnp-summary-cta-btn"
                  >
                    {!addressFilled && !items.some(item => item.isUnavailable) && 'Add Delivery Address'}
                    {addressFilled && !timeSlotFilled && !items.some(item => item.isUnavailable) && 'Choose Delivery Slot'}
                    {addressFilled && timeSlotFilled && !items.some(item => item.isUnavailable) && 'Proceed to Payment →'}
                    {items.some(item => item.isUnavailable) && 'Checkout Disabled'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    disabled={isProcessingPayment}
                    className="fnp-summary-cta-btn pay"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 size={18} className="spin-animate" /> Processing Payment…
                      </>
                    ) : (
                      <>
                        Pay ₹{grandTotal.toLocaleString('en-IN')} Securely →
                      </>
                    )}
</button>
                )}
                <p className="fnp-summary-terms-sub">
                  By continuing you agree to our<br /><a href="#" className="fnp-summary-terms-link">Terms & Conditions</a>, <a href="#" className="fnp-summary-terms-link">Privacy Policy</a>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-cart-modal-overlay">
          <div className="fnp-cart-modal-box">
            <button onClick={() => setShowAddressModal(false)} className="fnp-cart-modal-close-btn"><X size={18} color="currentColor" /></button>
            <div className="fnp-cart-modal-header">
              <h2 className="fnp-cart-modal-title">{editingAddress ? 'Edit Delivery Address' : 'Add Delivery Address'}</h2>
            </div>

            <div className="fnp-cart-modal-body">
              <div className="fnp-cart-myself-row">
                <input type="checkbox" style={{ accentColor: '#111', width: '16px', height: '16px', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Ordering for Myself</span>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #888', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, cursor: 'help' }}>i</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <input type="text" placeholder="Recipient name*" value={addressForm.name} onChange={e => setAddressForm(p => ({ ...p, name: e.target.value }))} className="fnp-cart-modal-input" />

                <div className="fnp-cart-phone-input-group">
                  <div className="fnp-cart-phone-prefix">+91</div>
                  <input type="text" placeholder="Mobile number*" value={addressForm.phone} onChange={e => setAddressForm(p => ({ ...p, phone: e.target.value }))} className="fnp-cart-modal-input fnp-cart-phone-input" />
                </div>

                <input type="email" placeholder="Email id (optional)" value={addressForm.email} onChange={e => setAddressForm(p => ({ ...p, email: e.target.value }))} className="fnp-cart-modal-input" />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <h4 className="fnp-cart-modal-section-title">Delivery Location</h4>
                  <button onClick={handleAutoDetectLocation} disabled={detectingLocation} className="fnp-cart-auto-detect-btn">
                    {detectingLocation ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                    {detectingLocation ? 'Detecting...' : 'Auto-detect'}
                  </button>
                </div>
                {locationError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '-0.75rem' }}>{locationError}</div>}

                <input type="text" placeholder="Flat/House no, Floor, Tower, Block, Plot*" value={addressForm.flat} onChange={e => setAddressForm(p => ({ ...p, flat: e.target.value }))} className="fnp-cart-modal-input" />

                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="Apartment, Street, Locality*" value={addressForm.locality} onChange={e => setAddressForm(p => ({ ...p, locality: e.target.value }))} className="fnp-cart-modal-input" style={{ paddingRight: '2.5rem' }} />
                  <MapPin size={18} color="#888" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>

                <div className="fnp-cart-pincode-group">
                  <span className="fnp-cart-pincode-label">Pincode*</span>
                  <input type="text" placeholder="110094" value={addressForm.pincode} onChange={e => setAddressForm(p => ({ ...p, pincode: e.target.value }))} className="fnp-cart-pincode-input" />
                  <span className="fnp-cart-pincode-city">{addressForm.city}{addressForm.state ? `, ${addressForm.state}` : ''}</span>
                </div>

                <div>
                  <h4 className="fnp-cart-modal-section-title" style={{ marginBottom: '0.75rem' }}>Type Of Address</h4>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    {['Home', 'Office', 'Other'].map(type => (
                      <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="addressType" checked={addressForm.type === type.toLowerCase()} onChange={() => setAddressForm(p => ({ ...p, type: type.toLowerCase() }))} style={{ accentColor: '#111', width: '18px', height: '18px', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: addressForm.type === type.toLowerCase() ? 600 : 400 }}>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleSaveAddress} disabled={isSavingAddress} className="fnp-cart-modal-btn-primary">
                {isSavingAddress ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : (editingAddress ? 'Update Address' : 'Save Address')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mock Time Slot Modal */}
      {showTimeModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-cart-modal-overlay">
          <div className="fnp-cart-modal-box">
            <button onClick={() => setShowTimeModal(false)} className="fnp-cart-modal-close-btn"><X size={18} color="currentColor" /></button>
            <div className="fnp-cart-modal-header">
              <h2 className="fnp-cart-modal-title">Choose Time-slot</h2>
            </div>
            <div className="fnp-cart-modal-body">
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: '#64748b' }}>Select your preferred delivery window</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {['Morning (09:00 AM - 01:00 PM)', 'Afternoon (01:00 PM - 05:00 PM)', 'Evening (05:00 PM - 09:00 PM)'].map((slot, i) => (
                  <label key={i} className="fnp-cart-modal-subcard" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <input type="radio" name="timeslot" style={{ accentColor: '#111', width: '18px', height: '18px' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{slot}</span>
                  </label>
                ))}
              </div>
              <button onClick={() => { setTimeSlotFilled(true); setShowTimeModal(false); }} className="fnp-cart-modal-btn-primary">
                Confirm Time Slot
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-cart-modal-overlay">
          <div className="fnp-cart-modal-box" style={{ maxWidth: '400px' }}>
            <button onClick={() => setShowDeleteModal(false)} className="fnp-cart-modal-close-btn"><X size={18} color="currentColor" /></button>
            <div className="fnp-cart-modal-header">
              <h2 className="fnp-cart-modal-title">Remove Gift?</h2>
            </div>

            <div className="fnp-cart-modal-body">
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Are you sure you want to remove this gift?</p>

              {itemToDelete && (
                <div className="fnp-cart-modal-subcard" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', background: '#f5f5f5', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                    {itemToDelete.thumbnail ? (
                      <img src={getImageUrl(itemToDelete.thumbnail)} alt={itemToDelete.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎁</div>
                    )}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4 }}>{itemToDelete.title}</h4>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>₹{itemToDelete.price?.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleConfirmDelete} disabled={isDeletingItem} className="fnp-cart-modal-btn-outline" style={{ flex: 1 }}>
                  {isDeletingItem ? <><Loader2 size={16} className="animate-spin" /> Removing...</> : 'Yes, Remove'}
                </button>
                <button onClick={() => setShowDeleteModal(false)} className="fnp-cart-modal-btn-primary" style={{ flex: 1 }}>No</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Coupon Modal */}
      {showCouponModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-cart-modal-overlay">
          <div className="fnp-cart-modal-box">
            <button onClick={() => setShowCouponModal(false)} className="fnp-cart-modal-close-btn"><X size={20} color="currentColor" /></button>
            <div className="fnp-cart-modal-header">
              <h2 className="fnp-cart-modal-title">Apply Coupon</h2>
            </div>

            <div className="fnp-cart-modal-body">

              {/* Input Box */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter Coupon Code"
                  className="fnp-cart-modal-input"
                  style={{ textTransform: 'uppercase' }}
                />
                <button
                  onClick={() => handleApplyCoupon(couponInput)}
                  disabled={!couponInput || isApplyingCoupon}
                  className="fnp-cart-modal-btn-primary"
                  style={{ width: 'auto', padding: '0 1.5rem', whiteSpace: 'nowrap' }}
                >
                  {isApplyingCoupon ? <Loader2 size={18} className="animate-spin" /> : 'APPLY'}
                </button>
              </div>

              {couponError && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 500 }}>{couponError}</div>}

              {/* Available Coupons */}
              <div>
                <h4 className="fnp-cart-modal-section-title" style={{ marginBottom: '1rem' }}>Available Offers</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {availableCoupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.9rem' }}>No offers available at the moment.</div>
                  ) : (
                    availableCoupons.map(coupon => {
                      const meetsMin = cartTotal >= coupon.minOrderValue;
                      return (
                        <div key={coupon._id} className="fnp-cart-modal-subcard" style={{ position: 'relative', opacity: meetsMin ? 1 : 0.6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div className="fnp-coupon-chip">
                              {coupon.code}
                            </div>
                            {meetsMin ? (
                              <button onClick={() => handleApplyCoupon(coupon.code)} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                                APPLY
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Add ₹{coupon.minOrderValue - cartTotal} more</span>
                            )}
                          </div>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>{coupon.description}</p>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>Valid on orders above ₹{coupon.minOrderValue}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Message Card Modal */}
      {showMessageModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-cart-modal-overlay">
          <div className="fnp-cart-modal-box" style={{ maxWidth: '480px' }}>
            <button onClick={() => setShowMessageModal(false)} className="fnp-cart-modal-close-btn"><X size={18} color="currentColor" /></button>
            <div className="fnp-cart-modal-header">
              <h2 className="fnp-cart-modal-title">Message on Card</h2>
            </div>

            <div className="fnp-cart-modal-body" style={{ padding: '1rem 1.25rem' }}>
              <div className="fnp-cart-modal-subcard" style={{ padding: '0', position: 'relative', overflow: 'hidden' }}>
                <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700 }}>Dear {selectedAddress?.name || 'Loved One'},</h4>

                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowPrebuiltDropdown(!showPrebuiltDropdown)} className="fnp-cart-modal-btn-outline" style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 700, width: 'auto' }}>
                      Choose Message <ChevronDown size={13} />
                    </button>
                    {showPrebuiltDropdown && (
                      <div className="fnp-cart-modal-box" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '280px', maxHeight: '220px', overflowY: 'auto', zIndex: 20, padding: 0, boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}>
                        <div style={{ padding: '0.65rem 0.95rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8' }}>Select a Template</div>
                        {prebuiltMessages.map(pm => (
                          <div key={pm._id} onClick={() => { setLocalMessageCard(p => ({ ...p, message: pm.message })); setShowPrebuiltDropdown(false); }} style={{ padding: '0.75rem 0.95rem', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: '0.25rem' }}>{pm.title}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>&quot;{pm.message}&quot;</div>
                          </div>
                        ))}
                        {prebuiltMessages.length === 0 && <div style={{ padding: '1.25rem 1rem', fontSize: '0.82rem', color: '#64748b', textAlign: 'center' }}>No templates found</div>}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <textarea
                    value={localMessageCard.message}
                    onChange={e => setLocalMessageCard(p => ({ ...p, message: e.target.value.slice(0, 250) }))}
                    placeholder="Write a heartfelt message..."
                    rows="3"
                    className="fnp-cart-modal-input"
                    style={{ background: 'transparent', border: 'none', resize: 'none', lineHeight: 1.6, padding: '0.85rem 1.15rem', minHeight: '80px' }}
                  ></textarea>

                  <div style={{ padding: '0 1.15rem 0.65rem', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'right', fontWeight: 600 }}>
                    {localMessageCard.message.length} / 250
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>From:</span>
                  <input
                    type="text"
                    value={localMessageCard.senderName}
                    onChange={e => setLocalMessageCard(p => ({ ...p, senderName: e.target.value }))}
                    placeholder="Your Name"
                    className="fnp-cart-modal-input"
                    style={{ border: 'none', background: 'transparent', fontWeight: 700, padding: '0.2rem 0.5rem' }}
                  />
                </div>
              </div>

              <div className="fnp-cart-modal-subcard" style={{ marginTop: '0.75rem', padding: '0.75rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="checkbox"
                  id="hideName"
                  checked={localMessageCard.hideName}
                  onChange={e => setLocalMessageCard(p => ({ ...p, hideName: e.target.checked }))}
                  style={{ accentColor: '#111', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="hideName" style={{ fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none' }}>
                  Don&apos;t Show My Name On The Card
                </label>
              </div>
            </div>

            <div className="fnp-cart-modal-footer" style={{ padding: '1rem 1.25rem' }}>
              <button onClick={() => { setMessageCard(localMessageCard); setShowMessageModal(false); }} className="fnp-cart-modal-btn-primary">
                Save & Continue
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Address Confirmation Modal */}
      {showDeleteAddressModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-cart-modal-overlay">
          <div className="fnp-cart-modal-box" style={{ maxWidth: '400px' }}>
            <button onClick={() => setShowDeleteAddressModal(false)} className="fnp-cart-modal-close-btn"><X size={18} color="currentColor" /></button>
            <div className="fnp-cart-modal-header">
              <h2 className="fnp-cart-modal-title">Delete Address?</h2>
            </div>

            <div className="fnp-cart-modal-body">
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 600 }}>Are you sure you want to permanently delete this address?</p>

              {addressToDelete && (
                <div className="fnp-cart-modal-subcard" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{addressToDelete.name}</h4>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'lowercase' }}>{addressToDelete.type || 'home'}</span>
                  </div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                    {addressToDelete.flat}, {addressToDelete.locality}, {addressToDelete.city}, {addressToDelete.state} - {addressToDelete.pincode}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleConfirmDeleteAddress} disabled={isDeletingAddress} className="fnp-cart-modal-btn-danger" style={{ flex: 1 }}>
                  {isDeletingAddress ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : 'Yes, Delete'}
                </button>
                <button onClick={() => setShowDeleteAddressModal(false)} className="fnp-cart-modal-btn-primary" style={{ flex: 1 }}>No, Keep It</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Select Delivery Address Modal */}
      {showSelectAddressModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-cart-modal-overlay">
          <div className="fnp-cart-modal-box">
            <button onClick={() => setShowSelectAddressModal(false)} className="fnp-cart-modal-close-btn"><X size={18} color="currentColor" /></button>
            <div className="fnp-cart-modal-header">
              <h2 className="fnp-cart-modal-title">Select delivery address</h2>
            </div>

            <div className="fnp-cart-modal-body">
              <button
                onClick={() => { setEditingAddress(null); setShowSelectAddressModal(false); setShowAddressModal(true); }}
                className="fnp-cart-modal-btn-outline"
                style={{ marginBottom: '1.5rem' }}
              >
                <Plus size={18} color="currentColor" /> Add New Address
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {addresses.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.95rem' }}>No saved addresses found.</div>
                )}
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId ? selectedAddressId === addr._id : addr.isDefault;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => { setSelectedAddressId(addr._id); setAddressFilled(true); }}
                      className={`fnp-payment-method-card ${isSelected ? 'selected' : ''}`}
                      style={{ padding: '1.25rem', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%' }}>
                        <input type="radio" name="selectAddress" checked={isSelected} readOnly style={{ accentColor: '#111', width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{addr.name}</h4>
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'lowercase' }}>{addr.type || 'home'}</span>
                          </div>
                          <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                            {addr.flat}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Mobile: {addr.phone}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            setEditingAddress(addr);
                            setShowSelectAddressModal(false);
                            setShowAddressModal(true);
                          }} className="fnp-cart-slot-change-btn" style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} title="Edit">
                            <Pencil size={14} color="currentColor" />
                          </button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            confirmRemoveAddress(addr);
                          }} className="fnp-cart-modal-btn-danger" style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} title="Delete">
                            <Trash2 size={14} color="#e53e3e" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="fnp-cart-modal-footer">
              <button onClick={() => { if (addresses.length > 0) setAddressFilled(true); setShowSelectAddressModal(false); }} disabled={addresses.length === 0} className="fnp-cart-modal-btn-primary">
                Confirm Selection
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Sender Details Modal */}
      {showSenderModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-cart-modal-overlay">
          <div className="fnp-cart-modal-box" style={{ maxWidth: '500px' }}>
            <button onClick={() => setShowSenderModal(false)} className="fnp-cart-modal-close-btn"><X size={18} color="currentColor" /></button>
            <div className="fnp-cart-modal-header">
              <h2 className="fnp-cart-modal-title">Edit Sender&apos;s Details</h2>
            </div>

            <div className="fnp-cart-modal-body">
              <p style={{ margin: '0 0 1.5rem', fontSize: '0.95rem', color: '#64748b', lineHeight: 1.5 }}>Order related communication will also be sent to the sender.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ position: 'relative' }}>
                  <label className="fnp-cart-pincode-label">Sender&apos;s Name*</label>
                  <input
                    type="text"
                    value={localSenderDetails.name}
                    onChange={e => setLocalSenderDetails({ ...localSenderDetails, name: e.target.value })}
                    className="fnp-cart-modal-input"
                  />
                </div>

                <div className="fnp-cart-phone-input-group">
                  <div className="fnp-cart-phone-prefix">
                    <span>🇮🇳 +91</span>
                  </div>
                  <input
                    type="tel"
                    value={localSenderDetails.phone}
                    onChange={e => setLocalSenderDetails({ ...localSenderDetails, phone: e.target.value })}
                    placeholder="Sender's Mobile Number*"
                    className="fnp-cart-modal-input fnp-cart-phone-input"
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <label className="fnp-cart-pincode-label">Email*</label>
                  <input
                    type="email"
                    value={localSenderDetails.email}
                    onChange={e => setLocalSenderDetails({ ...localSenderDetails, email: e.target.value })}
                    className="fnp-cart-modal-input"
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <label className="fnp-cart-pincode-label">City*</label>
                  <input
                    type="text"
                    value={localSenderDetails.city}
                    onChange={e => setLocalSenderDetails({ ...localSenderDetails, city: e.target.value, sameAsRecipientCity: false })}
                    className="fnp-cart-modal-input"
                    readOnly={localSenderDetails.sameAsRecipientCity}
                  />
                </div>

                <label className="fnp-cart-modal-subcard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={localSenderDetails.sameAsRecipientCity}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setLocalSenderDetails(prev => ({
                        ...prev,
                        sameAsRecipientCity: checked,
                        city: checked ? (selectedAddress?.city || prev.city) : prev.city
                      }));
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#111' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Same as recipient&apos;s city</span>
                </label>
              </div>
            </div>

            <div className="fnp-cart-modal-footer">
              <button
                onClick={() => {
                  setSenderDetails({ name: '', phone: '', email: '', city: '', sameAsRecipientCity: false });
                  setShowSenderModal(false);
                }}
                className="fnp-cart-modal-btn-outline"
                style={{ width: '30%', color: '#e53e3e', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setSenderDetails(localSenderDetails);
                  setShowSenderModal(false);
                }}
                disabled={!localSenderDetails.name || !localSenderDetails.phone || !localSenderDetails.email || !localSenderDetails.city}
                className="fnp-cart-modal-btn-primary"
                style={{ flex: 1 }}
              >
                Save
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Time Slot Modal */}
      {showSlotModal && typeof document !== 'undefined' && (() => {
        const activeGift = groupedGifts.find(g => g.groupId === activeGiftIdForSlot)?.main;
        const isDateOnly = activeGift?.deliveryMode === 'date_only' || (activeGift?.deliveryMode === 'courier' && activeGift?.expressDeliveryMode === 'date_only');

        return createPortal(
          <div className="fnp-cart-modal-overlay">
            <div className="fnp-cart-modal-box" style={{ maxWidth: '500px' }}>
              <button onClick={() => setShowSlotModal(false)} className="fnp-cart-modal-close-btn"><X size={18} color="currentColor" /></button>
              <div className="fnp-cart-modal-header">
                <h2 className="fnp-cart-modal-title">
                  {isDateOnly ? 'Choose Delivery Date' : 'Choose Time-slot'}
                </h2>
              </div>

              <div className="fnp-cart-modal-body">
                <div className="fnp-cart-free-shipping" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>✨ Want it free? Pick a slot with the FREE tag.</span>
                </div>

                <div className="fnp-cart-modal-subcard" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Delivery Date:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => {
                      setSelectedDate(e.target.value);
                      setLocalSelectedSlot(null);
                    }}
                    className="fnp-cart-modal-input"
                    style={{ flex: 1, padding: '0.35rem 0.5rem', border: 'none', background: 'transparent' }}
                  />
                </div>

                {(() => {
                  let dateOnlyCharge = 0;
                  let dateOnlyLabel = 'Standard Delivery';
                  if (isDateOnly) {
                    const sel = new Date(selectedDate);
                    const today = new Date();
                    const utcSel = Date.UTC(sel.getFullYear(), sel.getMonth(), sel.getDate());
                    const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
                    const diffDays = Math.floor((utcSel - utcToday) / (1000 * 60 * 60 * 24));

                    let applyExpress = false;
                    if (activeGift?.originalDeliveryMode === 'courier') {
                      const maxDaysStr = activeGift?.courierDays ? String(activeGift.courierDays).split('-').pop() : '3';
                      const maxCourierDays = parseInt(maxDaysStr, 10) || 3;
                      if (diffDays < maxCourierDays) applyExpress = true;
                    } else {
                      if (diffDays === 0) applyExpress = true;
                    }

                    if (applyExpress) {
                      const sameDayRule = availableSlots.find(t => t.methodType === 'SAME_DAY');
                      if (sameDayRule) {
                        dateOnlyCharge = sameDayRule.baseCharge;
                        dateOnlyLabel = diffDays === 0 ? 'Same Day Delivery' : 'Express Date Delivery';
                      }
                    }

                    return (
                      <div className="fnp-cart-modal-subcard" style={{ padding: '2rem', textAlign: 'center' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 0.5rem' }}>Your item will be delivered anytime during the selected date.</p>
                        {dateOnlyCharge > 0 ? (
                          <div style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 700 }}>{dateOnlyLabel} Charge: ₹{dateOnlyCharge}</div>
                        ) : (
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Standard delivery charges may apply.</div>
                        )}
                      </div>
                    );
                  }

                  if (isFetchingSlots) {
                    return (
                      <div className="fnp-cart-modal-subcard" style={{ padding: '2.5rem 0', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" size={28} style={{ margin: '0 auto 0.75rem' }} />
                        <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#64748b' }}>Fetching available slots...</div>
                      </div>
                    );
                  }

                  if (availableSlots.length === 0) {
                    return (
                      <div className="fnp-cart-gift-head fnp-cart-gift-head-alert" style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '12px' }}>
                        <p style={{ fontWeight: 700, margin: 0, color: '#b91c1c' }}>No delivery slots available for this date.</p>
                        <div style={{ fontSize: '0.85rem', marginTop: '0.4rem', color: '#dc2626' }}>Please select another date.</div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '380px', overflowY: 'auto' }}>
                      {availableSlots.map(type => (
                        <div key={type._id} className="fnp-cart-modal-subcard" style={{ padding: '0', overflow: 'hidden' }}>
                          {type.slots.map((slot, idx) => {
                            const isSelected = localSelectedSlot?.id === slot._id;
                            return (
                              <div
                                key={slot._id}
                                onClick={() => setLocalSelectedSlot({ type: type.type, label: slot.label, charge: slot.charge, id: slot._id })}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '1rem 1.25rem',
                                  cursor: 'pointer',
                                  borderBottom: idx < type.slots.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                  background: isSelected ? 'rgba(197,155,39,0.1)' : 'transparent',
                                  transition: 'all 0.2s',
                                  position: 'relative'
                                }}
                              >
                                {isSelected && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'currentColor' }} />}
                                <div style={{ flex: 1, paddingLeft: isSelected ? '0.5rem' : '0', transition: 'padding 0.2s' }}>
                                  <div style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.2rem' }}>{type.type}</div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, display: 'inline-block', color: slot.charge === 0 ? '#10b981' : '#64748b' }}>
                                    {slot.charge === 0 ? 'FREE' : `₹${slot.charge}`}
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, flex: 1.5, textAlign: 'center' }}>
                                  {slot.label}
                                </div>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSelected ? '6px solid currentColor' : '2px solid #94a3b8', transition: 'all 0.2s' }}></div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="fnp-cart-modal-footer" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    let charge = 0;
                    let label = 'Standard Delivery';
                    let id = 'date_only';
                    if (isDateOnly) {
                      const sel = new Date(selectedDate);
                      const today = new Date();
                      const utcSel = Date.UTC(sel.getFullYear(), sel.getMonth(), sel.getDate());
                      const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
                      const diffDays = Math.floor((utcSel - utcToday) / (1000 * 60 * 60 * 24));

                      let applyExpress = false;
                      if (activeGift?.originalDeliveryMode === 'courier') {
                        const maxDaysStr = activeGift?.courierDays ? String(activeGift.courierDays).split('-').pop() : '3';
                        const maxCourierDays = parseInt(maxDaysStr, 10) || 3;
                        if (diffDays < maxCourierDays) applyExpress = true;
                      } else {
                        if (diffDays === 0) applyExpress = true;
                      }

                      if (applyExpress) {
                        const sameDayRule = availableSlots.find(t => t.methodType === 'SAME_DAY');
                        if (sameDayRule) {
                          charge = sameDayRule.baseCharge;
                          label = diffDays === 0 ? 'Same Day Delivery' : 'Express Date Delivery';
                          id = sameDayRule._id;
                        }
                      }
                    }

                    const slotToSave = isDateOnly ? { type: label, label: 'Anytime during the day', charge, id } : localSelectedSlot;
                    updateDeliverySlot(activeGiftIdForSlot, selectedDate, slotToSave, isDateOnly ? 'date_only' : 'slot');
                    setShowSlotModal(false);
                  }}
                  disabled={!isDateOnly && !localSelectedSlot}
                  className="fnp-cart-modal-btn-primary"
                >
                  {isDateOnly ? 'Confirm Date' : 'Confirm Time-slot'}
                </button>
                {activeGift?.originalDeliveryMode === 'courier' && activeGift?.deliveryMode !== 'courier' && (
                  <button
                    onClick={() => {
                      updateDeliverySlot(activeGiftIdForSlot, null, null, 'courier');
                      setShowSlotModal(false);
                    }}
                    className="fnp-cart-modal-btn-outline"
                  >
                    Cancel Express & Revert to Standard Courier
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* UPI Payment Modal */}
      {showUpiModal && typeof document !== 'undefined' && createPortal(
        <div className="fnp-cart-modal-overlay">
          <div className="fnp-cart-modal-box" style={{ maxWidth: '400px' }}>
            <button onClick={() => setShowUpiModal(false)} className="fnp-cart-modal-close-btn"><X size={18} color="currentColor" /></button>
            <div className="fnp-cart-modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <h2 className="fnp-cart-modal-title" style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Scan to Pay</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Open any UPI app (GPay, PhonePe, Paytm) and scan this QR code to complete your payment of <strong>₹{grandTotal.toLocaleString('en-IN')}</strong>.
              </p>

              <div style={{ border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', display: 'inline-block', background: '#ffffff', marginBottom: '1.5rem' }}>
                <QRCodeSVG
                  value={`upi://pay?pa=${upiConfig.upiId}&pn=${encodeURIComponent(upiConfig.merchantName)}&mc=${upiConfig.merchantCode}&am=${grandTotal}&cu=INR&tn=Order Payment`}
                  size={200}
                  level={"H"}
                  includeMargin={false}
                />
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span>Merchant: <strong>{upiConfig.merchantName}</strong></span>
                <span>UPI ID: {upiConfig.upiId}</span>
              </div>

              <div style={{ marginBottom: '1.5rem', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
                <div className="fnp-cart-modal-section-title" style={{ marginBottom: '0.5rem' }}>Or enter your UPI ID to pay</div>
                <input
                  type="text"
                  placeholder="e.g. yourname@upi"
                  className="fnp-cart-modal-input"
                />
              </div>

              <button
                onClick={async () => {
                  setShowUpiModal(false);
                  setIsProcessingPayment(true);
                  await createOrder('upi');
                }}
                className="fnp-cart-modal-btn-primary"
              >
                I Have Completed Payment
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Celebration Toast/Faded Text */}
      {celebrationText && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 999999, background: 'rgba(17,17,17,0.9)', backdropFilter: 'blur(8px)', padding: '1rem 2.5rem', borderRadius: '50px', color: '#fff', fontSize: '1.25rem', fontWeight: 800, animation: 'centerPop 1s ease-in-out forwards', pointerEvents: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          {celebrationText}
        </div>,
        document.body
      )}

      <style>{`
        @keyframes centerPop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
