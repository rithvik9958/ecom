/* eslint-disable react-hooks/set-state-in-effect */
'use client';
/**
 * CartContext — Hybrid cart (Amazon/Shopify pattern)
 * 
 * Guest:  items persisted in MongoDB via x-guest-id header (UUID in localStorage)
 * Auth:   items persisted in MongoDB via Bearer token
 * Merge:  handled automatically by StoreAuthContext.login()
 * 
 * Local state is used for instant UI feedback; server is the source of truth.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useStoreAuth } from './StoreAuthContext';
import { v4 as uuidv4 } from 'uuid';
import showToast from '@/lib/storeToast';

const CartContext = createContext(null);

function getGuestId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('store_guest_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('store_guest_id', id);
  }
  return id;
}

function buildHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) {
    h['Authorization'] = `Bearer ${token}`;
  } else {
    const guestId = getGuestId();
    if (guestId) h['x-guest-id'] = guestId;
  }
  return h;
}

export function CartProvider({ children }) {
  const { user } = useStoreAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;

  const [items, setItems]   = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [senderDetails, setSenderDetails] = useState({
    name: '', phone: '', email: '', city: '', sameAsRecipientCity: false
  });
  const [messageCard, setMessageCard] = useState({ message: '', senderName: '', hideName: false });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user && !senderDetails.name) {
      setSenderDetails(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const fetchCart = useCallback(async () => {
    try {
      const tkn = localStorage.getItem('store_token');
      const res = await fetch('/api/store-cart', { headers: buildHeaders(tkn), cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    try {
      let url = '/api/store-addresses';
      const tkn = localStorage.getItem('store_token');
      if (!tkn) {
        const guestId = getGuestId();
        if (guestId) url += `?guestId=${guestId}`;
      }
      const res = await fetch(url, { headers: buildHeaders(tkn), cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const fetchedAddresses = data.addresses || [];
          setAddresses(fetchedAddresses);
          
          // Globally sync the header location to the user's default saved address only if none exists
          if (fetchedAddresses.length > 0 && typeof window !== 'undefined') {
            const existingLoc = localStorage.getItem('deliveryLocation');
            if (!existingLoc) {
              // No location set — use default/first address
              const defaultAddr = fetchedAddresses.find(a => a.isDefault) || fetchedAddresses[0];
              if (defaultAddr && defaultAddr.pincode) {
                const displayCity = defaultAddr.city || 'Location';
                const fullText = `${defaultAddr.locality ? defaultAddr.locality + ', ' : ''}${displayCity}, ${defaultAddr.pincode}`;
                const newLoc = { name: defaultAddr.name, city: displayCity, full: fullText, pincode: defaultAddr.pincode, addressId: defaultAddr._id };
                localStorage.setItem('deliveryLocation', JSON.stringify(newLoc));
                window.dispatchEvent(new CustomEvent('deliveryLocationUpdated', { detail: { source: 'cart-context', pincode: defaultAddr.pincode } }));
              }
            } else {
              // A location is already set — backfill missing addressId so delete/update handlers can identify it
              try {
                const parsed = JSON.parse(existingLoc);
                if (!parsed.addressId && parsed.pincode) {
                  // Was set from header modal without a real addressId — link to the matching address
                  const matched = fetchedAddresses.find(a => a.pincode === parsed.pincode);
                  if (matched) {
                    const updatedLoc = { ...parsed, addressId: matched._id };
                    localStorage.setItem('deliveryLocation', JSON.stringify(updatedLoc));
                    // No need to fire deliveryLocationUpdated — the display value hasn't changed
                  }
                } else if (parsed.addressId) {
                  // Has an addressId — verify the address still exists (handles deletion from another session)
                  const stillExists = fetchedAddresses.some(a => a._id === parsed.addressId);
                  if (!stillExists) {
                    localStorage.removeItem('deliveryLocation');
                    window.dispatchEvent(new CustomEvent('deliveryLocationUpdated', { detail: { source: 'cart-context' } }));
                  }
                }
              } catch { /* malformed JSON — ignore */ }
            }
          } else if (fetchedAddresses.length === 0 && typeof window !== 'undefined') {
            // All addresses were deleted — clear any stale location
            const existingLoc = localStorage.getItem('deliveryLocation');
            if (existingLoc) {
              try {
                const parsed = JSON.parse(existingLoc);
                // Only clear if it was tied to a saved address (not a manually entered pincode)
                if (parsed.addressId) {
                  localStorage.removeItem('deliveryLocation');
                  window.dispatchEvent(new CustomEvent('deliveryLocationUpdated', { detail: { source: 'cart-context' } }));
                }
              } catch { /* ignore */ }
            }
          }
        }
      }
    } catch { /* silent */ }
  }, []);

  // Re-fetch cart & addresses whenever auth state changes (login/logout)
  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, [user, fetchCart, fetchAddresses]);

  const addItem = useCallback(async (product, quantity = 1, options = {}) => {
    setLoading(true);
    try {
      const tkn = localStorage.getItem('store_token');
      const itemPrice = options.price !== undefined ? Number(options.price) : (Number(product.discountedPrice) || Number(product.price) || 0);
      const itemMrp = options.mrp !== undefined ? Number(options.mrp) : (Number(product.mrp) || Number(product.discountedPrice) || Number(product.price) || 0);

      const res = await fetch('/api/store-cart', {
        method:  'POST',
        headers: buildHeaders(tkn),
        body: JSON.stringify({
          productId: product.id || product._id,
          title:     product.title,
          price:     itemPrice,
          mrp:       itemMrp,
          quantity,
          thumbnail: product.thumbnail,
          category:  product.category,
          sku:       options.sku || (options.variant?.sku) || '',
          variant:   options.variant || null,
          selectedVariantAttrs: options.selectedVariantAttrs || (options.variant?.attrs) || null,
          groupId:   options.groupId || null,
          isAddon:   options.isAddon || false,
          deliveryMode: options.deliveryMode || 'courier',
          originalDeliveryMode: options.originalDeliveryMode || 'courier',
          allowExpressUpgrade: options.allowExpressUpgrade || false,
          expressDeliveryMode: options.expressDeliveryMode || 'slot',
          courierDays: options.courierDays || '2-3',
          deliveryDate: options.deliveryDate || null,
          deliverySlot: options.deliverySlot || null,
        }),
      });
      if (res.ok) {
        await fetchCart();
        if (!options.silent) showToast.success('Added to cart!');
      } else {
        const err = await res.json();
        if (!options.silent) showToast.error(err.message || 'Failed to add to cart.');
      }
    } catch {
      if (!options.silent) showToast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    setLoading(true);
    // Optimistic update - if deleting (qty <= 0), also remove its addons
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter(i => i._id !== itemId && i.groupId !== itemId);
      }
      return prev.map((i) => i._id === itemId ? { ...i, quantity } : i);
    });
    try {
      const tkn = localStorage.getItem('store_token');
      const res = await fetch(`/api/store-cart/${itemId}`, {
        method:  'PATCH',
        headers: buildHeaders(tkn),
        body: JSON.stringify({ quantity }),
      });
      if (quantity <= 0) {
        await fetchCart();
      }
    } catch {
      await fetchCart(); // revert on error
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    // Optimistic update - remove the item and any addons attached to it
    setItems((prev) => prev.filter((i) => i._id !== itemId && i.groupId !== itemId));
    try {
      const tkn = localStorage.getItem('store_token');
      const res = await fetch(`/api/store-cart/${itemId}`, {
        method:  'DELETE',
        headers: buildHeaders(tkn),
      });
      if (res.ok) {
         showToast.success('Item removed from cart.');
         await fetchCart();
      } else {
         await fetchCart();
      }
    } catch {
      await fetchCart();
    }
  }, [fetchCart]);

  const updateDeliverySlot = useCallback(async (groupId, deliveryDate, deliverySlot, deliveryMode = undefined) => {
    setItems(prev => prev.map(item => 
      (item.groupId === groupId || item._id === groupId || item.id === groupId) ? { ...item, deliveryDate, deliverySlot, ...(deliveryMode && { deliveryMode }) } : item
    ));
    try {
      const tkn = localStorage.getItem('store_token');
      await fetch('/api/store-cart/delivery', {
        method: 'POST',
        headers: buildHeaders(tkn),
        body: JSON.stringify({ groupId, deliveryDate, deliverySlot, deliveryMode })
      });
    } catch {
      await fetchCart();
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    setItems([]);
    try {
      const tkn = localStorage.getItem('store_token');
      await fetch('/api/store-cart', { method: 'DELETE', headers: buildHeaders(tkn) });
    } catch { /* non-critical */ }
  }, []);

  const addAddress = useCallback(async (addressData) => {
    setLoading(true);
    try {
      const tkn = localStorage.getItem('store_token');
      const payload = { ...addressData };
      if (!tkn) payload.guestId = getGuestId();
      
      const res = await fetch('/api/store-addresses', {
        method: 'POST',
        headers: buildHeaders(tkn),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAddresses();
        showToast.success('Address saved successfully');
        // Return the created address so callers can use the real _id (e.g. to set deliveryLocation correctly)
        return data.address || true;
      } else {
        showToast.error(data.message || 'Failed to save address');
        return false;
      }
    } catch {
      showToast.error('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAddresses]);

  const updateAddress = useCallback(async (id, addressData) => {
    setLoading(true);
    try {
      const tkn = localStorage.getItem('store_token');
      const payload = { ...addressData };
      if (!tkn) payload.guestId = getGuestId();
      
      const res = await fetch(`/api/store-addresses/${id}`, {
        method: 'PUT',
        headers: buildHeaders(tkn),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAddresses();
        showToast.success('Address updated successfully');
        return true;
      } else {
        showToast.error(data.message || 'Failed to update address');
        return false;
      }
    } catch {
      showToast.error('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchAddresses]);

  const deleteAddress = useCallback(async (id) => {
    setLoading(true);
    try {
      let url = `/api/store-addresses/${id}`;
      const tkn = localStorage.getItem('store_token');
      if (!tkn) {
        const guestId = getGuestId();
        if (guestId) url += `?guestId=${guestId}`;
      }
      const res = await fetch(url, {
        method: 'DELETE',
        headers: buildHeaders(tkn)
      });
      const data = await res.json();
      if (data.success) {
        await fetchAddresses();
        showToast.success('Address deleted');
      } else {
        showToast.error(data.message || 'Failed to delete address');
      }
    } catch {
      showToast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [fetchAddresses]);

  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addresses,
      senderDetails,
      setSenderDetails,
      messageCard,
      setMessageCard,
      appliedCoupon,
      setAppliedCoupon,
      itemCount, 
      cartTotal, 
      loading, 
      isInitialized,
      addItem, 
      updateQuantity, 
      removeItem, 
      updateDeliverySlot,
      clearCart,
      addAddress,
      updateAddress,
      deleteAddress,
      fetchCart,
      fetchAddresses
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      addresses: [],
      senderDetails: {},
      messageCard: {},
      appliedCoupon: null,
      loading: true,
      isInitialized: false,
      itemCount: 0,
      total: 0,
      addItem: async () => {},
      updateQuantity: async () => {},
      removeItem: async () => {},
      updateDeliverySlot: () => {},
      clearCart: () => {},
      addAddress: async () => {},
      updateAddress: async () => {},
      deleteAddress: async () => {},
      fetchCart: async () => {},
      fetchAddresses: async () => {}
    };
  }
  return ctx;
}

