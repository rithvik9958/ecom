'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Universal Dashboard Toast Component
 * Supports both array mode (<Toast toasts={toasts} onRemove={...} />)
 * and single-item mode (<Toast message="..." type="success" onClose={...} />)
 */
export default function Toast({
  toasts,
  onRemove,
  removeToast,
  onClose,
  message,
  type = 'success',
  id,
}) {
  // Determine if passed as array or single item
  const activeToasts = Array.isArray(toasts)
    ? toasts
    : message
    ? [{ id: id || 1, message, type }]
    : [];

  const removeHandler = onRemove || removeToast || onClose;
  const onRemoveRef = useRef(removeHandler);

  useEffect(() => {
    onRemoveRef.current = removeHandler;
  }, [removeHandler]);

  const latestToast = activeToasts.length > 0 ? activeToasts[activeToasts.length - 1] : null;

  useEffect(() => {
    if (!latestToast) return;
    const timer = setTimeout(() => {
      if (onRemoveRef.current) {
        onRemoveRef.current(latestToast.id);
      }
    }, 3200);
    return () => clearTimeout(timer);
  }, [latestToast?.id, latestToast?.message]);

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="wait">
        {activeToasts.slice(-1).map((t) => (
          <motion.div
            key={t.id || t.message}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-full shadow-2xl border text-xs font-semibold backdrop-blur-md max-w-md",
              t.type === 'success' && "bg-[#111111] border-emerald-500/30 text-white",
              (t.type === 'error' || t.type === 'danger') && "bg-[#18181b] border-red-500/35 text-white",
              t.type === 'warning' && "bg-[#18181b] border-amber-500/35 text-white",
              t.type === 'info' && "bg-[#18181b] border-blue-500/35 text-white",
              (!t.type || t.type === 'default') && "bg-[#111111] border-white/15 text-white"
            )}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'success' && (
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
              {(t.type === 'error' || t.type === 'danger') && (
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <X size={11} strokeWidth={3} />
                </span>
              )}
              {t.type === 'warning' && (
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={11} strokeWidth={2.5} />
                </span>
              )}
              {t.type === 'info' && (
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Info size={11} strokeWidth={2.5} />
                </span>
              )}
              {(!t.type || t.type === 'default') && (
                <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
              <p className="text-[13px] font-semibold text-white tracking-wide">{t.message}</p>
            </div>
            {removeHandler && (
              <button
                onClick={() => removeHandler(t.id)}
                className="text-white/60 hover:text-white transition-opacity focus:outline-none ml-2 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
