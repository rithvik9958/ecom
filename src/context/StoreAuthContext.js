/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const StoreAuthContext = createContext(null);

export function StoreAuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('store_token');
      if (!token) { setUser(null); return; }
      const res = await fetch('/api/store-auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) { setUser(data.user); return; }
      }
    } catch { /* network error */ }
    setUser(null);
    localStorage.removeItem('store_token');
  }, []);

  useEffect(() => {
    loadUser().finally(() => setLoading(false));
  }, [loadUser]);

  async function login(userData, token, { mergeGuestCart } = {}) {
    // Store token first so any API calls made during merge can authenticate
    localStorage.setItem('store_token', token);

    // Merge guest cart BEFORE setting user state.
    // This way CartContext's useEffect([user]) fires only AFTER merge is complete,
    // so the immediate re-fetch picks up the already-merged cart (no reload needed).
    if (mergeGuestCart) {
      const guestId = localStorage.getItem('store_guest_id');
      if (guestId) {
        try {
          await fetch('/api/store-cart/merge', {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              Authorization:   `Bearer ${token}`,
            },
            body: JSON.stringify({ guestId }),
          });
          localStorage.removeItem('store_guest_id');
        } catch { /* non-critical — user is still logged in */ }
      }
    }

    // Set user state last — this triggers CartContext to re-fetch the (now merged) cart
    setUser(userData);
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('store_token');
    // Keep guestId so cart survives logout
    // Clear saved delivery address so the previous user's address doesn't bleed into the next session
    localStorage.removeItem('deliveryLocation');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('deliveryLocationUpdated', { detail: { source: 'logout' } }));
    }
  }

  return (
    <StoreAuthContext.Provider value={{ user, setUser, loading, login, logout, loadUser }}>
      {children}
    </StoreAuthContext.Provider>
  );
}

export function useStoreAuth() {
  const ctx = useContext(StoreAuthContext);
  if (!ctx) {
    return {
      user: null,
      loading: true,
      login: async () => {},
      logout: () => {},
      loadUser: async () => {},
      setUser: () => {}
    };
  }
  return ctx;
}

