'use client';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StatusSwitch — Standardized animated toggle used in tables and forms.
 * Shows an instant micro-spinner when loading/updating so the user gets
 * clear visual feedback that the async status change is in flight.
 */
export default function StatusSwitch({
  checked,
  onCheckedChange,
  loading = false,
  disabled = false,
  label,
  className
}) {
  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Switch
        checked={checked}
        disabled={disabled || loading}
        onCheckedChange={onCheckedChange}
        className={cn(loading && 'opacity-60 cursor-wait')}
      />
      {loading ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary animate-pulse select-none">
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
          <span>Updating...</span>
        </span>
      ) : label ? (
        <span className={cn(
          'text-xs font-medium select-none',
          checked ? 'text-foreground' : 'text-muted-foreground'
        )}>
          {label}
        </span>
      ) : null}
    </div>
  );
}
