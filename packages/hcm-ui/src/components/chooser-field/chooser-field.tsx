'use client';

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { SearchIcon, XIcon, LoaderIcon } from 'lucide-react';

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ChooserDialog } from '../chooser-dialog/chooser-dialog';
import type { UseChooserReturn } from '../../hooks/use-chooser';
import { cn } from '../../lib/utils';

// ── Types ──

export interface ChooserFieldProps<TData, TValue> {
  /** useChooser return object */
  chooser: UseChooserReturn<TData, TValue>;
  /** Validate a typed code on blur.
   *  Query the same endpoint as the dialog table with the typed code.
   *  Return the projected TValue if exactly 1 match, null otherwise. */
  validateCode: (code: string) => Promise<TValue | null>;
  /** Extract the code string from a TValue */
  getCode: (item: TValue) => string;
  /** Extract the key string from a TValue (for pre-selecting in chooser) */
  getKey: (item: TValue) => string;
  /** Extract the display label from a TValue.
   *  If omitted, the right-side label input is hidden and code input takes full width. */
  getLabel?: (item: TValue) => string;
  /** Current selected value */
  value: TValue | null;
  /** Called when value changes */
  onChange: (value: TValue | null) => void;

  // ── Form field props ──

  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  error?: string;
  id?: string;

  // ── ChooserDialog props ──

  dialogTitle: string;
  dialogDescription?: string;
  dialogMaxWidth?: string;
  /** Content inside the ChooserDialog — typically a DataTable */
  children: React.ReactNode;
}

// ── Reducer ──

interface FieldState {
  codeText: string;
  displayLabel: string;
  codeError: string | null;
  isValidating: boolean;
  isHovered: boolean;
}

type FieldAction =
  | { type: 'SET_CODE'; code: string }
  | { type: 'SET_HOVER'; hovered: boolean }
  | { type: 'VALIDATE_START' }
  | { type: 'VALIDATE_SUCCESS'; codeText: string; displayLabel: string }
  | { type: 'VALIDATE_FAIL' }
  | { type: 'SYNC_VALUE'; codeText: string; displayLabel: string }
  | { type: 'CLEAR' }
  | { type: 'CLEAR_ERROR' };

function fieldReducer(state: FieldState, action: FieldAction): FieldState {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, codeText: action.code, codeError: null };
    case 'SET_HOVER':
      return { ...state, isHovered: action.hovered };
    case 'VALIDATE_START':
      return { ...state, isValidating: true };
    case 'VALIDATE_SUCCESS':
      return {
        ...state,
        isValidating: false,
        codeText: action.codeText,
        displayLabel: action.displayLabel,
        codeError: null,
      };
    case 'VALIDATE_FAIL':
      return {
        ...state,
        isValidating: false,
        displayLabel: '',
        codeError: 'Code is invalid',
      };
    case 'SYNC_VALUE':
      return {
        ...state,
        codeText: action.codeText,
        displayLabel: action.displayLabel,
        codeError: null,
      };
    case 'CLEAR':
      return {
        ...state,
        codeText: '',
        displayLabel: '',
        codeError: null,
        isHovered: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, codeError: null };
    default:
      return state;
  }
}

// ── Component ──

