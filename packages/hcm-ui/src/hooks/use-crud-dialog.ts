'use client';

import { useReducer, useRef, useEffect } from 'react';

// ══════════════════════════════════════════════════════════════
// Public API: Types & Constants
// ══════════════════════════════════════════════════════════════

export type FormMode = 'create' | 'edit' | 'view';

export const CrudDialogActionTypes = {
  OpenCreate: 'OPEN_CREATE',
  OpenEdit: 'OPEN_EDIT',
  OpenEditByIdStart: 'OPEN_EDIT_BY_ID_START',
  OpenEditByIdSuccess: 'OPEN_EDIT_BY_ID_SUCCESS',
  OpenEditByIdError: 'OPEN_EDIT_BY_ID_ERROR',
  OpenView: 'OPEN_VIEW',
  RequestClose: 'REQUEST_CLOSE',
  ConfirmDiscard: 'CONFIRM_DISCARD',
  CancelDiscard: 'CANCEL_DISCARD',
} as const;

export type CrudDialogActionType =
  (typeof CrudDialogActionTypes)[keyof typeof CrudDialogActionTypes];

// ── State ──

export interface CrudDialogState<TData> {
  isOpen: boolean;
  mode: FormMode;
  editId: string | null;
  editData: TData | null;
  isLoading: boolean;
  isCloseBlocked: boolean;
}

// ── Actions ──

export type CrudDialogAction<TData> =
  | { type: typeof CrudDialogActionTypes.OpenCreate }
  | { type: typeof CrudDialogActionTypes.OpenEdit; id: string; data: TData }
  | { type: typeof CrudDialogActionTypes.OpenEditByIdStart; id: string }
  | { type: typeof CrudDialogActionTypes.OpenEditByIdSuccess; data: TData }
  | { type: typeof CrudDialogActionTypes.OpenEditByIdError }
  | { type: typeof CrudDialogActionTypes.OpenView; id: string; data: TData }
  | { type: typeof CrudDialogActionTypes.RequestClose; isDirty: boolean }
  | { type: typeof CrudDialogActionTypes.ConfirmDiscard }
  | { type: typeof CrudDialogActionTypes.CancelDiscard };

// ── Options ──

export interface UseCrudDialogOptions<TData> {
  /** Fetch full record details for edit-by-id */
  loadForEdit?: (id: string) => Promise<TData>;

  /** Intercept any state transition */
  stateReducer?: (
    state: CrudDialogState<TData>,
    actionAndChanges: CrudDialogAction<TData> & { changes: CrudDialogState<TData> },
  ) => CrudDialogState<TData>;

  /** Called after any state change */
  onStateChange?: (context: CrudDialogState<TData> & { type: CrudDialogActionType }) => void;
  /** Called when isOpen changes */
  onIsOpenChange?: (context: { isOpen: boolean; type: CrudDialogActionType }) => void;
  /** Called when mode changes */
  onModeChange?: (context: { mode: FormMode; type: CrudDialogActionType }) => void;
}

// ── Return type ──

export interface UseCrudDialogReturn<TData> {
  isOpen: boolean;
  mode: FormMode;
  editId: string | null;
  /** Raw backend data passed to openEdit/openView, or fetched by openEditById */
  editData: TData | null;
  isLoading: boolean;
  isCloseBlocked: boolean;

  openCreate: () => void;
  openEdit: (id: string, data: TData) => void;
  openEditById: (id: string) => Promise<void>;
  openView: (id: string, data: TData) => void;
  requestClose: () => void;
  confirmDiscard: () => void;
  cancelDiscard: () => void;
  /**
   * Call this every render from the form bridge to sync
   * TanStack Form's isDirty into the dialog's close guard.
   */
  syncIsDirty: (dirty: boolean) => void;
}

// ══════════════════════════════════════════════════════════════
// Internal reducer
// ══════════════════════════════════════════════════════════════

