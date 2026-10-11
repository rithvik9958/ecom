/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from API on mount (validates the httpOnly cookie)
  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          return;
        }
      }
    } catch {
      // network error
    }
    
    // If we reach here, token is invalid or request failed
    try {
      // Call logout API to ensure the HttpOnly cookie is cleared on the server side.
      // Otherwise, proxy.js will endlessly redirect /admin-login back to /dashboard.
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_user');
    sessionStorage.clear();
    document.cookie = 'admin_token=; Max-Age=0; Path=/;';
  }, []);

  useEffect(() => {
    loadUser().finally(() => setLoading(false));
  }, [loadUser]);

  function login(userData, token) {
    setUser(userData);
    if (token) {
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_logged_in', 'true');
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error', err);
    }
    
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_user');
    sessionStorage.clear();
    
    // Fallback: Clear httpOnly cookie visually just in case, though API does it
    document.cookie = 'admin_token=; Max-Age=0; Path=/;';
    
    // Hard redirect to clear any cached states/memory and return to dashboard login
    window.location.href = '/admin-login';
  }

  /**
   * Check if the current user has a given permission.
   * Super admins pass all checks automatically.
   * @param {string} module - e.g. 'blogs'
   * @param {string} action - e.g. 'create', 'read', 'update', 'delete'
   */
  function hasPermission(module, action) {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const allowed = user.permissions?.[module] || [];
    return allowed.includes(action);
  }

  function isSuperAdmin() {
    return user?.role === 'super_admin';
  }

  /**
   * Check if user has at least one action permission for the module.
   * Used to decide whether to show sidebar items.
   */
  function hasModuleAccess(module) {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const allowed = user.permissions?.[module] || [];
    return allowed.length > 0;
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, loadUser, hasPermission, hasModuleAccess, isSuperAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