export function ChooserField<TData, TValue>({
  chooser,
  validateCode,
  getCode,
  getLabel,
  getKey,
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  placeholder = 'Search',
  error,
  id,
  dialogTitle,
  dialogDescription,
  dialogMaxWidth,
  children,
}: ChooserFieldProps<TData, TValue>) {
  const [state, dispatch] = useReducer(fieldReducer, {
    codeText: value ? getCode(value) : '',
    displayLabel: value && getLabel ? getLabel(value) : '',
    codeError: null,
    isValidating: false,
    isHovered: false,
  });

  const isSubmittingRef = useRef(false);
  const previousValueRef = useRef(value);
  const showLabel = !!getLabel;

  // ── Sync from external value changes ──

  useEffect(() => {
    if (value) {
      dispatch({
        type: 'SYNC_VALUE',
        codeText: getCode(value),
        displayLabel: getLabel ? getLabel(value) : '',
      });
    } else {
      dispatch({ type: 'CLEAR' });
    }
    previousValueRef.current = value;
  }, [value, getCode, getLabel]);

  // ── Blur handler ──

  const handleBlur = useCallback(async () => {
    if (isSubmittingRef.current) return;

    const trimmed = state.codeText.trim();

    if (trimmed === '') {
      if (required && previousValueRef.current) {
        dispatch({
          type: 'SYNC_VALUE',
          codeText: getCode(previousValueRef.current),
          displayLabel: getLabel ? getLabel(previousValueRef.current) : '',
        });
      } else if (!required) {
        dispatch({ type: 'CLEAR' });
        onChange(null);
      }
      return;
    }

    if (value && trimmed === getCode(value)) return;

    isSubmittingRef.current = true;
    dispatch({ type: 'VALIDATE_START' });

    try {
      const result = await validateCode(trimmed);

      if (result) {
        dispatch({
          type: 'VALIDATE_SUCCESS',
          codeText: getCode(result),
          displayLabel: getLabel ? getLabel(result) : '',
        });
        onChange(result);
      } else {
        dispatch({ type: 'VALIDATE_FAIL' });
      }
    } catch {
      dispatch({ type: 'VALIDATE_FAIL' });
    } finally {
      isSubmittingRef.current = false;
    }
  }, [state.codeText, value, required, validateCode, getCode, getLabel, onChange]);

  // ── Clear handler ──

  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR' });
    onChange(null);
  }, [onChange]);

  // ── Open chooser ──

  const handleOpenChooser = useCallback(() => {
    if (disabled || readOnly) return;
    chooser.open(value ? [getKey(value)] : []);
  }, [chooser, value, getKey, disabled, readOnly]);

  // ── Derived ──

  const showError = error || state.codeError;
  const isDisabled = disabled || readOnly;
  const showClearButton =
    !isDisabled && state.isHovered && (state.codeText !== '' || value !== null);

  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div
        className="flex items-center gap-2"
        onMouseEnter={() => dispatch({ type: 'SET_HOVER', hovered: true })}
        onMouseLeave={() => dispatch({ type: 'SET_HOVER', hovered: false })}
      >
        {/* ── Code input + search/clear button ── */}
        <div className={cn('relative flex', showLabel ? 'w-1/3' : 'w-full')}>
          <Input
            id={id}
            type="text"
            value={state.codeText}
            onChange={(e) => dispatch({ type: 'SET_CODE', code: e.target.value })}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            disabled={isDisabled}
            placeholder={placeholder}
            className={cn('rounded-r-none', showError && 'border-destructive')}
          />
          <button
            type="button"
            disabled={isDisabled}
            className={cn(
              'flex items-center justify-center rounded-r-md border border-l-0 border-input bg-background px-3',
              'hover:bg-accent transition-colors',
              isDisabled && 'opacity-50 cursor-not-allowed',
              showError && 'border-destructive',
            )}
            onClick={showClearButton ? handleClear : handleOpenChooser}
            title={showClearButton ? 'Clear' : 'Search'}
          >
            {state.isValidating ? (
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            ) : showClearButton ? (
              <XIcon className="size-4 text-muted-foreground" />
            ) : (
              <SearchIcon className="size-4 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* ── Display label (optional) ── */}
        {showLabel && (
          <Input
            type="text"
            value={state.displayLabel}
            disabled
            readOnly
            className="w-2/3"
            tabIndex={-1}
          />
        )}
      </div>

      {/* ── Error message ── */}
      {showError && <p className="text-sm text-destructive">{showError}</p>}

      {/* ── ChooserDialog ── */}
      <ChooserDialog
        chooser={chooser}
        title={dialogTitle}
        description={dialogDescription}
        maxWidth={dialogMaxWidth}
      >
        {children}
      </ChooserDialog>
    </div>
  );
}
