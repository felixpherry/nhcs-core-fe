'use client';

import { useReducer, useRef, useEffect } from 'react';
import { isEqual } from 'src/lib/is-equal';

export type FormMode = 'create' | 'edit' | 'view';

export const CrudFormActionTypes = {
  OpenCreate: 'OPEN_CREATE',
  OpenEdit: 'OPEN_EDIT',
  OpenEditByIdStart: 'OPEN_EDIT_BY_ID_START',
  OpenEditByIdSuccess: 'OPEN_EDIT_BY_ID_SUCCESS',
  OpenEditByIdError: 'OPEN_EDIT_BY_ID_ERROR',
  OpenView: 'OPEN_VIEW',
  SetFieldValue: 'SET_FIELD_VALUE',
  SetValues: 'SET_VALUES',
  Reset: 'RESET',
  RequestClose: 'REQUEST_CLOSE',
  ConfirmDiscard: 'CONFIRM_DISCARD',
  CancelDiscard: 'CANCEL_DISCARD',
} as const;

export type CrudFormActionType = (typeof CrudFormActionTypes)[keyof typeof CrudFormActionTypes];

export interface CrudFormState<TForm> {
  isOpen: boolean;
  mode: FormMode;
  values: TForm;
  initialValues: TForm;
  editId: string | null;
  isLoading: boolean;
  isCloseBlocked: boolean;
}

export type CrudFormAction<TForm> =
  | { type: typeof CrudFormActionTypes.OpenCreate; defaultValues: TForm }
  | { type: typeof CrudFormActionTypes.OpenEdit; id: string; data: TForm }
  | { type: typeof CrudFormActionTypes.OpenEditByIdStart; id: string; defaultValues: TForm }
  | { type: typeof CrudFormActionTypes.OpenEditByIdSuccess; values: TForm }
  | { type: typeof CrudFormActionTypes.OpenEditByIdError }
  | { type: typeof CrudFormActionTypes.OpenView; id: string; data: TForm }
  | { type: typeof CrudFormActionTypes.SetFieldValue; key: string; value: unknown }
  | { type: typeof CrudFormActionTypes.SetValues; values: TForm }
  | { type: typeof CrudFormActionTypes.Reset }
  | { type: typeof CrudFormActionTypes.RequestClose; isDirty: boolean }
  | { type: typeof CrudFormActionTypes.ConfirmDiscard }
  | { type: typeof CrudFormActionTypes.CancelDiscard };

export interface UseCrudFormOptions<TForm extends Record<string, unknown>, TData = unknown> {
  defaultValues: TForm;
  transformForEdit?: (data: TData) => TForm;
  loadForEdit?: (id: string) => Promise<TData>;
  stateReducer?: (
    state: CrudFormState<TForm>,
    actionAndChanges: CrudFormAction<TForm> & { changes: CrudFormState<TForm> },
  ) => CrudFormState<TForm>;
  onStateChange?: (context: CrudFormState<TForm> & { type: CrudFormActionType }) => void;
  onIsOpenChange?: (context: { isOpen: boolean; type: CrudFormActionType }) => void;
  onModeChange?: (context: { mode: FormMode; type: CrudFormActionType }) => void;
  onValuesChange?: (context: { values: TForm; type: CrudFormActionType }) => void;
}

export interface UseCrudFormReturn<TForm extends Record<string, unknown>> {
  isOpen: boolean;
  mode: FormMode;
  values: TForm;
  editId: string | null;
  isDirty: boolean;
  isLoading: boolean;
  isCloseBlocked: boolean;
  setFieldValue: <K extends keyof TForm>(key: K, value: TForm[K]) => void;
  setValues: (values: TForm) => void;
  openCreate: () => void;
  openEdit: (id: string, data: TForm) => void;
  openEditById: (id: string) => Promise<void>;
  openView: (id: string, data: TForm) => void;
  requestClose: () => void;
  confirmDiscard: () => void;
  cancelDiscard: () => void;
  reset: () => void;
}

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
        isCloseBlocked: false,
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
        isCloseBlocked: false,
      };

    case 'OPEN_EDIT_BY_ID_START':
      return {
        ...state,
        isOpen: true,
        mode: 'edit',
        values: { ...action.defaultValues },
        initialValues: { ...action.defaultValues },
        editId: action.id,
        isLoading: true,
        isCloseBlocked: false,
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
        isCloseBlocked: false,
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

    case 'REQUEST_CLOSE':
      if (action.isDirty) {
        return { ...state, isCloseBlocked: true };
      }
      return { ...state, isOpen: false, isCloseBlocked: false };

    case 'CONFIRM_DISCARD':
      return { ...state, isOpen: false, isCloseBlocked: false };

    case 'CANCEL_DISCARD':
      return { ...state, isCloseBlocked: false };

    default:
      return state;
  }
}

