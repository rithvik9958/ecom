import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Trash2, Plus, ArrowDownUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

export default function TableToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  selectedCount = 0,
  onBulkDelete,
  bulkDeleting = false,
  onAdd,
  addLabel = 'Add New',
  extraActions,
  extraFilters,
  hideSort = false
}) {
  const SORT_OPTIONS = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'a-z', label: 'A - Z' },
    { value: 'z-a', label: 'Z - A' }
  ];

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Sort By';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      {/* Left side: Search & Sort */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-9 bg-background border-border hover:border-primary focus:border-primary h-10 rounded-full transition-colors text-foreground shadow-sm"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        
        {!hideSort && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-full h-10 font-medium bg-background hover:bg-muted text-foreground border-border whitespace-nowrap hidden sm:flex items-center gap-2">
                <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
                {currentSortLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 rounded-xl shadow-lg border-border/40">
              {SORT_OPTIONS.map(opt => (
                <DropdownMenuItem 
                  key={opt.value} 
                  onClick={() => onSortChange?.(opt.value)}
                  className={`cursor-pointer ${sort === opt.value ? 'bg-primary/10 text-primary font-bold' : ''}`}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {extraFilters}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        {selectedCount > 0 && (
          <Button 
            variant="destructive" 
            onClick={onBulkDelete} 
            disabled={bulkDeleting} 
            className="rounded-full px-4 h-10 font-medium whitespace-nowrap bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/20 shadow-none transition-colors"
          >
            {bulkDeleting ? (
              <span className="w-4 h-4 animate-spin rounded-full border-2 border-destructive border-t-transparent mr-2" />
            ) : (
              <Trash2 className="w-4 h-4 mr-1.5" />
            )}
            {bulkDeleting ? 'Deleting...' : `Delete (${selectedCount})`}
          </Button>
        )}
        
        {extraActions}

        {onAdd && (
          <Button 
            onClick={onAdd} 
            className="rounded-full px-5 h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all whitespace-nowrap shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" /> {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
