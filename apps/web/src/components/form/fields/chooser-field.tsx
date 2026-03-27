'use client';

import { useState, useRef, useId } from 'react';
import { Search, X } from 'lucide-react';
import { useFieldContext } from '../form-context';
import { getErrorMessages } from '../utils';
import { BaseField } from './base-field';
import { Chooser } from '@/components/chooser';
import type { ChooserContext } from '@/components/chooser';
import { Button, Input } from '@/components/ui';
import type { Label } from '@/components/ui';

interface ChooserFieldProps<TData, TValue> {
  labelProps: React.ComponentProps<typeof Label>;
  required?: boolean;
  placeholder?: string;
  description?: string;
  className?: string;

  disableInput?: boolean;

  dialogTitle: string;
  dialogDescription?: string;
  dialogClassName?: string;

  empty: TValue;
  getDisplay: (value: TValue) => string;
  getRowId: (row: TData) => string;
  getValueId: (value: TValue) => string;
  transformToValue: (row: TData) => TValue;

  validateInput?: (text: string) => Promise<TValue | null>;
  invalidMessage?: string;
  onConfirm?: (value: TValue) => void;
  onClear?: () => void;

  children: (ctx: ChooserContext<TData>) => React.ReactNode;
}

export function ChooserField<TData, TValue>({
  labelProps,
  required,
  placeholder,
  description,
  className,
  disableInput = false,
  dialogTitle,
  dialogDescription,
  dialogClassName,
  empty,
  getDisplay,
  getRowId,
  getValueId,
  transformToValue,
  validateInput,
  invalidMessage = 'Invalid code',
  onConfirm,
  onClear,
  children,
}: ChooserFieldProps<TData, TValue>) {
  const field = useFieldContext<TValue>();
  const formErrors = getErrorMessages(field);
  const id = useId();

  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const errors = localError ? [...formErrors, localError] : formErrors;

  const displayText = getDisplay(field.state.value);
  const isEmpty = !displayText;

  const prevValueIdRef = useRef('');
  const currentValueId = getValueId(field.state.value);
  if (currentValueId !== prevValueIdRef.current) {
    prevValueIdRef.current = currentValueId;
    if (!disableInput) {
      setInputText(getDisplay(field.state.value));
    }
  }

  async function handleBlur() {
    setLocalError(null);

    if (!validateInput || disableInput) {
      field.handleBlur();
      return;
    }

    const trimmed = inputText.trim();

    if (!trimmed) {
      if (!isEmpty) {
        field.handleChange(empty);
        onClear?.();
      }
      field.handleBlur();
      return;
    }

    if (getDisplay(field.state.value) === trimmed) {
      field.handleBlur();
      return;
    }

    setIsValidating(true);
    const result = await validateInput(trimmed);
    setIsValidating(false);

    if (result) {
      field.handleChange(result);
      setInputText(getDisplay(result));
      onConfirm?.(result);
    } else {
      setLocalError(invalidMessage);
      setInputText(getDisplay(field.state.value));
    }
    field.handleBlur();
  }

  function handleClear() {
    field.handleChange(empty);
    setInputText('');
    setLocalError(null);
    onClear?.();
    field.handleBlur();
  }

  function handleChooserConfirm(rows: TData[]) {
    if (rows.length === 0) return;
    const value = transformToValue(rows[0]!);
    field.handleChange(value);
    setInputText(getDisplay(value));
    setLocalError(null);
    onConfirm?.(value);
    field.handleBlur();
  }

  const initialSelectedIds = isEmpty ? [] : [getValueId(field.state.value)];

  return (
    <BaseField
      id={id}
      labelProps={labelProps}
      required={required}
      errors={errors}
      description={description}
      className={className}
    >
      <div className="flex">
        {disableInput ? (
          <div className="flex h-8 flex-1 items-center truncate rounded-lg border border-input bg-background px-3 text-sm">
            {displayText || <span className="text-muted-foreground">{placeholder}</span>}
          </div>
        ) : (
          <Input
            id={id}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setLocalError(null);
            }}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={isValidating}
            className="flex-1 rounded-r-none border-r-0"
            aria-invalid={errors.length > 0 || undefined}
            aria-describedby={errors.length > 0 ? `${id}-error` : undefined}
          />
        )}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => setOpen(true)}
          disabled={isValidating}
          className="rounded-l-none border-l-0"
        >
          <Search />
        </Button>
        {!isEmpty && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            disabled={isValidating}
          >
            <X />
          </Button>
        )}
      </div>

      <Chooser
        open={open}
        onOpenChange={setOpen}
        title={dialogTitle}
        description={dialogDescription}
        className={dialogClassName}
        mode="single"
        getRowId={getRowId}
        initialSelectedIds={initialSelectedIds}
        required={required}
        onConfirm={handleChooserConfirm}
      >
        {children}
      </Chooser>
    </BaseField>
  );
}
