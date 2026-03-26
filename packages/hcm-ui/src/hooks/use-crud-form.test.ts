import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrudForm, CrudFormActionTypes } from './use-crud-form';
import type { CrudFormState, CrudFormAction } from './use-crud-form';

interface TestForm extends Record<string, unknown> {
  name: string;
  code: string;
  isActive: boolean;
}

interface TestData {
  companyId: number;
  companyName: string;
  companyCode: string;
  isActive: 'T' | 'F';
}

const DEFAULTS: TestForm = {
  name: '',
  code: '',
  isActive: false,
};

describe('useCrudForm', () => {
  // ══════════════════════════════════════════════════════════════
  // Initial state
  // ══════════════════════════════════════════════════════════════

  describe('initial state', () => {
    it('starts closed with default values', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      expect(result.current.isOpen).toBe(false);
      expect(result.current.mode).toBe('create');
      expect(result.current.values).toEqual(DEFAULTS);
      expect(result.current.editId).toBeNull();
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Open create
  // ══════════════════════════════════════════════════════════════

  describe('openCreate', () => {
    it('opens form in create mode with defaults', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('create');
      expect(result.current.values).toEqual(DEFAULTS);
      expect(result.current.editId).toBeNull();
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('resets values when opening create after edit', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openEdit('1', { name: 'Acme', code: 'ACM', isActive: true }));
      expect(result.current.values.name).toBe('Acme');

      act(() => result.current.openCreate());
      expect(result.current.values).toEqual(DEFAULTS);
      expect(result.current.editId).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Open edit
  // ══════════════════════════════════════════════════════════════

  describe('openEdit', () => {
    it('opens form in edit mode with provided data', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      const data: TestForm = { name: 'Acme', code: 'ACM', isActive: true };
      act(() => result.current.openEdit('42', data));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('edit');
      expect(result.current.editId).toBe('42');
      expect(result.current.values).toEqual(data);
      expect(result.current.isDirty).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Open edit by ID
  // ══════════════════════════════════════════════════════════════

  describe('openEditById', () => {
    it('fetches data and opens in edit mode', async () => {
      const backendData: TestData = {
        companyId: 42,
        companyName: 'Acme',
        companyCode: 'ACM',
        isActive: 'T',
      };

      const loadForEdit = vi.fn().mockResolvedValue(backendData);
      const transformForEdit = vi.fn(
        (data: TestData): TestForm => ({
          name: data.companyName,
          code: data.companyCode,
          isActive: data.isActive === 'T',
        }),
      );

      const { result } = renderHook(() =>
        useCrudForm({
          defaultValues: DEFAULTS,
          loadForEdit,
          transformForEdit,
        }),
      );

      await act(async () => {
        await result.current.openEditById('42');
      });

      expect(loadForEdit).toHaveBeenCalledWith('42');
      expect(transformForEdit).toHaveBeenCalledWith(backendData);
      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('edit');
      expect(result.current.editId).toBe('42');
      expect(result.current.values).toEqual({
        name: 'Acme',
        code: 'ACM',
        isActive: true,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });

    it('throws if loadForEdit not provided', async () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      await expect(
        act(async () => {
          await result.current.openEditById('42');
        }),
      ).rejects.toThrow('loadForEdit not provided');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Open view
  // ══════════════════════════════════════════════════════════════

  describe('openView', () => {
    it('opens in view mode', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      const data: TestForm = { name: 'Acme', code: 'ACM', isActive: true };
      act(() => result.current.openView('42', data));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('view');
      expect(result.current.editId).toBe('42');
      expect(result.current.values).toEqual(data);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Field operations
  // ══════════════════════════════════════════════════════════════

  describe('field operations', () => {
    it('setFieldValue updates a single field', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'Test'));

      expect(result.current.values.name).toBe('Test');
    });

    it('setValues replaces all values', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setValues({ name: 'Test', code: 'TST', isActive: true }));

      expect(result.current.values).toEqual({
        name: 'Test',
        code: 'TST',
        isActive: true,
      });
    });

    it('reset restores initial values', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'dirty'));
      expect(result.current.isDirty).toBe(true);

      act(() => result.current.reset());
      expect(result.current.values).toEqual(DEFAULTS);
      expect(result.current.isDirty).toBe(false);
    });

    it('reset in edit mode restores edit data, not defaults', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      const editData: TestForm = { name: 'Acme', code: 'ACM', isActive: true };
      act(() => result.current.openEdit('1', editData));
      act(() => result.current.setFieldValue('name', 'Changed'));
      expect(result.current.isDirty).toBe(true);

      act(() => result.current.reset());
      expect(result.current.values).toEqual(editData);
      expect(result.current.isDirty).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Dirty tracking
  // ══════════════════════════════════════════════════════════════

  describe('dirty tracking', () => {
    it('is not dirty when values match initial', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      expect(result.current.isDirty).toBe(false);
    });

    it('is dirty when a field changes', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'changed'));
      expect(result.current.isDirty).toBe(true);
    });

    it('is not dirty when changed back to initial', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'changed'));
      expect(result.current.isDirty).toBe(true);

      act(() => result.current.setFieldValue('name', ''));
      expect(result.current.isDirty).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Close lifecycle (Pattern 3: unified close)
  // ══════════════════════════════════════════════════════════════

  describe('close lifecycle', () => {
    it('requestClose closes immediately when not dirty', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      expect(result.current.isOpen).toBe(true);

      act(() => result.current.requestClose());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('requestClose sets isCloseBlocked when dirty', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'dirty'));

      act(() => result.current.requestClose());

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isCloseBlocked).toBe(true);
    });

    it('confirmDiscard closes regardless of dirty state', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'dirty'));
      act(() => result.current.requestClose());
      expect(result.current.isCloseBlocked).toBe(true);

      act(() => result.current.confirmDiscard());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('cancelDiscard dismisses the block and keeps the form open', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'dirty'));
      act(() => result.current.requestClose());
      expect(result.current.isCloseBlocked).toBe(true);

      act(() => result.current.cancelDiscard());

      expect(result.current.isOpen).toBe(true);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('isCloseBlocked resets when re-opening', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      // Get into a blocked state
      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'dirty'));
      act(() => result.current.requestClose());
      expect(result.current.isCloseBlocked).toBe(true);

      // Force close then re-open
      act(() => result.current.confirmDiscard());
      act(() => result.current.openCreate());

      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('full discard flow: request → blocked → confirm → closed', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      // Open and make dirty
      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'unsaved work'));
      expect(result.current.isDirty).toBe(true);
      expect(result.current.isCloseBlocked).toBe(false);

      // Request close → blocked
      act(() => result.current.requestClose());
      expect(result.current.isOpen).toBe(true);
      expect(result.current.isCloseBlocked).toBe(true);

      // Confirm discard → closed
      act(() => result.current.confirmDiscard());
      expect(result.current.isOpen).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('full cancel flow: request → blocked → cancel → still open', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'unsaved work'));

      // Request close → blocked
      act(() => result.current.requestClose());
      expect(result.current.isCloseBlocked).toBe(true);

      // Cancel → back to editing
      act(() => result.current.cancelDiscard());
      expect(result.current.isOpen).toBe(true);
      expect(result.current.isCloseBlocked).toBe(false);
      expect(result.current.values.name).toBe('unsaved work');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Pattern 1: State reducer
  // ══════════════════════════════════════════════════════════════

  describe('stateReducer', () => {
    it('receives current state and action with proposed changes', () => {
      const stateReducer = vi.fn(
        (
          _state: CrudFormState<TestForm>,
          actionAndChanges: CrudFormAction<TestForm> & { changes: CrudFormState<TestForm> },
        ) => actionAndChanges.changes,
      );

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, stateReducer }));

      act(() => result.current.openCreate());

      expect(stateReducer).toHaveBeenCalledTimes(1);
      const [state, actionAndChanges] = stateReducer.mock.calls[0]!;

      // State is the PREVIOUS state (before the action)
      expect(state.isOpen).toBe(false);

      // Changes are what the internal reducer computed
      expect(actionAndChanges.changes.isOpen).toBe(true);
      expect(actionAndChanges.changes.mode).toBe('create');

      // Action type is included
      expect(actionAndChanges.type).toBe(CrudFormActionTypes.OpenCreate);
    });

    it('can modify the proposed changes', () => {
      // When opening create, override the name default value
      const stateReducer = (
        _state: CrudFormState<TestForm>,
        actionAndChanges: CrudFormAction<TestForm> & { changes: CrudFormState<TestForm> },
      ) => {
        const { type, changes } = actionAndChanges;
        if (type === CrudFormActionTypes.OpenCreate) {
          const values = { ...changes.values, name: 'Pre-filled' } as TestForm;
          return { ...changes, values, initialValues: values };
        }
        return changes;
      };

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, stateReducer }));

      act(() => result.current.openCreate());

      expect(result.current.values.name).toBe('Pre-filled');
      // Both values and initialValues were set, so isDirty should be false
      expect(result.current.isDirty).toBe(false);
    });

    it('can cascade-clear dependent fields on SET_FIELD_VALUE', () => {
      interface CascadeForm extends Record<string, unknown> {
        companyId: string;
        locationId: string;
        departmentId: string;
      }

      const cascadeDefaults: CascadeForm = {
        companyId: '',
        locationId: '',
        departmentId: '',
      };

      const stateReducer = (
        _state: CrudFormState<CascadeForm>,
        actionAndChanges: CrudFormAction<CascadeForm> & { changes: CrudFormState<CascadeForm> },
      ) => {
        const { type, changes } = actionAndChanges;
        if (
          type === CrudFormActionTypes.SetFieldValue &&
          'key' in actionAndChanges &&
          actionAndChanges.key === 'companyId'
        ) {
          return {
            ...changes,
            values: { ...changes.values, locationId: '', departmentId: '' },
          };
        }
        return changes;
      };

      const { result } = renderHook(() =>
        useCrudForm({ defaultValues: cascadeDefaults, stateReducer }),
      );

      // Set up: open and fill all fields
      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('companyId', 'c1'));
      act(() => result.current.setFieldValue('locationId', 'l1'));
      act(() => result.current.setFieldValue('departmentId', 'd1'));

      expect(result.current.values.locationId).toBe('l1');
      expect(result.current.values.departmentId).toBe('d1');

      // Change company → children should cascade-clear
      act(() => result.current.setFieldValue('companyId', 'c2'));

      expect(result.current.values.companyId).toBe('c2');
      expect(result.current.values.locationId).toBe('');
      expect(result.current.values.departmentId).toBe('');
    });

    it('can override close behavior (e.g., skip dirty guard in view mode)', () => {
      const stateReducer = (
        state: CrudFormState<TestForm>,
        actionAndChanges: CrudFormAction<TestForm> & { changes: CrudFormState<TestForm> },
      ) => {
        const { type, changes } = actionAndChanges;
        // View mode: always close immediately, never block
        if (type === CrudFormActionTypes.RequestClose && state.mode === 'view') {
          return { ...changes, isOpen: false, isCloseBlocked: false };
        }
        return changes;
      };

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, stateReducer }));

      const data: TestForm = { name: 'Acme', code: 'ACM', isActive: true };
      act(() => result.current.openView('42', data));

      // Even though we can't make view mode "dirty" through normal means,
      // the stateReducer ensures RequestClose always closes in view mode
      act(() => result.current.requestClose());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isCloseBlocked).toBe(false);
    });

    it('does not intercept when stateReducer is not provided', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'Test'));

      expect(result.current.values.name).toBe('Test');
      expect(result.current.isOpen).toBe(true);
    });

    it('receives the full action payload for SET_FIELD_VALUE', () => {
      const stateReducer = vi.fn(
        (
          _state: CrudFormState<TestForm>,
          actionAndChanges: CrudFormAction<TestForm> & { changes: CrudFormState<TestForm> },
        ) => actionAndChanges.changes,
      );

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, stateReducer }));

      act(() => result.current.openCreate());
      stateReducer.mockClear();

      act(() => result.current.setFieldValue('name', 'Test'));

      const actionAndChanges = stateReducer.mock.calls[0]?.[1];

      expect(actionAndChanges).toMatchObject({
        type: CrudFormActionTypes.SetFieldValue,
        key: 'name',
        value: 'Test',
      });
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Pattern 2: Convention-based callbacks
  // ══════════════════════════════════════════════════════════════

  describe('on{Key}Change callbacks', () => {
    it('calls onIsOpenChange when isOpen changes', () => {
      const onIsOpenChange = vi.fn();

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, onIsOpenChange }));

      act(() => result.current.openCreate());

      expect(onIsOpenChange).toHaveBeenCalledWith({
        isOpen: true,
        type: CrudFormActionTypes.OpenCreate,
      });
    });

    it('calls onIsOpenChange on close with correct type', () => {
      const onIsOpenChange = vi.fn();

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, onIsOpenChange }));

      act(() => result.current.openCreate());
      onIsOpenChange.mockClear();

      act(() => result.current.requestClose());

      expect(onIsOpenChange).toHaveBeenCalledWith({
        isOpen: false,
        type: CrudFormActionTypes.RequestClose,
      });
    });

    it('calls onIsOpenChange with ConfirmDiscard type when force closing', () => {
      const onIsOpenChange = vi.fn();

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, onIsOpenChange }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'dirty'));
      act(() => result.current.requestClose()); // blocked
      onIsOpenChange.mockClear();

      act(() => result.current.confirmDiscard());

      expect(onIsOpenChange).toHaveBeenCalledWith({
        isOpen: false,
        type: CrudFormActionTypes.ConfirmDiscard,
      });
    });

    it('does NOT call onIsOpenChange when isOpen stays the same', () => {
      const onIsOpenChange = vi.fn();

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, onIsOpenChange }));

      act(() => result.current.openCreate());
      onIsOpenChange.mockClear();

      // setFieldValue doesn't change isOpen
      act(() => result.current.setFieldValue('name', 'test'));

      expect(onIsOpenChange).not.toHaveBeenCalled();
    });

    it('calls onModeChange when mode changes', () => {
      const onModeChange = vi.fn();

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, onModeChange }));

      const data: TestForm = { name: 'Acme', code: 'ACM', isActive: true };
      act(() => result.current.openEdit('1', data));

      expect(onModeChange).toHaveBeenCalledWith({
        mode: 'edit',
        type: CrudFormActionTypes.OpenEdit,
      });
    });

    it('calls onValuesChange when values change', () => {
      const onValuesChange = vi.fn();

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, onValuesChange }));

      act(() => result.current.openCreate());
      onValuesChange.mockClear();

      act(() => result.current.setFieldValue('name', 'New Name'));

      expect(onValuesChange).toHaveBeenCalledWith({
        values: { ...DEFAULTS, name: 'New Name' },
        type: CrudFormActionTypes.SetFieldValue,
      });
    });

    it('calls onStateChange on every state change', () => {
      const onStateChange = vi.fn();

      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS, onStateChange }));

      act(() => result.current.openCreate());

      expect(onStateChange).toHaveBeenCalledTimes(1);
      expect(onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isOpen: true,
          mode: 'create',
          type: CrudFormActionTypes.OpenCreate,
        }),
      );

      act(() => result.current.setFieldValue('name', 'test'));

      expect(onStateChange).toHaveBeenCalledTimes(2);
      expect(onStateChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: CrudFormActionTypes.SetFieldValue,
          values: { ...DEFAULTS, name: 'test' },
        }),
      );
    });

    it('does not call callbacks on initial mount', () => {
      const onIsOpenChange = vi.fn();
      const onStateChange = vi.fn();

      renderHook(() => useCrudForm({ defaultValues: DEFAULTS, onIsOpenChange, onStateChange }));

      expect(onIsOpenChange).not.toHaveBeenCalled();
      expect(onStateChange).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════
  // Combined patterns
  // ══════════════════════════════════════════════════════════════

  describe('combined: stateReducer + callbacks', () => {
    it('callbacks see the state AFTER stateReducer modifications', () => {
      const onValuesChange = vi.fn();

      interface CascadeForm extends Record<string, unknown> {
        companyId: string;
        locationId: string;
      }

      const cascadeDefaults: CascadeForm = { companyId: '', locationId: '' };

      const stateReducer = (
        _state: CrudFormState<CascadeForm>,
        actionAndChanges: CrudFormAction<CascadeForm> & { changes: CrudFormState<CascadeForm> },
      ) => {
        const { type, changes } = actionAndChanges;
        if (
          type === CrudFormActionTypes.SetFieldValue &&
          'key' in actionAndChanges &&
          actionAndChanges.key === 'companyId'
        ) {
          return { ...changes, values: { ...changes.values, locationId: '' } };
        }
        return changes;
      };

      const { result } = renderHook(() =>
        useCrudForm({
          defaultValues: cascadeDefaults,
          stateReducer,
          onValuesChange,
        }),
      );

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('locationId', 'loc1'));
      onValuesChange.mockClear();

      // Change company → stateReducer clears locationId
      act(() => result.current.setFieldValue('companyId', 'c2'));

      // The callback should see locationId already cleared
      expect(onValuesChange).toHaveBeenCalledWith({
        values: { companyId: 'c2', locationId: '' },
        type: CrudFormActionTypes.SetFieldValue,
      });
    });

    it('stateReducer can prevent close → callback does NOT fire for isOpen', () => {
      const onIsOpenChange = vi.fn();

      const stateReducer = (
        _state: CrudFormState<TestForm>,
        actionAndChanges: CrudFormAction<TestForm> & { changes: CrudFormState<TestForm> },
      ) => {
        const { type, changes } = actionAndChanges;
        // Block ALL close attempts (extreme case for testing)
        if (type === CrudFormActionTypes.RequestClose) {
          return { ...changes, isOpen: true, isCloseBlocked: false };
        }
        return changes;
      };

      const { result } = renderHook(() =>
        useCrudForm({ defaultValues: DEFAULTS, stateReducer, onIsOpenChange }),
      );

      act(() => result.current.openCreate());
      onIsOpenChange.mockClear();

      // requestClose dispatches but stateReducer keeps isOpen: true
      act(() => result.current.requestClose());

      // isOpen didn't change, so onIsOpenChange should NOT fire
      expect(onIsOpenChange).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(true);
    });
  });
});
