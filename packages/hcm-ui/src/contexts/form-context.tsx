'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { FormMode, UseCrudFormReturn } from '../hooks/use-crud-form';

export interface FormContextValue<TForm extends Record<string, unknown>> {
  values: TForm;
  mode: FormMode;
  errors: Record<string, string[]>;
  isLoading: boolean;
  isDirty: boolean;
  editId: string | null;
  setFieldValue: <K extends keyof TForm>(key: K, value: TForm[K]) => void;
  onBlur?: (name: string) => void;
}

const FormContext = createContext<FormContextValue<Record<string, unknown>> | null>(null);

export function useFormContext<TForm extends Record<string, unknown>>(): FormContextValue<TForm> {
  const ctx = useContext(FormContext);
  if (!ctx) {
    throw new Error(
      'FormBuilder must be used within <CrudFormProvider> or <StandaloneFormProvider>',
    );
  }
  return ctx as unknown as FormContextValue<TForm>;
}

export interface CrudContextValue<TForm extends Record<string, unknown>> {
  crud: UseCrudFormReturn<TForm>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const CrudContext = createContext<CrudContextValue<Record<string, unknown>> | null>(null);

export function useCrudContext<TForm extends Record<string, unknown>>(): CrudContextValue<TForm> {
  const ctx = useContext(CrudContext);
  if (!ctx) {
    throw new Error('CrudDialog must be used within <CrudFormProvider>');
  }
  return ctx as unknown as CrudContextValue<TForm>;
}

// ══════════════════════════════════════════════════════════════
// CrudFormProvider — provides BOTH contexts
// ══════════════════════════════════════════════════════════════

export interface CrudFormProviderProps<TForm extends Record<string, unknown>> {
  crud: UseCrudFormReturn<TForm>;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errors?: Record<string, string[]>;
  onBlur?: (name: string) => void;
  children: ReactNode;
}

export function CrudFormProvider<TForm extends Record<string, unknown>>(
  props: CrudFormProviderProps<TForm>,
) {
  const { crud, onSubmit, isSubmitting = false, errors = {}, onBlur, children } = props;

  const formCtx: FormContextValue<TForm> = {
    values: crud.values,
    mode: crud.mode,
    errors,
    isLoading: crud.isLoading,
    isDirty: crud.isDirty,
    editId: crud.editId,
    setFieldValue: crud.setFieldValue,
    onBlur,
  };

  const crudCtx: CrudContextValue<TForm> = {
    crud,
    onSubmit,
    isSubmitting,
  };

  return (
    <CrudContext.Provider value={crudCtx as CrudContextValue<Record<string, unknown>>}>
      <FormContext.Provider value={formCtx as FormContextValue<Record<string, unknown>>}>
        {children}
      </FormContext.Provider>
    </CrudContext.Provider>
  );
}

// ══════════════════════════════════════════════════════════════
// StandaloneFormProvider — provides only FormContext
// ══════════════════════════════════════════════════════════════

export interface StandaloneFormProviderProps<TForm extends Record<string, unknown>> {
  values: TForm;
  onChange: <K extends keyof TForm>(key: K, value: TForm[K]) => void;
  errors?: Record<string, string[]>;
  mode?: FormMode;
  onBlur?: (name: string) => void;
  children: ReactNode;
}

export function StandaloneFormProvider<TForm extends Record<string, unknown>>(
  props: StandaloneFormProviderProps<TForm>,
) {
  const { values, onChange, errors = {}, mode = 'create', onBlur, children } = props;

  const ctx: FormContextValue<TForm> = {
    values,
    mode,
    errors,
    isLoading: false,
    isDirty: false,
    editId: null,
    setFieldValue: onChange,
    onBlur,
  };

  return (
    <FormContext.Provider value={ctx as FormContextValue<Record<string, unknown>>}>
      {children}
    </FormContext.Provider>
  );
}
