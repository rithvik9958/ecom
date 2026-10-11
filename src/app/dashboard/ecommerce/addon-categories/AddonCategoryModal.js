'use client';
import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FloatingInput } from '@/components/ui/floating-input';
import StatusSwitch from '@/components/dashboard/StatusSwitch';
import Toast from '@/components/dashboard/Toast';

export default function AddonCategoryModal({ category, onClose, onSave, onToast }) {
  const [name, setName] = useState(category?.name || '');
  const [order, setOrder] = useState(category?.order ?? 0);
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(category?.image ? (category.image.startsWith('http') ? category.image : `/uploads/${category.image}`) : null);
  
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToasts(prev => [...prev, { id: Date.now() + Math.random(), message, type }]);
    if (onToast) onToast(message, type);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    
    setLoading(true);
    const fd = new FormData();
    fd.append('name', name);
    fd.append('order', String(order));
    fd.append('isActive', String(isActive));
    if (imageFile) fd.append('image', imageFile);

    try {
      const url = category 
        ? `/api/admin/store-addon-categories/${category._id || category.id}` 
        : `/api/admin/store-addon-categories`;
      
      const res = await fetch(url, {
        method: category ? 'PUT' : 'POST',
        body: fd
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save');
      }
      
      const saved = await res.json();
      onSave(saved);
      showToast('Category saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {category ? 'Edit Add-on Category' : 'New Add-on Category'}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Group your add-ons under categories like Gourmet, Gifts, Chocolates, or Flowers.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="flex flex-col items-center">
            <div 
              className="w-24 h-24 border-2 border-dashed border-border rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden relative bg-muted/20"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <span className="text-xs text-muted-foreground mt-2">Click to upload category icon</span>
          </div>

          <FloatingInput 
            label="Category Name *"
            required
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Gourmet, Rakhi, Flowers"
          />

          <FloatingInput 
            label="Sort Order"
            type="number" 
            value={order} 
            onChange={e => setOrder(e.target.value)} 
            placeholder="0"
          />

          <div className="p-3 border border-border rounded-xl bg-muted/20">
            <StatusSwitch 
              checked={isActive} 
              onCheckedChange={setIsActive}
              label={isActive ? 'Category is active' : 'Category is hidden'}
            />
          </div>

          <DialogFooter className="pt-4 border-t border-border mt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : category ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </Dialog>
  );
}
