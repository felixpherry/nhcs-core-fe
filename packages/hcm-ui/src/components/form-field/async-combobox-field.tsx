'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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

import type { AsyncComboboxFieldConfig, FieldOption, PaginatedFieldOptions } from './types';

// ── Props ──

export interface AsyncComboboxFieldProps<TForm extends Record<string, unknown>> {
  config: AsyncComboboxFieldConfig<TForm>;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  disabled: boolean;
  readOnly: boolean;
  hasError: boolean;
  formValues?: TForm;
}

// ── Helpers ──

/** Type guard: is the queryFn result paginated? */
function isPaginated(
  result: FieldOption[] | PaginatedFieldOptions,
): result is PaginatedFieldOptions {
  return !Array.isArray(result) && 'options' in result && 'nextCursor' in result;
}

/** Normalize initialOptions to array */
function normalizeOptions(opts?: FieldOption | FieldOption[]): FieldOption[] {
  if (!opts) return [];
  return Array.isArray(opts) ? opts : [opts];
}

/** Extract current value as string array (works for both single and multi) */
function valueToKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string' && value !== '') return [value];
  return [];
}

// ── Component ──

export function AsyncComboboxField<TForm extends Record<string, unknown>>({
  config,
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  hasError,
  formValues,
}: AsyncComboboxFieldProps<TForm>) {
  const {
    mode = 'single',
    multiDisplayMode = 'count',
    maxSelections,
    showToggleAll = false,
    debounceMs = 300,
    initialOptions,
    placeholder,
  } = config;

  const isMulti = mode === 'multi';

  // ── State ──

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [chipsExpanded, setChipsExpanded] = useState(false);

  const debouncedSearch = useDebounce(search, debounceMs);

  // ── Option cache ──
  // Seeds from initialOptions, then merges fetched results.
  // This guarantees resolveLabel() always works for selected values.

  const [optionCache, setOptionCache] = useState<Map<string, FieldOption>>(() => {
    const map = new Map<string, FieldOption>();
    for (const opt of normalizeOptions(initialOptions)) {
      map.set(opt.value, opt);
    }
    return map;
  });

  const mergeIntoCache = useCallback((options: FieldOption[]) => {
    setOptionCache((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const opt of options) {
        // Fetched wins on conflict (fresher data)
        if (!prev.has(opt.value) || prev.get(opt.value)!.label !== opt.label) {
          next.set(opt.value, opt);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  /** Resolve a value to its display label from cache */
  const resolveLabel = useCallback(
    (val: string): string => {
      return optionCache.get(val)?.label ?? val;
    },
    [optionCache],
  );

  // ── Selection (delegates to useSelection) ──

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
        // Close popover on single select
        setOpen(false);
      }
    },
  });

  // Sync external value changes into useSelection
  // (e.g., form reset, dependency change clearing the value)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      const keys = valueToKeys(value);
      // Only sync if selection is actually different
      const currentSelection = Array.from(selectionState.selectedKeys).sort().join(',');
      const newSelection = keys.sort().join(',');
      if (currentSelection !== newSelection) {
        // Use replaceSelection would be ideal but we don't have it from
        // the destructured return. Instead, clear + re-init via the hook
        // won't work because useSelection uses useState internally.
        // For now, we'll let the initialKeys handle mount-time sync.
        // Runtime sync is handled by the parent re-mounting via key prop.
      }
    }
  }, [value, selectionState.selectedKeys]);

  // ── Query ──

  const queryEnabled =
    !disabled &&
    !readOnly &&
    (config.isQueryEnabled ? config.isQueryEnabled(formValues ?? ({} as TForm)) : true);

  const { data: queryResult, isLoading } = useQuery({
    queryKey: [
      'field-options',
      config.id,
      debouncedSearch,
      // Include dependency values in the key for automatic refetch
      config.dependsOn?.map((dep) => formValues?.[dep]).sort(),
    ],
    queryFn: () =>
      config.queryFn({
        search: debouncedSearch,
        values: formValues as Partial<TForm> | undefined,
      }),
    enabled: queryEnabled && open, // Only fetch when popup is open
  });

  // ── Flatten fetched options ──

  const fetchedOptions = useMemo<FieldOption[]>(() => {
    if (!queryResult) return [];
    return isPaginated(queryResult) ? queryResult.options : queryResult;
  }, [queryResult]);

  // Merge fetched options into cache
  useEffect(() => {
    if (fetchedOptions.length > 0) {
      mergeIntoCache(fetchedOptions);
    }
  }, [fetchedOptions, mergeIntoCache]);

  // ── Visible options (what's shown in the dropdown) ──
  // cmdk handles filtering by search internally, so we pass all fetched options.

  const visibleOptions = fetchedOptions;

  // ── Toggle all handler (multi mode) ──

  const handleToggleAll = useCallback(() => {
    const visibleKeys = visibleOptions.map((o) => o.value);

    if (maxSelections) {
      // If toggling all would exceed max, only select up to the limit
      const currentlySelected = selectionState.selectedKeys;
      const allVisible = visibleKeys.every((k) => currentlySelected.has(k));

      if (allVisible) {
        // Deselect all visible
        toggleAll(visibleKeys);
      } else {
        // Select visible up to remaining capacity
        const remaining = maxSelections - currentlySelected.size;
        const toSelect = visibleKeys.filter((k) => !currentlySelected.has(k)).slice(0, remaining);
        toggleAll([...Array.from(currentlySelected), ...toSelect]);
      }
    } else {
      toggleAll(visibleKeys);
    }
  }, [visibleOptions, maxSelections, selectionState.selectedKeys, toggleAll]);

  // ── Check if max selections reached ──

  const isMaxReached =
    isMulti && maxSelections ? selectionState.selectedKeys.size >= maxSelections : false;

  // ── Remove a single chip (for inline-chips and chips-below) ──

  const handleRemoveChip = useCallback(
    (val: string) => {
      toggleRow(val);
    },
    [toggleRow],
  );

  // ── Render: Trigger button content ──

  const selectedCount = selectionState.selectedKeys.size;

  function renderTriggerContent() {
    // Nothing selected
    if (selectedCount === 0) {
      return <span className="text-muted-foreground">{placeholder ?? 'Select...'}</span>;
    }

    // Single mode — show label
    if (!isMulti) {
      const selectedValue = Array.from(selectionState.selectedKeys)[0]!;
      return <span>{resolveLabel(selectedValue)}</span>;
    }

    // Multi mode — depends on multiDisplayMode
    switch (multiDisplayMode) {
      case 'count':
        return (
          <span>
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        );

      case 'inline-chips': {
        const keys = Array.from(selectionState.selectedKeys);
        const maxVisible = 3;
        const visible = keys.slice(0, maxVisible);
        const overflowCount = keys.length - maxVisible;
        return (
          <span className="flex flex-wrap items-center gap-1 overflow-hidden">
            {visible.map((val) => (
              <Badge key={val} variant="secondary" className="group/chip gap-0.5 pr-0.5">
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
            {overflowCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setChipsExpanded(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    e.preventDefault();
                    setChipsExpanded(true);
                  }
                }}
              >
                +{overflowCount} more
              </span>
            )}
          </span>
        );
      }
    }
  }

  // ── Render: Chips below trigger (for chips-below mode) ──

  function renderChipsBelow() {
    if (!isMulti || multiDisplayMode !== 'inline-chips' || !chipsExpanded || selectedCount === 0) {
      return null;
    }

    const keys = Array.from(selectionState.selectedKeys);

    return (
      <div className="flex flex-wrap items-center gap-1 pt-1">
        {keys.map((val) => (
          <Badge key={val} variant="secondary" className="group/chip gap-0.5 pr-0.5">
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
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          onClick={() => setChipsExpanded(false)}
        >
          Show less
        </button>
      </div>
    );
  }

  // ── Render ──

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={config.id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={hasError}
            disabled={disabled || readOnly}
            className={cn(
              'w-full justify-between font-normal',
              !selectedCount && 'text-muted-foreground',
            )}
            onClick={() => onBlur()}
          >
            {renderTriggerContent()}
            <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${config.label.toLowerCase()}...`}
              value={search}
              onValueChange={setSearch}
            />

            {/* Toggle All button (multi mode only) */}
            {isMulti && showToggleAll && visibleOptions.length > 0 && (
              <div className="border-b px-2 py-1.5">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleToggleAll}
                >
                  {selectionState.isAllSelected(visibleOptions.map((o) => o.value))
                    ? 'Deselect all'
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
                      data-checked={isSelected}
                      onSelect={() => {
                        if (!isDisabledOption) {
                          toggleRow(option.value);
                        }
                      }}
                    >
                      {isMulti && (
                        <div
                          className={cn(
                            'mr-1 flex size-4 items-center justify-center rounded-sm border border-primary',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible',
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

      {renderChipsBelow()}
    </div>
  );
}
