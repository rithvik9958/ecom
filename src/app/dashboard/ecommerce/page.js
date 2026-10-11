'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import {
  ShoppingCart, Users, Package, DollarSign, TrendingUp,
  ArrowUpRight, Clock, CheckCircle2, XCircle, RotateCcw,
  Truck, AlertCircle, BarChart2, Star
} from 'lucide-react';
import Link from 'next/link';

// --- Mini SVG Bar Chart (no external deps) ---
function BarChart({ data = [], labels = [], height = 120 }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px`, width: '100%' }}>
      {data.map((val, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
          <span className="text-[9px] text-muted-foreground font-medium" title={`₹${val.toLocaleString('en-IN')}`}>
            {val > 0 ? `₹${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}` : ''}
          </span>
          <div
            style={{
              width: '100%',
              height: `${Math.max((val / max) * (height - 30), val > 0 ? 4 : 2)}px`,
              background: val > 0
                ? 'linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)'
                : 'hsl(var(--muted))',
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.4s ease',
            }}
          />
          <span className="text-[9px] text-muted-foreground" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// --- Status badge config ---
const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'text-amber-600',  bg: 'bg-amber-500/10',   icon: Clock },
  confirmed:  { label: 'Confirmed', color: 'text-blue-600',   bg: 'bg-blue-500/10',    icon: CheckCircle2 },
  processing: { label: 'Processing',color: 'text-indigo-600', bg: 'bg-indigo-500/10',  icon: RotateCcw },
  shipped:    { label: 'Shipped',   color: 'text-purple-600', bg: 'bg-purple-500/10',  icon: Truck },
  delivered:  { label: 'Delivered', color: 'text-green-600',  bg: 'bg-green-500/10',   icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled', color: 'text-red-600',    bg: 'bg-red-500/10',     icon: XCircle },
  returned:   { label: 'Returned',  color: 'text-orange-600', bg: 'bg-orange-500/10',  icon: RotateCcw },
  refunded:   { label: 'Refunded',  color: 'text-gray-600',   bg: 'bg-gray-500/10',    icon: AlertCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color} ${cfg.bg}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

export default function EcommerceOverviewPage() {
  const [stats, setStats] = useState({
    totalOrders: 0, totalCustomers: 0, totalProducts: 0, totalSales: 0,
    revenueChart: { labels: [], data: [] },
    orderStatusBreakdown: [],
    topProducts: [],
    recentOrdersList: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/store-stats')
      .then(res => res.json())
      .then(data => { if (!data.message) setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Sales',       value: `₹${stats.totalSales.toLocaleString('en-IN')}`, icon: DollarSign,   color: 'text-green-600',  bg: 'bg-green-500/10'  },
    { label: 'Total Orders',      value: stats.totalOrders,                               icon: ShoppingCart, color: 'text-blue-600',   bg: 'bg-blue-500/10'   },
    { label: 'Active Customers',  value: stats.totalCustomers,                            icon: Users,        color: 'text-purple-600', bg: 'bg-purple-500/10' },
    { label: 'Total Products',    value: stats.totalProducts,                             icon: Package,      color: 'text-orange-600', bg: 'bg-orange-500/10' },
  ];

  const totalStatusOrders = (stats.orderStatusBreakdown || []).reduce((s, x) => s + x.count, 0) || 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb
        title="Storefront Overview"
        subtitle="Key metrics and analytics for your e-commerce operations"
        crumbs={[{ label: 'Storefront Management' }, { label: 'Overview' }]}
      />

      {/* ── Stat Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted/50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Row 2: Revenue Chart + Status Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Chart (last 7 days) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={15} className="text-primary" /> Revenue — Last 7 Days
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">Paid orders only</p>
            </div>
            <Link href="/dashboard/ecommerce/orders" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
              All Orders <ArrowUpRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="h-[150px] bg-muted/40 rounded-xl animate-pulse" />
          ) : (
            <BarChart data={stats.revenueChart?.data || []} labels={stats.revenueChart?.labels || []} height={150} />
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5">
            <BarChart2 size={15} className="text-primary" /> Order Status
          </h4>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-6 bg-muted/40 rounded animate-pulse" />)}
            </div>
          ) : stats.orderStatusBreakdown?.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {(stats.orderStatusBreakdown || []).sort((a, b) => b.count - a.count).map(({ status, count }) => {
                const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                const pct = Math.round((count / totalStatusOrders) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-[11px] text-muted-foreground font-bold">{count} <span className="text-[10px] font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cfg.color.replace('text-', 'bg-').replace('-600', '-500')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Recent Orders + Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShoppingCart size={14} className="text-primary" /> Recent Orders
            </h4>
            <Link href="/dashboard/ecommerce/orders" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />)}
            </div>
          ) : stats.recentOrdersList?.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No orders yet</div>
          ) : (
            <div className="divide-y divide-border">
              {(stats.recentOrdersList || []).map((order, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">
                      #{order.id?.toString().slice(-3)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{order.customer}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={order.status} />
                    <span className="text-xs font-bold text-foreground">₹{(order.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Star size={14} className="text-primary" /> Top Products
            </h4>
            <Link href="/dashboard/ecommerce/products" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
              Manage <ArrowUpRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-9 bg-muted/40 rounded animate-pulse" />)}
            </div>
          ) : stats.topProducts?.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No sales data yet</div>
          ) : (
            <div className="divide-y divide-border">
              {(stats.topProducts || []).map((product, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                  <span className="text-[11px] font-black text-muted-foreground w-4 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground">{product.units} units sold</p>
                  </div>
                  <span className="text-xs font-bold text-green-600 shrink-0">
                    ₹{product.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Manage Orders',    href: '/dashboard/ecommerce/orders',    icon: ShoppingCart, color: 'text-blue-600',   bg: 'bg-blue-500/10'   },
          { label: 'Manage Customers', href: '/dashboard/ecommerce/customers', icon: Users,        color: 'text-purple-600', bg: 'bg-purple-500/10' },
          { label: 'Manage Products',  href: '/dashboard/ecommerce/products',  icon: Package,      color: 'text-orange-600', bg: 'bg-orange-500/10' },
          { label: 'Shipping Rules',   href: '/dashboard/ecommerce/shipping',  icon: Truck,        color: 'text-green-600',  bg: 'bg-green-500/10'  },
        ].map(({ label, href, icon: Icon, color, bg }) => (
          <Link key={href} href={href}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg} ${color} group-hover:scale-110 transition-transform shrink-0`}>
              <Icon size={16} />
            </div>
            <span className="text-xs font-bold text-foreground">{label}</span>
            <ArrowUpRight size={12} className="ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
