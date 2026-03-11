import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrudForm } from './use-crud-form';

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
  // ── Initial state ──

  describe('initial state', () => {
    it('starts closed with default values', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      expect(result.current.isOpen).toBe(false);
      expect(result.current.mode).toBe('create');
      expect(result.current.values).toEqual(DEFAULTS);
      expect(result.current.editId).toBeNull();
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ── Open create ──

  describe('openCreate', () => {
    it('opens form in create mode with defaults', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());

      expect(result.current.isOpen).toBe(true);
      expect(result.current.mode).toBe('create');
      expect(result.current.values).toEqual(DEFAULTS);
      expect(result.current.editId).toBeNull();
      expect(result.current.isDirty).toBe(false);
    });

    it('resets values when opening create after edit', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      // Open edit first
      act(() => result.current.openEdit('1', { name: 'Acme', code: 'ACM', isActive: true }));
      expect(result.current.values.name).toBe('Acme');

      // Then open create
      act(() => result.current.openCreate());
      expect(result.current.values).toEqual(DEFAULTS);
      expect(result.current.editId).toBeNull();
    });
  });

  // ── Open edit ──

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

  // ── Open edit by ID ──

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

  // ── Open view ──

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

  // ── Field operations ──

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

  // ── Dirty tracking ──

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

  // ── Close operations ──

  describe('close operations', () => {
    it('requestClose returns true and closes when not dirty', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      expect(result.current.isOpen).toBe(true);

      let closed = false;
      act(() => {
        closed = result.current.requestClose();
      });

      expect(closed).toBe(true);
      expect(result.current.isOpen).toBe(false);
    });

    it('requestClose returns false and stays open when dirty', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'dirty'));

      let closed = false;
      act(() => {
        closed = result.current.requestClose();
      });

      expect(closed).toBe(false);
      expect(result.current.isOpen).toBe(true);
    });

    it('forceClose closes regardless of dirty state', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      act(() => result.current.setFieldValue('name', 'dirty'));
      expect(result.current.isDirty).toBe(true);

      act(() => result.current.forceClose());
      expect(result.current.isOpen).toBe(false);
    });

    it('canClose reflects dirty state', () => {
      const { result } = renderHook(() => useCrudForm({ defaultValues: DEFAULTS }));

      act(() => result.current.openCreate());
      expect(result.current.canClose).toBe(true);

      act(() => result.current.setFieldValue('name', 'dirty'));
      expect(result.current.canClose).toBe(false);

      act(() => result.current.setFieldValue('name', ''));
      expect(result.current.canClose).toBe(true);
    });
  });
});
