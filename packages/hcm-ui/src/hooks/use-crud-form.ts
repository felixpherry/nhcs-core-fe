'use client';

import { useState, useCallback, useMemo, useRef } from 'react';

// ── Types ──

export type FormMode = 'create' | 'edit' | 'view';

export interface UseCrudFormOptions<TForm extends Record<string, unknown>, TData = unknown> {
  /** Default values for create mode */
  defaultValues: TForm;
  /** Transform backend data into form values for edit mode */
  transformForEdit?: (data: TData) => TForm;
  /** Fetch full record details for edit (list rows are often partial) */
  loadForEdit?: (id: string) => Promise<TData>;
}

export interface UseCrudFormReturn<TForm extends Record<string, unknown>> {
  /** Whether the form sheet is open */
  isOpen: boolean;
  /** Current form mode */
  mode: FormMode;
  /** Current form values */
  values: TForm;
  /** The ID of the record being edited (null for create) */
  editId: string | null;
  /** Whether values differ from initial state */
  isDirty: boolean;
  /** Whether async edit data is loading */
  isLoading: boolean;
  /** Update a single field */
  setFieldValue: <K extends keyof TForm>(key: K, value: TForm[K]) => void;
  /** Replace all values */
  setValues: (values: TForm) => void;
  /** Open in create mode */
  openCreate: () => void;
  /** Open in edit mode with data */
  openEdit: (id: string, data: TForm) => void;
  /** Open in edit mode by ID (fetches data) */
  openEditById: (id: string) => Promise<void>;
  /** Open in view mode */
  openView: (id: string, data: TForm) => void;
  /** Close the form (checks dirty state) */
  requestClose: () => boolean;
  /** Force close without dirty check */
  forceClose: () => void;
  /** Whether it's safe to close (not dirty) */
  canClose: boolean;
  /** Reset form to initial values for current mode */
  reset: () => void;
}

// ── Deep equality ──

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => isEqual(v, b[i]));
  }
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => isEqual(aObj[key], bObj[key]));
}

// ── Hook ──

export function useCrudForm<TForm extends Record<string, unknown>, TData = unknown>(
  options: UseCrudFormOptions<TForm, TData>,
): UseCrudFormReturn<TForm> {
  const { defaultValues, transformForEdit, loadForEdit } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>('create');
  const [values, setValuesState] = useState<TForm>(() => ({ ...defaultValues }));
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Track initial values to compute isDirty
  const initialValues = useRef<TForm>({ ...defaultValues });

  const isDirty = useMemo(() => !isEqual(values, initialValues.current), [values]);

  const canClose = !isDirty;

  // ── Field operations ──

  const setFieldValue = useCallback(<K extends keyof TForm>(key: K, value: TForm[K]) => {
    setValuesState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setValues = useCallback((newValues: TForm) => {
    setValuesState({ ...newValues });
  }, []);

  const reset = useCallback(() => {
    setValuesState({ ...initialValues.current });
  }, []);

  // ── Open operations ──

  const openCreate = useCallback(() => {
    const vals = { ...defaultValues };
    initialValues.current = vals;
    setValuesState(vals);
    setMode('create');
    setEditId(null);
    setIsOpen(true);
  }, [defaultValues]);

  const openEdit = useCallback((id: string, data: TForm) => {
    initialValues.current = { ...data };
    setValuesState({ ...data });
    setMode('edit');
    setEditId(id);
    setIsOpen(true);
  }, []);

  const openEditById = useCallback(
    async (id: string) => {
      if (!loadForEdit) {
        throw new Error('loadForEdit not provided');
      }

      setIsLoading(true);
      setMode('edit');
      setEditId(id);
      setIsOpen(true);

      try {
        const data = await loadForEdit(id);
        const formValues = transformForEdit ? transformForEdit(data) : (data as unknown as TForm);
        initialValues.current = { ...formValues };
        setValuesState({ ...formValues });
      } finally {
        setIsLoading(false);
      }
    },
    [loadForEdit, transformForEdit],
  );

  const openView = useCallback((id: string, data: TForm) => {
    initialValues.current = { ...data };
    setValuesState({ ...data });
    setMode('view');
    setEditId(id);
    setIsOpen(true);
  }, []);

  // ── Close operations ──

  const requestClose = useCallback((): boolean => {
    if (isDirty) {
      return false; // Caller should show confirmation dialog
    }
    setIsOpen(false);
    return true;
  }, [isDirty]);

  const forceClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    mode,
    values,
    editId,
    isDirty,
    isLoading,
    setFieldValue,
    setValues,
    openCreate,
    openEdit,
    openEditById,
    openView,
    requestClose,
    forceClose,
    canClose,
    reset,
  };
}
