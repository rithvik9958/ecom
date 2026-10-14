'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ChevronRight,
  Zap,
  ShoppingCart,
  LayoutTemplate,
  Mail,
  User,
  PackageSearch,
  Truck,
  CreditCard,
  Palette,
  BookOpen,
  PhoneCall,
  ClipboardList
} from 'lucide-react';

const NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    permission: null,
  },

  // ── Storefront Management (split into 3) ──
  {
    id: 'orders-customers',
    label: 'Orders & Customers',
    icon: ClipboardList,
    permission: null,
    children: [
      { label: 'Overview',   href: '/dashboard/ecommerce' },
      { label: 'Orders',     href: '/dashboard/ecommerce/orders' },
      { label: 'Customers',  href: '/dashboard/ecommerce/customers' },
    ],
  },
  {
    id: 'catalog-products',
    label: 'Catalog & Products',
    icon: PackageSearch,
    permission: null,
    children: [
      { label: 'Products',              href: '/dashboard/ecommerce/products' },
      { label: 'Categories',            href: '/dashboard/ecommerce/categories' },
      { label: 'Attribute Templates',   href: '/dashboard/ecommerce/attribute-templates' },
      { label: 'Add-on Categories',     href: '/dashboard/ecommerce/addon-categories' },
      { label: 'Add-ons',               href: '/dashboard/ecommerce/addons' },
      { label: 'Coupons & Discounts',   href: '/dashboard/ecommerce/coupons' },
    ],
  },
  {
    id: 'shipping-payments',
    label: 'Shipping & Payments',
    icon: Truck,
    permission: null,
    children: [
      { label: 'Shipping Rules',           href: '/dashboard/ecommerce/shipping' },
      { label: 'Delivery Slots',           href: '/dashboard/ecommerce/delivery-slots' },
      { label: 'Store & Payment Settings', href: '/dashboard/ecommerce/settings' },
      { label: 'Invoice Settings',         href: '/dashboard/ecommerce/invoice-settings' },
    ],
  },

  // ── Storefront CMS (split into 3) ──
  {
    id: 'design-homepage',
    label: 'Design & Homepage',
    icon: Palette,
    permission: null,
    // children injected dynamically in dynamicNav below (homepage sections)
  },
  {
    id: 'store-content',
    label: 'Store Content',
    icon: BookOpen,
    permission: null,
    children: [
      { label: 'About Us Page',         href: '/dashboard/ecommerce/about' },
      { label: 'Footer & Brand Story',  href: '/dashboard/ecommerce/footer' },
      { label: 'Customer Testimonials', href: '/dashboard/ecommerce/testimonials' },
      { label: 'Help & FAQs',           href: '/dashboard/ecommerce/faqs' },
      { label: 'Custom Pages',          href: '/dashboard/custom-pages' },
    ],
  },
  {
    id: 'blog-contact',
    label: 'Blog & Contact',
    icon: PhoneCall,
    permission: null,
    children: [
      { label: 'Blog & Journal CMS', href: '/dashboard/blogs' },
      { label: 'Contact Page CMS',   href: '/dashboard/contact' },
    ],
  },

  // ── Communication ──
  {
    id: 'communication',
    label: 'Communication',
    icon: Mail,
    permission: null,
    children: [
      { label: 'Enquiries',       href: '/dashboard/enquiries' },
      { label: 'Email Templates', href: '/dashboard/email-templates' },
    ],
  },
  {
    id: 'settings-tools',
    label: 'Settings & Tools',
    icon: Settings,
    permission: 'global_settings',
    children: [
      { label: 'File Manager',     href: '/dashboard/files' },
      { label: 'AI Assistant',     href: '/dashboard/advanced/ai' },
      { label: 'SEO Health Audit', href: '/dashboard/advanced/seo-audit' },
    ],
  },
];

const ADMIN_NAV = [
  {
    id: 'manage-users',
    label: 'Manage Users',
    icon: ShieldCheck,
    href: '/dashboard/users',
  },
  {
    id: 'security-settings',
    label: 'Security Settings',
    icon: ShieldCheck,
    href: '/dashboard/security',
  },
  {
    id: 'advanced',
    label: 'Advanced Features',
    icon: Zap,
    children: [
      { label: 'SEO Health Audit',    href: '/dashboard/advanced/seo-audit' },
      { label: 'Redirect Manager',    href: '/dashboard/advanced/redirects' },
      { label: 'Sitemap Manager',     href: '/dashboard/advanced/sitemap' },
      { label: 'Integrations & Code', href: '/dashboard/advanced/integrations' },
      { label: 'Performance Monitor', href: '/dashboard/advanced/performance' },
      { label: 'Error & 404 Monitor', href: '/dashboard/advanced/error-monitor' },
      { label: 'Activity Logs',       href: '/dashboard/logs' },
      { label: 'Cache Management',    href: '/dashboard/advanced/cache' },
      { label: 'Maintenance Mode',    href: '/dashboard/advanced/maintenance' },
      { label: 'Backup Management',   href: '/dashboard/advanced/backups' },
    ],
  },
];

