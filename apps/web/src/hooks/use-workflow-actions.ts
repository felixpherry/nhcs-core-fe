'use client';

import { useReducer, useRef, useEffect } from 'react';

// ══════════════════════════════════════════════════════════════
// Public API: Types & Constants
// ══════════════════════════════════════════════════════════════

/** Action pipeline step: simple confirmation dialog */
export interface ActionConfirmStep {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
}

/** Action pipeline step: input form dialog */
export interface ActionInputStep {
  title: string;
  description?: string;
  fields: Record<string, unknown>[];
  submitLabel?: string;
  cancelLabel?: string;
}

/** A single workflow action definition */
export interface WorkflowAction {
  /** Unique action ID */
  id: string;
  /** Button label */
  label: string;
  /** Button variant for styling */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  /** Is this action visible? Driven by backend flags. Default: true */
  visible?: boolean;
  /** Is this action disabled? Default: false */
  disabled?: boolean;
  /** Button type — 'button' (default) or 'submit' (for form submission) */
  type?: 'button' | 'submit';

  // ── Pipeline steps (in order) ──

  /** Optional: show confirmation dialog before executing */
  confirm?: ActionConfirmStep;
  /** Optional: show input form dialog before executing */
  input?: ActionInputStep;

  // ── Execution ──

  /** The actual action handler. Receives input data if an input step was configured.
   *  Return a promise for async operations (loading state is tracked). */
  onExecute: (inputData?: Record<string, unknown>) => Promise<void> | void;
}

/** Named pipeline transition types for use in `stateReducer` switch statements. */
export const WorkflowTransitions = {
  Trigger: 'TRIGGER',
  AdvanceToConfirm: 'ADVANCE_TO_CONFIRM',
  AdvanceToInput: 'ADVANCE_TO_INPUT',
  AdvanceToExecute: 'ADVANCE_TO_EXECUTE',
  ExecutionComplete: 'EXECUTION_COMPLETE',
  ExecutionError: 'EXECUTION_ERROR',
  Cancel: 'CANCEL',
} as const;

export type WorkflowTransitionType = (typeof WorkflowTransitions)[keyof typeof WorkflowTransitions];

// ── Pipeline state ──

export type PipelineStep = 'idle' | 'confirm' | 'input' | 'executing';

export type PipelineState =
  | { step: 'idle'; actionId: null }
  | { step: 'confirm'; actionId: string }
  | { step: 'input'; actionId: string }
  | { step: 'executing'; actionId: string };

// ── Actions (discriminated union) ──

export type PipelineAction =
  | { type: typeof WorkflowTransitions.Trigger; actionId: string; action: WorkflowAction }
  | { type: typeof WorkflowTransitions.AdvanceToConfirm; actionId: string }
  | { type: typeof WorkflowTransitions.AdvanceToInput; actionId: string }
  | {
      type: typeof WorkflowTransitions.AdvanceToExecute;
      actionId: string;
      inputData?: Record<string, unknown>;
    }
  | { type: typeof WorkflowTransitions.ExecutionComplete; actionId: string }
  | { type: typeof WorkflowTransitions.ExecutionError; actionId: string; error: unknown }
  | { type: typeof WorkflowTransitions.Cancel };

// ── Options ──

export interface UseWorkflowActionsOptions {
  /** Action definitions */
  actions: WorkflowAction[];
  /** Called when any action completes successfully */
  onActionComplete?: (actionId: string) => void;
  /** Called when any action fails */
  onActionError?: (actionId: string, error: unknown) => void;

  /**
   * Intercept any pipeline transition. Receives the current state and an
   * object containing the action plus the `changes` the internal reducer
   * computed. Return the final state you want applied.
   *
   * @example
   * ```ts
   * stateReducer(state, { type, changes }) {
   *   // Skip confirm for draft items
   *   if (type === WorkflowTransitions.AdvanceToConfirm && isDraft) {
   *     return { ...changes, step: 'input', actionId: changes.actionId };
   *   }
   *   return changes;
   * }
   * ```
   */
  stateReducer?: (
    state: PipelineState,
    actionAndChanges: PipelineAction & { changes: PipelineState },
  ) => PipelineState;

  /** Called when the pipeline step changes */
  onPipelineChange?: (context: { state: PipelineState; type: WorkflowTransitionType }) => void;
}

// ── Return type ──

export interface UseWorkflowActionsReturn {
  /** Visible actions (filtered by visible !== false) */
  visibleActions: WorkflowAction[];
  /** Current pipeline state */
  pipelineState: PipelineState;
  /** Whether an action is currently executing */
  isExecuting: boolean;
  /** The action currently in the pipeline (confirm/input/executing), or null */
  activeAction: WorkflowAction | null;

  // ── Pipeline controls ──

