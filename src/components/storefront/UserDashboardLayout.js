'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStoreAuth } from '@/context/StoreAuthContext';
import { User, Package, MapPin, LogOut, Lock, Heart, ChevronRight, ShieldCheck, Sparkles, HelpCircle, Star, Ticket, RotateCcw, Bell, Wallet } from 'lucide-react';
import showToast from '@/lib/storeToast';

export default function UserDashboardLayout({ children, title, action }) {
  const { user, loading, logout } = useStoreAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [user, loading, router, pathname]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  if (loading || !user) {
    return (
      <div className="storefront-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '4rem' }}>
        <span className="auth-spinner auth-spinner-dark" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  const navSections = [
    {
      title: 'Account Settings',
      items: [
        { label: 'My Profile', href: '/user', icon: User },
        { label: 'Notifications & Alerts', href: '/user/notifications', icon: Bell },
        { label: 'Security & Password', href: '/user/password', icon: Lock },
        { label: 'Saved Addresses', href: '/user/addresses', icon: MapPin },
      ]
    },
    {
      title: 'Orders & Shopping',
      items: [
        { label: 'My Orders', href: '/orders', icon: Package },
        { label: 'My Wishlist', href: '/user/wishlist', icon: Heart },
        { label: 'My Reviews & Ratings', href: '/user/reviews', icon: Star },
        { label: 'My Coupons & Offers', href: '/user/coupons', icon: Ticket },
        { label: 'Returns & Refunds', href: '/user/returns', icon: RotateCcw },
      ]
    }
  ];

  return (
    <div className="user-dashboard-wrapper storefront-body">
      <div className="user-dashboard-container">
        
        {/* Sticky Luxury Sidebar */}
        <aside className="user-dashboard-sidebar">
          
          {/* User Profile Studio Header */}
          <div className="user-dashboard-sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ 
                width: '46px', 
                height: '46px', 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.12)', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '1.2rem', 
                fontWeight: '800', 
                flexShrink: 0, 
                overflow: 'hidden', 
                border: '2px solid rgba(255,255,255,0.25)', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)' 
              }}>
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                <span className="user-dashboard-greeting">{getGreeting()}</span>
                <h2 className="user-dashboard-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Customer'}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.12)', padding: '2px 7px', borderRadius: '4px', fontWeight: 700 }}>
                    <ShieldCheck size={11} color="#ffffff" /> Verified Member
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="user-dashboard-nav-group">
            {navSections.map((section, idx) => (
              <div key={section.title} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: idx > 0 ? '0.4rem' : '0' }}>
                <span className="user-dashboard-nav-section-title">{section.title}</span>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href === '/orders' && pathname.startsWith('/orders'));
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      className={`user-dashboard-nav-item ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={16} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && <ChevronRight size={14} style={{ opacity: 0.8 }} />}
                    </Link>
                  );
                })}
              </div>
            ))}
            
            {/* Logout Action */}
            <button 
              onClick={() => { logout(); showToast.success('Signed out successfully'); router.push('/'); }} 
              className="user-dashboard-nav-item logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>

            {/* Quick Support Badge */}
            <div className="user-dashboard-help-badge">
              <HelpCircle size={15} color="#64748b" style={{ flexShrink: 0 }} />
              <div className="user-dashboard-help-text">
                Need assistance? <Link href="/contact" className="user-dashboard-help-link">24/7 Support</Link>
              </div>
            </div>

          </div>
        </aside>

        {/* Main Content */}
        <main className="user-dashboard-content">
          {action && <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>{action}</div>}
          {children}
        </main>
        
      </div>
    </div>
  );
}
