'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Plus, ChevronRight } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import CustomSelect from '@/components/ui/CustomSelect';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';

// All modules from the system with their available actions
const MODULE_DEFINITIONS = [
  { key: 'orders',          label: 'Orders & Shipments',       actions: ['read', 'update', 'delete'] },
  { key: 'products',        label: 'Products & Addons',        actions: ['create', 'read', 'update', 'delete'] },
  { key: 'categories',      label: 'Categories & Attributes',  actions: ['create', 'read', 'update', 'delete'] },
  { key: 'customers',       label: 'Customers Management',     actions: ['read', 'update', 'delete'] },
  { key: 'shipping',        label: 'Shipping & Delivery Slots', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'store_cms',       label: 'Storefront CMS (Pages)',   actions: ['create', 'read', 'update', 'delete'] },
  { key: 'blogs',           label: 'Blogs & Journal',          actions: ['create', 'read', 'update', 'delete'] },
  { key: 'enquiries',       label: 'Customer Enquiries',       actions: ['read', 'update', 'delete'] },
  { key: 'email_templates', label: 'Email Templates',          actions: ['read', 'update'] },
  { key: 'global_settings', label: 'Settings & Brand Theme',   actions: ['read', 'update'] },
  { key: 'file_manager',    label: 'File Manager',             actions: ['create', 'read', 'delete'] },
  { key: 'ai_features',     label: 'AI Assistant',             actions: ['read', 'update'] },
  { key: 'activity_logs',   label: 'Audit & Activity Logs',    actions: ['read'] },
];

const EMPTY_PERMISSIONS = Object.fromEntries(MODULE_DEFINITIONS.map(m => [m.key, []]));