  /** Trigger an action — starts its pipeline (confirm → input → execute) */
  trigger: (actionId: string) => void;
  /** Confirm the current confirm step → advance to input or execute */
  confirmStep: () => void;
  /** Cancel the current pipeline step → return to idle */
  cancelStep: () => void;
  /** Submit the input form → advance to execute */
  submitInput: (data: Record<string, unknown>) => void;
}

// ══════════════════════════════════════════════════════════════
// Internal reducer
// ══════════════════════════════════════════════════════════════

const IDLE_STATE: PipelineState = { step: 'idle', actionId: null };

function resolveFirstStep(action: WorkflowAction): PipelineState {
  if (action.confirm) return { step: 'confirm', actionId: action.id };
  if (action.input) return { step: 'input', actionId: action.id };
  return { step: 'executing', actionId: action.id };
}

function pipelineReducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case 'TRIGGER':
      return resolveFirstStep(action.action);

    case 'ADVANCE_TO_CONFIRM':
      return { step: 'confirm', actionId: action.actionId };

    case 'ADVANCE_TO_INPUT':
      return { step: 'input', actionId: action.actionId };

    case 'ADVANCE_TO_EXECUTE':
      return { step: 'executing', actionId: action.actionId };

    case 'EXECUTION_COMPLETE':
      return IDLE_STATE;

    case 'EXECUTION_ERROR':
      return IDLE_STATE;

    case 'CANCEL':
      return IDLE_STATE;

    default:
      return state;
  }
}

// ══════════════════════════════════════════════════════════════
// Hook
// ══════════════════════════════════════════════════════════════

export function useWorkflowActions(options: UseWorkflowActionsOptions): UseWorkflowActionsReturn {
  const { actions, onActionComplete, onActionError, stateReducer, onPipelineChange } = options;

  // ── Enhanced reducer with stateReducer interception ──

  const enhancedReducer = (state: PipelineState, action: PipelineAction): PipelineState => {
    const changes = pipelineReducer(state, action);

    if (stateReducer) {
      return stateReducer(state, { ...action, changes });
    }

    return changes;
  };

  const [pipelineState, dispatch] = useReducer(enhancedReducer, IDLE_STATE);

  // ── Lifecycle callback tracking ──

  const lastTransitionRef = useRef<WorkflowTransitionType>(WorkflowTransitions.Cancel);
  const prevStateRef = useRef(pipelineState);

  const trackedDispatch = (action: PipelineAction) => {
    lastTransitionRef.current = action.type;
    dispatch(action);
  };

  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = pipelineState;

    if (prev === pipelineState) return;

    onPipelineChange?.({
      state: pipelineState,
      type: lastTransitionRef.current,
    });
  });

  // ── Derived ──

  const visibleActions = actions.filter((a) => a.visible !== false);

  const activeAction =
    pipelineState.step === 'idle'
      ? null
      : (actions.find((a) => a.id === pipelineState.actionId) ?? null);

  const isExecuting = pipelineState.step === 'executing';

  // ── Async execution (side effect — not in the reducer) ──

  const executeAction = async (action: WorkflowAction, inputData?: Record<string, unknown>) => {
    trackedDispatch({
      type: WorkflowTransitions.AdvanceToExecute,
      actionId: action.id,
      inputData,
    });

    try {
      await action.onExecute(inputData);
      trackedDispatch({
        type: WorkflowTransitions.ExecutionComplete,
        actionId: action.id,
      });
      onActionComplete?.(action.id);
    } catch (error) {
      trackedDispatch({
        type: WorkflowTransitions.ExecutionError,
        actionId: action.id,
        error,
      });
      onActionError?.(action.id, error);
    }
  };

  // ── Pipeline controls ──

  const trigger = (actionId: string) => {
    const action = actions.find((a) => a.id === actionId);
    if (!action) return;
    if (action.disabled) return;

    // For direct-execute actions (no confirm, no input), go straight to executeAction
    if (!action.confirm && !action.input) {
      executeAction(action);
      return;
    }

    trackedDispatch({
      type: WorkflowTransitions.Trigger,
      actionId: action.id,
      action,
    });
  };

  const confirmStep = () => {
    if (pipelineState.step !== 'confirm' || !activeAction) return;

    if (activeAction.input) {
      trackedDispatch({
        type: WorkflowTransitions.AdvanceToInput,
        actionId: activeAction.id,
      });
    } else {
      executeAction(activeAction);
    }
  };

  const cancelStep = () => {
    trackedDispatch({ type: WorkflowTransitions.Cancel });
  };

  const submitInput = (data: Record<string, unknown>) => {
    if (pipelineState.step !== 'input' || !activeAction) return;
    executeAction(activeAction, data);
  };

  return {
    visibleActions,
    pipelineState,
    isExecuting,
    activeAction,
    trigger,
    confirmStep,
    cancelStep,
    submitInput,
  };
}
