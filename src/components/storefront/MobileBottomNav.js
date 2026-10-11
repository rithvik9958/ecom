'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, ShoppingCart, User, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { useState } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist?.length || 0;
  const { user } = useStoreAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].some(p => pathname?.startsWith(p));
  if (isAuthPage) return null;

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal('');
    }
  }

  const tabs = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: null, icon: Search, action: () => setSearchOpen(true) },
    { label: 'Wishlist', href: '/user?tab=wishlist', icon: Heart, badge: wishlistCount > 0 ? (wishlistCount > 99 ? '99+' : wishlistCount) : null },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, badge: itemCount > 0 ? (itemCount > 99 ? '99+' : itemCount) : null },
    { label: 'Account', href: user ? '/user' : '/login', icon: User },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <nav className="fnp-mobile-nav" aria-label="Mobile navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.href ? isActive(tab.href) : false;
          const content = (
            <>
              <span className="fnp-mobile-nav-icon-wrap">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {tab.badge && (
                  <span className="fnp-mobile-nav-badge">{tab.badge}</span>
                )}
              </span>
              <span className="fnp-mobile-nav-label">{tab.label}</span>
            </>
          );

          if (tab.action) {
            return (
              <button
                key={tab.label}
                className={`fnp-mobile-nav-tab ${active ? 'active' : ''}`}
                onClick={tab.action}
                aria-label={tab.label}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`fnp-mobile-nav-tab ${active ? 'active' : ''}`}
              aria-label={tab.label}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Full-screen search overlay (triggered by Search tab) */}
      {searchOpen && (
        <div
          className="fnp-mobile-search-overlay"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="fnp-mobile-search-box"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearchSubmit} className="fnp-mobile-search-form">
              <Search size={20} color="var(--fnp-gray-500)" />
              <input
                autoFocus
                type="text"
                placeholder="Search products..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="fnp-mobile-search-input"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="fnp-mobile-search-close"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
