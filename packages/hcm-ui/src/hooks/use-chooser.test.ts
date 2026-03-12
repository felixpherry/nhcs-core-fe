import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChooser } from './use-chooser';

// ── Test types ──

interface Company {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface CompanyFormValue {
  id: number;
  code: string;
  name: string;
}

// ── Test data ──

const companies: Company[] = [
  { id: 1, code: 'ACME', name: 'Acme Corp', createdAt: '2024-01-01', updatedAt: '2024-06-01' },
  { id: 2, code: 'BETA', name: 'Beta Inc', createdAt: '2024-02-01', updatedAt: '2024-06-01' },
  { id: 3, code: 'GAMMA', name: 'Gamma LLC', createdAt: '2024-03-01', updatedAt: '2024-06-01' },
  { id: 4, code: 'DELTA', name: 'Delta Co', createdAt: '2024-04-01', updatedAt: '2024-06-01' },
  { id: 5, code: 'EPSI', name: 'Epsilon Ltd', createdAt: '2024-05-01', updatedAt: '2024-06-01' },
];

// ── Helpers ──

function defaultOptions() {
  return {
    mode: 'multi' as const,
    rowKey: (row: Company) => String(row.id),
    mapSelected: (row: Company): CompanyFormValue => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }),
  };
}

// ── Tests ──

