'use client';

import { useReducer, useCallback, useMemo, useRef } from 'react';

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

// ── Reducer ──

interface CrudFormState<TForm> {
  isOpen: boolean;
  mode: FormMode;
  values: TForm;
  initialValues: TForm;
  editId: string | null;
  isLoading: boolean;
}

type CrudFormAction<TForm> =
  | { type: 'OPEN_CREATE'; defaultValues: TForm }
  | { type: 'OPEN_EDIT'; id: string; data: TForm }
  | { type: 'OPEN_EDIT_BY_ID_START'; id: string; defaultValues: TForm }
  | { type: 'OPEN_EDIT_BY_ID_SUCCESS'; values: TForm }
  | { type: 'OPEN_EDIT_BY_ID_ERROR' }
  | { type: 'OPEN_VIEW'; id: string; data: TForm }
  | { type: 'SET_FIELD_VALUE'; key: string; value: unknown }
  | { type: 'SET_VALUES'; values: TForm }
  | { type: 'RESET' }
  | { type: 'CLOSE' };

function crudFormReducer<TForm>(
  state: CrudFormState<TForm>,
  action: CrudFormAction<TForm>,
): CrudFormState<TForm> {
  switch (action.type) {
    case 'OPEN_CREATE':
      return {
        ...state,
        isOpen: true,
        mode: 'create',
        values: { ...action.defaultValues },
        initialValues: { ...action.defaultValues },
        editId: null,
        isLoading: false,
      };

    case 'OPEN_EDIT':
      return {
        ...state,
        isOpen: true,
        mode: 'edit',
        values: { ...action.data },
        initialValues: { ...action.data },
        editId: action.id,
        isLoading: false,
      };

    case 'OPEN_EDIT_BY_ID_START':
      // §7.3: Hard-reset to defaults immediately while loading
      return {
        ...state,
        isOpen: true,
        mode: 'edit',
        values: { ...action.defaultValues },
        initialValues: { ...action.defaultValues },
        editId: action.id,
        isLoading: true,
      };

    case 'OPEN_EDIT_BY_ID_SUCCESS':
      return {
        ...state,
        values: { ...action.values },
        initialValues: { ...action.values },
        isLoading: false,
      };

    case 'OPEN_EDIT_BY_ID_ERROR':
      return {
        ...state,
        isLoading: false,
      };

    case 'OPEN_VIEW':
      return {
        ...state,
        isOpen: true,
        mode: 'view',
        values: { ...action.data },
        initialValues: { ...action.data },
        editId: action.id,
        isLoading: false,
      };

    case 'SET_FIELD_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.key]: action.value },
      };

    case 'SET_VALUES':
      return {
        ...state,
        values: { ...action.values },
      };

    case 'RESET':
      return {
        ...state,
        values: { ...state.initialValues },
      };

    case 'CLOSE':
      return {
        ...state,
        isOpen: false,
      };

    default:
      return state;
  }
}

// ── Hook ──

export function useCrudForm<TForm extends Record<string, unknown>, TData = unknown>(
  options: UseCrudFormOptions<TForm, TData>,
): UseCrudFormReturn<TForm> {
  const { defaultValues, transformForEdit, loadForEdit } = options;

  const [state, dispatch] = useReducer(crudFormReducer<TForm>, {
    isOpen: false,
    mode: 'create' as FormMode,
    values: { ...defaultValues },
    initialValues: { ...defaultValues },
    editId: null,
    isLoading: false,
  });

  // Stale request guard for openEditById race condition (§7.3)
  const requestIdRef = useRef(0);

  const isDirty = useMemo(() => !isEqual(state.values, state.initialValues), [state.values, state.initialValues]);

  const canClose = !isDirty;

  // ── Field operations ──

  const setFieldValue = useCallback(<K extends keyof TForm>(key: K, value: TForm[K]) => {
    dispatch({ type: 'SET_FIELD_VALUE', key: key as string, value });
  }, []);

  const setValues = useCallback((newValues: TForm) => {
    dispatch({ type: 'SET_VALUES', values: newValues });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // ── Open operations ──

  const openCreate = useCallback(() => {
    dispatch({ type: 'OPEN_CREATE', defaultValues });
  }, [defaultValues]);

  const openEdit = useCallback((id: string, data: TForm) => {
    dispatch({ type: 'OPEN_EDIT', id, data });
  }, []);

  const openEditById = useCallback(
    async (id: string) => {
      if (!loadForEdit) {
        throw new Error('loadForEdit not provided');
      }

      // Increment request counter — any earlier in-flight request becomes stale
      const thisRequest = ++requestIdRef.current;

      // §7.3: Hard-reset to defaults immediately while loading
      dispatch({ type: 'OPEN_EDIT_BY_ID_START', id, defaultValues });

      try {
        const data = await loadForEdit(id);

        // Discard if a newer request has been made
        if (thisRequest !== requestIdRef.current) return;

        const formValues = transformForEdit ? transformForEdit(data) : (data as unknown as TForm);
        dispatch({ type: 'OPEN_EDIT_BY_ID_SUCCESS', values: formValues });
      } catch (error) {
        // Only handle error if this is still the active request
        if (thisRequest === requestIdRef.current) {
          dispatch({ type: 'OPEN_EDIT_BY_ID_ERROR' });
        }
        throw error;
      }
    },
    [defaultValues, loadForEdit, transformForEdit],
  );

  const openView = useCallback((id: string, data: TForm) => {
    dispatch({ type: 'OPEN_VIEW', id, data });
  }, []);

  // ── Close operations ──

  const requestClose = useCallback((): boolean => {
    if (isDirty) {
      return false; // Caller should show confirmation dialog
    }
    dispatch({ type: 'CLOSE' });
    return true;
  }, [isDirty]);

  const forceClose = useCallback(() => {
    dispatch({ type: 'CLOSE' });
  }, []);

  return {
    isOpen: state.isOpen,
    mode: state.mode,
    values: state.values,
    editId: state.editId,
    isDirty,
    isLoading: state.isLoading,
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
