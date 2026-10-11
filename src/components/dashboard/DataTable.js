'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Trash2, Inbox } from 'lucide-react';
import ConfirmDeleteModal from '@/components/dashboard/ConfirmDeleteModal';

/**
 * DataTable — Premium consistent table used across the whole dashboard.
 *
 * Props:
 *  columns          — array of { key, label, render?, align? }
 *  data             — array of row objects
 *  loading          — boolean
 *  onRowClick       — optional, makes rows clickable
 *  actions          — boolean, show a trailing actions column (default true)
 *  pagination       — boolean (default true)
 *  selectedIds      — array of selected row IDs (for checkbox selection)
 *  onToggleSelectAll — fn, enables checkbox header
 *  onToggleSelectRow — fn, enables per-row checkbox
 *  onReorder        — fn(newData), enables drag-and-drop row sorting with grip handles
 */
export default function DataTable({
  columns,
  data,
  loading,
  onRowClick,
  actions = true,
  pagination = true,
  selectedIds = [],
  onToggleSelectAll,
  onToggleSelectRow,
  onReorder,
  onBulkDelete,
  isBulkDeleting = false,
}) {
  const [internalSelectedIds, setInternalSelectedIds] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const isControlled = onToggleSelectAll !== undefined;
  const activeSelectedIds = isControlled ? selectedIds : internalSelectedIds;
  const hasSelect = isControlled || onBulkDelete !== undefined;
  const hasDrag = typeof onReorder === 'function';
  const hasExplicitActions = columns.some(
    (c) => c.key === 'actions' || c.label?.toLowerCase() === 'actions' || c.label?.toLowerCase() === 'action'
  );
  const showTrailingActions = actions && !hasExplicitActions;

  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleToggleSelectAll = (e) => {
    if (isControlled) {
      onToggleSelectAll(e);
    } else {
      if (activeSelectedIds.length === data.length && data.length > 0) {
        setInternalSelectedIds([]);
      } else {
        setInternalSelectedIds(data.map((d, i) => d._id || d.id || String(i)));
      }
    }
  };

  const handleToggleSelectRow = (id) => {
    if (isControlled) {
      onToggleSelectRow?.(id);
    } else {
      setInternalSelectedIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  };

  const handleBatchDeleteClick = () => {
    if (onBulkDelete && activeSelectedIds.length > 0) {
      setShowConfirm(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (onBulkDelete && activeSelectedIds.length > 0) {
      await onBulkDelete(activeSelectedIds);
      setInternalSelectedIds([]);
      setShowConfirm(false);
    }
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const next = [...data];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dragOverIndex, 0, moved);
      onReorder(next);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden shadow-sm bg-card flex flex-col">
        
        {/* Bulk Action Bar */}
        {onBulkDelete && activeSelectedIds.length > 0 && (
          <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center justify-between animate-in fade-in shrink-0">
            <span className="text-sm font-semibold text-primary">
              {activeSelectedIds.length} item{activeSelectedIds.length > 1 ? 's' : ''} selected
            </span>
          <button 
            onClick={handleBatchDeleteClick}
            disabled={isBulkDeleting}
            className="flex items-center gap-2 text-xs font-medium bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            {isBulkDeleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">

          {/* ── Header ── */}
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {/* Drag handle column header */}
              {hasDrag && <th className="w-10 px-3 py-3.5" />}

              {/* Checkbox column header */}
              {hasSelect && (
                <th className="px-5 py-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && activeSelectedIds.length === data.length}
                    onChange={handleToggleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer w-4 h-4"
                  />
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {col.label}
                </th>
              ))}

              {showTrailingActions && (
                <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td
                    colSpan={
                      columns.length +
                      (hasDrag ? 1 : 0) +
                      (hasSelect ? 1 : 0) +
                      (showTrailingActions ? 1 : 0)
                    }
                    className="px-5 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-4 bg-muted/60 rounded w-1/4" />
                      <div className="h-4 bg-muted/40 rounded w-1/3" />
                      <div className="h-4 bg-muted/30 rounded w-1/4" />
                    </div>
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (hasDrag ? 1 : 0) +
                    (hasSelect ? 1 : 0) +
                    (actions && !columns.some(c => c.key === 'actions') ? 1 : 0)
                  }
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-3 shadow-xs">
                      <Inbox className="w-6 h-6 text-muted-foreground opacity-70" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No records found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">There are no items matching your criteria or none have been added yet.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const isDragging = hasDrag && dragIndex === i;
                const isOver = hasDrag && dragOverIndex === i && dragIndex !== i;
                const rowId = row._id || row.id || String(i);

                return (
                  <tr
                    key={rowId}
                    draggable={hasDrag}
                    onDragStart={hasDrag ? () => setDragIndex(i) : undefined}
                    onDragEnter={hasDrag ? () => setDragOverIndex(i) : undefined}
                    onDragOver={hasDrag ? (e) => e.preventDefault() : undefined}
                    onDragEnd={hasDrag ? handleDragEnd : undefined}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors duration-100 group select-none',
                      onRowClick && 'cursor-pointer',
                      hasDrag && 'cursor-default',
                      !isDragging && 'hover:bg-muted/40',
                      isDragging && 'opacity-40 bg-primary/10',
                      isOver && 'border-t-2 border-t-primary bg-primary/10'
                    )}
                  >
                    {/* Drag Handle */}
                    {hasDrag && (
                      <td
                        className="w-10 px-3 py-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="opacity-60 group-hover:opacity-100 transition-opacity">
                          <circle cx="5" cy="4" r="1.5" />
                          <circle cx="11" cy="4" r="1.5" />
                          <circle cx="5" cy="8" r="1.5" />
                          <circle cx="11" cy="8" r="1.5" />
                          <circle cx="5" cy="12" r="1.5" />
                          <circle cx="11" cy="12" r="1.5" />
                        </svg>
                      </td>
                    )}

                    {/* Checkbox */}
                    {hasSelect && (
                      <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={activeSelectedIds.includes(rowId)}
                          onChange={() => handleToggleSelectRow(rowId)}
                          className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer w-4 h-4"
                        />
                      </td>
                    )}

                    {/* Data Cells */}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-5 py-3.5 text-sm text-foreground align-middle',
                          col.align === 'right' && 'text-right'
                        )}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}

                    {/* Actions slot */}
                    {showTrailingActions && (
                      <td
                        className="px-5 py-3.5 text-right align-middle"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination && data.length > 0 && (
        <div className="px-5 py-3.5 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{data.length}</span> record{data.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1.5">
            <button className="px-2.5 py-1.5 border border-border bg-background hover:bg-muted rounded-lg text-xs font-medium text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-foreground bg-background border border-border rounded-lg">
              1
            </span>
            <button className="px-2.5 py-1.5 border border-border bg-background hover:bg-muted rounded-lg text-xs font-medium text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      </div>

      <ConfirmDeleteModal
        isOpen={showConfirm}
        isDeleting={isBulkDeleting}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${activeSelectedIds.length} selected item${activeSelectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`}
      />
    </>
  );
}
