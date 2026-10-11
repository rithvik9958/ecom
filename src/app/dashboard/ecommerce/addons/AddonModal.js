'use client';
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FloatingInput } from '@/components/ui/floating-input';
import CustomSelect from '@/components/ui/CustomSelect';
import { Button } from '@/components/ui/button';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import { Upload, Gift, X, Loader2 } from 'lucide-react';
import Toast from '@/components/dashboard/Toast';

export default function AddonModal({ addon, onClose, onSave }) {
  const [form, setForm] = useState(addon ? {
    name: addon.name || '',
    price: addon.price || '',
    mrp: addon.mrp || '',
    isActive: addon.isActive ?? true,
    category: (addon.category && typeof addon.category === 'object') ? addon.category._id : (addon.category || '')
  } : {
    name: '',
    price: '',
    mrp: '',
    isActive: true,
    category: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(addon?.image ? (addon.image.startsWith('http') ? addon.image : `/uploads/${addon.image}`) : null);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileInputRef = useRef(null);

  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetch('/api/admin/store-addon-categories')
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data.filter(c => c.isActive) : []);
      })
      .catch(console.error);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    
    setSaving(true);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('price', form.price);
    fd.append('mrp', form.mrp);
    fd.append('isActive', form.isActive);
    fd.append('category', form.category);
    if (imageFile) fd.append('image', imageFile);

    try {
      const url = addon ? `/api/store-addons/${addon._id || addon.id}` : '/api/store-addons';
      const method = addon ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        body: fd
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onSave(data.addon);
    } catch (err) {
      addToast(err.message || 'Error saving add-on', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Gift size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {addon ? `Edit "${form.name || 'Add-on'}"` : 'Create New Add-on'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure extra cross-sell items like chocolates, greeting cards, or candles.
                </p>
              </div>
            </div>

            <StatusSwitch
              checked={form.isActive}
              onCheckedChange={v => setForm({ ...form, isActive: v })}
              label={form.isActive ? 'Active' : 'Draft'}
            />
          </div>
        </DialogHeader>

        <form id="addon-form" onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex gap-4 items-start">
            <div className="flex-1 space-y-4">
              <FloatingInput 
                label="Add-on Name *" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
              />
              
              <div className="grid grid-cols-2 gap-3">
                <FloatingInput 
                  label="Selling Price (₹) *" 
                  type="number"
                  value={form.price} 
                  onChange={e => setForm({ ...form, price: e.target.value })} 
                  required 
                />

                <FloatingInput 
                  label="MRP Strike (₹)" 
                  type="number"
                  value={form.mrp} 
                  onChange={e => setForm({ ...form, mrp: e.target.value })} 
                />
              </div>
            </div>
            
            <div className="w-28 flex flex-col gap-1.5 shrink-0">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Image</label>
              <div 
                className="w-full aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden relative bg-muted/20"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setImageFile(null); setPreview(null); }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground" />
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
              Add-on Category
            </label>
            <CustomSelect
              value={form.category}
              onChange={val => setForm({ ...form, category: val })}
              options={[
                { value: '', label: 'None (General Add-on)' },
                ...categories.map(c => ({ value: c._id, label: c.name }))
              ]}
              placeholder="Select Add-on Category..."
              searchable={true}
            />
          </div>
        </form>

        <DialogFooter className="px-6 py-3.5 border-t border-border bg-card shrink-0 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="h-9 text-xs">
            Cancel
          </Button>
          <Button type="submit" form="addon-form" disabled={saving} className="h-9 text-xs gap-1.5">
            {saving && <Loader2 size={13} className="animate-spin" />}
            {saving ? 'Saving...' : addon ? 'Save Changes' : 'Create Add-on'}
          </Button>
        </DialogFooter>
      </DialogContent>
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </Dialog>
  );
}
