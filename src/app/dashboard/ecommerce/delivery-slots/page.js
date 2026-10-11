"use client";
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, CheckCircle2, XCircle, Save } from 'lucide-react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';
import Toast from '@/components/dashboard/Toast';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FloatingInput } from '@/components/ui/floating-input';

const CustomTimePicker = ({ value, onChange }) => {
  const [hour, min] = (value || '12:00').split(':');
  let h = parseInt(hour, 10) || 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hStr = h.toString().padStart(2, '0');

  const handleUpdate = (newHStr, newMin, newAmPm) => {
    let newH = parseInt(newHStr, 10);
    if (newAmPm === 'PM' && newH !== 12) newH += 12;
    if (newAmPm === 'AM' && newH === 12) newH = 0;
    onChange(`${newH.toString().padStart(2, '0')}:${newMin.padStart(2, '0')}`);
  };

  return (
    <div className="flex bg-background border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring text-sm h-12 transition-shadow">
      <select 
        value={hStr} 
        onChange={e => handleUpdate(e.target.value, min || '00', ampm)}
        className="bg-transparent text-foreground border-none outline-none px-2 py-1 flex-1 cursor-pointer appearance-none text-center hover:bg-muted/50 font-medium"
      >
        {Array.from({length: 12}, (_, i) => {
          const val = (i+1).toString().padStart(2, '0');
          return <option key={val} value={val} className="bg-background text-foreground">{val}</option>
        })}
      </select>
      <span className="flex items-center text-muted-foreground font-bold">:</span>
      <select 
        value={min || '00'} 
        onChange={e => handleUpdate(hStr, e.target.value, ampm)}
        className="bg-transparent text-foreground border-none outline-none px-2 py-1 flex-1 cursor-pointer appearance-none text-center hover:bg-muted/50 font-medium"
      >
        {Array.from({length: 60}, (_, i) => {
          const val = i.toString().padStart(2, '0');
          return <option key={val} value={val} className="bg-background text-foreground">{val}</option>
        })}
      </select>
      <select 
        value={ampm} 
        onChange={e => handleUpdate(hStr, min || '00', e.target.value)}
        className="bg-muted text-foreground border-none outline-none px-3 py-1 font-bold cursor-pointer appearance-none text-center hover:bg-muted/80"
      >
        <option value="AM" className="bg-background text-foreground">AM</option>
        <option value="PM" className="bg-background text-foreground">PM</option>
      </select>
    </div>
  );
};

