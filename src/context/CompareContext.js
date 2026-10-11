'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import showToast from '@/lib/storeToast';

const CompareContext = createContext(null);

const STORAGE_KEY = 'eshop_compare_items';
const MAX_COMPARE_ITEMS = 4;

export function CompareProvider({ children }) {
  const [compareItems, setCompareItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCompareItems(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load compare items from localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems));
    } catch (e) {
      console.error('Failed to save compare items to localStorage:', e);
    }
  }, [compareItems, isInitialized]);

  const isInCompare = useCallback((target) => {
    if (!target) return false;
    if (typeof target === 'object') {
      const targetId1 = target._id ? String(target._id) : null;
      const targetId2 = target.id ? String(target.id) : null;
      const targetTitle = target.title || target.name || null;
      return compareItems.some(item => {
        const itemIds = [String(item._id || ''), String(item.id || '')].filter(Boolean);
        return (
          (targetId1 && itemIds.includes(targetId1)) || 
          (targetId2 && itemIds.includes(targetId2)) ||
          (targetTitle && item.title === targetTitle)
        );
      });
    }
    const strId = String(target);
    return compareItems.some(item => 
      String(item._id || '') === strId || 
      String(item.id || '') === strId ||
      String(item.title || '') === strId
    );
  }, [compareItems]);

  const removeFromCompare = useCallback((target) => {
    if (!target) return;
    if (typeof target === 'object') {
      const targetId1 = target._id ? String(target._id) : null;
      const targetId2 = target.id ? String(target.id) : null;
      const targetTitle = target.title || target.name || null;
      setCompareItems(prev => prev.filter(item => {
        const itemIds = [String(item._id || ''), String(item.id || '')].filter(Boolean);
        const matches = (targetId1 && itemIds.includes(targetId1)) || 
                        (targetId2 && itemIds.includes(targetId2)) ||
                        (targetTitle && item.title === targetTitle);
        return !matches;
      }));
    } else {
      const strId = String(target);
      setCompareItems(prev => prev.filter(item => 
        String(item._id || '') !== strId && 
        String(item.id || '') !== strId &&
        String(item.title || '') !== strId
      ));
    }
    showToast.success('Removed from comparison');
  }, []);

  const addToCompare = useCallback((product) => {
    if (!product) return false;
    const prodId = String(product._id || product.id || product.slug || product.title);

    // If already in list, toggle off
    if (isInCompare(product)) {
      removeFromCompare(product);
      return false;
    }

    // Check maximum limit
    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      showToast.error(`You can compare up to ${MAX_COMPARE_ITEMS} items at a time.`);
      return false;
    }

    const itemToAdd = {
      _id: product._id ? String(product._id) : prodId,
      id: product.id ? String(product.id) : prodId,
      title: product.title || product.name || 'Product',
      price: Number(product.price) || 0,
      mrp: Number(product.mrp) || Number(product.price) || 0,
      thumbnail: product.thumbnail || product.images?.[0] || '',
      category: product.category?.name || product.category || 'General',
      rating: product.rating || 4.5,
      numReviews: product.numReviews || 0,
      stock: product.stock !== undefined ? product.stock : 10,
      sku: product.sku || '',
      description: product.description || '',
      attributes: product.attributes || {},
      deliveryMode: product.deliveryMode || 'standard',
      isSameDay: product.isSameDay || false
    };

    setCompareItems(prev => [...prev, itemToAdd]);
    setIsDockOpen(true);
    showToast.success(`Added "${itemToAdd.title.slice(0, 24)}${itemToAdd.title.length > 24 ? '…' : ''}" to compare`);
    return true;
  }, [compareItems, isInCompare, removeFromCompare]);

  const clearCompare = useCallback(() => {
    setCompareItems([]);
    showToast.success('Comparison list cleared');
  }, []);

  const toggleDock = useCallback(() => {
    setIsDockOpen(prev => !prev);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isDockOpen,
        setIsDockOpen,
        toggleDock,
        maxItems: MAX_COMPARE_ITEMS
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
