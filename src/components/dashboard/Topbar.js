'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { 
  Bell, LogOut, Settings, User as UserIcon, Sun, Moon, Menu, 
  ExternalLink, Key, ShoppingBag, RotateCcw, XCircle, Star, 
  Mail, CheckCheck, Volume2, VolumeX, Smartphone, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebPush } from '@/lib/useWebPush';
import showToast from '@/lib/storeToast';

function playCashRegisterChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Tone 1: High crisp ping
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Tone 2: Harmonic shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, now + 0.08); // E6
    gain2.gain.setValueAtTime(0.18, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.65);
  } catch (e) {}
}

export default function Topbar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { user, logout, isSuperAdmin, hasModuleAccess } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Admin Notification Feed State
  const [adminNotifs, setAdminNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [topbarBranding, setTopbarBranding] = useState({ title: 'EShop Admin', logo: '' });

  // Web Push for Admin Devices
  const { isSupported: isPushSupported, isSubscribed: isPushSubscribed, subscribe: subscribePush, loading: pushLoading } = useWebPush('admin');

  // Load sound setting and theme branding
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_sound_chime');
      if (saved !== null) setSoundEnabled(saved === 'true');
    } catch (e) {}

    const fetchBranding = () => {
      fetch('/api/admin/theme')
        .then(res => res.json())
        .then(json => {
          if (json.theme) {
            setTopbarBranding({
              title: json.theme.adminTitle || json.theme.brandName || 'EShop Admin',
              logo: json.theme.adminLogo || json.theme.logo || ''
            });
          }
        })
        .catch(() => {});
    };

    fetchBranding();
    window.addEventListener('themeUpdated', fetchBranding);
    return () => window.removeEventListener('themeUpdated', fetchBranding);
  }, []);

  const toggleSound = (e) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    try { localStorage.setItem('admin_sound_chime', String(next)); } catch (e) {}
    if (next) playCashRegisterChime();
  };

  const fetchAdminNotifications = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch('/api/admin/notifications?limit=8');
      const data = await res.json();
      if (data.success) {
        setAdminNotifs(data.notifications || []);
        const newUnread = data.unreadCount || 0;

        // If new unread alerts arrived while dashboard is open, ring audio chime
        if (!isInitial && newUnread > prevUnreadRef.current && soundEnabled) {
          playCashRegisterChime();
        }

        prevUnreadRef.current = newUnread;
        setUnreadCount(newUnread);
      }
    } catch (e) {}
  }, [soundEnabled]);

  useEffect(() => {
    setMounted(true);
    fetchAdminNotifications(true);

    const interval = setInterval(() => {
      fetchAdminNotifications(false);
    }, 12000); // 12-second live poll

    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handler);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handler);
    };
  }, [fetchAdminNotifications]);

  async function handleMarkAllRead(e) {
    e.stopPropagation();
    try {
      setAdminNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      prevUnreadRef.current = 0;

      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'all' })
      });
    } catch (e) {}
  }

  async function handleNotificationClick(id, link) {
    setNotifOpen(false);
    try {
      setAdminNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));

      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        keepalive: true
      });
    } catch (e) {}
  }

  const displayName = user?.name || user?.email || 'Admin';
  const initials = displayName.charAt(0).toUpperCase();
  const avatarSrc = user?.avatar ? user.avatar : null;

  function getNotifBadge(type) {
    switch (type) {
      case 'new_order':
        return { icon: <ShoppingBag className="w-3.5 h-3.5" />, bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'NEW ORDER' };
      case 'order_cancelled':
        return { icon: <XCircle className="w-3.5 h-3.5" />, bg: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20', label: 'CANCELLED' };
      case 'return_requested':
        return { icon: <RotateCcw className="w-3.5 h-3.5" />, bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'RETURN REQ' };
      case 'new_review':
        return { icon: <Star className="w-3.5 h-3.5" />, bg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20', label: 'NEW REVIEW' };
      default:
        return { icon: <Mail className="w-3.5 h-3.5" />, bg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20', label: 'EVENT' };
    }
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-8 transition-colors duration-200 shadow-xs shrink-0">
      <div className="flex items-center gap-3 lg:hidden">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="p-2 -ml-2 text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
            {topbarBranding.logo ? (
              <img src={topbarBranding.logo} alt="Logo" className="w-full h-full object-contain p-0.5" />
            ) : (
              <span className="font-extrabold text-primary text-xs">
                {topbarBranding.title.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="font-bold text-base text-foreground tracking-tight">{topbarBranding.title}</span>
        </Link>
      </div>

      <div className="flex-1 hidden lg:block" />

      {/* Visit Website Button */}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border bg-muted/50 hover:bg-primary hover:text-primary-foreground hover:border-primary text-sm font-medium text-muted-foreground transition-all duration-200 group shrink-0"
      >
        <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        Visit Website
      </a>

      <div className="flex items-center gap-3.5">
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-muted-foreground hover:bg-muted text-foreground rounded-full transition-colors"
            title="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        {/* ── Real-Time Store Activity & Notification Bell ─────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors flex items-center justify-center focus:outline-none"
            title="Store Activity & Orders"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm border-2 border-background animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 dropdown-menu-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 origin-top-right border border-border"
              >
                {/* Popover Header */}
                <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">Store Activity</span>
                    {unreadCount > 0 && (
                      <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Chime Toggle */}
                    <button
                      type="button"
                      onClick={toggleSound}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-xs flex items-center gap-1"
                      title={soundEnabled ? 'Chime sound active (Click to mute)' : 'Chime sound muted (Click to enable)'}
                    >
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    </button>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> Mark read
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
                  {adminNotifs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-xs">
                      No recent store events
                    </div>
                  ) : (
                    adminNotifs.map((n) => {
                      const badge = getNotifBadge(n.type);
                      const isUnread = !n.read;

                      return (
                        <Link
                          key={n._id}
                          href={n.link || '/dashboard/ecommerce/orders'}
                          onClick={() => handleNotificationClick(n._id, n.link)}
                          className={`flex items-start gap-3 p-3.5 text-left transition-colors hover:bg-muted/50 ${isUnread ? 'bg-primary/5' : ''}`}
                        >
                          <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${badge.bg}`}>
                            {badge.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded border uppercase ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className={`text-xs font-semibold truncate ${isUnread ? 'text-foreground font-bold' : 'text-foreground/80'}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                          </div>

                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-xs">
                  {isPushSupported && !isPushSubscribed ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await subscribePush(user?.email);
                        if (res.success) showToast.success('🔔 Admin Web Push Enabled!');
                      }}
                      disabled={pushLoading}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Enable Desktop Push
                    </button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      🔔 Live Alerts Active
                    </span>
                  )}

                  <Link
                    href="/dashboard/ecommerce/orders"
                    onClick={() => setNotifOpen(false)}
                    className="font-bold text-foreground hover:text-primary flex items-center gap-1 text-[11px]"
                  >
                    View Orders <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none"
            onClick={() => setDropOpen(!dropOpen)}
          >
            <div className="w-9 h-9 rounded-full dashboard-active-pill flex items-center justify-center text-sm font-bold shadow-sm border-2 border-background overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-foreground leading-tight">{displayName}</p>
              <p className="text-xs text-muted-foreground leading-tight">{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
            </div>
          </button>

          <AnimatePresence>
            {dropOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 dropdown-menu-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 origin-top-right border border-border"
              >
                {/* User info header */}
                <div className="px-4 py-3.5 border-b border-border bg-muted/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full dashboard-active-pill flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="py-1.5">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-muted-foreground" />
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard/ecommerce/theme"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Brand & Theme Settings
                  </Link>
                  {isSuperAdmin && isSuperAdmin() && (
                    <>
                      <Link
                        href="/dashboard/users"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        Manage Users
                      </Link>
                      <Link
                        href="/dashboard/profile/api-keys"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Key className="w-4 h-4 text-muted-foreground" />
                        Manage API Keys
                      </Link>
                    </>
                  )}
                </div>

                <div className="py-1.5 border-t border-border">
                  <button
                    onClick={() => { setDropOpen(false); logout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
