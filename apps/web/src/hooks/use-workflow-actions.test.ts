import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as useWorkflowActions from './use-workflow-actions';

// ── Helpers ──

function createAction(
  overrides: Partial<useWorkflowActions.WorkflowAction> = {},
): useWorkflowActions.WorkflowAction {
  return {
    id: 'test-action',
    label: 'Test Action',
    onExecute: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ── Tests ──

describe('useWorkflowActions', () => {
  // ════════════════════════════════════════
  // Initial state
  // ════════════════════════════════════════

  describe('initial state', () => {
    it('starts in idle state', () => {
      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions: [createAction()] }),
      );

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.activeAction).toBeNull();
    });
  });

  // ════════════════════════════════════════
  // Visible actions
  // ════════════════════════════════════════

  describe('visibleActions', () => {
    it('returns all actions when all visible', () => {
      const actions = [
        createAction({ id: 'a', label: 'A' }),
        createAction({ id: 'b', label: 'B' }),
      ];

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      expect(result.current.visibleActions).toHaveLength(2);
    });

    it('filters out actions with visible: false', () => {
      const actions = [
        createAction({ id: 'a', label: 'A', visible: true }),
        createAction({ id: 'b', label: 'B', visible: false }),
        createAction({ id: 'c', label: 'C' }),
      ];

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      expect(result.current.visibleActions).toHaveLength(2);
      expect(result.current.visibleActions.map((a) => a.id)).toEqual(['a', 'c']);
    });

    it('returns empty array when all hidden', () => {
      const actions = [
        createAction({ id: 'a', visible: false }),
        createAction({ id: 'b', visible: false }),
      ];

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      expect(result.current.visibleActions).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════
  // Direct execution (no confirm, no input)
  // ════════════════════════════════════════

  describe('direct execution', () => {
    it('executes action immediately when no confirm or input', async () => {
      const onExecute = vi.fn().mockResolvedValue(undefined);
      const actions = [createAction({ id: 'save', onExecute })];

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      await act(async () => {
        result.current.trigger('save');
      });

      expect(onExecute).toHaveBeenCalledTimes(1);
      expect(onExecute).toHaveBeenCalledWith(undefined);
    });

    it('returns to idle after execution', async () => {
      const onExecute = vi.fn().mockResolvedValue(undefined);
      const actions = [createAction({ id: 'save', onExecute })];

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      await act(async () => {
        result.current.trigger('save');
      });

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
    });

    it('calls onActionComplete after successful execution', async () => {
      const onActionComplete = vi.fn();
      const actions = [createAction({ id: 'save' })];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, onActionComplete }),
      );

      await act(async () => {
        result.current.trigger('save');
      });

      expect(onActionComplete).toHaveBeenCalledWith('save');
    });

    it('calls onActionError when execution fails', async () => {
      const error = new Error('API Error');
      const onActionError = vi.fn();
      const actions = [createAction({ id: 'save', onExecute: vi.fn().mockRejectedValue(error) })];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, onActionError }),
      );

      await act(async () => {
        result.current.trigger('save');
      });

      expect(onActionError).toHaveBeenCalledWith('save', error);
    });

    it('returns to idle after failed execution', async () => {
      const actions = [
        createAction({ id: 'save', onExecute: vi.fn().mockRejectedValue(new Error()) }),
      ];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, onActionError: vi.fn() }),
      );

      await act(async () => {
        result.current.trigger('save');
      });

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
    });

    it('does nothing when triggering non-existent action', async () => {
      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions: [createAction()] }),
      );

      await act(async () => {
        result.current.trigger('non-existent');
      });

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
    });

    it('does nothing when triggering disabled action', async () => {
      const onExecute = vi.fn();
      const actions = [createAction({ id: 'save', disabled: true, onExecute })];

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      await act(async () => {
        result.current.trigger('save');
      });

      expect(onExecute).not.toHaveBeenCalled();
      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
    });
  });

  // ════════════════════════════════════════
  // Confirm → execute pipeline
  // ════════════════════════════════════════

  describe('confirm → execute', () => {
    it('enters confirm state when action has confirm step', () => {
      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Are you sure?' },
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      act(() => result.current.trigger('delete'));
      expect(result.current.pipelineState.step).toBe('confirm');

      await act(async () => {
        result.current.confirmStep();
      });

      expect(onExecute).toHaveBeenCalledTimes(1);
      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      act(() => result.current.trigger('delete'));
      act(() => result.current.cancelStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
      expect(onExecute).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════
  // Input → execute pipeline
  // ════════════════════════════════════════

  describe('input → execute', () => {
    it('enters input state when action has input step (no confirm)', () => {
      const actions = [
        createAction({
          id: 'cancel-request',
          input: { title: 'Cancel Reason', fields: [] },
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel-request'));

      await act(async () => {
        result.current.submitInput({ reason: 'No longer needed' });
      });

      expect(onExecute).toHaveBeenCalledWith({ reason: 'No longer needed' });
      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel-request'));
      act(() => result.current.cancelStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
      expect(onExecute).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════
  // Confirm → input → execute pipeline
  // ════════════════════════════════════════

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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

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
      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel-request'));
      act(() => result.current.cancelStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel-request'));
      act(() => result.current.confirmStep());
      expect(result.current.pipelineState.step).toBe('input');

      act(() => result.current.cancelStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
      expect(onExecute).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════
  // Active action
  // ════════════════════════════════════════

  describe('activeAction', () => {
    it('is null when idle', () => {
      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions: [createAction()] }),
      );

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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      act(() => result.current.trigger('cancel'));

      expect(result.current.activeAction!.id).toBe('cancel');
    });
  });

  // ════════════════════════════════════════
  // isExecuting
  // ════════════════════════════════════════

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

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

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

  // ════════════════════════════════════════
  // Edge cases: no-ops on wrong state
  // ════════════════════════════════════════

  describe('edge cases', () => {
    it('confirmStep does nothing when not in confirm state', () => {
      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions: [createAction()] }),
      );

      act(() => result.current.confirmStep());

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
    });

    it('submitInput does nothing when not in input state', () => {
      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions: [createAction()] }),
      );

      act(() => result.current.submitInput({ reason: 'test' }));

      expect(result.current.pipelineState).toEqual({ step: 'idle', actionId: null });
    });

    it('synchronous onExecute works correctly', async () => {
      const onExecute = vi.fn();
      const onActionComplete = vi.fn();
      const actions = [createAction({ id: 'close', onExecute })];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, onActionComplete }),
      );

      await act(async () => {
        result.current.trigger('close');
      });

      expect(onExecute).toHaveBeenCalled();
      expect(onActionComplete).toHaveBeenCalledWith('close');
    });
  });

  // ════════════════════════════════════════
  // State reducer
  // ════════════════════════════════════════

  describe('stateReducer', () => {
    it('receives current state and action with proposed changes', () => {
      const stateReducer = vi.fn(
        (
          _state: useWorkflowActions.PipelineState,
          actionAndChanges: useWorkflowActions.PipelineAction & {
            changes: useWorkflowActions.PipelineState;
          },
        ) => actionAndChanges.changes,
      );

      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Sure?' },
        }),
      ];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, stateReducer }),
      );

      act(() => result.current.trigger('delete'));

      expect(stateReducer).toHaveBeenCalledTimes(1);
      const [state, actionAndChanges] = stateReducer.mock.calls[0]!;

      expect(state).toEqual({ step: 'idle', actionId: null });
      expect(actionAndChanges.changes).toEqual({ step: 'confirm', actionId: 'delete' });
      expect(actionAndChanges.type).toBe(useWorkflowActions.WorkflowTransitions.Trigger);
    });

    it('can skip confirm step', () => {
      const stateReducer = (
        _state: useWorkflowActions.PipelineState,
        actionAndChanges: useWorkflowActions.PipelineAction & {
          changes: useWorkflowActions.PipelineState;
        },
      ) => {
        const { type, changes } = actionAndChanges;
        // Skip confirm → go straight to input or execute
        if (type === useWorkflowActions.WorkflowTransitions.Trigger && changes.step === 'confirm') {
          return { ...changes, step: 'input' as const };
        }
        return changes;
      };

      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Sure?' },
          input: { title: 'Reason', fields: [] },
        }),
      ];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, stateReducer }),
      );

      act(() => result.current.trigger('delete'));

      // Should skip confirm and go straight to input
      expect(result.current.pipelineState).toEqual({
        step: 'input',
        actionId: 'delete',
      });
    });

    it('can prevent cancel', () => {
      const stateReducer = (
        state: useWorkflowActions.PipelineState,
        actionAndChanges: useWorkflowActions.PipelineAction & {
          changes: useWorkflowActions.PipelineState;
        },
      ) => {
        const { type, changes } = actionAndChanges;
        // Block cancel during input step
        if (type === useWorkflowActions.WorkflowTransitions.Cancel && state.step === 'input') {
          return state; // stay where we are
        }
        return changes;
      };

      const actions = [
        createAction({
          id: 'cancel-request',
          input: { title: 'Reason', fields: [] },
        }),
      ];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, stateReducer }),
      );

      act(() => result.current.trigger('cancel-request'));
      expect(result.current.pipelineState.step).toBe('input');

      act(() => result.current.cancelStep());

      // Should still be in input — cancel was blocked
      expect(result.current.pipelineState).toEqual({
        step: 'input',
        actionId: 'cancel-request',
      });
    });

    it('does not intercept when stateReducer is not provided', () => {
      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Sure?' },
        }),
      ];

      const { result } = renderHook(() => useWorkflowActions.useWorkflowActions({ actions }));

      act(() => result.current.trigger('delete'));

      expect(result.current.pipelineState).toEqual({
        step: 'confirm',
        actionId: 'delete',
      });
    });
  });

  // ════════════════════════════════════════
  // onPipelineChange callback
  // ════════════════════════════════════════

  describe('onPipelineChange', () => {
    it('is called when pipeline state changes', () => {
      const onPipelineChange = vi.fn();
      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Sure?' },
        }),
      ];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, onPipelineChange }),
      );

      act(() => result.current.trigger('delete'));

      expect(onPipelineChange).toHaveBeenCalledWith({
        state: { step: 'confirm', actionId: 'delete' },
        type: useWorkflowActions.WorkflowTransitions.Trigger,
      });
    });

    it('is called on cancel', () => {
      const onPipelineChange = vi.fn();
      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Sure?' },
        }),
      ];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, onPipelineChange }),
      );

      act(() => result.current.trigger('delete'));
      onPipelineChange.mockClear();

      act(() => result.current.cancelStep());

      expect(onPipelineChange).toHaveBeenCalledWith({
        state: { step: 'idle', actionId: null },
        type: useWorkflowActions.WorkflowTransitions.Cancel,
      });
    });

    it('fires executing callback when onExecute is slow', async () => {
      const onPipelineChange = vi.fn();

      let resolveExecute: () => void;
      const onExecute = vi.fn().mockImplementation(
        () =>
          new Promise<void>((r) => {
            resolveExecute = r;
          }),
      );

      const actions = [
        createAction({
          id: 'cancel-request',
          input: { title: 'Reason', fields: [] },
          onExecute,
        }),
      ];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, onPipelineChange }),
      );

      act(() => result.current.trigger('cancel-request'));
      onPipelineChange.mockClear();

      // submitInput dispatches ADVANCE_TO_EXECUTE, then awaits onExecute
      act(() => {
        result.current.submitInput({ reason: 'done' });
      });

      // onExecute hasn't resolved yet — we should see executing state
      expect(onPipelineChange).toHaveBeenCalledWith(
        expect.objectContaining({
          state: { step: 'executing', actionId: 'cancel-request' },
          type: useWorkflowActions.WorkflowTransitions.AdvanceToExecute,
        }),
      );

      // Now resolve → EXECUTION_COMPLETE fires
      await act(async () => {
        resolveExecute!();
      });

      expect(onPipelineChange).toHaveBeenCalledWith(
        expect.objectContaining({
          state: { step: 'idle', actionId: null },
          type: useWorkflowActions.WorkflowTransitions.ExecutionComplete,
        }),
      );
    });

    it('is not called on initial mount', () => {
      const onPipelineChange = vi.fn();

      renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions: [createAction()], onPipelineChange }),
      );

      expect(onPipelineChange).not.toHaveBeenCalled();
    });

    it('sees state after stateReducer modifications', () => {
      const onPipelineChange = vi.fn();

      // stateReducer skips confirm → goes to input
      const stateReducer = (
        _state: useWorkflowActions.PipelineState,
        actionAndChanges: useWorkflowActions.PipelineAction & {
          changes: useWorkflowActions.PipelineState;
        },
      ) => {
        const { type, changes } = actionAndChanges;
        if (type === useWorkflowActions.WorkflowTransitions.Trigger && changes.step === 'confirm') {
          return { ...changes, step: 'input' as const };
        }
        return changes;
      };

      const actions = [
        createAction({
          id: 'delete',
          confirm: { title: 'Sure?' },
          input: { title: 'Reason', fields: [] },
        }),
      ];

      const { result } = renderHook(() =>
        useWorkflowActions.useWorkflowActions({ actions, stateReducer, onPipelineChange }),
      );

      act(() => result.current.trigger('delete'));

      // Callback should see the stateReducer-modified result (input, not confirm)
      expect(onPipelineChange).toHaveBeenCalledWith({
        state: { step: 'input', actionId: 'delete' },
        type: useWorkflowActions.WorkflowTransitions.Trigger,
      });
    });
  });
});
