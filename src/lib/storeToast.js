import toast from 'react-hot-toast';
import { Check, AlertTriangle, X, Info } from 'lucide-react';

const TOAST_SINGLETON_ID = 'storefront-toast';

// Inject keyframes globally if not already injected
if (typeof document !== 'undefined' && !document.getElementById('store-toast-animations')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'store-toast-animations';
  styleEl.innerHTML = `
    @keyframes toastEnter {
      0% {
        opacity: 0;
        transform: translateY(22px) scale(0.92);
      }
      65% {
        opacity: 1;
        transform: translateY(-4px) scale(1.02);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes toastLeave {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(14px) scale(0.94);
      }
    }
  `;
  document.head.appendChild(styleEl);
}

function formatToastMsg(msg) {
  if (!msg) return '';
  if (typeof msg === 'string') return msg;
  if (typeof msg === 'object') {
    return msg.message || msg.error || JSON.stringify(msg);
  }
  return String(msg);
}

export const showToast = {
  success: (message, options = {}) => {
    const text = formatToastMsg(message);
    const toastId = options.id || TOAST_SINGLETON_ID;
    return toast.custom((t) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#111111',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '50px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          fontSize: '0.84rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          pointerEvents: 'auto',
          maxWidth: '440px',
          backdropFilter: 'blur(12px)',
          animation: t.visible ? 'toastEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'toastLeave 0.2s cubic-bezier(0.4, 0, 1, 1) forwards'
        }}
      >
        <span style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.22)',
          color: '#22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Check size={13} strokeWidth={3} />
        </span>
        <span style={{ flex: 1 }}>{text}</span>
      </div>
    ), { id: toastId, duration: 2600, ...options });
  },

  info: (message, options = {}) => {
    const text = formatToastMsg(message);
    const toastId = options.id || TOAST_SINGLETON_ID;
    return toast.custom((t) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#18181b',
          color: '#f4f4f5',
          padding: '10px 18px',
          borderRadius: '50px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          fontSize: '0.84rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          pointerEvents: 'auto',
          maxWidth: '440px',
          backdropFilter: 'blur(12px)',
          animation: t.visible ? 'toastEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'toastLeave 0.2s cubic-bezier(0.4, 0, 1, 1) forwards'
        }}
      >
        <span style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.22)',
          color: '#60a5fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Info size={13} strokeWidth={2.5} />
        </span>
        <span style={{ flex: 1 }}>{text}</span>
      </div>
    ), { id: toastId, duration: 2600, ...options });
  },

  warning: (message, options = {}) => {
    const text = formatToastMsg(message);
    const toastId = options.id || TOAST_SINGLETON_ID;
    return toast.custom((t) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#18181b',
          color: '#f4f4f5',
          padding: '10px 18px',
          borderRadius: '50px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0,0,0,0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          fontSize: '0.84rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          pointerEvents: 'auto',
          maxWidth: '440px',
          backdropFilter: 'blur(12px)',
          animation: t.visible ? 'toastEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'toastLeave 0.2s cubic-bezier(0.4, 0, 1, 1) forwards'
        }}
      >
        <span style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.22)',
          color: '#f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <AlertTriangle size={12} strokeWidth={2.5} />
        </span>
        <span style={{ flex: 1 }}>{text}</span>
      </div>
    ), { id: toastId, duration: 2800, ...options });
  },

  error: (message, options = {}) => {
    const text = formatToastMsg(message);
    const toastId = options.id || TOAST_SINGLETON_ID;
    return toast.custom((t) => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#18181b',
          color: '#f4f4f5',
          padding: '10px 18px',
          borderRadius: '50px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0,0,0,0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          fontSize: '0.84rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          pointerEvents: 'auto',
          maxWidth: '440px',
          backdropFilter: 'blur(12px)',
          animation: t.visible ? 'toastEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' : 'toastLeave 0.2s cubic-bezier(0.4, 0, 1, 1) forwards'
        }}
      >
        <span style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.22)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <X size={13} strokeWidth={3} />
        </span>
        <span style={{ flex: 1 }}>{text}</span>
      </div>
    ), { id: toastId, duration: 2800, ...options });
  },

  dismiss: (id = TOAST_SINGLETON_ID) => {
    toast.dismiss(id);
  }
};

export default showToast;
