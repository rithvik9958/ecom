'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [], // [{ value: 'x', label: 'Option X', desc?: '...' }, ...] or ['Option 1', 'Option 2']
  prefix = '',
  placeholder = 'Select option...',
  searchable = undefined, // default: auto-enables if > 4 options, or pass boolean
  fullWidth = true,
  className = '',
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { 
        value: opt.value ?? opt.id ?? opt.slug ?? opt.key, 
        label: opt.label ?? opt.name ?? opt.title ?? String(opt.value ?? opt.id ?? ''),
        desc: opt.desc || opt.description || null
      };
    }
    return { value: opt, label: String(opt), desc: null };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Determine if search box should show (like Select2)
  const isSearchEnabled = searchable !== undefined ? searchable : normalizedOptions.length >= 5;

  // Filter options based on search query
  const filteredOptions = isSearchEnabled && searchQuery.trim()
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.desc && opt.desc.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : normalizedOptions;

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (isSearchEnabled && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isSearchEnabled]);

  // Handle keyboard navigation (Escape, Enter)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Dimensions based on size prop
  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-lg',
    md: 'h-10 px-3 text-xs sm:text-sm rounded-xl',
    lg: 'h-12 px-4 text-sm rounded-xl'
  }[size] || 'h-10 px-3 text-xs sm:text-sm rounded-xl';

  return (
    <div
      ref={containerRef}
      className={`custom-select-container relative select-none ${fullWidth ? 'w-full block' : 'inline-block'} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 border text-left font-medium transition-all ${sizeClasses} ${
          isOpen
            ? 'bg-background border-primary ring-2 ring-primary/20 shadow-xs'
            : 'bg-background hover:bg-muted/30 border-border text-foreground'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-1.5 truncate">
          {prefix && (
            <span className="text-muted-foreground font-normal text-xs shrink-0">
              {prefix}
            </span>
          )}
          <span className={`truncate ${selectedOption ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : 'rotate-0'
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[200px] z-[9999] bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          {/* Select2-Style Search Box */}
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
                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div ref={listRef} className="max-h-56 overflow-y-auto space-y-0.5 no-scrollbar p-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No matching options found.
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold shadow-xs'
                        : 'text-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
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
}