export default function DeliverySlotsPage() {
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [saving, setSaving] = useState(false);

  const addToast = (message, type = 'success') => {
    setToasts(prev => [...prev, { id: Date.now() + Math.random(), message, type }]);
  };
  
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    type: '',
    baseCharge: 0,
    description: '',
    isActive: true,
    slots: []
  });

  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/admin/delivery-slots');
      const data = await res.json();
      if (data.success) {
        setSlots(data.deliverySlots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleOpenModal = (slot = null) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData(slot);
    } else {
      setEditingSlot(null);
      setFormData({ type: '', baseCharge: 0, description: '', isActive: true, slots: [] });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = '/api/admin/delivery-slots';
      const method = editingSlot ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchSlots();
        addToast(editingSlot ? 'Delivery slot updated successfully!' : 'Delivery slot created successfully!', 'success');
      } else {
        addToast(data.message || 'Error saving delivery slot', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error saving delivery slot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const triggerDelete = (slot) => {
    setSlotToDelete(slot);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;
    try {
      const res = await fetch(`/api/admin/delivery-slots?id=${slotToDelete._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        setSlotToDelete(null);
        fetchSlots();
        addToast('Delivery type deleted', 'warning');
      } else {
        addToast(data.message || 'Error deleting delivery slot', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error deleting delivery slot', 'error');
    }
  };

  const handleAddSlot = () => {
    setFormData(prev => ({
      ...prev,
      slots: [
        ...prev.slots,
        {
          label: '',
          startTime: '09:00',
          endTime: '12:00',
          cutoffTime: '17:00',
          maxCapacity: 0,
          isActive: true
        }
      ]
    }));
  };

  const handleRemoveSlot = (idx) => {
    setFormData(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateSlot = (idx, field, value) => {
    setFormData(prev => {
      const nextSlots = [...prev.slots];
      nextSlots[idx] = { ...nextSlots[idx], [field]: value };
      return { ...prev, slots: nextSlots };
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Delivery Slots Matrix" 
        subtitle="Manage available delivery time windows, hourly cutoffs, and base charges"
        crumbs={[{ label: 'Storefront Management' }, { label: 'Delivery Slots' }]} 
      />

      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-xs">
        <div>
          <h3 className="text-base font-bold text-foreground">Delivery Methods & Time Slots</h3>
          <p className="text-xs text-muted-foreground">Configure customer delivery choices available at checkout</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="font-bold">
          <Plus size={16} className="mr-2" /> Add Delivery Type
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map(slot => (
            <div key={slot._id} className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
              <div className="p-5 border-b border-border flex justify-between items-start bg-muted/20">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{slot.type}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${slot.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                      {slot.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-primary mt-1">₹{slot.baseCharge} Base Charge</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(slot); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                    title="Edit Delivery Type"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); triggerDelete(slot); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
                    title="Delete Delivery Type"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <p className="text-xs text-muted-foreground italic mb-4">"{slot.description || 'No description provided'}"</p>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider mb-3">
                  <Clock size={14} className="text-primary" /> Time Slots ({slot.slots.length})
                </h4>
                <div className="space-y-2 flex-1">
                  {slot.slots.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-muted/20 rounded-lg border border-border text-xs">
                      <div>
                        <div className={`font-bold text-foreground ${!s.isActive ? 'line-through opacity-50' : ''}`}>{s.label}</div>
                        <div className="text-[11px] text-muted-foreground">Cutoff: {s.cutoffTime} | Cap: {s.maxCapacity === 0 ? '∞' : s.maxCapacity}</div>
                      </div>
                      {s.isActive ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <XCircle size={16} className="text-muted-foreground shrink-0" />}
                    </div>
                  ))}
                  {slot.slots.length === 0 && <div className="text-xs text-muted-foreground py-2">No slots configured.</div>}
                </div>
              </div>
            </div>
          ))}
          {slots.length === 0 && (
            <div className="col-span-full text-center p-12 bg-card text-muted-foreground rounded-xl border border-dashed border-border">
              No delivery types found. Create one to get started!
            </div>
          )}
        </div>
      )}

      {/* Symmetrical Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && !saving && setIsModalOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingSlot ? 'Edit' : 'Add'} Delivery Type
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Configure name, base price, description, and individual time slot windows.
            </p>
          </DialogHeader>
          
          <form onSubmit={handleSave} className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput 
                label="Type Name (e.g. Standard, Midnight) *" 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})} 
                required 
              />
              <FloatingInput 
                label="Base Charge (₹) *" 
                type="number" 
                value={formData.baseCharge} 
                onChange={e => setFormData({...formData, baseCharge: Number(e.target.value)})} 
                min="0" 
                required 
              />
            </div>

            <FloatingInput 
              label="Description / Hint" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="e.g. Want it free? Pick a slot with the FREE tag." 
            />

            <div className="p-3 border border-border rounded-xl bg-muted/20">
              <StatusSwitch 
                checked={formData.isActive} 
                onCheckedChange={checked => setFormData({...formData, isActive: checked})}
                label={formData.isActive ? 'Delivery type is active' : 'Delivery type is disabled'}
              />
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Time Slot Windows</h3>
                  <p className="text-xs text-muted-foreground">Define slot start/end hours and order cutoff times</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddSlot}>
                  <Plus size={14} className="mr-1.5" /> Add Slot
                </Button>
              </div>

              <div className="space-y-3">
                {formData.slots.map((s, idx) => (
                  <div key={idx} className="bg-muted/10 border border-border rounded-xl p-4 relative space-y-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(idx)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
                      title="Remove Slot"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                      <FloatingInput
                        label="Slot Label *"
                        value={s.label}
                        onChange={e => handleUpdateSlot(idx, 'label', e.target.value)}
                        placeholder="e.g. 09:00 AM - 12:00 PM"
                      />
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Start Time</label>
                        <CustomTimePicker value={s.startTime} onChange={val => handleUpdateSlot(idx, 'startTime', val)} />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">End Time</label>
                        <CustomTimePicker value={s.endTime} onChange={val => handleUpdateSlot(idx, 'endTime', val)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Cutoff Time</label>
                        <CustomTimePicker value={s.cutoffTime} onChange={val => handleUpdateSlot(idx, 'cutoffTime', val)} />
                      </div>
                      <FloatingInput
                        label="Max Capacity (0 = unlimited)"
                        type="number"
                        value={s.maxCapacity}
                        onChange={e => handleUpdateSlot(idx, 'maxCapacity', Number(e.target.value))}
                        min="0"
                      />
                      <div className="h-12 flex items-center p-2.5 bg-background border border-input rounded-xl">
                        <StatusSwitch
                          checked={s.isActive}
                          onCheckedChange={checked => handleUpdateSlot(idx, 'isActive', checked)}
                          label={s.isActive ? 'Active' : 'Disabled'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {formData.slots.length === 0 && (
                  <div className="text-xs text-muted-foreground italic p-4 text-center border border-dashed border-border rounded-xl">
                    Click "Add Slot" to define available time slots for this delivery method.
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border mt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingSlot ? 'Save Changes' : 'Create Delivery Type'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Delivery Type"
        message={slotToDelete ? `Are you sure you want to delete the delivery type "${slotToDelete.type}"? This action cannot be undone.` : ''}
      />

      <Toast toasts={toasts} onRemove={id => setToasts(prev => prev.filter(x => x.id !== id))} />
    </div>
  );
}
