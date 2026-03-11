import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFieldVisibility } from './use-field-visibility';

const ALL_FIELDS = ['company', 'location', 'status', 'group'];

describe('useFieldVisibility', () => {
  // ── Initial state ──

  describe('initial state', () => {
    it('defaults to all fields visible when no defaults specified', () => {
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
        }),
      );

      expect(result.current.visibleCount).toBe(4);
      expect(result.current.totalCount).toBe(4);
      expect(result.current.areAllVisible).toBe(true);
      expect(result.current.areNoneVisible).toBe(false);
    });

    it('respects defaultVisibleFieldIds', () => {
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          defaultVisibleFieldIds: ['company', 'status'],
        }),
      );

      expect(result.current.visibleCount).toBe(2);
      expect(result.current.totalCount).toBe(4);
      expect(result.current.isVisible('company')).toBe(true);
      expect(result.current.isVisible('status')).toBe(true);
      expect(result.current.isVisible('location')).toBe(false);
    });

    it('loads from persisted state', () => {
      const load = vi.fn().mockReturnValue(['location']);

      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          defaultVisibleFieldIds: ['company', 'status'],
          load,
        }),
      );

      expect(load).toHaveBeenCalledWith('test');
      expect(result.current.visibleCount).toBe(1);
      expect(result.current.isVisible('location')).toBe(true);
      expect(result.current.isVisible('company')).toBe(false);
    });

    it('falls back to defaults when load returns null', () => {
      const load = vi.fn().mockReturnValue(null);

      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          defaultVisibleFieldIds: ['company'],
          load,
        }),
      );

      expect(result.current.visibleCount).toBe(1);
      expect(result.current.isVisible('company')).toBe(true);
    });
  });

  // ── Toggle ──

  describe('toggle', () => {
    it('hides a visible field', () => {
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
        }),
      );

      act(() => result.current.toggle('company'));
      expect(result.current.isVisible('company')).toBe(false);
      expect(result.current.visibleCount).toBe(3);
    });

    it('shows a hidden field', () => {
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          defaultVisibleFieldIds: ['company'],
        }),
      );

      act(() => result.current.toggle('location'));
      expect(result.current.isVisible('location')).toBe(true);
      expect(result.current.visibleCount).toBe(2);
    });
  });

  // ── Show all / Hide all ──

  describe('showAll and hideAll', () => {
    it('showAll makes all fields visible', () => {
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          defaultVisibleFieldIds: ['company'],
        }),
      );

      act(() => result.current.showAll());
      expect(result.current.areAllVisible).toBe(true);
      expect(result.current.visibleCount).toBe(4);
    });

    it('hideAll makes all fields hidden', () => {
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
        }),
      );

      act(() => result.current.hideAll());
      expect(result.current.areNoneVisible).toBe(true);
      expect(result.current.visibleCount).toBe(0);
    });
  });

  // ── Reset to defaults ──

  describe('resetToDefaults', () => {
    it('restores default visibility', () => {
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          defaultVisibleFieldIds: ['company', 'status'],
        }),
      );

      // Change visibility
      act(() => result.current.showAll());
      expect(result.current.visibleCount).toBe(4);

      // Reset
      act(() => result.current.resetToDefaults());
      expect(result.current.visibleCount).toBe(2);
      expect(result.current.isVisible('company')).toBe(true);
      expect(result.current.isVisible('status')).toBe(true);
      expect(result.current.isVisible('location')).toBe(false);
    });
  });

  // ── onFieldsHidden callback ──

  describe('onFieldsHidden', () => {
    it('fires when toggling a field OFF', () => {
      const onFieldsHidden = vi.fn();
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          onFieldsHidden,
        }),
      );

      act(() => result.current.toggle('company'));
      expect(onFieldsHidden).toHaveBeenCalledWith(['company']);
    });

    it('does NOT fire when toggling a field ON', () => {
      const onFieldsHidden = vi.fn();
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          defaultVisibleFieldIds: ['company'],
          onFieldsHidden,
        }),
      );

      act(() => result.current.toggle('location'));
      expect(onFieldsHidden).not.toHaveBeenCalled();
    });

    it('fires with all fields on hideAll', () => {
      const onFieldsHidden = vi.fn();
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          onFieldsHidden,
        }),
      );

      act(() => result.current.hideAll());
      expect(onFieldsHidden).toHaveBeenCalledWith(ALL_FIELDS);
    });

    it('does NOT fire on showAll', () => {
      const onFieldsHidden = vi.fn();
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          defaultVisibleFieldIds: ['company'],
          onFieldsHidden,
        }),
      );

      act(() => result.current.showAll());
      expect(onFieldsHidden).not.toHaveBeenCalled();
    });

    it('fires with non-default fields on resetToDefaults', () => {
      const onFieldsHidden = vi.fn();
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          defaultVisibleFieldIds: ['company'],
          onFieldsHidden,
        }),
      );

      // Show all first
      act(() => result.current.showAll());

      // Reset — location, status, group should be reported as hidden
      act(() => result.current.resetToDefaults());
      expect(onFieldsHidden).toHaveBeenCalledWith(
        expect.arrayContaining(['location', 'status', 'group']),
      );
    });
  });

  // ── Persistence ──

  describe('persistence', () => {
    it('calls save when visibility changes', () => {
      const save = vi.fn();
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          save,
        }),
      );

      act(() => result.current.toggle('company'));
      expect(save).toHaveBeenCalledWith(
        'test',
        expect.arrayContaining(['location', 'status', 'group']),
      );
    });

    it('calls save on hideAll', () => {
      const save = vi.fn();
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
          save,
        }),
      );

      act(() => result.current.hideAll());
      expect(save).toHaveBeenCalledWith('test', []);
    });
  });

  // ── totalCount ──

  describe('totalCount', () => {
    it('returns the total number of available fields', () => {
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
        }),
      );

      expect(result.current.totalCount).toBe(4);
    });

    it('remains stable regardless of visibility changes', () => {
      const { result } = renderHook(() =>
        useFieldVisibility({
          scopeKey: 'test',
          allFieldIds: ALL_FIELDS,
        }),
      );

      act(() => result.current.hideAll());
      expect(result.current.totalCount).toBe(4);
      expect(result.current.visibleCount).toBe(0);

      act(() => result.current.showAll());
      expect(result.current.totalCount).toBe(4);
      expect(result.current.visibleCount).toBe(4);
    });
  });
});
