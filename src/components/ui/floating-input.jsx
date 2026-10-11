"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

const FloatingInput = React.forwardRef(({ className, type, label, id, rightElement, placeholder, ...props }, ref) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const inputId = id || React.useId()
  return (
    <div className="relative">
      <input
        type={type}
        id={inputId}
        className={cn(
          "block px-4 pb-2.5 pt-6 w-full text-sm text-foreground bg-muted/40 rounded-lg border border-border appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary peer transition-colors disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-transparent focus:placeholder:text-muted-foreground/60 placeholder:text-[12px] placeholder:transition-colors",
          className
        )}
        placeholder={placeholder || " "}
        ref={ref}
        {...props}
      />
      <label
        htmlFor={inputId}
        className="absolute text-[13px] text-muted-foreground duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-4 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 font-medium cursor-text peer-focus:font-semibold"
      >
        {label}
      </label>
      {rightElement && (
        <div className="absolute right-3 top-2 z-20 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  )
})
FloatingInput.displayName = "FloatingInput"

import { ChevronDown, Check, Search, X } from "lucide-react"

function extractOptions(children, optionsProp) {
  if (Array.isArray(optionsProp) && optionsProp.length > 0) {
    return optionsProp.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value ?? opt.id ?? opt.slug ?? opt.key ?? '',
          label: opt.label ?? opt.name ?? opt.title ?? String(opt.value ?? opt.id ?? ''),
          desc: opt.desc || opt.description || null,
          disabled: Boolean(opt.disabled)
        };
      }
      return { value: String(opt), label: String(opt), desc: null, disabled: false };
    });
  }

  const result = [];
  React.Children.forEach(children, (child) => {
    if (!child) return;
    if (child.type === 'option') {
      result.push({
        value: child.props.value !== undefined ? String(child.props.value) : String(child.props.children || ''),
        label: typeof child.props.children === 'string' ? child.props.children : String(child.props.children || child.props.value || ''),
        desc: null,
        disabled: Boolean(child.props.disabled)
      });
    } else if (child.type === 'optgroup') {
      const groupLabel = child.props.label || '';
      React.Children.forEach(child.props.children, (opt) => {
        if (opt && opt.type === 'option') {
          result.push({
            value: opt.props.value !== undefined ? String(opt.props.value) : String(opt.props.children || ''),
            label: typeof opt.props.children === 'string' ? opt.props.children : String(opt.props.children || opt.props.value || ''),
            desc: groupLabel,
            disabled: Boolean(opt.props.disabled)
          });
        }
      });
    }
  });
  return result;
}

const FloatingSelect = React.forwardRef(({
  className,
  label,
  id,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  children,
  options: optionsProp,
  placeholder = 'Select...',
  searchable,
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const selectId = id || React.useId();
  const [internalValue, setInternalValue] = React.useState(
    controlledValue !== undefined ? controlledValue : (defaultValue !== undefined ? defaultValue : '')
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const parsedOptions = React.useMemo(() => {
    return extractOptions(children, optionsProp);
  }, [children, optionsProp]);

  const currentValue = controlledValue !== undefined ? String(controlledValue) : String(internalValue ?? '');
  const selectedOption = parsedOptions.find(o => String(o.value) === currentValue);
  const hasValue = Boolean(selectedOption && selectedOption.value !== '');

  const isSearchEnabled = searchable !== undefined ? searchable : parsedOptions.length >= 4;

  const filteredOptions = isSearchEnabled && searchQuery.trim()
    ? parsedOptions.filter(o =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.desc && o.desc.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : parsedOptions;

  React.useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
      if (isSearchEnabled && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, isSearchEnabled]);

  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleSelect = (val) => {
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    setIsOpen(false);
    setSearchQuery('');

    if (onChange) {
      const syntheticEvent = {
        target: { value: val, name: name || '', id: selectId },
        currentTarget: { value: val, name: name || '', id: selectId },
        value: val,
        toString: () => val,
        valueOf: () => val
      };
      onChange(syntheticEvent, val);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative select-none", className)}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          id={selectId}
          ref={ref}
        />
      )}

      {/* Trigger Button styled like FloatingInput */}
      <button
        type="button"
        id={!name ? selectId : undefined}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "block px-4 pb-2.5 pt-6 w-full text-sm text-foreground bg-muted/40 rounded-lg border appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors text-left peer",
          isOpen
            ? "border-primary ring-2 ring-primary/20"
            : "border-border hover:border-border/80",
          disabled && "opacity-50 cursor-not-allowed",
          !hasValue && "text-muted-foreground"
        )}
      >
        <span className={cn("truncate block pr-6 text-sm", hasValue ? "text-foreground font-medium" : "text-transparent")}>
          {hasValue ? selectedOption.label : (placeholder || ' ')}
        </span>
      </button>

      {/* Floating Animated Label */}
      <label
        htmlFor={selectId}
        className={cn(
          "absolute text-[13px] duration-200 transform z-10 origin-[0] start-4 pointer-events-none font-medium transition-all",
          hasValue || isOpen
            ? "-translate-y-3 scale-75 top-4 text-primary font-semibold"
            : "translate-y-0 scale-100 top-4 text-muted-foreground"
        )}
      >
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>

      {/* Chevron Icon */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5">
        <ChevronDown
          size={15}
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </div>

      {/* Select2-Style Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[220px] z-[9999] bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          {/* Search Box */}
          {isSearchEnabled && (
            <div className="p-1 mb-1 border-b border-border/60">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-muted/40 rounded-lg border border-border focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 no-scrollbar p-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No matching options found.
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === currentValue;
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-bold shadow-xs"
                        : "text-foreground hover:bg-muted/60 hover:text-foreground",
                      opt.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{opt.label}</div>
                      {opt.desc && (
                        <div className="text-[10px] text-muted-foreground truncate">{opt.desc}</div>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-primary shrink-0 ml-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});
FloatingSelect.displayName = "FloatingSelect"

const FloatingTextarea = React.forwardRef(({ className, label, id, rightElement, placeholder, ...props }, ref) => {
  const textareaId = id || React.useId()
  return (
    <div className="relative">
      <textarea
        id={textareaId}
        className={cn(
          "block px-4 pb-2.5 pt-6 w-full text-sm text-foreground bg-muted/40 rounded-lg border border-border appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary peer transition-colors disabled:cursor-not-allowed disabled:opacity-50 resize-y placeholder:text-transparent focus:placeholder:text-muted-foreground/60 placeholder:text-[12px] placeholder:transition-colors",
          className
        )}
        placeholder={placeholder || " "}
        ref={ref}
        {...props}
      />
      <label
        htmlFor={textareaId}
        className="absolute text-[13px] text-muted-foreground duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] start-4 peer-focus:text-primary peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 font-medium cursor-text peer-focus:font-semibold pr-1"
      >
        {label}
      </label>
      {rightElement && (
        <div className="absolute right-3 top-2 z-20 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  )
})
FloatingTextarea.displayName = "FloatingTextarea"

export { FloatingInput, FloatingSelect, FloatingTextarea }