function NestedNavChild({ child, pathname }) {
  const isActive = child.children.some(c => pathname === c.href);
  const [open, setOpen] = useState(isActive);
  return (
    <div className="space-y-1">
      <div
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-colors",
          isActive || open ? "text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
        )}
      >
        <span>{child.label}</span>
        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-90")} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-3 border-l border-slate-700/50 ml-3 space-y-1 overflow-hidden"
          >
            {child.children.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                className={cn(
                  "block px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors",
                  pathname === sub.href
                    ? "dashboard-active-child font-bold text-white shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                {sub.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ item, isActive, isChildActive, hasModuleAccess, isHovered }) {
  const [open, setOpen] = useState(isChildActive);
  const pathname = usePathname();

  useEffect(() => {
    if (!isHovered) {
      setOpen(false);
    } else {
      if (isChildActive) setOpen(true);
    }
  }, [isHovered, isChildActive]);

  if (item.permission && !hasModuleAccess(item.permission)) return null;

  const hasChildren = item.children && item.children.length > 0;
  const isItemActive = isActive || isChildActive;

  const content = (
    <div className={cn(
      "flex items-center rounded-xl text-sm font-medium transition-all group cursor-pointer w-full select-none",
      isItemActive
        ? "dashboard-active-pill shadow-xs text-white"
        : "text-slate-400 hover:bg-slate-800/80 hover:text-white",
      "p-2.5 group-hover/aside:px-3.5 group-hover/aside:py-2.5 gap-3"
    )}>
      <div className="w-5 h-5 shrink-0 flex items-center justify-center">
        <item.icon className={cn(
          "w-5 h-5 shrink-0 transition-colors",
          isItemActive ? "text-white" : "text-slate-400 group-hover:text-white"
        )} />
      </div>
      <span className="flex-1 truncate opacity-0 group-hover/aside:opacity-100 max-lg:opacity-100 transition-opacity duration-300 w-0 group-hover/aside:w-auto max-lg:w-auto overflow-hidden">
        {item.label}
      </span>
      {hasChildren && (
        <ChevronRight className={cn(
          "w-4 h-4 shrink-0 transition-all duration-200 opacity-0 group-hover/aside:opacity-100 max-lg:opacity-100 w-0 group-hover/aside:w-auto max-lg:w-auto",
          open && "rotate-90"
        )} />
      )}
    </div>
  );

  return (
    <div className="space-y-1">
      {hasChildren ? (
        <div onClick={() => setOpen(!open)}>{content}</div>
      ) : (
        <Link href={item.href}>{content}</Link>
      )}

      <AnimatePresence initial={false}>
        {hasChildren && open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-7 space-y-1 opacity-0 group-hover/aside:opacity-100 max-lg:opacity-100 transition-opacity duration-300"
          >
            {item.children.map((child) => {
              if (child.children) {
                return <NestedNavChild key={child.label} child={child} pathname={pathname} />;
              }
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "block px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                    pathname === child.href
                      ? "dashboard-active-child font-bold text-white shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  {child.label}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasModuleAccess, isSuperAdmin } = useAuth();
  const [homepageSections, setHomepageSections] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({});
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchHomepageSections = () => {
      fetch('/api/store-homepage')
        .then(res => res.json())
        .then(json => {
           if (json.sections && Array.isArray(json.sections)) {
             const sorted = json.sections.slice().sort((a, b) => a.order - b.order);
             setHomepageSections(sorted);
           }
        })
        .catch(err => console.error("Failed to fetch homepage sections", err));
    };

    const fetchThemeBranding = () => {
      fetch('/api/admin/theme')
        .then(res => res.json())
        .then(json => {
          if (json.theme) {
            setGlobalSettings(prev => ({
              ...prev,
              adminLogo: json.theme.adminLogo || json.theme.logo || prev.adminLogo,
              adminTitle: json.theme.adminTitle || json.theme.brandName || prev.adminTitle,
              logoImage: json.theme.logo || prev.logoImage
            }));
          }
        })
        .catch(() => {});
    };

    fetchHomepageSections();
    fetchThemeBranding();

    window.addEventListener('homepageUpdated', fetchHomepageSections);
    window.addEventListener('themeUpdated', fetchThemeBranding);

    fetch('/api/global-settings')
      .then(res => res.json())
      .then(json => {
        if (json.data) setGlobalSettings(prev => ({ ...prev, ...json.data }));
      })
      .catch(err => console.error("Failed to fetch global settings", err));

    return () => {
      window.removeEventListener('homepageUpdated', fetchHomepageSections);
      window.removeEventListener('themeUpdated', fetchThemeBranding);
    };
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [pathname]);

  const typeLabels = {
    'banner_slider': 'Banner',
    'category_carousel': 'Categories',
    'video_stories': 'Videos',
    'product_showcase': 'Products',
    'stats_counter': 'Stats',
    'trust_badges': 'Badges',
    'occasion_cards': 'Mini Cards'
  };

  const dynamicNav = NAV.map(item => {
    if (item.id === 'design-homepage') {
      const homepageChildren = homepageSections.map(sec => {
        let labelType = typeLabels[sec.type] || 'Section';
        let title = sec.config?.title?.trim();
        let label = title ? `${labelType} — ${title}` : labelType;
        return { label, href: `/dashboard/homepage/${sec.id}` };
      });

      return {
        ...item,
        children: [
          { label: 'Brand & Theme Customizer', href: '/dashboard/ecommerce/theme' },
          {
            label: 'Homepage Layout',
            children: [
              { label: 'Layout & Ordering', href: '/dashboard/homepage' },
              ...homepageChildren
            ]
          },
        ]
      };
    }
    return item;
  });


  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "border-r border-[#1e293b] bg-[#0f172a] dashboard-sidebar-surface shrink-0 flex flex-col h-screen fixed lg:sticky top-0 z-[70] transition-all duration-300 group/aside overflow-x-hidden",
          mobileMenuOpen
            ? "w-[260px] translate-x-0"
            : "w-[260px] -translate-x-full lg:w-[84px] lg:translate-x-0 lg:hover:w-[260px]"
        )}
      >
        <div className="p-3 lg:p-4 group-hover/aside:p-6 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar transition-all duration-300">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 shrink-0 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center shadow-sm overflow-hidden relative">
              {(globalSettings.adminLogo || globalSettings.logoImage) ? (
                <img
                  src={globalSettings.adminLogo || globalSettings.logoImage}
                  alt={globalSettings.adminTitle || "Admin"}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <span className="font-extrabold text-base text-primary">
                  {(globalSettings.adminTitle || "E").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="font-bold text-lg tracking-tight text-white opacity-0 group-hover/aside:opacity-100 max-lg:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden w-0 group-hover/aside:w-auto max-lg:w-auto">{globalSettings.adminTitle || "EShop Admin"}</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3 opacity-0 group-hover/aside:opacity-100 max-lg:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden w-0 group-hover/aside:w-auto max-lg:w-auto">Main Menu</p>
              <nav className="space-y-1">
                {dynamicNav.map((item) => {
                  const isActive = pathname === item.href;
                  const isChildActive = item.children?.some(c => {
                    if (c.children) return c.children.some(sub => pathname === sub.href);
                    return pathname === c.href;
                  });
                  return (
                    <NavItem
                      key={item.id}
                      item={item}
                      isActive={isActive}
                      isChildActive={!!isChildActive}
                      hasModuleAccess={hasModuleAccess}
                      isHovered={isHovered}
                    />
                  );
                })}
              </nav>
            </div>

            {isSuperAdmin && isSuperAdmin() && (
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3 opacity-0 group-hover/aside:opacity-100 max-lg:opacity-100 transition-all duration-300 whitespace-nowrap overflow-hidden w-0 group-hover/aside:w-auto max-lg:w-auto">Administration</p>
                <nav className="space-y-1">
                  {ADMIN_NAV.map((item) => {
                    const isActive = pathname === item.href;
                    const isChildActive = item.children?.some(c => pathname === c.href);
                    return (
                      <NavItem
                        key={item.id}
                        item={item}
                        isActive={isActive}
                        isChildActive={!!isChildActive}
                        hasModuleAccess={() => true}
                        isHovered={isHovered}
                      />
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Profile footer â€” click to navigate to profile */}
        <div
          className="p-4 lg:px-4 lg:py-4 group-hover/aside:p-6 border-t border-white/10 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors group/profile"
          onClick={() => router.push('/dashboard/profile')}
          title="View Profile"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full dashboard-active-pill border border-white/15 overflow-hidden shrink-0 shadow-sm flex items-center justify-center font-bold text-sm">
              {user?.avatar
                ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                : (user?.name || 'A').charAt(0).toUpperCase()
              }
            </div>
            <div className="min-w-0 opacity-0 group-hover/aside:opacity-100 max-lg:opacity-100 transition-all duration-300 w-0 group-hover/aside:w-auto max-lg:w-auto overflow-hidden whitespace-nowrap">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[11px] font-medium text-slate-400 truncate tracking-wide flex items-center gap-1">
                <User className="w-3 h-3" />
                {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}