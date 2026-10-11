'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useStoreAuth } from './StoreAuthContext';

const WishlistContext = createContext(null);
const LOCAL_KEY = 'store_wishlist';

function getLocalWishlist() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch { return []; }
}

function setLocalWishlist(ids) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
}

export function WishlistProvider({ children }) {
  const { user } = useStoreAuth();
  const [wishlist, setWishlist] = useState([]); // array of productId strings
  const [loaded, setLoaded] = useState(false);

  // On mount — load from localStorage first for instant UI
  useEffect(() => {
    setWishlist(getLocalWishlist());
  }, []);

  // When user logs in — fetch DB wishlist and merge with localStorage
  const syncToServer = useCallback(async () => {
    try {
      const token = localStorage.getItem('store_token');
      if (!token) return;

      const local = getLocalWishlist();

      // Sync local → DB (PUT merges)
      if (local.length > 0) {
        await fetch('/api/store-wishlist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productIds: local }),
        });
      }

      // Fetch merged DB wishlist
      const res = await fetch('/api/store-wishlist', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setWishlist(data.productIds || []);
          setLocalWishlist(data.productIds || []);
        }
      }
    } catch (err) {
      console.error('[WishlistContext] sync error', err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      syncToServer();
    } else {
      setLoaded(true);
    }
  }, [user, syncToServer]);

  const toggleWishlist = useCallback(async (productId) => {
    const isIn = wishlist.includes(productId);
    const newList = isIn
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];

    // Optimistic update
    setWishlist(newList);
    setLocalWishlist(newList);

    // Persist to server if logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('store_token') : null;
    if (token) {
      try {
        const res = await fetch('/api/store-wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId, action: isIn ? 'remove' : 'add' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setWishlist(data.productIds || []);
            setLocalWishlist(data.productIds || []);
          }
        }
      } catch (err) {
        console.error('[WishlistContext] toggle error', err);
        // Rollback on error
        setWishlist(wishlist);
        setLocalWishlist(wishlist);
      }
    }
  }, [wishlist]);

  const isWishlisted = useCallback((productId) => wishlist.includes(productId), [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, loaded }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      wishlist: [],
      toggleWishlist: () => {},
      isWishlisted: () => false,
      loaded: false
    };
  }
  return ctx;
}

