import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WorkflowModalFooter } from './workflow-modal-footer';
import type { UseWorkflowActionsReturn, WorkflowAction } from '../../hooks/use-workflow-actions';

// ── Mock factory ──

function createMockWorkflowActions(
  overrides: Partial<UseWorkflowActionsReturn> = {},
): UseWorkflowActionsReturn {
  return {
    visibleActions: [],
    pipelineState: { step: 'idle' },
    isExecuting: false,
    activeAction: null,
    trigger: vi.fn(),
    confirmStep: vi.fn(),
    cancelStep: vi.fn(),
    submitInput: vi.fn(),
    ...overrides,
  };
}

function createAction(overrides: Partial<WorkflowAction> = {}): WorkflowAction {
  return {
    id: 'test',
    label: 'Test',
    onExecute: vi.fn(),
    ...overrides,
  };
}

// ── Tests ──

describe('WorkflowModalFooter', () => {
  const user = userEvent.setup();

  // ────────────────────────────────────────
  // Button rendering
  // ────────────────────────────────────────

  describe('button rendering', () => {
    it('renders action buttons from visibleActions', () => {
      const wa = createMockWorkflowActions({
        visibleActions: [
          createAction({ id: 'close', label: 'Close' }),
          createAction({ id: 'save', label: 'Save' }),
          createAction({ id: 'approve', label: 'Approve' }),
        ],
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    it('renders no buttons when visibleActions is empty', () => {
      const wa = createMockWorkflowActions({ visibleActions: [] });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls trigger with action id on click', async () => {
      const wa = createMockWorkflowActions({
        visibleActions: [createAction({ id: 'approve', label: 'Approve' })],
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      await user.click(screen.getByText('Approve'));

      expect(wa.trigger).toHaveBeenCalledWith('approve');
    });

    it('disables all buttons when isExecuting', () => {
      const wa = createMockWorkflowActions({
        isExecuting: true,
        visibleActions: [
          createAction({ id: 'close', label: 'Close' }),
          createAction({ id: 'save', label: 'Save' }),
        ],
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.getByText('Close')).toBeDisabled();
      expect(screen.getByText('Save')).toBeDisabled();
    });

    it('disables individual action when action.disabled is true', () => {
      const wa = createMockWorkflowActions({
        visibleActions: [
          createAction({ id: 'close', label: 'Close' }),
          createAction({ id: 'save', label: 'Save', disabled: true }),
        ],
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.getByText('Close')).not.toBeDisabled();
      expect(screen.getByText('Save')).toBeDisabled();
    });

    it('applies variant to buttons', () => {
      const wa = createMockWorkflowActions({
        visibleActions: [
          createAction({ id: 'close', label: 'Close', variant: 'outline' }),
          createAction({ id: 'delete', label: 'Delete', variant: 'destructive' }),
        ],
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.getByText('Close')).toHaveClass('border-border');
      expect(screen.getByText('Delete')).toHaveClass('bg-destructive/10');
    });

    it('applies className to container', () => {
      const wa = createMockWorkflowActions({
        visibleActions: [createAction({ id: 'a', label: 'A' })],
      });

      const { container } = render(
        <WorkflowModalFooter workflowActions={wa} className="flex gap-2" />,
      );

      expect(container.firstChild).toHaveClass('flex', 'gap-2');
    });
  });

  // ────────────────────────────────────────
  // ConfirmDialog wiring
  // ────────────────────────────────────────

  describe('ConfirmDialog wiring', () => {
    it('renders ConfirmDialog when pipeline is in confirm step', () => {
      const action = createAction({
        id: 'delete',
        label: 'Delete',
        confirm: {
          title: 'Delete this record?',
          description: 'This cannot be undone.',
        },
      });

      const wa = createMockWorkflowActions({
        visibleActions: [action],
        pipelineState: { step: 'confirm', actionId: 'delete' },
        activeAction: action,
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.getByText('Delete this record?')).toBeInTheDocument();
      expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    });

    it('does not render ConfirmDialog when idle', () => {
      const action = createAction({
        id: 'delete',
        label: 'Delete',
        confirm: { title: 'Delete this record?' },
      });

      const wa = createMockWorkflowActions({
        visibleActions: [action],
        pipelineState: { step: 'idle' },
        activeAction: null,
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.queryByText('Delete this record?')).not.toBeInTheDocument();
    });

    it('calls confirmStep when ConfirmDialog confirm is clicked', async () => {
      const action = createAction({
        id: 'approve',
        label: 'Approve',
        confirm: { title: 'Approve?' },
      });

      const wa = createMockWorkflowActions({
        visibleActions: [action],
        pipelineState: { step: 'confirm', actionId: 'approve' },
        activeAction: action,
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      await user.click(screen.getByText('Confirm'));

      expect(wa.confirmStep).toHaveBeenCalledTimes(1);
    });

    it('calls cancelStep when ConfirmDialog cancel is clicked', async () => {
      const action = createAction({
        id: 'approve',
        label: 'Approve',
        confirm: { title: 'Approve?' },
      });

      const wa = createMockWorkflowActions({
        visibleActions: [action],
        pipelineState: { step: 'confirm', actionId: 'approve' },
        activeAction: action,
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      await user.click(screen.getByText('Cancel'));

      expect(wa.cancelStep).toHaveBeenCalled();
    });

    it('uses custom confirm labels', () => {
      const action = createAction({
        id: 'delete',
        label: 'Delete',
        confirm: {
          title: 'Delete?',
          confirmLabel: 'Yes, delete it',
          cancelLabel: 'No, keep it',
        },
      });

      const wa = createMockWorkflowActions({
        visibleActions: [action],
        pipelineState: { step: 'confirm', actionId: 'delete' },
        activeAction: action,
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.getByText('Yes, delete it')).toBeInTheDocument();
      expect(screen.getByText('No, keep it')).toBeInTheDocument();
    });

    it('applies destructive variant to ConfirmDialog', () => {
      const action = createAction({
        id: 'delete',
        label: 'Delete',
        confirm: {
          title: 'Delete?',
          variant: 'destructive',
        },
      });

      const wa = createMockWorkflowActions({
        visibleActions: [action],
        pipelineState: { step: 'confirm', actionId: 'delete' },
        activeAction: action,
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-destructive/10');
    });
  });

  // ────────────────────────────────────────
  // ActionInputDialog wiring
  // ────────────────────────────────────────

  describe('ActionInputDialog wiring', () => {
    it('renders ActionInputDialog when pipeline is in input step', () => {
      const action = createAction({
        id: 'cancel-request',
        label: 'Cancel Request',
        input: {
          title: 'Cancel Reason',
          description: 'Please provide a reason',
          fields: [
            {
              id: 'reason',
              name: 'reason',
              type: 'textarea' as const,
              label: 'Reason',
              required: true,
            },
          ],
        },
      });

      const wa = createMockWorkflowActions({
        visibleActions: [action],
        pipelineState: { step: 'input', actionId: 'cancel-request' },
        activeAction: action,
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.getByText('Cancel Reason')).toBeInTheDocument();
      expect(screen.getByText('Please provide a reason')).toBeInTheDocument();
    });

    it('does not render ActionInputDialog when idle', () => {
      const action = createAction({
        id: 'cancel-request',
        label: 'Cancel Request',
        input: {
          title: 'Cancel Reason',
          fields: [],
        },
      });

      const wa = createMockWorkflowActions({
        visibleActions: [action],
        pipelineState: { step: 'idle' },
        activeAction: null,
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      expect(screen.queryByText('Cancel Reason')).not.toBeInTheDocument();
    });

    it('calls cancelStep when ActionInputDialog is cancelled', async () => {
      const action = createAction({
        id: 'cancel-request',
        label: 'Cancel Request',
        input: {
          title: 'Cancel Reason',
          fields: [{ id: 'reason', name: 'reason', type: 'textarea' as const, label: 'Reason' }],
        },
      });

      const wa = createMockWorkflowActions({
        visibleActions: [action],
        pipelineState: { step: 'input', actionId: 'cancel-request' },
        activeAction: action,
      });

      render(<WorkflowModalFooter workflowActions={wa} />);

      await user.click(screen.getByText('Cancel'));

      expect(wa.cancelStep).toHaveBeenCalledTimes(1);
    });
  });
});