function crudDialogReducer<TData>(
  state: CrudDialogState<TData>,
  action: CrudDialogAction<TData>,
): CrudDialogState<TData> {
  switch (action.type) {
    case 'OPEN_CREATE':
      return {
        ...state,
        isOpen: true,
        mode: 'create',
        editId: null,
        editData: null,
        isLoading: false,
        isCloseBlocked: false,
      };

    case 'OPEN_EDIT':
      return {
        ...state,
        isOpen: true,
        mode: 'edit',
        editId: action.id,
        editData: action.data,
        isLoading: false,
        isCloseBlocked: false,
      };

    case 'OPEN_EDIT_BY_ID_START':
      return {
        ...state,
        isOpen: true,
        mode: 'edit',
        editId: action.id,
        editData: null,
        isLoading: true,
        isCloseBlocked: false,
      };

    case 'OPEN_EDIT_BY_ID_SUCCESS':
      return {
        ...state,
        editData: action.data,
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
        editId: action.id,
        editData: action.data,
        isLoading: false,
        isCloseBlocked: false,
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

// ══════════════════════════════════════════════════════════════
// Hook
// ══════════════════════════════════════════════════════════════

export function useCrudDialog<TData>(
  options: UseCrudDialogOptions<TData> = {},
): UseCrudDialogReturn<TData> {
  const { loadForEdit, stateReducer, onStateChange, onIsOpenChange, onModeChange } = options;

  // ── Enhanced reducer with stateReducer interception ──

  const enhancedReducer = (
    state: CrudDialogState<TData>,
    action: CrudDialogAction<TData>,
  ): CrudDialogState<TData> => {
    const changes = crudDialogReducer(state, action);

    if (stateReducer) {
      return stateReducer(state, { ...action, changes });
    }

    return changes;
  };

  const [state, dispatch] = useReducer(enhancedReducer, {
    isOpen: false,
    mode: 'create' as FormMode,
    editId: null,
    editData: null,
    isLoading: false,
    isCloseBlocked: false,
  });

  // ── Refs ──

  // Race condition guard for openEditById
  const requestIdRef = useRef(0);

  // Previous state for callback diffing
  const prevStateRef = useRef(state);

  // Last action type for callback context
  const lastActionTypeRef = useRef<CrudDialogActionType>(CrudDialogActionTypes.OpenCreate);

  // isDirty synced from TanStack Form via CrudFormBridge
  const isDirtyRef = useRef(false);

  // ── Tracked dispatch ──

  const trackedDispatch = (action: CrudDialogAction<TData>) => {
    lastActionTypeRef.current = action.type;
    dispatch(action);
  };

  // ── Lifecycle callbacks ──

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    if (prev === state) return;

    const type = lastActionTypeRef.current;

    if (prev.isOpen !== state.isOpen) {
      onIsOpenChange?.({ isOpen: state.isOpen, type });
    }

    if (prev.mode !== state.mode) {
      onModeChange?.({ mode: state.mode, type });
    }

    onStateChange?.({ ...state, type });
  });

  // ── Actions ──

  const openCreate = () => {
    trackedDispatch({ type: 'OPEN_CREATE' });
  };

  const openEdit = (id: string, data: TData) => {
    trackedDispatch({ type: 'OPEN_EDIT', id, data });
  };

  const openEditById = async (id: string) => {
    if (!loadForEdit) {
      throw new Error('loadForEdit not provided');
    }

    const thisRequest = ++requestIdRef.current;

    trackedDispatch({ type: 'OPEN_EDIT_BY_ID_START', id });

    try {
      const data = await loadForEdit(id);

      if (thisRequest !== requestIdRef.current) return;

      trackedDispatch({ type: 'OPEN_EDIT_BY_ID_SUCCESS', data });
    } catch (error) {
      if (thisRequest === requestIdRef.current) {
        trackedDispatch({ type: 'OPEN_EDIT_BY_ID_ERROR' });
      }
      throw error;
    }
  };

  const openView = (id: string, data: TData) => {
    trackedDispatch({ type: 'OPEN_VIEW', id, data });
  };

  const requestClose = () => {
    trackedDispatch({ type: 'REQUEST_CLOSE', isDirty: isDirtyRef.current });
  };

  const confirmDiscard = () => {
    trackedDispatch({ type: 'CONFIRM_DISCARD' });
  };

  const cancelDiscard = () => {
    trackedDispatch({ type: 'CANCEL_DISCARD' });
  };

  const syncIsDirty = (dirty: boolean) => {
    isDirtyRef.current = dirty;
  };

  return {
    isOpen: state.isOpen,
    mode: state.mode,
    editId: state.editId,
    editData: state.editData,
    isLoading: state.isLoading,
    isCloseBlocked: state.isCloseBlocked,
    openCreate,
    openEdit,
    openEditById,
    openView,
    requestClose,
    confirmDiscard,
    cancelDiscard,
    syncIsDirty,
  };
}
