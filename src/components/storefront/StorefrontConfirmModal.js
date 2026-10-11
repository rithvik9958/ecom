'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export default function StorefrontConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete?",
  message = "Are you sure you want to delete this? This action cannot be undone.",
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fnp-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
      <div 
        className="fnp-confirm-modal-box"
        style={{ background: '#fff', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '2rem 1.5rem', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="fnp-modal-close-btn" style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          <X size={20} />
        </button>
        
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <AlertTriangle color="#ef4444" size={24} />
        </div>
        
        <h3 className="fnp-confirm-modal-title" style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#111', fontWeight: 'bold' }}>{title}</h3>
        <p className="fnp-confirm-modal-desc" style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.5 }}>{message}</p>
        
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          <button 
            onClick={onClose} 
            className="dashboard-secondary-btn"
            style={{ flex: 1, padding: '0.75rem', borderRadius: '50px' }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            style={{ flex: 1, padding: '0.75rem', borderRadius: '50px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}
          >
            Yes, delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
