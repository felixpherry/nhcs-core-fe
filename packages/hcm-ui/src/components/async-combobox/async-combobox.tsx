'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDownIcon, XIcon, CheckIcon } from 'lucide-react';

import { useDebounce } from '../../hooks/use-debounce';
import { useSelection } from '../../hooks/use-selection';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface PaginatedComboboxResult {
  options: ComboboxOption[];
  nextCursor: unknown;
}

export type MultiDisplayMode = 'count' | 'inline-chips';

export interface AsyncComboboxProps {
  /** Unique identifier — used for HTML id and query key prefix */
  id: string;
  /** Label — used in search placeholder ("Search {label}...") */
  label: string;

  // ── Value ──
  value: string | string[];
  onChange: (value: string | string[]) => void;
  onBlur?: () => void;

  // ── Query ──
  /** Fetch options. Called when popover opens or search changes. */
  queryFn: (params: { search: string }) => Promise<ComboboxOption[] | PaginatedComboboxResult>;
  /** Extra keys to include in the React Query cache key (e.g., dependency values for refetch). */
  queryKeyDeps?: unknown[];

  // ── Mode ──
  /** Selection mode. Default: 'single' */
  mode?: 'single' | 'multi';
  /** How multi-select values display in the trigger. Default: 'count' */
  multiDisplayMode?: MultiDisplayMode;
  /** Max selections in multi mode. undefined = unlimited */
  maxSelections?: number;
  /** Show "Select all / Clear" toggle in multi mode. Default: false */
  showToggleAll?: boolean;

  // ── Display ──
  placeholder?: string;
  /** Debounce ms for search input. Default: 300 */
  debounceMs?: number;
  /** Pre-resolved option(s) for display before fetch completes.
   *  Seeded into internal option cache on mount. */
  initialOptions?: ComboboxOption | ComboboxOption[];

  // ── State ──
  disabled?: boolean;
  /** aria-invalid for error styling */
  'aria-invalid'?: boolean;
}

// ── Helpers ──

function isPaginated(
  result: ComboboxOption[] | PaginatedComboboxResult,
): result is PaginatedComboboxResult {
  return !Array.isArray(result) && 'options' in result && 'nextCursor' in result;
}

function normalizeOptions(opts?: ComboboxOption | ComboboxOption[]): ComboboxOption[] {
  if (!opts) return [];
  return Array.isArray(opts) ? opts : [opts];
}

function valueToKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string' && value !== '') return [value];
  return [];
}

// ── Component ──

