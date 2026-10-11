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

export default function MethodTab() {
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
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/store-delivery-methods');
      const d = await res.json();
      setMethods(d.methods || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load delivery methods', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = new FormData(e.target);
    const payload = {
      name: data.get('name'),
      type: data.get('type'),
      baseCharge: Number(data.get('baseCharge')),
      cutoffTime: data.get('cutoffTime') || null,
      startTime: data.get('startTime') || null,
      endTime: data.get('endTime') || null,
      isActive: data.get('isActive') === 'true'
    };
    
    const reqMethod = modal._id ? 'PUT' : 'POST';
    const url = modal._id ? `/api/admin/store-delivery-methods/${modal._id}` : '/api/admin/store-delivery-methods';
    
    try {
      const res = await fetch(url, {
        method: reqMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      
      if (resData.method) {
        setMethods(prev => modal._id ? prev.map(z => z._id === modal._id ? resData.method : z) : [resData.method, ...prev]);
        addToast(modal._id ? 'Method updated successfully' : 'Method created successfully');
        setModal(null);
      } else {
        throw new Error(resData.error || 'Failed to save method');
      }
    } catch (err) {
      addToast(err.message || 'Error saving method', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (methodId, currentStatus) => {
    try {
      setTogglingId(methodId);
      const method = methods.find(m => m._id === methodId);
      if (!method) return;

      const payload = {
        name: method.name,
        type: method.type,
        baseCharge: method.baseCharge,
        cutoffTime: method.cutoffTime,
        startTime: method.startTime,
        endTime: method.endTime,
        isActive: !currentStatus
      };

      const res = await fetch(`/api/admin/store-delivery-methods/${methodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.method) {
        setMethods(prev => prev.map(m => m._id === methodId ? data.method : m));
        addToast('Delivery method status updated');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to update status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteMethod = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/store-delivery-methods/${confirmDeleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setMethods(prev => prev.filter(m => m._id !== confirmDeleteId));
        addToast('Delivery method deleted', 'warning');
      } else {
        throw new Error('Failed to delete method');
      }
    } catch (err) {
      addToast(err.message || 'Error deleting method', 'error');
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleReorder = (reorderedList) => {
    setMethods(reorderedList);
    addToast('Delivery methods order updated');
  };

  const cols = [
    { key: 'name', label: 'Method Name', render: r => <span className="font-semibold text-foreground">{r.name}</span> },
    { key: 'type', label: 'Type', render: r => <span className="text-xs font-mono font-semibold border border-border px-2.5 py-1 rounded-md bg-muted/40 text-foreground">{r.type}</span> },
    { key: 'baseCharge', label: 'Base Charge', render: r => <span className="text-sm font-bold text-primary">₹{r.baseCharge}</span> },
    { key: 'timings', label: 'Timings', render: r => (
      <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
        {r.cutoffTime && <span>Cutoff: <strong className="text-foreground">{r.cutoffTime}</strong></span>}
        {r.startTime && <span>Slot: <strong className="text-foreground">{r.startTime} - {r.endTime}</strong></span>}
        {!r.cutoffTime && !r.startTime && <span>Standard</span>}
      </div>
    )},
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
            title="Edit Method"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(r._id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Delete Method"
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
          <h2 className="text-lg font-bold text-foreground">Delivery Methods</h2>
          <p className="text-xs text-muted-foreground">Configure standard, same day, midnight, and fixed time slots</p>
        </div>
        <Button onClick={() => setModal({ type: 'STANDARD', isActive: true, baseCharge: 0 })}>
          <Plus size={16} className="mr-2" /> Add Method
        </Button>
      </div>
      
      <DataTable columns={cols} data={methods} loading={loading} onReorder={handleReorder} />

      {/* Symmetrical Modal Dialog */}
      <Dialog open={!!modal} onOpenChange={(open) => !open && !saving && setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {modal?._id ? 'Edit Delivery Method' : 'New Delivery Method'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Define delivery method name, rate, and optional cutoff or time slots.
            </p>
          </DialogHeader>

          {modal && (
            <form onSubmit={handleSave} className="space-y-4 py-2">
              <FloatingInput
                label="Method Name *"
                name="name"
                defaultValue={modal.name || ''}
                placeholder="e.g. Standard Express Delivery"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingSelect
                  label="Type *"
                  name="type"
                  defaultValue={modal.type || 'STANDARD'}
                  required
                >
                  <option value="STANDARD">Standard</option>
                  <option value="MIDNIGHT">Midnight</option>
                  <option value="SAME_DAY">Same Day</option>
                  <option value="FIXED_TIME">Fixed Time</option>
                </FloatingSelect>

                <FloatingInput
                  label="Base Charge (₹) *"
                  name="baseCharge"
                  type="number"
                  defaultValue={modal.baseCharge ?? 0}
                  required
                  min="0"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput
                  label="Cutoff Time (e.g. 17:00)"
                  name="cutoffTime"
                  type="time"
                  defaultValue={modal.cutoffTime || ''}
                />
                <div />
              </div>
              
              <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
                <p className="text-xs font-semibold text-foreground">Specific Time Slot Window (Optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <FloatingInput
                    label="Slot Start Time"
                    name="startTime"
                    type="time"
                    defaultValue={modal.startTime || ''}
                  />
                  <FloatingInput
                    label="Slot End Time"
                    name="endTime"
                    type="time"
                    defaultValue={modal.endTime || ''}
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <label className="text-xs font-semibold text-foreground block mb-2">Method Status</label>
                <input type="hidden" name="isActive" value={modal.isActive !== false ? 'true' : 'false'} id="method-isActive-input" />
                <StatusSwitch
                  checked={modal.isActive !== false}
                  onCheckedChange={(checked) => {
                    setModal(prev => ({ ...prev, isActive: checked }));
                    const el = document.getElementById('method-isActive-input');
                    if (el) el.value = checked ? 'true' : 'false';
                  }}
                  label={modal.isActive !== false ? 'Method is active in checkout' : 'Method is disabled'}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-border mt-4">
                <Button type="button" variant="ghost" disabled={saving} onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : modal._id ? 'Save Changes' : 'Create Method'}
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
        onConfirm={handleDeleteMethod}
        title="Delete Delivery Method"
        message="Are you sure you want to delete this delivery method? Any associated shipping rules will be affected."
      />

      <Toast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(x => x.id !== id))} />
    </div>
  );
}
