'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * StoreSelect — a Select2-style searchable dropdown for the storefront.
 * Drop-in replacement for the admin CustomSelect component.
 * Uses storefront CSS variables (--store-*) instead of admin Tailwind tokens.
 *
 * Props API matches CustomSelect:
 *   value, onChange(val), options, prefix, placeholder, searchable,
 *   fullWidth, className, size ('sm'|'md'|'lg'), disabled
 */
export default function StoreSelect({
  value,
  onChange,
  options = [],
  prefix = '',
  placeholder = 'Select...',
  searchable,
  fullWidth = true,
  className = '',
  size = 'md',
  disabled = false,
  style = {},
  triggerStyle = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? opt.slug ?? opt.key,
        label: opt.label ?? opt.name ?? opt.title ?? String(opt.value ?? opt.id ?? ''),
        desc: opt.desc || opt.description || null,
      };
    }
    return { value: opt, label: String(opt), desc: null };
  });

  const selectedOption = normalizedOptions.find((o) => String(o.value) === String(value));
  const isSearchEnabled = searchable !== undefined ? searchable : normalizedOptions.length >= 5;

  const filteredOptions =
    isSearchEnabled && searchQuery.trim()
      ? normalizedOptions.filter(
          (o) =>
            o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.desc && o.desc.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : normalizedOptions;

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) close();
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
      if (isSearchEnabled && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, isSearchEnabled, close]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && isOpen) close(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    close();
  };

  const sizeMap = {
    sm: { height: '34px', padding: '0 10px', fontSize: '13px', borderRadius: '8px' },
    md: { height: '40px', padding: '0 12px', fontSize: '14px', borderRadius: '10px' },
    lg: { height: '46px', padding: '0 14px', fontSize: '14px', borderRadius: '10px' },
  };
  const dims = sizeMap[size] || sizeMap.md;

  const triggerBase = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    minWidth: '120px',
    height: dims.height,
    padding: dims.padding,
    fontSize: dims.fontSize,
    borderRadius: dims.borderRadius,
    border: `1px solid ${isOpen ? 'var(--store-primary, #111)' : 'var(--store-border, #e2e8f0)'}`,
    background: 'var(--store-surface, #fff)',
    color: selectedOption ? 'var(--store-text, #111)' : 'var(--store-muted, #64748b)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxShadow: isOpen ? '0 0 0 3px color-mix(in srgb, var(--store-primary, #111) 15%, transparent)' : 'none',
    userSelect: 'none',
    fontWeight: selectedOption ? 600 : 400,
    ...triggerStyle,
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-block', ...style }}
    >
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={triggerBase}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
          {prefix && (
            <span style={{ color: 'var(--store-muted, #64748b)', fontWeight: 400, fontSize: '12px', flexShrink: 0 }}>
              {prefix}
            </span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="var(--store-muted, #64748b)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            width: '100%',
            minWidth: '180px',
            zIndex: 9999,
            background: 'var(--store-surface, #fff)',
            border: '1px solid var(--store-border, #e2e8f0)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '6px',
            animation: 'storeSelectFadeIn 0.12s ease',
          }}
        >
          {/* Search box */}
          {isSearchEnabled && (
            <div style={{ padding: '4px 2px 6px', borderBottom: '1px solid var(--store-border, #e2e8f0)', marginBottom: '4px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="var(--store-muted, #64748b)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: '10px', pointerEvents: 'none', flexShrink: 0 }}
                >
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  style={{
                    width: '100%',
                    padding: '6px 30px 6px 32px',
                    border: '1px solid var(--store-border, #e2e8f0)',
                    borderRadius: '8px',
                    background: 'var(--store-bg, #f8fafc)',
                    color: 'var(--store-text, #111)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--store-muted, #64748b)', padding: 0, lineHeight: 1 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--store-muted, #64748b)' }}>
                No options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '13px',
                      cursor: 'pointer',
                      background: isSelected ? 'color-mix(in srgb, var(--store-primary, #111) 10%, transparent)' : 'transparent',
                      color: isSelected ? 'var(--store-primary, #111)' : 'var(--store-text, #111)',
                      fontWeight: isSelected ? 700 : 400,
                      transition: 'background 0.1s',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--store-border, #f1f5f9)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                      {opt.desc && (
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--store-muted, #64748b)', fontWeight: 400 }}>
                          {opt.desc}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--store-primary, #111)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes storeSelectFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