export function useCrudForm<TForm extends Record<string, unknown>, TData = unknown>(
  options: UseCrudFormOptions<TForm, TData>,
): UseCrudFormReturn<TForm> {
  const {
    defaultValues,
    transformForEdit,
    loadForEdit,
    stateReducer,
    onStateChange,
    onIsOpenChange,
    onModeChange,
    onValuesChange,
  } = options;

  const enhancedReducer = (
    state: CrudFormState<TForm>,
    action: CrudFormAction<TForm>,
  ): CrudFormState<TForm> => {
    const changes = crudFormReducer(state, action);

    if (stateReducer) {
      return stateReducer(state, { ...action, changes });
    }

    return changes;
  };

  const [state, dispatch] = useReducer(enhancedReducer, {
    isOpen: false,
    mode: 'create' as FormMode,
    values: { ...defaultValues },
    initialValues: { ...defaultValues },
    editId: null,
    isLoading: false,
    isCloseBlocked: false,
  });

  const requestIdRef = useRef(0);

  const prevStateRef = useRef(state);

  const lastActionTypeRef = useRef<CrudFormActionType>(CrudFormActionTypes.OpenCreate);

  const trackedDispatch = (action: CrudFormAction<TForm>) => {
    lastActionTypeRef.current = action.type;
    dispatch(action);
  };

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    // Don't fire on initial mount
    if (prev === state) return;

    const type = lastActionTypeRef.current;

    if (prev.isOpen !== state.isOpen) {
      onIsOpenChange?.({ isOpen: state.isOpen, type });
    }

    if (prev.mode !== state.mode) {
      onModeChange?.({ mode: state.mode, type });
    }

    if (prev.values !== state.values) {
      onValuesChange?.({ values: state.values, type });
    }

    onStateChange?.({ ...state, type });
  });

  const isDirty = !isEqual(state.values, state.initialValues);

  const setFieldValue = <K extends keyof TForm>(key: K, value: TForm[K]) => {
    trackedDispatch({ type: 'SET_FIELD_VALUE', key: key as string, value });
  };

  const setValues = (newValues: TForm) => {
    trackedDispatch({ type: 'SET_VALUES', values: newValues });
  };

  const reset = () => {
    trackedDispatch({ type: 'RESET' });
  };

  const openCreate = () => {
    trackedDispatch({ type: 'OPEN_CREATE', defaultValues });
  };

  const openEdit = (id: string, data: TForm) => {
    trackedDispatch({ type: 'OPEN_EDIT', id, data });
  };

  const openEditById = async (id: string) => {
    if (!loadForEdit) {
      throw new Error('loadForEdit not provided');
    }

    const thisRequest = ++requestIdRef.current;

    trackedDispatch({ type: 'OPEN_EDIT_BY_ID_START', id, defaultValues });

    try {
      const data = await loadForEdit(id);

      if (thisRequest !== requestIdRef.current) return;

      const formValues = transformForEdit ? transformForEdit(data) : (data as unknown as TForm);
      trackedDispatch({ type: 'OPEN_EDIT_BY_ID_SUCCESS', values: formValues });
    } catch (error) {
      if (thisRequest === requestIdRef.current) {
        trackedDispatch({ type: 'OPEN_EDIT_BY_ID_ERROR' });
      }
      throw error;
    }
  };

  const openView = (id: string, data: TForm) => {
    trackedDispatch({ type: 'OPEN_VIEW', id, data });
  };

  const requestClose = () => {
    trackedDispatch({ type: 'REQUEST_CLOSE', isDirty });
  };

  const confirmDiscard = () => {
    trackedDispatch({ type: 'CONFIRM_DISCARD' });
  };

  const cancelDiscard = () => {
    trackedDispatch({ type: 'CANCEL_DISCARD' });
  };

  return {
    isOpen: state.isOpen,
    mode: state.mode,
    values: state.values,
    editId: state.editId,
    isDirty,
    isLoading: state.isLoading,
    isCloseBlocked: state.isCloseBlocked,
    setFieldValue,
    setValues,
    openCreate,
    openEdit,
    openEditById,
    openView,
    requestClose,
    confirmDiscard,
    cancelDiscard,
    reset,
  };
}
