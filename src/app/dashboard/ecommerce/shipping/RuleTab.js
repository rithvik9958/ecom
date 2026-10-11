'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import Toast from '@/components/dashboard/Toast';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-input';

export default function RuleTab() {
  const [rules, setRules] = useState([]);
  const [zones, setZones] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const addToast = (message, type = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/store-shipping-rules').then(r => r.json()),
      fetch('/api/admin/store-delivery-zones').then(r => r.json()),
      fetch('/api/admin/store-delivery-methods').then(r => r.json())
    ]).then(([rData, zData, mData]) => {
      setRules(rData.rules || []);
      setZones(zData.zones || []);
      setMethods(mData.methods || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      addToast('Failed to load shipping rules data', 'error');
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = new FormData(e.target);
    const freeAboveStr = data.get('freeAbove');
    const payload = {
      zone: data.get('zone'),
      method: data.get('method'),
      charge: Number(data.get('charge')),
      freeAbove: freeAboveStr ? Number(freeAboveStr) : null,
      isActive: data.get('isActive') === 'true'
    };
    
    const reqMethod = modal._id ? 'PUT' : 'POST';
    const url = modal._id ? `/api/admin/store-shipping-rules/${modal._id}` : '/api/admin/store-shipping-rules';
    
    try {
      const res = await fetch(url, {
        method: reqMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      
      if (resData.rule) {
        setRules(prev => modal._id ? prev.map(z => z._id === modal._id ? resData.rule : z) : [resData.rule, ...prev]);
        addToast(modal._id ? 'Rule updated successfully' : 'Rule created successfully');
        setModal(null);
      } else {
        throw new Error(resData.error || 'Failed to save rule');
      }
    } catch (err) {
      addToast(err.message || 'Error saving rule', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (ruleId, currentStatus) => {
    try {
      setTogglingId(ruleId);
      const rule = rules.find(r => r._id === ruleId);
      if (!rule) return;

      const payload = {
        zone: rule.zone?._id || rule.zone,
        method: rule.method?._id || rule.method,
        charge: rule.charge,
        freeAbove: rule.freeAbove,
        isActive: !currentStatus
      };

      const res = await fetch(`/api/admin/store-shipping-rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.rule) {
        setRules(prev => prev.map(r => r._id === ruleId ? data.rule : r));
        addToast('Rule status updated');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to update status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteRule = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/store-shipping-rules/${confirmDeleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setRules(prev => prev.filter(r => r._id !== confirmDeleteId));
        addToast('Shipping rule deleted', 'warning');
      } else {
        throw new Error('Failed to delete rule');
      }
    } catch (err) {
      addToast(err.message || 'Error deleting rule', 'error');
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const cols = [
    { key: 'zone', label: 'Zone', render: r => <span className="font-semibold text-foreground">{r.zone?.name || '-'}</span> },
    { key: 'method', label: 'Method', render: r => <span className="font-semibold text-foreground">{r.method?.name || '-'}</span> },
    { key: 'charge', label: 'Final Charge', render: r => <span className="text-sm font-bold text-primary">₹{r.charge}</span> },
    { key: 'freeAbove', label: 'Free Above', render: r => <span className="text-sm text-muted-foreground">{r.freeAbove ? `₹${r.freeAbove}` : '-'}</span> },
    {
      key: 'status',
      label: 'Status',
      render: r => (
        <StatusSwitch
          checked={r.isActive}
          loading={togglingId === r._id}
          onCheckedChange={() => handleToggleStatus(r._id, r.isActive)}
          label={r.isActive ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      key: 'actions',
      align: 'right',
      label: 'Actions',
      render: r => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setModal(r)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Rule"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(r._id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Delete Rule"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Shipping Matrix Rules</h2>
          <p className="text-xs text-muted-foreground">Manage delivery pricing and free shipping thresholds per zone and method</p>
        </div>
        <Button onClick={() => setModal({ isActive: true })}>
          <Plus size={16} className="mr-2" /> Add Rule
        </Button>
      </div>
      
      <DataTable columns={cols} data={rules} loading={loading} />

      {/* Symmetrical Modal Dialog */}
      <Dialog open={!!modal} onOpenChange={(open) => !open && !saving && setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {modal?._id ? 'Edit Shipping Rule' : 'New Shipping Matrix Rule'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Define shipping rate calculations for a specific zone and delivery method combination.
            </p>
          </DialogHeader>

          {modal && (
            <form onSubmit={handleSave} className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingSelect
                  label="Delivery Zone *"
                  name="zone"
                  defaultValue={modal.zone?._id || modal.zone || ''}
                  required
                >
                  <option value="">Select Zone...</option>
                  {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                </FloatingSelect>

                <FloatingSelect
                  label="Delivery Method *"
                  name="method"
                  defaultValue={modal.method?._id || modal.method || ''}
                  required
                >
                  <option value="">Select Method...</option>
                  {methods.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </FloatingSelect>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Final Charge (₹) *"
                  name="charge"
                  type="number"
                  defaultValue={modal.charge ?? 0}
                  required
                  min="0"
                />
                <FloatingInput
                  label="Free Above (₹) - Optional"
                  name="freeAbove"
                  type="number"
                  defaultValue={modal.freeAbove ?? ''}
                  placeholder="e.g. 999"
                  min="0"
                />
              </div>
              
              <div className="pt-2">
                <label className="text-xs font-semibold text-foreground block mb-2">Rule Status</label>
                <input type="hidden" name="isActive" value={modal.isActive !== false ? 'true' : 'false'} id="rule-isActive-input" />
                <StatusSwitch
                  checked={modal.isActive !== false}
                  onCheckedChange={(checked) => {
                    setModal(prev => ({ ...prev, isActive: checked }));
                    const el = document.getElementById('rule-isActive-input');
                    if (el) el.value = checked ? 'true' : 'false';
                  }}
                  label={modal.isActive !== false ? 'Rule is active in checkout' : 'Rule is disabled'}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-border mt-4">
                <Button type="button" variant="ghost" disabled={saving} onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : modal._id ? 'Save Changes' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        isOpen={!!confirmDeleteId}
        isDeleting={deleting}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteRule}
        title="Delete Shipping Rule"
        message="Are you sure you want to delete this shipping rule? This zone and method combination will no longer have custom pricing."
      />

      <Toast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(x => x.id !== id))} />
    </div>
  );
}
