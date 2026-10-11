'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import Breadcrumb from '@/components/dashboard/Breadcrumb'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, LayoutTemplate, Box, Edit3, MessageSquare, Image as ImageIcon, Users, Star, Award, ArrowRight, Settings, Building, Globe, Plus, Search, Bell, Shield, Key, RefreshCw, ArrowDownUp, ShoppingBag, FolderPlus, Truck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    function update() {
      const now = new Date()
      const t = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      const d = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      setTime(`${t} | ${d}`)
    }
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground w-fit">
      <Calendar className="w-4 h-4" />
      <span className="font-medium tracking-wide">{time}</span>
    </div>
  )
}

const STAT_CONFIG = {
  banners:        { label: 'Banners',        icon: LayoutTemplate, bg: 'stat-card-violet',   iconColor: 'text-violet-600 dark:text-violet-400',  iconBg: 'bg-violet-500/15' },
  products:       { label: 'Products',       icon: Box,            bg: 'stat-card-blue',     iconColor: 'text-blue-600 dark:text-blue-400',        iconBg: 'bg-blue-500/15' },
  blogs:          { label: 'Blogs',          icon: Edit3,          bg: 'stat-card-rose',     iconColor: 'text-rose-600 dark:text-rose-400',        iconBg: 'bg-rose-500/15' },
  enquiries:      { label: 'Enquiries',      icon: MessageSquare,  bg: 'stat-card-sky',      iconColor: 'text-sky-600 dark:text-sky-400',          iconBg: 'bg-sky-500/15' },
  gallery:        { label: 'Gallery',        icon: ImageIcon,      bg: 'stat-card-amber',    iconColor: 'text-amber-600 dark:text-amber-400',    iconBg: 'bg-amber-500/15' },
  users:          { label: 'System Users',   icon: Users,          bg: 'stat-card-emerald',  iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/15' },
  whyChoose:      { label: 'Why Choose',     icon: Star,           bg: 'stat-card-orange',   iconColor: 'text-orange-600 dark:text-orange-400', iconBg: 'bg-orange-500/15' },
  certifications: { label: 'Certifications', icon: Award,          bg: 'stat-card-purple',   iconColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-500/15' },
}

// Maps each dashboard page entry to the permission module required to access it.
// Pages with permission: null are always visible (e.g. dashboard overview).
const DASHBOARD_PAGES = [
  // ── Core ──
  { name: 'Dashboard Overview',           href: '/dashboard',                                permission: null },

  // ── Storefront Management ──
  { name: 'Storefront Overview',          href: '/dashboard/ecommerce',                      permission: null },
  { name: 'Orders',                       href: '/dashboard/ecommerce/orders',               permission: null },
  { name: 'Products',                     href: '/dashboard/ecommerce/products',             permission: null },
  { name: 'Product Categories',           href: '/dashboard/ecommerce/categories',           permission: null },
  { name: 'Attribute Templates',          href: '/dashboard/ecommerce/attribute-templates',  permission: null },
  { name: 'Add-on Categories',            href: '/dashboard/ecommerce/addon-categories',     permission: null },
  { name: 'Add-ons',                      href: '/dashboard/ecommerce/addons',               permission: null },
  { name: 'Customers',                    href: '/dashboard/ecommerce/customers',            permission: null },
  { name: 'Shipping Rules',               href: '/dashboard/ecommerce/shipping',             permission: null },
  { name: 'Delivery Slots',               href: '/dashboard/ecommerce/delivery-slots',       permission: null },
  { name: 'Store & Payment Settings',     href: '/dashboard/ecommerce/settings',             permission: null },
  { name: 'Invoice Settings',             href: '/dashboard/ecommerce/invoice-settings',     permission: null },

  // ── Storefront CMS ──
  { name: 'Brand & Theme Customizer',     href: '/dashboard/ecommerce/theme',                permission: null },
  { name: 'Homepage Layout & Ordering',   href: '/dashboard/homepage',                       permission: null },
  { name: 'About Us Page CMS',            href: '/dashboard/ecommerce/about',                permission: null },
  { name: 'Footer & Brand Story',         href: '/dashboard/ecommerce/footer',               permission: null },
  { name: 'Customer Testimonials',        href: '/dashboard/ecommerce/testimonials',         permission: null },
  { name: 'Help & FAQs CMS',              href: '/dashboard/ecommerce/faqs',                 permission: null },
  { name: 'Custom Pages',                 href: '/dashboard/custom-pages',                   permission: null },
  { name: 'Blog & Journal CMS',           href: '/dashboard/blogs',                          permission: null },
  { name: 'Contact Page CMS',             href: '/dashboard/contact',                        permission: null },

  // ── Communication ──
  { name: 'Enquiries',                    href: '/dashboard/enquiries',                      permission: null },
  { name: 'Email Templates',              href: '/dashboard/email-templates',                permission: null },

  // ── Settings & Tools ──
  { name: 'File Manager',                 href: '/dashboard/files',                          permission: 'global_settings' },
  { name: 'AI Assistant',                 href: '/dashboard/advanced/ai',                    permission: 'global_settings' },
  { name: 'SEO Health Audit',             href: '/dashboard/advanced/seo-audit',             permission: null },

  // ── Administration (Super Admin) ──
  { name: 'Manage Users',                 href: '/dashboard/users',                          permission: 'users' },
  { name: 'Security Settings',            href: '/dashboard/security',                       permission: 'users' },
  { name: 'Activity Logs',                href: '/dashboard/activity-logs',                  permission: 'users' },
  { name: 'Redirect Manager',             href: '/dashboard/advanced/redirects',             permission: 'users' },
  { name: 'Sitemap Manager',              href: '/dashboard/advanced/sitemap',               permission: 'users' },
  { name: 'Integrations & Code',          href: '/dashboard/advanced/integrations',          permission: 'users' },
  { name: 'Performance Monitor',          href: '/dashboard/advanced/performance',           permission: 'users' },
  { name: 'Error & 404 Monitor',          href: '/dashboard/advanced/error-monitor',         permission: 'users' },
  { name: 'Activity Logs',                href: '/dashboard/logs',                           permission: 'users' },
  { name: 'Cache Management',             href: '/dashboard/advanced/cache',                 permission: 'users' },
  { name: 'Maintenance Mode',             href: '/dashboard/advanced/maintenance',           permission: 'users' },
  { name: 'Backup Management',            href: '/dashboard/advanced/backups',               permission: 'users' },

  // ── Profile ──
  { name: 'My Profile',                   href: '/dashboard/profile',                        permission: null },
  { name: 'API Keys',                     href: '/dashboard/profile/api-keys',               permission: null },
]


export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [recentEnquiries, setRecentEnquiries] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, hasModuleAccess } = useAuth()
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Quick Actions menu state
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const quickMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target)) {
        setShowQuickMenu(false)
      }
    }
    if (showQuickMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showQuickMenu])

  // Filter pages by permission — mirrors the sidebar's hasModuleAccess check.
  // Pages with permission: null (e.g. dashboard root) are always shown.
  const accessiblePages = useMemo(() => {
    return DASHBOARD_PAGES.filter(p => p.permission === null || hasModuleAccess(p.permission))
  }, [user])

  const filteredPages = accessiblePages.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  async function fetchData() {
    setLoading(true)
    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 600))
      const [statsRes, healthRes, analyticsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/system/health'),
        fetch('/api/analytics/stats'),
        minDelay
      ])
      
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.stats)
        setRecentEnquiries(statsData.recentEnquiries || [])
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json()
        setHealth(healthData)
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const currentMonthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Determine permission count or super admin status
  const isSuperAdmin = user?.role === 'super_admin';
  const permissionCount = user?.permissions 
    ? Object.values(user.permissions).filter(actions => Array.isArray(actions) && actions.length > 0).length 
    : 0;

  return (
    <div className="min-h-full flex flex-col bg-background">
      
      <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-[1600px] w-full mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Hello, {user?.name ? user.name.split(' ')[0] : 'Admin'}</h1>
                <Clock />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search pages..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  className="pl-9 pr-4 py-2 bg-muted/50 text-foreground border border-transparent focus:border-border rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 w-64 transition-all"
                />
                {showSearch && searchQuery && (
                  <div className="absolute top-full mt-2 w-full dropdown-menu-surface border border-border/80 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                    {filteredPages.length > 0 ? filteredPages.map(p => (
                      <Link href={p.href} key={p.href} className="block px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 border-b border-border/50 dark:border-slate-800/60 last:border-0 font-medium transition-colors">
                        {p.name}
                      </Link>
                    )) : (
                      <div className="px-4 py-4 text-sm text-muted-foreground text-center">No matching pages found</div>
                    )}
                  </div>
                )}
              </div>
              <Button onClick={fetchData} variant="ghost" size="icon" className="rounded-xl bg-muted/50 hover:bg-muted text-foreground" title="Refresh Dashboard">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          
          {/* Main Left Column */}
          <div className="flex-1 space-y-8 overflow-hidden">
            
            {/* Real-time Analytics Section */}
            <div className="mb-8">
               <h2 className="text-xl font-bold text-foreground mb-4">Real-time Analytics</h2>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {/* Visitors Today */}
                  <Card className="border shadow-xs rounded-2xl stat-card-blue transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden relative group">
                     <CardContent className="p-5 flex flex-col justify-center">
                        <div className="flex items-center gap-2.5 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                              <Users className="w-4 h-4" />
                           </div>
                           <p className="text-xs font-bold text-foreground/80">Visitors Today</p>
                        </div>
                        {loading ? <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse mt-1" /> : (
                           <h4 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">{analytics?.visitorsToday?.toLocaleString() || 0}</h4>
                        )}
                     </CardContent>
                  </Card>
                  
                  {/* Active Users */}
                  <Card className="border shadow-xs rounded-2xl stat-card-emerald transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden relative group">
                     <CardContent className="p-5 flex flex-col justify-center">
                        <div className="flex items-center gap-2.5 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                             <span className="relative flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                             </span>
                           </div>
                           <p className="text-xs font-bold text-foreground/80">Active Users (5m)</p>
                        </div>
                        {loading ? <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse mt-1" /> : (
                           <h4 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">{analytics?.activeUsers?.toLocaleString() || 0}</h4>
                        )}
                     </CardContent>
                  </Card>

                  {/* Page Views */}
                  <Card className="border shadow-xs rounded-2xl stat-card-amber transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden relative group">
                     <CardContent className="p-5 flex flex-col justify-center">
                        <div className="flex items-center gap-2.5 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                              <Globe className="w-4 h-4" />
                           </div>
                           <p className="text-xs font-bold text-foreground/80">Page Views</p>
                        </div>
                        {loading ? <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse mt-1" /> : (
                           <h4 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">{analytics?.pageViews?.toLocaleString() || 0}</h4>
                        )}
                     </CardContent>
                  </Card>

                  {/* Bounce Rate */}
                  <Card className="border shadow-xs rounded-2xl stat-card-rose transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden relative group">
                     <CardContent className="p-5 flex flex-col justify-center">
                        <div className="flex items-center gap-2.5 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                              <ArrowDownUp className="w-4 h-4" />
                           </div>
                           <p className="text-xs font-bold text-foreground/80">Bounce Rate</p>
                        </div>
                        {loading ? <div className="h-8 w-16 bg-black/10 dark:bg-white/10 rounded animate-pulse mt-1" /> : (
                           <h4 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">{analytics?.bounceRate || 0}%</h4>
                        )}
                     </CardContent>
                  </Card>
               </div>
            </div>

            {/* Quick Actions Title */}
            <div className="flex items-center justify-between mb-4 relative" ref={quickMenuRef}>
              <h2 className="text-xl font-bold text-foreground">Quick actions</h2>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setShowQuickMenu(prev => !prev)}
                className="rounded-xl h-8 w-8 bg-card border-border shadow-xs hover:bg-muted text-foreground transition-all cursor-pointer"
                title="Create or quick action"
              >
                <Plus className={`w-4 h-4 transition-transform duration-200 ${showQuickMenu ? 'rotate-45 text-rose-500' : ''}`} />
              </Button>

              {/* Quick Actions Dropdown Menu */}
              {showQuickMenu && (
                <div className="absolute right-0 top-10 w-72 dropdown-menu-surface rounded-2xl shadow-2xl border border-border p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Quick Create & Actions
                  </div>
                  <div className="py-1 space-y-0.5">
                    {[
                      { label: 'Add New Product', desc: 'Create item in store', href: '/dashboard/ecommerce/products', icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/15' },
                      { label: 'Add Category', desc: 'Organize your catalog', href: '/dashboard/ecommerce/categories', icon: FolderPlus, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/15' },
                      { label: 'Write Blog Post', desc: 'Publish an article', href: '/dashboard/blogs', icon: Edit3, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/15' },
                      { label: 'Shipping Rules', desc: 'Configure delivery zones', href: '/dashboard/ecommerce/shipping', icon: Truck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/15' },
                      { label: 'Invite User / Staff', desc: 'Add admin or staff', href: '/dashboard/users', icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/15' },
                    ].map((act, i) => (
                      <Link
                        key={i}
                        href={act.href}
                        onClick={() => setShowQuickMenu(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted text-foreground transition-colors group cursor-pointer"
                      >
                        <div className={`w-8 h-8 rounded-lg ${act.bg} ${act.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                          <act.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{act.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{act.desc}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Users (Mocking the "Latest Transaction" avatars) */}
            {/* Only show quick-action cards for modules the user can access */}
            {(hasModuleAccess('global_settings') || hasModuleAccess('home') || hasModuleAccess('inner_pages')) && (
            <div className="flex gap-4 overflow-x-auto mb-8 pb-2">
               {[
                 hasModuleAccess('global_settings') && { name: 'Website Details', email: 'Manage SEO & Info', icon: Settings, link: '/dashboard/settings' },
                 hasModuleAccess('home') && { name: 'Home Content', email: 'Banners & CTAs', icon: LayoutTemplate, link: '/dashboard/home/banner' },
                 hasModuleAccess('inner_pages') && { name: 'Inner Pages', email: 'Corporate & Vision', icon: Building, link: '/dashboard/inner-pages/sections' },
               ].filter(Boolean).map((item, i) => (
                 <Link href={item.link} key={i}>
                   <div className="flex items-center gap-3 bg-card border border-border px-4 py-3 rounded-2xl hover:bg-muted transition-colors min-w-[220px]">
                     <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                       <item.icon className="w-5 h-5" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-foreground">{item.name}</p>
                       <p className="text-[11px] text-muted-foreground">{item.email}</p>
                     </div>
                   </div>
                 </Link>
               ))}
            </div>
            )}

            {/* System Content Metrics Section */}
            <div className="mb-8">
               <h2 className="text-xl font-bold text-foreground mb-4">Content Metrics</h2>
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                 {Object.keys(STAT_CONFIG).map((key, i) => {
                   const config = STAT_CONFIG[key]
                   const Icon = config.icon
                   const value = stats ? stats[key] : 0
                   
                   return (
                        <Card key={i} className={`h-full border shadow-xs rounded-2xl ${config.bg} cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group`}>
                          <CardContent className="p-5 flex flex-col items-start gap-3.5">
                            <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0 ${config.iconColor} group-hover:scale-110 transition-transform duration-300 shadow-2xs`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 mt-1">
                              <p className="text-xs font-bold text-foreground/80 mb-1">{config.label}</p>
                              {loading ? (
                                  <div className="h-8 w-16 bg-muted rounded animate-pulse mt-1" />
                              ) : (
                                  <h4 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{value.toLocaleString()}</h4>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                   )
                 })}
               </div>
            </div>

            {/* Charts Section */}
            {!loading && analytics && (
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                 <Card className="border border-border shadow-sm rounded-2xl bg-card">
                    <CardHeader className="pb-2 border-b border-border/50">
                       <CardTitle className="text-sm font-bold">Device Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 h-64 flex flex-col items-center justify-center">
                       {analytics.devices?.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                             <Pie data={analytics.devices} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name" stroke="none">
                               {analytics.devices.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                             </Pie>
                             <RechartsTooltip 
                               contentStyle={{ 
                                 borderRadius: '12px', 
                                 border: '1px solid var(--border)', 
                                 background: 'var(--card)',
                                 color: 'var(--card-foreground)',
                                 boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)' 
                               }} 
                             />
                           </PieChart>
                         </ResponsiveContainer>
                       ) : <p className="text-muted-foreground text-sm">No data yet</p>}
                    </CardContent>
                 </Card>

                 <Card className="border border-border shadow-sm rounded-2xl bg-card">
                    <CardHeader className="pb-2 border-b border-border/50">
                       <CardTitle className="text-sm font-bold">Top Browsers</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 h-64">
                       {analytics.browsers?.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.browsers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <XAxis type="number" hide />
                              <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                fontSize={12}
                                width={70}
                                tick={{ fill: '#9ca3af' }}
                              />
                              <RechartsTooltip
                                cursor={{ fill: 'rgba(156,163,175,0.15)' }}
                                contentStyle={{
                                  borderRadius: '12px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--card)',
                                  color: 'var(--card-foreground)',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.2)'
                                }}
                              />
                              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                          </ResponsiveContainer>
                       ) : <p className="text-muted-foreground text-sm flex h-full items-center justify-center">No data yet</p>}
                    </CardContent>
                 </Card>

                 <Card className="border border-border shadow-sm rounded-2xl xl:col-span-1 lg:col-span-2">
                    <CardHeader className="pb-2 border-b border-border/50">
                       <CardTitle className="text-sm font-bold">Top Countries</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 h-64">
                       {analytics.countries?.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={analytics.countries}>
                             <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                             <YAxis hide />
                             <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                             <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                           </BarChart>
                         </ResponsiveContainer>
                       ) : <p className="text-muted-foreground text-sm flex h-full items-center justify-center">No data yet</p>}
                    </CardContent>
                 </Card>
               </div>
            )}

            {/* Top Pages & Recent Enquiries split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Quick Navigation Links — filtered by user permissions */}
               <div>
                 <h2 className="text-xl font-bold text-foreground mb-4">Navigation</h2>
                 <div className="flex flex-col space-y-1">
                   {[
                     hasModuleAccess('products')       && { label: 'Add New Product',       href: '/dashboard/products' },
                     hasModuleAccess('blogs')          && { label: 'Write Blog Post',        href: '/dashboard/blogs' },
                     hasModuleAccess('gallery')        && { label: 'Upload to Gallery',      href: '/dashboard/gallery' },
                     hasModuleAccess('home')           && { label: 'Edit Home Banner',       href: '/dashboard/home/banner' },
                     hasModuleAccess('certifications') && { label: 'Manage Certifications',  href: '/dashboard/certifications' },
                   ].filter(Boolean).map((link, i) => (
                     <Link key={i} href={link.href}>
                       <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted/50 group cursor-pointer transition-colors border border-transparent hover:border-border">
                         <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0`}>
                                 <Globe className="w-4 h-4 text-muted-foreground" />
                             </div>
                             <span className="font-bold text-sm text-foreground">{link.label}</span>
                         </div>
                         <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                       </div>
                     </Link>
                   ))}
                   {/* Show a friendly message if no navigation items are accessible */}
                   {!hasModuleAccess('products') && !hasModuleAccess('blogs') && !hasModuleAccess('gallery') && !hasModuleAccess('home') && !hasModuleAccess('certifications') && (
                     <div className="text-center py-6 text-muted-foreground text-sm bg-muted/20 rounded-2xl border border-border">
                       No quick actions available for your access level.
                     </div>
                   )}
                 </div>
               </div>

               {/* Recent Enquiries */}
               <div>
                 <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-bold text-foreground">Recent Enquiries</h2>
                   <Link href="/dashboard/enquiries">
                     <span className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer">View All</span>
                   </Link>
                 </div>
                 
                 <div className="flex flex-col space-y-1">
                     {loading ? (
                         [...Array(5)].map((_, i) => (
                             <div key={i} className="flex items-center gap-4 py-3 border-b border-border">
                                 <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                                 <div className="flex-1">
                                   <div className="h-4 w-32 bg-muted rounded animate-pulse mb-1" />
                                   <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                                 </div>
                             </div>
                         ))
                     ) : recentEnquiries.length === 0 ? (
                         <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-2xl border border-border">No recent enquiries found.</div>
                     ) : (
                         recentEnquiries.map(enq => {
                           const initial = enq.contactPerson ? enq.contactPerson.charAt(0).toUpperCase() : 'U';
                           return (
                             <div key={enq._id} className="flex items-center justify-between py-4 border-b border-border hover:bg-muted/50 px-2 -mx-2 rounded-xl transition-colors cursor-pointer" onClick={() => window.location.href = '/dashboard/enquiries'}>
                               <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                                   {initial}
                                 </div>
                                 <div>
                                   <h4 className="text-sm font-bold text-foreground">{enq.contactPerson}</h4>
                                   <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(enq.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                 </div>
                               </div>
                               <Badge 
                                 variant="outline"
                                 className={`capitalize px-2 py-0.5 border-none font-bold text-[10px] ${
                                     enq.status === 'new' ? 'bg-orange-500/20 text-orange-600' :
                                     enq.status === 'replied' ? 'bg-green-500/20 text-green-600' :
                                     'bg-muted text-muted-foreground'
                                 }`}
                               >
                                 {enq.status || 'new'}
                               </Badge>
                             </div>
                           )
                         })
                     )}
                 </div>
               </div>
            </div>



          </div>

          {/* Right Sidebar */}
          <div className="w-full xl:w-[380px] space-y-8 flex-shrink-0">
             
             {/* Admin Status / Profile Card */}
             <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold text-foreground">Admin Profile</h3>
                 <Link href="/dashboard/settings">
                   <Button variant="outline" size="icon" className="rounded-xl h-8 w-8 bg-background border-border shadow-sm"><Settings className="w-4 h-4 text-muted-foreground" /></Button>
                 </Link>
               </div>
               
               {/* Dark Card */}
               <div className="bg-[#0a0a0a] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-border/50">
                 <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-gradient-to-br from-purple-400 to-green-300 rounded-full opacity-20 blur-2xl" />
                 
                 <div className="flex justify-between items-center mb-8 relative z-10">
                   <div className="flex items-center gap-2">
                     <Shield className="w-5 h-5 text-purple-300" />
                     <span className="font-medium text-white/70 tracking-wide capitalize">{user?.role?.replace('_', ' ') || 'Admin'}</span>
                   </div>
                   <div className="flex gap-1">
                     <div className="w-5 h-5 rounded-full bg-white/80" />
                     <div className="w-5 h-5 rounded-full bg-white/40 -ml-2" />
                   </div>
                 </div>
                 
                 <div className="mb-8 relative z-10">
                   <h2 className="text-2xl font-bold tracking-tight mb-1 truncate">{user?.name || 'Administrator'}</h2>
                   <p className="text-xs text-white/50 truncate">{user?.email || 'admin@jindalstainless.com'}</p>
                 </div>
                 
                 <div className="flex items-end justify-between relative z-10">
                    <div className="flex flex-col gap-1 text-xs text-white/50 font-medium">
                        <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5" /> Access Level</span>
                        <span className="text-white text-sm font-semibold">
                            {isSuperAdmin ? 'Full System Access' : `${permissionCount} Module${permissionCount !== 1 ? 's' : ''} Authorized`}
                        </span>
                    </div>
                 </div>
               </div>
             </div>

             {/* System Health Card */}
             <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">System Health</h3>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health?.status === 'OK' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${health?.status === 'OK' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">{health?.status || 'Loading...'}</span>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Database Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground mb-0.5">Database</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{health?.database?.latencyMs || 0}ms latency</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`border-none font-bold ${health?.database?.status === 'Connected' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                      {health?.database?.status || 'Check'}
                    </Badge>
                  </div>

                  {/* Memory Usage */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Box className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground mb-0.5">Memory</p>
                        <p className="text-[11px] text-muted-foreground font-medium">Resident Set Size</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground bg-muted px-3 py-1 rounded-full">{health?.memory?.rss || '0 MB'}</span>
                  </div>

                  {/* Uptime */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground mb-0.5">Uptime</p>
                        <p className="text-[11px] text-muted-foreground font-medium">Server Process</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground bg-muted px-3 py-1 rounded-full">
                      {health?.uptimeSeconds ? (health.uptimeSeconds / 3600).toFixed(1) + 'h' : '0h'}
                    </span>
                  </div>
                </div>
             </div>

             {/* Top Pages */}
             <div className="pt-2">
               <h3 className="text-lg font-bold text-foreground mb-4 px-2">Top Visited Pages</h3>
               <div className="flex flex-col space-y-1">
                  {loading ? (
                      [...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-3">
                              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                              <div className="h-4 w-10 bg-muted rounded animate-pulse" />
                          </div>
                      ))
                  ) : analytics?.topPages?.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-2xl border border-border mx-2">No page visits recorded yet.</div>
                  ) : (
                      analytics?.topPages?.map((page, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted/50 group transition-colors border border-transparent hover:border-border">
                             <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                                <span className="text-sm font-medium text-foreground truncate max-w-[160px]">{page.path}</span>
                             </div>
                             <Badge variant="secondary" className="font-mono bg-blue-50 text-blue-700 hover:bg-blue-100">{page.views.toLocaleString()}</Badge>
                          </div>
                      ))
                  )}
               </div>
             </div>

          </div>
        </div>
        
      </div>
    </div>
  )
}

