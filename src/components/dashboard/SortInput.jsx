"use client"
import * as React from "react"
import { Hash } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * SortInput — a FloatingInput-styled sort order field.
 *  - When adding a new record: auto-calculated value (max + 1), with a badge showing it's auto-set.
 *  - When editing: free numeric input.
 *
 * Props:
 *  - value        {number|string}   current sort value
 *  - onChange     {fn}              called with new sort string
 *  - isEditing    {boolean}         true when editing an existing record
 *  - isAuto       {boolean}         true when value was auto-calculated (not yet manually changed)
 *  - onManualEdit {fn}              called when user starts editing manually (clears auto flag)
 *  - label        {string}          field label (default "Sort Order")
 *  - min          {number}          minimum value (default 1)
 */
export function SortInput({
  value = '',
  onChange,
  isEditing = false,
  isAuto = false,
  onManualEdit,
  label = 'Sort Order',
  min = 1,
}) {
  const inputId = React.useId()

  function handleChange(e) {
    if (isAuto && onManualEdit) onManualEdit()
    onChange(e.target.value)
  }

  const showAuto = isAuto && !isEditing

  return (
    <div className="relative group">
      <input
        id={inputId}
        type="number"
        min={min}
        value={value}
        onChange={handleChange}
        placeholder=" "
        className={cn(
          "block px-4 pb-2.5 pt-6 w-full text-sm text-foreground bg-muted/40 rounded-lg border appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary peer transition-colors pr-10",
          showAuto
            ? "border-amber-400/60 focus:border-amber-500"
            : "border-border"
        )}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "absolute text-[13px] duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 font-medium cursor-text peer-focus:font-semibold",
          showAuto
            ? "text-amber-600 peer-focus:text-amber-600"
            : "text-muted-foreground peer-focus:text-primary"
        )}
      >
        {label}
      </label>

      {/* Auto badge icon */}
      <div
        title={showAuto ? "Auto-calculated from existing records. You can edit it manually." : "Sort order"}
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded",
          showAuto ? "text-amber-500" : "text-muted-foreground/40"
        )}
      >
        <Hash className="w-3.5 h-3.5" />
      </div>

      {/* Hint text */}
      {!isEditing && (
        <p className={cn(
          "mt-1 text-[11px] transition-colors px-1 flex items-center gap-1",
          showAuto ? "text-amber-600/80" : "text-muted-foreground/60"
        )}>
          {showAuto ? (
            <>Auto-set to {value} — you can change it manually</>
          ) : (
            <>Display order in the list (lower = first)</>
          )}
        </p>
      )}
    </div>
  )
}
