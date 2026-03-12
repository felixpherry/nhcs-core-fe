import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowActions } from './use-workflow-actions';
import type { WorkflowAction } from './use-workflow-actions';

// ── Helpers ──

function createAction(overrides: Partial<WorkflowAction> = {}): WorkflowAction {
  return {
    id: 'test-action',
    label: 'Test Action',
    onExecute: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Tests ──

describe('useWorkflowActions', () => {
  // ────────────────────────────────────────
  // Initial state
  // ────────────────────────────────────────

  describe('initial state', () => {
    it('starts in idle state', () => {
      const { result } = renderHook(() => useWorkflowActions({ actions: [createAction()] }));

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.activeAction).toBeNull();
    });
  });

  // ────────────────────────────────────────
  // Visible actions
  // ────────────────────────────────────────

  describe('visibleActions', () => {
    it('returns all actions when all visible', () => {
      const actions = [
        createAction({ id: 'a', label: 'A' }),
        createAction({ id: 'b', label: 'B' }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      expect(result.current.visibleActions).toHaveLength(2);
    });

    it('filters out actions with visible: false', () => {
      const actions = [
        createAction({ id: 'a', label: 'A', visible: true }),
        createAction({ id: 'b', label: 'B', visible: false }),
        createAction({ id: 'c', label: 'C' }), // undefined = visible
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      expect(result.current.visibleActions).toHaveLength(2);
      expect(result.current.visibleActions.map((a) => a.id)).toEqual(['a', 'c']);
    });

    it('returns empty array when all hidden', () => {
      const actions = [
        createAction({ id: 'a', visible: false }),
        createAction({ id: 'b', visible: false }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      expect(result.current.visibleActions).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────
  // Direct execution (no confirm, no input)
  // ────────────────────────────────────────

  describe('direct execution', () => {
    it('executes action immediately when no confirm or input', async () => {
      const onExecute = vi.fn().mockResolvedValue(undefined);
      const actions = [createAction({ id: 'save', onExecute })];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      await act(async () => {
        result.current.trigger('save');
      });

      expect(onExecute).toHaveBeenCalledTimes(1);
      expect(onExecute).toHaveBeenCalledWith(undefined);
    });

    it('returns to idle after execution', async () => {
      const onExecute = vi.fn().mockResolvedValue(undefined);
      const actions = [createAction({ id: 'save', onExecute })];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      await act(async () => {
        result.current.trigger('save');
      });

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
    });

    it('calls onActionComplete after successful execution', async () => {
      const onActionComplete = vi.fn();
      const actions = [createAction({ id: 'save' })];

      const { result } = renderHook(() => useWorkflowActions({ actions, onActionComplete }));

      await act(async () => {
        result.current.trigger('save');
      });

      expect(onActionComplete).toHaveBeenCalledWith('save');
    });

    it('calls onActionError when execution fails', async () => {
      const error = new Error('API Error');
      const onActionError = vi.fn();
      const actions = [createAction({ id: 'save', onExecute: vi.fn().mockRejectedValue(error) })];

      const { result } = renderHook(() => useWorkflowActions({ actions, onActionError }));

      await act(async () => {
        result.current.trigger('save');
      });

      expect(onActionError).toHaveBeenCalledWith('save', error);
    });

    it('returns to idle after failed execution', async () => {
      const actions = [
        createAction({ id: 'save', onExecute: vi.fn().mockRejectedValue(new Error()) }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions, onActionError: vi.fn() }));

      await act(async () => {
        result.current.trigger('save');
      });

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
    });

    it('does nothing when triggering non-existent action', async () => {
      const { result } = renderHook(() => useWorkflowActions({ actions: [createAction()] }));

      await act(async () => {
        result.current.trigger('non-existent');
      });

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
    });

    it('does nothing when triggering disabled action', async () => {
      const onExecute = vi.fn();
      const actions = [createAction({ id: 'save', disabled: true, onExecute })];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      await act(async () => {
        result.current.trigger('save');
      });

      expect(onExecute).not.toHaveBeenCalled();
      expect(result.current.pipelineState).toEqual({ step: 'idle' });
    });
  });

  // ────────────────────────────────────────
  // Confirm → execute pipeline
  // ────────────────────────────────────────

  describe('confirm → execute', () => {
    it('enters confirm state when action has confirm step', () => {
      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Are you sure?' },
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('delete'));

      expect(result.current.pipelineState).toEqual({
        step: 'confirm',
        actionId: 'delete',
      });
      expect(result.current.activeAction?.id).toBe('delete');
    });

    it('executes after confirmStep', async () => {
      const onExecute = vi.fn().mockResolvedValue(undefined);
      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Are you sure?' },
          onExecute,
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('delete'));
      expect(result.current.pipelineState.step).toBe('confirm');

      await act(async () => {
        result.current.confirmStep();
      });

      expect(onExecute).toHaveBeenCalledTimes(1);
      expect(result.current.pipelineState).toEqual({ step: 'idle' });
    });

    it('returns to idle on cancelStep during confirm', () => {
      const onExecute = vi.fn();
      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Are you sure?' },
          onExecute,
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('delete'));
      act(() => result.current.cancelStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
      expect(onExecute).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────
  // Input → execute pipeline
  // ────────────────────────────────────────

  describe('input → execute', () => {
    it('enters input state when action has input step (no confirm)', () => {
      const actions = [
        createAction({
          id: 'cancel-request',
          input: {
            title: 'Cancel Reason',
            fields: [],
          },
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel-request'));

      expect(result.current.pipelineState).toEqual({
        step: 'input',
        actionId: 'cancel-request',
      });
    });

    it('executes with input data after submitInput', async () => {
      const onExecute = vi.fn().mockResolvedValue(undefined);
      const actions = [
        createAction({
          id: 'cancel-request',
          input: { title: 'Cancel Reason', fields: [] },
          onExecute,
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel-request'));

      await act(async () => {
        result.current.submitInput({ reason: 'No longer needed' });
      });

      expect(onExecute).toHaveBeenCalledWith({ reason: 'No longer needed' });
      expect(result.current.pipelineState).toEqual({ step: 'idle' });
    });

    it('returns to idle on cancelStep during input', () => {
      const onExecute = vi.fn();
      const actions = [
        createAction({
          id: 'cancel-request',
          input: { title: 'Cancel Reason', fields: [] },
          onExecute,
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel-request'));
      act(() => result.current.cancelStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
      expect(onExecute).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────
  // Confirm → input → execute pipeline
  // ────────────────────────────────────────

  describe('confirm → input → execute', () => {
    it('goes through full pipeline: confirm → input → execute', async () => {
      const onExecute = vi.fn().mockResolvedValue(undefined);
      const actions = [
        createAction({
          id: 'cancel-request',
          confirm: {
            title: 'Cancel Confirmation',
            description: 'Are you sure you want to cancel?',
            variant: 'destructive',
          },
          input: {
            title: 'Cancel Reason',
            fields: [],
            submitLabel: 'Submit',
          },
          onExecute,
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      // Step 1: trigger → confirm
      act(() => result.current.trigger('cancel-request'));
      expect(result.current.pipelineState).toEqual({
        step: 'confirm',
        actionId: 'cancel-request',
      });

      // Step 2: confirm → input
      act(() => result.current.confirmStep());
      expect(result.current.pipelineState).toEqual({
        step: 'input',
        actionId: 'cancel-request',
      });

      // Step 3: submit input → execute
      await act(async () => {
        result.current.submitInput({ reason: 'Changed plans' });
      });

      expect(onExecute).toHaveBeenCalledWith({ reason: 'Changed plans' });
      expect(result.current.pipelineState).toEqual({ step: 'idle' });
    });

    it('can cancel at confirm step in full pipeline', () => {
      const onExecute = vi.fn();
      const actions = [
        createAction({
          id: 'cancel-request',
          confirm: { title: 'Sure?' },
          input: { title: 'Reason', fields: [] },
          onExecute,
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel-request'));
      act(() => result.current.cancelStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
      expect(onExecute).not.toHaveBeenCalled();
    });

    it('can cancel at input step in full pipeline', () => {
      const onExecute = vi.fn();
      const actions = [
        createAction({
          id: 'cancel-request',
          confirm: { title: 'Sure?' },
          input: { title: 'Reason', fields: [] },
          onExecute,
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel-request'));
      act(() => result.current.confirmStep());
      expect(result.current.pipelineState.step).toBe('input');

      act(() => result.current.cancelStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
      expect(onExecute).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────
  // Active action
  // ────────────────────────────────────────

  describe('activeAction', () => {
    it('is null when idle', () => {
      const { result } = renderHook(() => useWorkflowActions({ actions: [createAction()] }));

      expect(result.current.activeAction).toBeNull();
    });

    it('is the current action during confirm step', () => {
      const actions = [
        createAction({
          id: 'approve',
          label: 'Approve',
          confirm: { title: 'Approve?' },
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('approve'));

      expect(result.current.activeAction).not.toBeNull();
      expect(result.current.activeAction!.id).toBe('approve');
      expect(result.current.activeAction!.label).toBe('Approve');
    });

    it('is the current action during input step', () => {
      const actions = [
        createAction({
          id: 'cancel',
          label: 'Cancel Request',
          input: { title: 'Reason', fields: [] },
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel'));

      expect(result.current.activeAction!.id).toBe('cancel');
    });
  });

  // ────────────────────────────────────────
  // isExecuting
  // ────────────────────────────────────────

  describe('isExecuting', () => {
    it('is true during execution', async () => {
      let resolveExecute: () => void;
      const onExecute = vi.fn().mockImplementation(
        () =>
          new Promise<void>((r) => {
            resolveExecute = r;
          }),
      );

      const actions = [createAction({ id: 'save', onExecute })];

      const { result } = renderHook(() => useWorkflowActions({ actions }));

      act(() => {
        result.current.trigger('save');
      });

      expect(result.current.isExecuting).toBe(true);
      expect(result.current.pipelineState).toEqual({
        step: 'executing',
        actionId: 'save',
      });

      await act(async () => {
        resolveExecute!();
      });

      expect(result.current.isExecuting).toBe(false);
    });
  });

  // ────────────────────────────────────────
  // Edge cases: no-ops on wrong state
  // ────────────────────────────────────────

  describe('edge cases', () => {
    it('confirmStep does nothing when not in confirm state', () => {
      const { result } = renderHook(() => useWorkflowActions({ actions: [createAction()] }));

      act(() => result.current.confirmStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
    });

    it('submitInput does nothing when not in input state', () => {
      const { result } = renderHook(() => useWorkflowActions({ actions: [createAction()] }));

      act(() => result.current.submitInput({ reason: 'test' }));

      expect(result.current.pipelineState).toEqual({ step: 'idle' });
    });

    it('synchronous onExecute works correctly', async () => {
      const onExecute = vi.fn(); // No return value — synchronous
      const onActionComplete = vi.fn();
      const actions = [createAction({ id: 'close', onExecute })];

      const { result } = renderHook(() => useWorkflowActions({ actions, onActionComplete }));

      await act(async () => {
        result.current.trigger('close');
      });

      expect(onExecute).toHaveBeenCalled();
      expect(onActionComplete).toHaveBeenCalledWith('close');
    });
  });
});
