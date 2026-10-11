'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const StoreThemeContext = createContext({
  themeMode: 'light',
  toggleTheme: () => {},
  setThemeMode: () => {},
  themeData: null
});

export function StoreThemeProvider({ children, initialTheme }) {
  const [themeData, setThemeData] = useState(initialTheme || null);
  const [themeMode, setThemeModeState] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Determine initial mode from localStorage or server default
    try {
      const saved = localStorage.getItem('storefront_theme');
      if (saved === 'dark' || saved === 'light') {
        setThemeModeState(saved);
        applyThemeClass(saved);
      } else {
        const defaultMode = initialTheme?.defaultThemeMode || 'light';
        setThemeModeState(defaultMode);
        applyThemeClass(defaultMode);
      }
    } catch (e) {
      applyThemeClass('light');
    }

    if (initialTheme) setThemeData(initialTheme);
  }, [initialTheme]);

  useEffect(() => {
    // 2. Fetch fresh theme from /api/store-theme
    fetch('/api/store-theme')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.theme) {
          setThemeData(data.theme);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // 3. Dynamically set favicon in browser tab
    if (themeData?.favicon && typeof document !== 'undefined') {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = themeData.favicon;
    }
  }, [themeData?.favicon]);

  const applyThemeClass = (mode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    const storeBody = document.querySelector('.storefront-body');

    if (mode === 'dark') {
      root.classList.add('dark');
      if (body) body.classList.add('dark');
      if (storeBody) storeBody.classList.add('dark');
    } else {
      root.classList.remove('dark');
      if (body) body.classList.remove('dark');
      if (storeBody) storeBody.classList.remove('dark');
    }
  };

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    applyThemeClass(mode);
    try {
      localStorage.setItem('storefront_theme', mode);
    } catch (e) {}
  };

  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  };

  return (
    <StoreThemeContext.Provider value={{ themeMode, toggleTheme, setThemeMode, themeData, mounted }}>
      {children}
    </StoreThemeContext.Provider>
  );
}

export function useStoreTheme() {
  return useContext(StoreThemeContext);
}
