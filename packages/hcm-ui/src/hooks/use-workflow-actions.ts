'use client';

import { useState, useCallback, useMemo } from 'react';
import type { FormFieldConfig } from '../components/form-field/types';

// ── Types ──

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
  fields: FormFieldConfig[];
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

/** Current pipeline state */
export type PipelineState =
  | { step: 'idle' }
  | { step: 'confirm'; actionId: string }
  | { step: 'input'; actionId: string }
  | { step: 'executing'; actionId: string };

export interface UseWorkflowActionsOptions {
  /** Action definitions */
  actions: WorkflowAction[];
  /** Called when any action completes successfully */
  onActionComplete?: (actionId: string) => void;
  /** Called when any action fails */
  onActionError?: (actionId: string, error: unknown) => void;
}

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

// ── Hook ──

export function useWorkflowActions(options: UseWorkflowActionsOptions): UseWorkflowActionsReturn {
  const { actions, onActionComplete, onActionError } = options;

  // ── Pipeline state ──

  const [pipelineState, setPipelineState] = useState<PipelineState>({ step: 'idle' });

  // ── Derived ──

  const visibleActions = useMemo(() => actions.filter((a) => a.visible !== false), [actions]);

  const activeAction = useMemo(() => {
    if (pipelineState.step === 'idle') return null;
    return actions.find((a) => a.id === pipelineState.actionId) ?? null;
  }, [pipelineState, actions]);

  const isExecuting = pipelineState.step === 'executing';

  // ── Execute an action ──

  const executeAction = useCallback(
    async (action: WorkflowAction, inputData?: Record<string, unknown>) => {
      setPipelineState({ step: 'executing', actionId: action.id });

      try {
        await action.onExecute(inputData);
        setPipelineState({ step: 'idle' });
        onActionComplete?.(action.id);
      } catch (error) {
        setPipelineState({ step: 'idle' });
        onActionError?.(action.id, error);
      }
    },
    [onActionComplete, onActionError],
  );

  // ── Advance to the next pipeline step ──

  const advanceToNextStep = useCallback(
    (action: WorkflowAction, fromStep: 'trigger' | 'confirm') => {
      if (fromStep === 'trigger') {
        // First step: check if confirm is needed
        if (action.confirm) {
          setPipelineState({ step: 'confirm', actionId: action.id });
          return;
        }
        // No confirm — check if input is needed
        if (action.input) {
          setPipelineState({ step: 'input', actionId: action.id });
          return;
        }
        // No confirm, no input — execute directly
        executeAction(action);
        return;
      }

      if (fromStep === 'confirm') {
        // After confirm — check if input is needed
        if (action.input) {
          setPipelineState({ step: 'input', actionId: action.id });
          return;
        }
        // No input — execute directly
        executeAction(action);
        return;
      }
    },
    [executeAction],
  );

  // ── Trigger an action ──

  const trigger = useCallback(
    (actionId: string) => {
      const action = actions.find((a) => a.id === actionId);
      if (!action) return;
      if (action.disabled) return;

      advanceToNextStep(action, 'trigger');
    },
    [actions, advanceToNextStep],
  );

  // ── Confirm step → advance ──

  const confirmStep = useCallback(() => {
    if (pipelineState.step !== 'confirm' || !activeAction) return;
    advanceToNextStep(activeAction, 'confirm');
  }, [pipelineState, activeAction, advanceToNextStep]);

  // ── Cancel step → back to idle ──

  const cancelStep = useCallback(() => {
    setPipelineState({ step: 'idle' });
  }, []);

  // ── Submit input → execute ──

  const submitInput = useCallback(
    (data: Record<string, unknown>) => {
      if (pipelineState.step !== 'input' || !activeAction) return;
      executeAction(activeAction, data);
    },
    [pipelineState, activeAction, executeAction],
  );

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