describe('useChooser', () => {
  // ────────────────────────────────────────
  // Initial state
  // ────────────────────────────────────────

  describe('initial state', () => {
    it('starts closed with no result', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      expect(result.current.isOpen).toBe(false);
      expect(result.current.result).toBeNull();
      expect(result.current.canConfirm).toBe(true);
    });

    it('starts with empty selection', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      expect(result.current.selection.state.isEmpty).toBe(true);
    });
  });

  // ────────────────────────────────────────
  // Open / close lifecycle
  // ────────────────────────────────────────

  describe('open', () => {
    it('opens the dialog', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open());

      expect(result.current.isOpen).toBe(true);
    });

    it('opens with empty selection when no preselectedKeys', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open());

      expect(result.current.selection.state.isEmpty).toBe(true);
    });

    it('opens with preselected keys', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open(['1', '3']));

      expect(result.current.selection.state.isSelected('1')).toBe(true);
      expect(result.current.selection.state.isSelected('3')).toBe(true);
      expect(result.current.selection.state.isSelected('2')).toBe(false);
      expect(result.current.selection.state.selectedKeys.size).toBe(2);
    });

    it('replaces selection on re-open with different keys', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open(['1', '2']));
      expect(result.current.selection.state.selectedKeys.size).toBe(2);

      // Close then re-open with different keys
      act(() => result.current.cancel());
      act(() => result.current.open(['3']));

      expect(result.current.selection.state.isSelected('1')).toBe(false);
      expect(result.current.selection.state.isSelected('3')).toBe(true);
      expect(result.current.selection.state.selectedKeys.size).toBe(1);
    });
  });

  // ────────────────────────────────────────
  // Cancel / revert
  // ────────────────────────────────────────

  describe('cancel', () => {
    it('closes the dialog', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open());
      act(() => result.current.cancel());

      expect(result.current.isOpen).toBe(false);
    });

    it('reverts selection to pre-open state', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      // Open with keys 1, 2
      act(() => result.current.open(['1', '2']));

      // User selects more items during dialog session
      act(() => result.current.selection.toggleRow('3'));
      act(() => result.current.selection.toggleRow('4'));
      expect(result.current.selection.state.selectedKeys.size).toBe(4);

      // Cancel — should revert to pre-open state
      act(() => result.current.cancel());

      expect(result.current.selection.state.selectedKeys.size).toBe(2);
      expect(result.current.selection.state.isSelected('1')).toBe(true);
      expect(result.current.selection.state.isSelected('2')).toBe(true);
      expect(result.current.selection.state.isSelected('3')).toBe(false);
      expect(result.current.selection.state.isSelected('4')).toBe(false);
    });

    it('reverts to empty when opened without preselection', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open());
      act(() => result.current.selection.toggleRow('1'));
      act(() => result.current.selection.toggleRow('2'));
      expect(result.current.selection.state.selectedKeys.size).toBe(2);

      act(() => result.current.cancel());

      expect(result.current.selection.state.isEmpty).toBe(true);
    });

    it('calls onCancel callback', () => {
      const onCancel = vi.fn();
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), onCancel }));

      act(() => result.current.open());
      act(() => result.current.cancel());

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not update result on cancel', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open());
      act(() => result.current.selection.toggleRow('1'));
      act(() => result.current.cancel());

      expect(result.current.result).toBeNull();
    });
  });

  // ────────────────────────────────────────
  // Confirm
  // ────────────────────────────────────────

  describe('confirm', () => {
    it('closes the dialog', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open());
      act(() => result.current.selection.toggleRow('1'));
      act(() => {
        result.current.confirm();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('returns true on successful confirm', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open());
      act(() => result.current.selection.toggleRow('1'));

      let confirmResult = false;
      act(() => {
        confirmResult = result.current.confirm();
      });

      expect(confirmResult).toBe(true);
    });

    it('sets result with selectedKeys', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open());
      act(() => result.current.selection.toggleRow('1'));
      act(() => result.current.selection.toggleRow('3'));
      act(() => {
        result.current.confirm();
      });

      expect(result.current.result).not.toBeNull();
      expect(result.current.result!.selectedKeys).toEqual(expect.arrayContaining(['1', '3']));
      expect(result.current.result!.selectedKeys).toHaveLength(2);
    });

    it('calls onConfirm with result', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), onConfirm }));

      act(() => result.current.open());
      act(() => result.current.selection.toggleRow('1'));

      // Track rows so mapSelected can project them
      act(() => result.current.trackRows(companies));

      act(() => {
        result.current.confirm();
      });

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith({
        selectedKeys: ['1'],
        selectedItems: [{ id: 1, code: 'ACME', name: 'Acme Corp' }],
      });
    });

    it('preserves result after dialog closes', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open());
      act(() => result.current.selection.toggleRow('1'));
      act(() => result.current.trackRows(companies));
      act(() => {
        result.current.confirm();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.result).not.toBeNull();
      expect(result.current.result!.selectedKeys).toEqual(['1']);
    });
  });

  // ────────────────────────────────────────
  // trackRows + mapSelected projection
  // ────────────────────────────────────────

  describe('trackRows and mapSelected', () => {
    it('captures rows and projects on confirm', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), onConfirm }));

      act(() => result.current.open());

      // Simulate page 1 loading
      act(() => result.current.trackRows(companies.slice(0, 3)));

      // Select from page 1
      act(() => result.current.selection.toggleRow('2'));

      // Simulate page 2 loading
      act(() => result.current.trackRows(companies.slice(3, 5)));

      // Select from page 2
      act(() => result.current.selection.toggleRow('4'));

      act(() => {
        result.current.confirm();
      });

      expect(onConfirm).toHaveBeenCalledWith({
        selectedKeys: expect.arrayContaining(['2', '4']),
        selectedItems: expect.arrayContaining([
          { id: 2, code: 'BETA', name: 'Beta Inc' },
          { id: 4, code: 'DELTA', name: 'Delta Co' },
        ]),
      });
    });

    it('mapSelected strips extra fields from TData', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), onConfirm }));

      act(() => result.current.open());
      act(() => result.current.trackRows([companies[0]!]));
      act(() => result.current.selection.toggleRow('1'));
      act(() => {
        result.current.confirm();
      });

      const item = onConfirm.mock.calls[0]![0].selectedItems[0];

      // Should have projected fields
      expect(item).toEqual({ id: 1, code: 'ACME', name: 'Acme Corp' });
      // Should NOT have TData-only fields
      expect(item).not.toHaveProperty('createdAt');
      expect(item).not.toHaveProperty('updatedAt');
    });

    it('selectedItems is empty for keys without tracked rows', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), onConfirm }));

      act(() => result.current.open(['99']));
      // Never call trackRows — row 99 was never seen

      act(() => {
        result.current.confirm();
      });

      expect(onConfirm).toHaveBeenCalledWith({
        selectedKeys: ['99'],
        selectedItems: [], // best-effort — row wasn't tracked
      });
    });

    it('row cache is cleared on each open', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), onConfirm }));

      // First session — track and confirm
      act(() => result.current.open());
      act(() => result.current.trackRows(companies));
      act(() => result.current.selection.toggleRow('1'));
      act(() => {
        result.current.confirm();
      });

      // Second session — don't track any rows
      act(() => result.current.open(['1']));
      act(() => {
        result.current.confirm();
      });

      // Row cache was cleared on second open, so selectedItems is empty
      expect(onConfirm.mock.calls[1]![0].selectedItems).toEqual([]);
    });
  });

  // ────────────────────────────────────────
  // Required validation
  // ────────────────────────────────────────

  describe('required validation', () => {
    it('canConfirm is false when required and empty', () => {
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), required: true }));

      act(() => result.current.open());

      expect(result.current.canConfirm).toBe(false);
    });

    it('canConfirm is true when required and has selection', () => {
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), required: true }));

      act(() => result.current.open());
      act(() => result.current.selection.toggleRow('1'));

      expect(result.current.canConfirm).toBe(true);
    });

    it('canConfirm is true when not required and empty', () => {
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), required: false }));

      act(() => result.current.open());

      expect(result.current.canConfirm).toBe(true);
    });

    it('confirm returns false when required and empty', () => {
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), required: true }));

      act(() => result.current.open());

      let confirmResult = false;
      act(() => {
        confirmResult = result.current.confirm();
      });

      expect(confirmResult).toBe(false);
      expect(result.current.isOpen).toBe(true); // stays open
    });

    it('confirm does not call onConfirm when required and empty', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() =>
        useChooser({ ...defaultOptions(), required: true, onConfirm }),
      );

      act(() => result.current.open());
      act(() => {
        result.current.confirm();
      });

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('confirm does not update result when required and empty', () => {
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), required: true }));

      act(() => result.current.open());
      act(() => {
        result.current.confirm();
      });

      expect(result.current.result).toBeNull();
    });
  });

  // ────────────────────────────────────────
  // Single mode
  // ────────────────────────────────────────

  describe('single mode', () => {
    it('selection only keeps one key', () => {
      const { result } = renderHook(() => useChooser({ ...defaultOptions(), mode: 'single' }));

      act(() => result.current.open());
      act(() => result.current.selection.toggleRow('1'));
      act(() => result.current.selection.toggleRow('2'));

      expect(result.current.selection.state.selectedKeys.size).toBe(1);
      expect(result.current.selection.state.isSelected('2')).toBe(true);
      expect(result.current.selection.state.isSelected('1')).toBe(false);
    });

    it('confirm returns single item', () => {
      const onConfirm = vi.fn();
      const { result } = renderHook(() =>
        useChooser({ ...defaultOptions(), mode: 'single', onConfirm }),
      );

      act(() => result.current.open());
      act(() => result.current.trackRows(companies));
      act(() => result.current.selection.toggleRow('2'));
      act(() => {
        result.current.confirm();
      });

      expect(onConfirm).toHaveBeenCalledWith({
        selectedKeys: ['2'],
        selectedItems: [{ id: 2, code: 'BETA', name: 'Beta Inc' }],
      });
    });
  });

  // ────────────────────────────────────────
  // remove (external chip × button)
  // ────────────────────────────────────────

  describe('remove', () => {
    it('removes a key from selection', () => {
      const { result } = renderHook(() => useChooser(defaultOptions()));

      act(() => result.current.open(['1', '2', '3']));
      act(() => result.current.remove('2'));

      expect(result.current.selection.state.isSelected('2')).toBe(false);
      expect(result.current.selection.state.selectedKeys.size).toBe(2);
    });
  });
});
