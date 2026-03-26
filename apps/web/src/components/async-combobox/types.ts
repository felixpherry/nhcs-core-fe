export interface AsyncComboboxProps {
  /** Unique id for the combobox */
  id: string;
  /** Placeholder text */
  placeholder?: string;
  /** Label used for search placeholder ("Search {label}...") */
  label: string;
  /** Single or multi select */
  mode?: 'single' | 'multi';
  /** How to display multi selections in the trigger */
  multiDisplayMode?: 'count' | 'inline-chips';
  /** Max selections in multi mode */
  maxSelections?: number;
  /** Show "Select all / Clear" toggle in multi mode */
  showToggleAll?: boolean;
  /** Debounce ms for search input */
  debounceMs?: number;
  /** Pre-populated options (for displaying labels of already-selected values) */
  initialOptions?: ComboboxOption | ComboboxOption[];

  // ── Query ──
  /** Fetch options. Called when popover opens or search changes. */
  queryFn: (params: { search: string }) => Promise<ComboboxOption[] | PaginatedComboboxOptions>;
  /** Query key prefix for React Query caching */
  queryKeyPrefix?: string;

  // ── Value ──
  value: string | string[];
  onChange: (value: string | string[]) => void;
  onBlur?: () => void;

  // ── State ──
  disabled?: boolean;
}

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface PaginatedComboboxOptions {
  options: ComboboxOption[];
  nextCursor?: string | null;
}