export function AsyncCombobox({
  id,
  label,
  value,
  onChange,
  onBlur,
  queryFn,
  queryKeyDeps = [],
  mode = 'single',
  multiDisplayMode = 'count',
  maxSelections,
  showToggleAll = false,
  placeholder,
  debounceMs = 300,
  initialOptions,
  disabled = false,
  'aria-invalid': ariaInvalid,
}: AsyncComboboxProps) {
  const isMulti = mode === 'multi';

  // ── State ──

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [chipsExpanded, setChipsExpanded] = useState(false);

  const debouncedSearch = useDebounce(search, debounceMs);

  // ── Option cache ──

  const [optionCache, setOptionCache] = useState<Map<string, ComboboxOption>>(() => {
    const map = new Map<string, ComboboxOption>();
    for (const opt of normalizeOptions(initialOptions)) {
      map.set(opt.value, opt);
    }
    return map;
  });

  const mergeIntoCache = (options: ComboboxOption[]) => {
    setOptionCache((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const opt of options) {
        if (!prev.has(opt.value) || prev.get(opt.value)!.label !== opt.label) {
          next.set(opt.value, opt);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  };

  const resolveLabel = (val: string): string => {
    return optionCache.get(val)?.label ?? val;
  };

  // ── Selection ──

  const currentKeys = useMemo(() => valueToKeys(value), [value]);

  const {
    state: selectionState,
    toggleRow,
    toggleAll,
  } = useSelection({
    mode,
    initialKeys: currentKeys,
    onSelectionChange: (selectedKeys) => {
      const keys = Array.from(selectedKeys);
      if (isMulti) {
        onChange(keys);
      } else {
        onChange(keys[0] ?? '');
        setOpen(false);
      }
    },
  });

  // Sync external value changes into selection
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
    }
  }, [value]);

  // ── Query ──

  const { data: queryResult, isLoading } = useQuery({
    queryKey: ['async-combobox', id, debouncedSearch, ...queryKeyDeps],
    queryFn: () => queryFn({ search: debouncedSearch }),
    enabled: !disabled && open,
  });

  // ── Flatten fetched options ──

  const fetchedOptions = useMemo<ComboboxOption[]>(() => {
    if (!queryResult) return [];
    return isPaginated(queryResult) ? queryResult.options : queryResult;
  }, [queryResult]);

  // Merge fetched into cache
  useEffect(() => {
    if (fetchedOptions.length > 0) {
      mergeIntoCache(fetchedOptions);
    }
  }, [fetchedOptions]);

  const visibleOptions = fetchedOptions;

  // ── Toggle all handler ──

  const handleToggleAll = () => {
    const visibleKeys = visibleOptions.map((o) => o.value);

    if (maxSelections) {
      const currentlySelected = selectionState.selectedKeys;
      const allVisible = visibleKeys.every((k) => currentlySelected.has(k));

      if (allVisible) {
        toggleAll(visibleKeys);
      } else {
        const remaining = maxSelections - currentlySelected.size;
        const toSelect = visibleKeys.filter((k) => !currentlySelected.has(k)).slice(0, remaining);
        toggleAll([...Array.from(currentlySelected), ...toSelect]);
      }
    } else {
      toggleAll(visibleKeys);
    }
  };

  const isMaxReached =
    isMulti && maxSelections ? selectionState.selectedKeys.size >= maxSelections : false;

  const handleRemoveChip = (val: string) => {
    toggleRow(val);
  };

  // ── Trigger content ──

  const selectedCount = selectionState.selectedKeys.size;

  function renderTriggerContent() {
    if (selectedCount === 0) {
      return <span className="text-muted-foreground">{placeholder ?? 'Select...'}</span>;
    }

    if (!isMulti) {
      const selectedValue = Array.from(selectionState.selectedKeys)[0]!;
      return <span>{resolveLabel(selectedValue)}</span>;
    }

    switch (multiDisplayMode) {
      case 'count':
        return (
          <span>
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        );

      case 'inline-chips': {
        const keys = Array.from(selectionState.selectedKeys);
        const maxVisible = chipsExpanded ? keys.length : 1;
        const visible = keys.slice(0, maxVisible);
        const overflowCount = keys.length - maxVisible;
        return (
          <span className="flex flex-wrap items-center gap-1 overflow-hidden">
            {visible.map((val) => (
              <Badge key={val} variant="default" className="group/chip gap-0.5 pr-0.5">
                {resolveLabel(val)}
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-0.5 rounded-full p-0.5 opacity-0 transition-opacity hover:bg-muted-foreground/20 group-hover/chip:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleRemoveChip(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      e.preventDefault();
                      handleRemoveChip(val);
                    }
                  }}
                  aria-label={`Remove ${resolveLabel(val)}`}
                >
                  <XIcon className="size-3" />
                </span>
              </Badge>
            ))}
            {(overflowCount > 0 || chipsExpanded) && (
              <span
                role="button"
                tabIndex={0}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setChipsExpanded((v) => !v);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    e.preventDefault();
                    setChipsExpanded((v) => !v);
                  }
                }}
              >
                {chipsExpanded ? 'Show less' : `+${overflowCount} more`}
              </span>
            )}
          </span>
        );
      }
    }
  }

  // ── Render ──

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal h-auto min-h-8 py-1.5',
              !selectedCount && 'text-muted-foreground',
            )}
            onClick={() => onBlur?.()}
          >
            {renderTriggerContent()}
            <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onValueChange={setSearch}
            />

            {isMulti && showToggleAll && visibleOptions.length > 0 && (
              <div className="flex items-center justify-between border-b px-2 py-1.5">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleToggleAll}
                >
                  {selectionState.isAllSelected(visibleOptions.map((o) => o.value))
                    ? 'Clear'
                    : 'Select all'}
                </button>
              </div>
            )}

            <CommandList>
              <CommandEmpty>{isLoading ? 'Loading...' : 'No results found.'}</CommandEmpty>
              <CommandGroup>
                {visibleOptions.map((option) => {
                  const isSelected = selectionState.isSelected(option.value);
                  const isDisabledOption = !isSelected && isMaxReached;

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      disabled={isDisabledOption}
                      onSelect={() => {
                        if (!isDisabledOption) {
                          toggleRow(option.value);
                        }
                      }}
                      data-checked={isMulti ? undefined : isSelected}
                    >
                      {isMulti && (
                        <div
                          className={cn(
                            'mr-1 flex size-4 items-center justify-center rounded-sm border border-primary',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : '[&_svg]:invisible opacity-50',
                          )}
                        >
                          <CheckIcon className="size-3" />
                        </div>
                      )}
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