function PermissionGrid({ permissions, onChange }) {
  function toggleAction(moduleKey, action, checked) {
    const current = permissions[moduleKey] || [];
    const updated  = checked
      ? [...current, action]
      : current.filter(a => a !== action);
    onChange({ ...permissions, [moduleKey]: updated });
  }

  function toggleAll(moduleKey, actions, checked) {
    onChange({ ...permissions, [moduleKey]: checked ? [...actions] : [] });
  }

  return (
    <div className="overflow-x-auto border border-polaris-border rounded-lg">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left w-[220px] font-bold uppercase tracking-wider">Module</th>
            <th className="px-4 py-3 text-center w-16 font-bold uppercase tracking-wider">All</th>
            {['create', 'read', 'update', 'delete'].map(a => (
               <th key={a} className="px-4 py-3 text-center font-bold uppercase tracking-wider">{a}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-polaris-border">
          {MODULE_DEFINITIONS.map((mod, i) => {
            const granted   = permissions[mod.key] || [];
            const allGranted = mod.actions.every(a => granted.includes(a));

            return (
              <tr key={mod.key} className={cn("hover:bg-muted/50 transition-colors", i % 2 === 0 ? "bg-card" : "bg-muted/20")}>
                <td className="px-4 py-3 font-semibold text-foreground">{mod.label}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allGranted}
                    onChange={e => toggleAll(mod.key, mod.actions, e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-polaris-primary rounded-sm"
                  />
                </td>
                {['create', 'read', 'update', 'delete'].map(action => (
                  <td key={action} className="px-4 py-3 text-center">
                    {mod.actions.includes(action) ? (
                      <input
                        type="checkbox"
                        checked={granted.includes(action)}
                        onChange={e => toggleAction(mod.key, action, e.target.checked)}
                        className="w-4 h-4 cursor-pointer accent-polaris-primary rounded-sm"
                      />
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function UserManagementPage() {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const router = useRouter();

  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]   = useState(null);
  
  // Standard states
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Modal state
  const [modal, setModal]   = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'admin', permissions: { ...EMPTY_PERMISSIONS } });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'single', id: null, name: '' });
  const [deletingId, setDeletingId] = useState(null);

  // Protect route
  useEffect(() => {
    if (!isSuperAdmin()) router.push('/dashboard');
  }, [isSuperAdmin]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function getToken() {
    return localStorage.getItem('admin_token') || '';
  }

  async function fetchUsers() {
    try {
      const res  = await fetch('/api/user', { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch { /* ignore */ }
    finally   { setLoading(false); }
  }

  useEffect(() => { fetchUsers(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'admin', permissions: { ...EMPTY_PERMISSIONS } });
    setModal('create');
  }

  function openEdit(u) {
    setEditing(u);
    // Merge with EMPTY_PERMISSIONS so every module key is always defined
    const merged = { ...EMPTY_PERMISSIONS };
    if (u.permissions) {
      Object.keys(u.permissions).forEach(key => {
        if (merged[key] !== undefined) {
          merged[key] = u.permissions[key];
        }
      });
    }
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role || 'admin',
      permissions: merged,
    });
    setModal('edit');
  }

  async function handleSave() {
    if (!form.name || !form.email) return showToast('Name and email are required', 'error');
    if (modal === 'create' && !form.password) return showToast('Password is required', 'error');

    setSaving(true);
    try {
      const url    = modal === 'create' ? '/api/user' : `/api/user/${editing._id}`;
      const method = modal === 'create' ? 'POST' : 'PUT';
      const body   = { name: form.name, email: form.email, role: form.role, permissions: form.permissions };
      if (form.password) body.password = form.password;

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      showToast(modal === 'create' ? 'Admin user created!' : 'User updated!');
      setModal(null);
      fetchUsers();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    try {
      setConfirmModal({ isOpen: false, type: 'single', id: null, name: '' })
      setDeletingId(id)
      const res  = await fetch(`/api/user/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast('User deleted successfully');
      setSelectedIds(prev => prev.filter(x => x !== id));
      fetchUsers();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeletingId(null)
    }
  }

  async function handleBulkDelete() {
    try {
      setConfirmModal({ isOpen: false, type: 'bulk', id: null, name: '' })
      setBulkDeleting(true)
      await Promise.all(selectedIds.map(id => fetch(`/api/user/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } })))
      setUsers(u => u.filter(x => !selectedIds.includes(x._id)))
      setSelectedIds([])
      showToast('Users deleted successfully')
    } catch (err) {
      showToast('Error deleting some users: ' + err.message, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  async function toggleActive(u) {
    try {
      setTogglingId(u._id);
      const res  = await fetch(`/api/user/${u._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      showToast(!u.isActive ? 'User activated' : 'User deactivated');
      fetchUsers();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setTogglingId(null);
    }
  }

  const grantedCount = (perms) =>
    Object.values(perms || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const filteredData = users
    .filter(u => 
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'latest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      if (sort === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      if (sort === 'a-z') return (a.name || '').localeCompare(b.name || '')
      if (sort === 'z-a') return (b.name || '').localeCompare(a.name || '')
      return 0
    })

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredData.length) setSelectedIds([])
    else setSelectedIds(filteredData.map(x => x._id))
  }

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = [
    { 
      key: 'name', 
      label: 'Admin User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
             {row.name ? row.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div className="font-bold text-foreground">{row.name}</div>
            <div className="text-xs text-muted-foreground">{row.email}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Role',
      render: (row) => (
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider",
          row.role === 'super_admin' ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-500/20" :
          row.role === 'admin' ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-500/20" :
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-500/20"
        )}>
          {row.role === 'super_admin' ? 'Super Admin' : (row.role || 'Admin')}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => (
        <StatusSwitch
          checked={row.isActive !== false}
          loading={togglingId === row._id}
          onCheckedChange={() => toggleActive(row)}
          label={row.isActive ? 'Active' : 'Inactive'}
        />
      )
    },
    { 
      key: 'permissions', 
      label: 'Permissions',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground">
          {grantedCount(row.permissions)} actions
        </span>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Date',
      render: (row) => (
        <span className="font-data text-muted-foreground text-xs">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      align: 'right',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit User"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, type: 'single', id: row._id, name: row.name }); }}
            disabled={deletingId === row._id}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
            title="Delete User"
          >
            {deletingId === row._id ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="User Management" 
        subtitle={`Manage admin users and their granular permissions (${users.length} total)`}
        crumbs={[{ label: 'User Management' }]} 
      />
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        selectedCount={selectedIds.length}
        onBulkDelete={() => setConfirmModal({ isOpen: true, type: 'bulk', id: null, name: '' })}
        bulkDeleting={bulkDeleting}
        onAdd={openCreate}
        addLabel="Create Admin User"
      />

      <DataTable 
        columns={columns}
        data={filteredData}
        loading={loading}
        onRowClick={openEdit}
        actions={false}
        selectedIds={selectedIds}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectRow={toggleSelectRow}
      />

      {/* Dialog Form */}
      <Dialog open={!!modal} onOpenChange={(open) => !open && !saving && setModal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{modal === 'create' ? "Create Admin User" : `Edit User: ${editing?.name}`}</DialogTitle>
            <p className="text-muted-foreground text-sm">{modal === 'create' ? "Register a new admin with specific access" : "Modify access levels and account info"}</p>
          </DialogHeader>
          
          <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name*</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full h-10 px-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-background text-foreground" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address*</label>
                <input 
                  type="email" 
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full h-10 px-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-background text-foreground" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password {modal === 'edit' && '(optional)'}*</label>
                <input 
                  type="password" 
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm bg-background text-foreground" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Role Level*</label>
                <CustomSelect
                  value={form.role}
                  onChange={val => setForm({ ...form, role: val })}
                  options={[
                    { value: 'admin', label: 'Staff Admin (Restricted to Selected Permissions)' },
                    { value: 'super_admin', label: 'Super Admin (Full Unrestricted Access)' }
                  ]}
                  placeholder="Select Role..."
                />
              </div>
            </div>

            {form.role === 'super_admin' ? (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs">
                <p className="font-bold">👑 Super Admin Access</p>
                <p className="mt-0.5 text-muted-foreground">This user will have full, unrestricted access to all modules, orders, catalog, settings, and user administration.</p>
              </div>
            ) : (
              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between border-b border-polaris-border pb-2">
                   <h3 className="text-sm font-bold text-foreground">Module Permissions</h3>
                   <span className="text-[10px] font-medium text-muted-foreground bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-tight">
                      {grantedCount(form.permissions)} active rules
                   </span>
                </div>
                <PermissionGrid 
                  permissions={form.permissions} 
                  onChange={p => setForm({ ...form, permissions: p })} 
                />
              </div>
            )}

            <DialogFooter className="pt-6 border-t border-border mt-6">
              <Button variant="ghost" type="button" onClick={() => setModal(null)} disabled={saving} className="rounded-full px-6 text-muted-foreground hover:bg-muted/50 font-medium">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-full px-10 py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/30 transition-transform active:scale-95">
                {saving ? 'Saving...' : modal === 'create' ? 'Create User' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        isDeleting={confirmModal.type === 'single' ? deletingId === confirmModal.id : bulkDeleting}
        onClose={() => setConfirmModal({ isOpen: false, type: 'single', id: null, name: '' })}
        onConfirm={() => confirmModal.type === 'single' ? handleDelete(confirmModal.id, confirmModal.name) : handleBulkDelete()}
        title={confirmModal.type === 'single' ? "Delete Admin User" : "Bulk Delete"}
        message={confirmModal.type === 'single' 
          ? `Are you sure you want to delete "${confirmModal.name}"? This cannot be undone.` 
          : `Are you sure you want to delete ${selectedIds.length} users? This cannot be undone.`}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 right-8 px-6 py-3 rounded-xl shadow-2xl text-white text-sm font-bold z-50 flex items-center gap-3",
              toast.type === 'success' ? "bg-polaris-primary" : "bg-red-600"
            )}
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
               {toast.type === 'success' ? <ChevronRight className="w-3 h-3" /> : <Plus className="w-3 h-3 rotate-45" />}
            </div>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
