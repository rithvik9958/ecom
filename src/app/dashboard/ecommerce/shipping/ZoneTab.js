'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import DataTable from '@/components/dashboard/DataTable';
import Toast from '@/components/dashboard/Toast';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FloatingInput, FloatingTextarea } from '@/components/ui/floating-input';

export default function ZoneTab() {
  const [zones, setZones] = useState([]);
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
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/store-delivery-zones');
      const d = await res.json();
      setZones(d.zones || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load delivery zones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = new FormData(e.target);
    const pincodesStr = data.get('pincodes') || '';
    const payload = {
      name: data.get('name'),
      pincodes: pincodesStr.split(',').map(s => s.trim()).filter(Boolean),
      isActive: data.get('isActive') === 'true'
    };
    
    const reqMethod = modal._id ? 'PUT' : 'POST';
    const url = modal._id ? `/api/admin/store-delivery-zones/${modal._id}` : '/api/admin/store-delivery-zones';
    
    try {
      const res = await fetch(url, {
        method: reqMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      
      if (resData.zone) {
        setZones(prev => modal._id ? prev.map(z => z._id === modal._id ? resData.zone : z) : [resData.zone, ...prev]);
        addToast(modal._id ? 'Zone updated successfully' : 'Zone created successfully');
        setModal(null);
      } else {
        throw new Error(resData.error || 'Failed to save zone');
      }
    } catch (err) {
      addToast(err.message || 'Error saving zone', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (zoneId, currentStatus) => {
    try {
      setTogglingId(zoneId);
      const zone = zones.find(z => z._id === zoneId);
      if (!zone) return;

      const payload = {
        name: zone.name,
        pincodes: zone.pincodes,
        isActive: !currentStatus
      };

      const res = await fetch(`/api/admin/store-delivery-zones/${zoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.zone) {
        setZones(prev => prev.map(z => z._id === zoneId ? data.zone : z));
        addToast('Zone status updated');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to update status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteZone = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/store-delivery-zones/${confirmDeleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setZones(prev => prev.filter(z => z._id !== confirmDeleteId));
        addToast('Delivery zone deleted', 'warning');
      } else {
        throw new Error('Failed to delete zone');
      }
    } catch (err) {
      addToast(err.message || 'Error deleting zone', 'error');
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const cols = [
    { key: 'name', label: 'Zone Name', render: r => <span className="font-semibold text-foreground">{r.name}</span> },
    {
      key: 'pincodes',
      label: 'Pincodes',
      render: r => (
        <span className="text-xs text-muted-foreground">
          {r.pincodes?.length > 0 ? `${r.pincodes.slice(0, 3).join(', ')}${r.pincodes.length > 3 ? ` +${r.pincodes.length - 3} more` : ''} (${r.pincodes.length})` : 'All (Fallback Zone)'}
        </span>
      )
    },
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
            title="Edit Zone"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDeleteId(r._id)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Delete Zone"
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
          <h2 className="text-lg font-bold text-foreground">Delivery Zones</h2>
          <p className="text-xs text-muted-foreground">Group pincodes into delivery regions for rate calculation</p>
        </div>
        <Button onClick={() => setModal({ isActive: true, pincodes: [] })}>
          <Plus size={16} className="mr-2" /> Add Zone
        </Button>
      </div>
      
      <DataTable columns={cols} data={zones} loading={loading} />

      {/* Symmetrical Modal Dialog */}
      <Dialog open={!!modal} onOpenChange={(open) => !open && !saving && setModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {modal?._id ? 'Edit Delivery Zone' : 'New Delivery Zone'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Define zone name and list of matching serviceable pincodes.
            </p>
          </DialogHeader>

          {modal && (
            <form onSubmit={handleSave} className="space-y-4 py-2">
              <FloatingInput
                label="Zone Name *"
                name="name"
                defaultValue={modal.name || ''}
                placeholder="e.g. Delhi NCR, Mumbai Metro, Rest of India"
                required
              />

              <div>
                <FloatingTextarea
                  label="Pincodes (Comma separated, leave empty for Default/Fallback)"
                  name="pincodes"
                  defaultValue={modal.pincodes?.join(', ') || ''}
                  placeholder="e.g. 110001, 110002, 110003..."
                  rows={4}
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Orders with pincodes matching this list will use this zone's rules. If empty, it acts as a universal fallback zone.
                </p>
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-foreground block mb-2">Zone Status</label>
                <input type="hidden" name="isActive" value={modal.isActive !== false ? 'true' : 'false'} id="zone-isActive-input" />
                <StatusSwitch
                  checked={modal.isActive !== false}
                  onCheckedChange={(checked) => {
                    setModal(prev => ({ ...prev, isActive: checked }));
                    const el = document.getElementById('zone-isActive-input');
                    if (el) el.value = checked ? 'true' : 'false';
                  }}
                  label={modal.isActive !== false ? 'Zone is active' : 'Zone is disabled'}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-border mt-4">
                <Button type="button" variant="ghost" disabled={saving} onClick={() => setModal(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : modal._id ? 'Save Changes' : 'Create Zone'}
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
        onConfirm={handleDeleteZone}
        title="Delete Delivery Zone"
        message="Are you sure you want to delete this delivery zone? Shipping rules assigned to this zone will need reconfiguring."
      />

      <Toast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(x => x.id !== id))} />
    </div>
  );
}
