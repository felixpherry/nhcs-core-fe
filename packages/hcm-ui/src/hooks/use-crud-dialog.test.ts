import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrudDialog, CrudDialogActionTypes } from './use-crud-dialog';
import type { CrudDialogState, CrudDialogAction } from './use-crud-dialog';

// ── Test data ──

interface Company {
  companyId: number;
  companyCode: string;
  companyName: string;
  isActive: 'T' | 'F';
}

const SAMPLE_COMPANY: Company = {
  companyId: 42,
  companyCode: 'ACM',
  companyName: 'Acme',
  isActive: 'T',
};

describe('useCrudDialog', () => {
  // ══════════════════════════════════════════════════════════════
  // Initial state
  // ══════════════════════════════════════════════════════════════

  describe('initial state', () => {
    it('starts closed with no data', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.mode).toBe('create');
      expect(result.current.editId).toBeNull();
      expect(result.current.editData).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // openCreate
  // ══════════════════════════════════════════════════════════════

  describe('openCreate', () => {
    it('opens in create mode with no edit data', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('create');
      expect(result.current.editId).toBeNull();
      expect(result.current.editData).toBeNull();
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('clears edit data when opening create after edit', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openEdit('42', SAMPLE_COMPANY));
      expect(result.current.editData).toEqual(SAMPLE_COMPANY);

      act(() => result.current.openCreate());
      expect(result.current.editData).toBeNull();
      expect(result.current.editId).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // openEdit
  // ══════════════════════════════════════════════════════════════

  describe('openEdit', () => {
    it('opens in edit mode with raw backend data', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openEdit('42', SAMPLE_COMPANY));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('edit');
      expect(result.current.editId).toBe('42');
      expect(result.current.editData).toEqual(SAMPLE_COMPANY);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // openEditById
  // ══════════════════════════════════════════════════════════════

  describe('openEditById', () => {
    it('fetches data and stores it as editData', async () => {
      const loadForEdit = vi.fn().mockResolvedValue(SAMPLE_COMPANY);

      const { result } = renderHook(() => useCrudDialog<Company>({ loadForEdit }));

      await act(async () => {
        await result.current.openEditById('42');
      });

      expect(loadForEdit).toHaveBeenCalledWith('42');
      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('edit');
      expect(result.current.editId).toBe('42');
      expect(result.current.editData).toEqual(SAMPLE_COMPANY);
      expect(result.current.isLoading).toBe(false);
    });

    it('stores raw data without transformation', async () => {
      const rawData: Company = {
        companyId: 99,
        companyCode: 'RAW',
        companyName: 'Raw Data Corp',
        isActive: 'F',
      };

      const loadForEdit = vi.fn().mockResolvedValue(rawData);

      const { result } = renderHook(() => useCrudDialog<Company>({ loadForEdit }));

      await act(async () => {
        await result.current.openEditById('99');
      });

      // editData is the exact object from loadForEdit — no transform
      expect(result.current.editData).toEqual(rawData);
    });

    it('throws if loadForEdit not provided', async () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      await expect(
        act(async () => {
          await result.current.openEditById('42');
        }),
      ).rejects.toThrow('loadForEdit not provided');
    });

    it('discards stale responses (race condition)', async () => {
      let resolveFirst: (value: Company) => void;
      let resolveSecond: (value: Company) => void;

      const firstData: Company = { ...SAMPLE_COMPANY, companyName: 'First' };
      const secondData: Company = { ...SAMPLE_COMPANY, companyName: 'Second' };

      const loadForEdit = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<Company>((r) => {
              resolveFirst = r;
            }),
        )
        .mockImplementationOnce(
          () =>
            new Promise<Company>((r) => {
              resolveSecond = r;
            }),
        );

      const { result } = renderHook(() => useCrudDialog<Company>({ loadForEdit }));

      // Fire two requests rapidly
      act(() => {
        result.current.openEditById('1');
      });
      act(() => {
        result.current.openEditById('2');
      });

      // Second resolves first
      await act(async () => {
        resolveSecond!(secondData);
      });
      expect(result.current.editData).toEqual(secondData);

      // First resolves late — should be discarded
      await act(async () => {
        resolveFirst!(firstData);
      });
      expect(result.current.editData).toEqual(secondData);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // openView
  // ══════════════════════════════════════════════════════════════

  describe('openView', () => {
    it('opens in view mode with data', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openView('42', SAMPLE_COMPANY));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('view');
      expect(result.current.editId).toBe('42');
      expect(result.current.editData).toEqual(SAMPLE_COMPANY);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Close lifecycle
  // ══════════════════════════════════════════════════════════════

  describe('close lifecycle', () => {
    it('requestClose closes immediately when isDirty is false', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());
      // isDirtyRef defaults to false
      act(() => result.current.requestClose());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('requestClose blocks when isDirty is true', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());
      act(() => result.current.syncIsDirty(true));
      act(() => result.current.requestClose());

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isCloseBlocked).toBe(true);
    });

    it('confirmDiscard closes regardless of isDirty', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());
      act(() => result.current.syncIsDirty(true));
      act(() => result.current.requestClose());
      expect(result.current.isCloseBlocked).toBe(true);

      act(() => result.current.confirmDiscard());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('cancelDiscard dismisses the block and keeps open', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());
      act(() => result.current.syncIsDirty(true));
      act(() => result.current.requestClose());
      expect(result.current.isCloseBlocked).toBe(true);

      act(() => result.current.cancelDiscard());

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('isCloseBlocked resets when re-opening', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());
      act(() => result.current.syncIsDirty(true));
      act(() => result.current.requestClose());
      expect(result.current.isCloseBlocked).toBe(true);

      act(() => result.current.confirmDiscard());
      act(() => result.current.openCreate());

      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('full discard flow: request → blocked → confirm → closed', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());
      act(() => result.current.syncIsDirty(true));
      expect(result.current.isCloseBlocked).toBe(false);

      act(() => result.current.requestClose());
      expect(result.current.isOpen).toBe(true);
      expect(result.current.isCloseBlocked).toBe(true);

      act(() => result.current.confirmDiscard());
      expect(result.current.isOpen).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('full cancel flow: request → blocked → cancel → still open', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());
      act(() => result.current.syncIsDirty(true));

      act(() => result.current.requestClose());
      expect(result.current.isCloseBlocked).toBe(true);

      act(() => result.current.cancelDiscard());
      expect(result.current.isOpen).toBe(true);
      expect(result.current.isCloseBlocked).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // syncIsDirty
  // ══════════════════════════════════════════════════════════════

  describe('syncIsDirty', () => {
    it('syncs dirty state from external source (TanStack Form)', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());

      // Not dirty → clean close
      act(() => result.current.syncIsDirty(false));
      act(() => result.current.requestClose());
      expect(result.current.isOpen).toBe(false);

      // Re-open, sync dirty → blocked close
      act(() => result.current.openCreate());
      act(() => result.current.syncIsDirty(true));
      act(() => result.current.requestClose());
      expect(result.current.isOpen).toBe(true);
      expect(result.current.isCloseBlocked).toBe(true);
    });

    it('dirty state can be toggled', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());

      act(() => result.current.syncIsDirty(true));
      act(() => result.current.requestClose());
      expect(result.current.isCloseBlocked).toBe(true);

      act(() => result.current.cancelDiscard());

      // User "undoes" their changes — form becomes clean
      act(() => result.current.syncIsDirty(false));
      act(() => result.current.requestClose());
      expect(result.current.isOpen).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // State reducer
  // ══════════════════════════════════════════════════════════════

  describe('stateReducer', () => {
    it('receives current state and action with proposed changes', () => {
      const stateReducer = vi.fn(
        (
          _state: CrudDialogState<Company>,
          actionAndChanges: CrudDialogAction<Company> & { changes: CrudDialogState<Company> },
        ) => actionAndChanges.changes,
      );

      const { result } = renderHook(() => useCrudDialog<Company>({ stateReducer }));

      act(() => result.current.openCreate());

      expect(stateReducer).toHaveBeenCalledTimes(1);
      const [state, actionAndChanges] = stateReducer.mock.calls[0]!;

      expect(state.isOpen).toBe(false);
      expect(actionAndChanges.changes.isOpen).toBe(true);
      expect(actionAndChanges.changes.mode).toBe('create');
      expect(actionAndChanges.type).toBe(CrudDialogActionTypes.OpenCreate);
    });

    it('can override close behavior (skip dirty guard in view mode)', () => {
      const stateReducer = (
        state: CrudDialogState<Company>,
        actionAndChanges: CrudDialogAction<Company> & { changes: CrudDialogState<Company> },
      ) => {
        const { type, changes } = actionAndChanges;
        if (type === CrudDialogActionTypes.RequestClose && state.mode === 'view') {
          return { ...changes, isOpen: false, isCloseBlocked: false };
        }
        return changes;
      };

      const { result } = renderHook(() => useCrudDialog<Company>({ stateReducer }));

      act(() => result.current.openView('42', SAMPLE_COMPANY));
      act(() => result.current.syncIsDirty(true)); // even if somehow dirty
      act(() => result.current.requestClose());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('can modify editData on open', () => {
      const stateReducer = (
        _state: CrudDialogState<Company>,
        actionAndChanges: CrudDialogAction<Company> & { changes: CrudDialogState<Company> },
      ) => {
        const { type, changes } = actionAndChanges;
        if (type === CrudDialogActionTypes.OpenEdit && changes.editData) {
          return {
            ...changes,
            editData: { ...changes.editData, companyName: 'Modified' },
          };
        }
        return changes;
      };

      const { result } = renderHook(() => useCrudDialog<Company>({ stateReducer }));

      act(() => result.current.openEdit('42', SAMPLE_COMPANY));

      expect(result.current.editData?.companyName).toBe('Modified');
    });

    it('does not intercept when stateReducer is not provided', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openEdit('42', SAMPLE_COMPANY));

      expect(result.current.editData).toEqual(SAMPLE_COMPANY);
      expect(result.current.isOpen).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Lifecycle callbacks
  // ══════════════════════════════════════════════════════════════

  describe('on{Key}Change callbacks', () => {
    it('calls onIsOpenChange when isOpen changes', () => {
      const onIsOpenChange = vi.fn();

      const { result } = renderHook(() => useCrudDialog<Company>({ onIsOpenChange }));

      act(() => result.current.openCreate());

      expect(onIsOpenChange).toHaveBeenCalledWith({
        isOpen: true,
        type: CrudDialogActionTypes.OpenCreate,
      });
    });

    it('calls onIsOpenChange on close with correct type', () => {
      const onIsOpenChange = vi.fn();

      const { result } = renderHook(() => useCrudDialog<Company>({ onIsOpenChange }));

      act(() => result.current.openCreate());
      onIsOpenChange.mockClear();

      act(() => result.current.requestClose());

      expect(onIsOpenChange).toHaveBeenCalledWith({
        isOpen: false,
        type: CrudDialogActionTypes.RequestClose,
      });
    });

    it('calls onIsOpenChange with ConfirmDiscard type when force closing', () => {
      const onIsOpenChange = vi.fn();

      const { result } = renderHook(() => useCrudDialog<Company>({ onIsOpenChange }));

      act(() => result.current.openCreate());
      act(() => result.current.syncIsDirty(true));
      act(() => result.current.requestClose());
      onIsOpenChange.mockClear();

      act(() => result.current.confirmDiscard());

      expect(onIsOpenChange).toHaveBeenCalledWith({
        isOpen: false,
        type: CrudDialogActionTypes.ConfirmDiscard,
      });
    });

    it('does NOT call onIsOpenChange when isOpen stays the same', () => {
      const onIsOpenChange = vi.fn();

      const { result } = renderHook(() => useCrudDialog<Company>({ onIsOpenChange }));

      act(() => result.current.openCreate());
      onIsOpenChange.mockClear();

      // syncIsDirty doesn't change isOpen
      act(() => result.current.syncIsDirty(true));

      expect(onIsOpenChange).not.toHaveBeenCalled();
    });

    it('calls onModeChange when mode changes', () => {
      const onModeChange = vi.fn();

      const { result } = renderHook(() => useCrudDialog<Company>({ onModeChange }));

      act(() => result.current.openEdit('1', SAMPLE_COMPANY));

      expect(onModeChange).toHaveBeenCalledWith({
        mode: 'edit',
        type: CrudDialogActionTypes.OpenEdit,
      });
    });

    it('calls onStateChange on every state change', () => {
      const onStateChange = vi.fn();

      const { result } = renderHook(() => useCrudDialog<Company>({ onStateChange }));

      act(() => result.current.openCreate());

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: true,
          mode: 'create',
          type: CrudDialogActionTypes.OpenCreate,
        }),
      );
    });

    it('does not call callbacks on initial mount', () => {
      const onIsOpenChange = vi.fn();
      const onStateChange = vi.fn();

      renderHook(() => useCrudDialog<Company>({ onIsOpenChange, onStateChange }));

      expect(onIsOpenChange).not.toHaveBeenCalled();
      expect(onStateChange).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // editData access patterns
  // ══════════════════════════════════════════════════════════════

  describe('editData', () => {
    it('is null in create mode', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openCreate());

      expect(result.current.editData).toBeNull();
    });

    it('is the raw data in edit mode', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openEdit('42', SAMPLE_COMPANY));

      expect(result.current.editData).toEqual(SAMPLE_COMPANY);
      expect(result.current.editData?.companyId).toBe(42);
      expect(result.current.editData?.companyCode).toBe('ACM');
    });

    it('is the raw data in view mode', () => {
      const { result } = renderHook(() => useCrudDialog<Company>());

      act(() => result.current.openView('42', SAMPLE_COMPANY));

      expect(result.current.editData).toEqual(SAMPLE_COMPANY);
    });

    it('is null during openEditById loading', () => {
      const loadForEdit = vi.fn().mockImplementation(
        () => new Promise(() => {}), // never resolves
      );

      const { result } = renderHook(() => useCrudDialog<Company>({ loadForEdit }));

      act(() => {
        result.current.openEditById('42');
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.editData).toBeNull();
    });

    it('is populated after openEditById resolves', async () => {
      const loadForEdit = vi.fn().mockResolvedValue(SAMPLE_COMPANY);

      const { result } = renderHook(() => useCrudDialog<Company>({ loadForEdit }));

      await act(async () => {
        await result.current.openEditById('42');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.editData).toEqual(SAMPLE_COMPANY);
    });
  });
});
