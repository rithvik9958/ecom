'use client';
import { useState, useEffect, useMemo } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import Toast from '@/components/dashboard/Toast';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Edit2, Trash2, Ticket, Percent, IndianRupee, Clock, 
  Copy, Check, Users, UserPlus, Mail, Repeat, EyeOff 
} from 'lucide-react';
import CouponModal from './CouponModal';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // 'new' | coupon object
  const [confirmDelete, setConfirmDelete] = useState(null); // id
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [togglingId, setTogglingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const addToast = (msg, type = 'success') =>
    setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons || []);
      } else {
        throw new Error(data.message || 'Failed to load coupons');
      }
    } catch (err) {
      console.error(err);
      addToast(err.message || 'Error loading coupons', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopyCode = (code, id) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      addToast(`Coupon "${code}" copied to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSave = (savedCoupon) => {
    setCoupons(prev => {
      const idx = prev.findIndex(c => c._id === savedCoupon._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedCoupon;
        return next;
      }
      return [savedCoupon, ...prev];
    });
    setModal(null);
    addToast(modal === 'new' ? 'Coupon created successfully' : 'Coupon updated successfully');
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update status');

      setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !currentStatus } : c));
      addToast(`Coupon is now ${!currentStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      addToast(err.message, 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${confirmDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete coupon');

      setCoupons(prev => prev.filter(c => c._id !== confirmDelete));
      setSelectedIds(prev => prev.filter(id => id !== confirmDelete));
      addToast('Coupon deleted', 'warning');
    } catch (err) {
      addToast(err.message, 'danger');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })));
      setCoupons(prev => prev.filter(c => !selectedIds.includes(c._id)));
      addToast(`${selectedIds.length} coupons deleted`, 'warning');
      setSelectedIds([]);
    } catch (err) {
      addToast('Error during bulk deletion', 'danger');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Filter & Search
  const filteredCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter(c => {
      const matchesSearch = !search.trim() ||
        c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.targetEmail?.toLowerCase().includes(search.toLowerCase());

      const isExpired = c.expiresAt ? new Date(c.expiresAt) < now : false;

      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = c.isActive && !isExpired;
      } else if (statusFilter === 'inactive') {
        matchesStatus = !c.isActive;
      } else if (statusFilter === 'expired') {
        matchesStatus = isExpired;
      }

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  // Metrics
  const stats = useMemo(() => {
    const now = new Date();
    const total = coupons.length;
    const active = coupons.filter(c => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > now)).length;
    const expired = coupons.filter(c => c.expiresAt && new Date(c.expiresAt) <= now).length;
    const inactive = coupons.filter(c => !c.isActive).length;
    return { total, active, expired, inactive };
  }, [coupons]);

  const columns = [
    {
      key: 'code',
      label: 'Coupon Code',
      render: (row) => {
        const isCopied = copiedId === row._id;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold tracking-wider text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
              {row.code}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyCode(row.code, row._id);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Copy code"
            >
              {isCopied ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
            </button>
            {row.isSecret && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30" title="Hidden/Secret Coupon - Manual Entry Only">
                <EyeOff size={11} /> Secret
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'discount',
      label: 'Discount',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
          {row.discountType === 'percentage' ? (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {row.discountValue}% OFF
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ₹{Number(row.discountValue).toLocaleString('en-IN')} FLAT
            </span>
          )}
        </span>
      )
    },
    {
      key: 'audience',
      label: 'Target Audience',
      render: (row) => {
        const audience = row.targetAudience || 'all';
        if (audience === 'first_time') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
              <UserPlus size={12} /> New Customers Only
            </span>
          );
        }
        if (audience === 'specific_customer') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 max-w-[200px] truncate" title={row.targetEmail || 'Specific Customer'}>
              <Mail size={12} className="shrink-0" />
              <span className="truncate">{row.targetEmail || 'Single User'}</span>
            </span>
          );
        }
        if (audience === 'returning') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 whitespace-nowrap">
              <Repeat size={12} /> Returning VIPs
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border whitespace-nowrap">
            <Users size={12} /> All Customers
          </span>
        );
      }
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <div className="text-xs text-muted-foreground max-w-xs truncate" title={row.description}>
          {row.description}
        </div>
      )
    },
    {
      key: 'minOrder',
      label: 'Min Spend',
      render: (row) => (
        <span className="text-xs font-mono font-medium text-foreground">
          {row.minOrderValue > 0 ? `₹${Number(row.minOrderValue).toLocaleString('en-IN')}` : 'No Min.'}
        </span>
      )
    },
    {
      key: 'usage',
      label: 'Usage Limits',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          <div className="font-semibold text-foreground">
            {row.usedCount || 0} claimed
            {row.usageLimit > 0 && (
              <span className="text-muted-foreground font-normal"> / {row.usageLimit} max</span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {row.maxUsesPerUser ? `${row.maxUsesPerUser} use/user` : '1 use/user'}
          </div>
        </div>
      )
    },
    {
      key: 'validity',
      label: 'Validity',
      render: (row) => {
        if (!row.expiresAt) {
          return <span className="text-xs text-muted-foreground">Permanent / No Expiry</span>;
        }
        const exp = new Date(row.expiresAt);
        const now = new Date();
        const isExp = exp < now;
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock size={12} className={isExp ? 'text-destructive' : 'text-muted-foreground'} />
            <span className={isExp ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
              {isExp ? 'Expired' : exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <StatusSwitch
            checked={row.isActive}
            loading={togglingId === row._id}
            onCheckedChange={() => handleToggleStatus(row._id, row.isActive)}
            label={row.isActive ? 'Active' : 'Inactive'}
          />
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setModal(row)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Coupon"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(row._id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Delete Coupon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const statusFilters = (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
      {[
        { id: 'all', label: 'All Coupons' },
        { id: 'active', label: 'Active Only' },
        { id: 'inactive', label: 'Inactive' },
        { id: 'expired', label: 'Expired' }
      ].map(f => (
        <button
          key={f.id}
          type="button"
          onClick={() => setStatusFilter(f.id)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            statusFilter === f.id
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      {/* Standardized Dashboard Breadcrumb with matching negative margins */}
      <Breadcrumb
        title="Coupons & Discounts"
        subtitle={`Configure promotional codes, audience targeting rules, and discounts (${coupons.length} total)`}
        crumbs={[
          { label: 'Catalog & Products' },
          { label: 'Coupons & Discounts' }
        ]}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Coupons</div>
          <div className="text-2xl font-black text-foreground mt-1">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Active Codes</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">Draft / Inactive</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.inactive}</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-destructive font-semibold uppercase tracking-wider">Expired</div>
          <div className="text-2xl font-black text-destructive mt-1">{stats.expired}</div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        hideSort={true}
        onAdd={() => setModal('new')}
        addLabel="Create Coupon"
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        bulkDeleting={bulkDeleting}
        extraFilters={statusFilters}
      />

      {/* Coupons Data Table */}
      <DataTable
        columns={columns}
        data={filteredCoupons}
        loading={loading}
        onRowClick={(row) => setModal(row)}
        selectedIds={selectedIds}
        onToggleSelectAll={(ids) => setSelectedIds(ids)}
        onToggleSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={bulkDeleting}
        actions={false}
      />

      {/* Create / Edit Modal */}
      {modal && (
        <CouponModal
          coupon={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(confirmDelete)}
        isDeleting={deleting}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Coupon Code"
        message="Are you sure you want to delete this coupon? Customers will no longer be able to redeem this code at checkout."
      />

      {/* Toast Feedback */}
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
