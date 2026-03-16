import type { Meta, StoryObj } from '@storybook/react';

import { WorkflowModalFooter } from './workflow-modal-footer';
import { useWorkflowActions } from '../../hooks/use-workflow-actions';

// ── Meta ──

const meta: Meta = {
  title: 'Workflow/WorkflowModalFooter',
  parameters: { layout: 'padded' },
};

export default meta;

// ── Stories ──

export const BasicActions: StoryObj = {
  name: 'Basic — Close + Save',
  render: () => {
    const workflowActions = useWorkflowActions({
      actions: [
        {
          id: 'close',
          label: 'Close',
          variant: 'outline',
          onExecute: () => alert('Closed'),
        },
        {
          id: 'save',
          label: 'Save',
          onExecute: async () => {
            await new Promise((r) => setTimeout(r, 1000));
            alert('Saved!');
          },
        },
      ],
    });

    return (
      <div className="rounded border p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Click Save to see loading state (1s delay).
        </p>
        <WorkflowModalFooter
          workflowActions={workflowActions}
          className="flex items-center justify-end gap-2"
        />
      </div>
    );
  },
};

export const WithConfirmation: StoryObj = {
  name: 'With Confirmation Dialog',
  render: () => {
    const workflowActions = useWorkflowActions({
      actions: [
        {
          id: 'close',
          label: 'Close',
          variant: 'outline',
          onExecute: () => {},
        },
        {
          id: 'approve',
          label: 'Approve',
          confirm: {
            title: 'Approve Request',
            description:
              'Are you sure you want to approve this request? This action cannot be undone.',
          },
          onExecute: async () => {
            await new Promise((r) => setTimeout(r, 1000));
            alert('Approved!');
          },
        },
        {
          id: 'delete',
          label: 'Delete',
          variant: 'destructive',
          confirm: {
            title: 'Delete Record',
            description: 'This will permanently delete this record.',
            variant: 'destructive',
            confirmLabel: 'Yes, delete it',
            cancelLabel: 'No, keep it',
          },
          onExecute: async () => {
            await new Promise((r) => setTimeout(r, 1000));
            alert('Deleted!');
          },
        },
      ],
    });

    return (
      <div className="rounded border p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Click Approve or Delete to see confirmation dialogs.
        </p>
        <WorkflowModalFooter
          workflowActions={workflowActions}
          className="flex items-center justify-end gap-2"
        />
      </div>
    );
  },
};

export const WithInputDialog: StoryObj = {
  name: 'With Input Dialog (Reason)',
  render: () => {
    const workflowActions = useWorkflowActions({
      actions: [
        {
          id: 'close',
          label: 'Close',
          variant: 'outline',
          onExecute: () => {},
        },
        {
          id: 'cancel-request',
          label: 'Cancel Request',
          variant: 'destructive',
          input: {
            title: 'Cancel Reason',
            description: 'Please provide a reason for cancellation.',
            fields: [
              {
                id: 'reason',
                name: 'reason',
                type: 'textarea' as const,
                label: 'Reason',
                required: true,
                placeholder: 'Enter your reason...',
                rows: 4,
              },
            ],
            submitLabel: 'Submit Cancellation',
          },
          onExecute: async (data) => {
            await new Promise((r) => setTimeout(r, 1000));
            alert(`Cancelled with reason: ${data?.reason}`);
          },
        },
      ],
    });

    return (
      <div className="rounded border p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Click Cancel Request to see the input dialog with required validation.
        </p>
        <WorkflowModalFooter
          workflowActions={workflowActions}
          className="flex items-center justify-end gap-2"
        />
      </div>
    );
  },
};

export const FullPipeline: StoryObj = {
  name: 'Full Pipeline — Confirm → Input → Execute',
  render: () => {
    const workflowActions = useWorkflowActions({
      actions: [
        {
          id: 'close',
          label: 'Close',
          variant: 'outline',
          onExecute: () => {},
        },
        {
          id: 'edit',
          label: 'Edit',
          variant: 'secondary',
          onExecute: () => alert('Edit mode activated'),
        },
        {
          id: 'cancel-request',
          label: 'Cancel Request',
          variant: 'destructive',
          confirm: {
            title: 'Cancel Confirmation',
            description: 'Are you sure you want to cancel this request?',
            variant: 'destructive',
          },
          input: {
            title: 'Cancel Reason',
            description: 'A reason is required for audit trail.',
            fields: [
              {
                id: 'reason',
                name: 'reason',
                type: 'textarea' as const,
                label: 'Reason',
                required: true,
                rows: 3,
              },
              {
                id: 'notes',
                name: 'notes',
                type: 'text' as const,
                label: 'Additional Notes',
                placeholder: 'Optional',
              },
            ],
            submitLabel: 'Submit',
          },
          onExecute: async (data) => {
            await new Promise((r) => setTimeout(r, 1500));
            alert(`Cancelled!\nReason: ${data?.reason}\nNotes: ${data?.notes || '(none)'}`);
          },
        },
      ],
      onActionComplete: (id) => console.log(`Action completed: ${id}`),
      onActionError: (id, err) => console.error(`Action failed: ${id}`, err),
    });

    return (
      <div className="rounded border p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Cancel Request goes through: Confirm → Input (with validation) → Execute (1.5s delay).
        </p>
        <WorkflowModalFooter
          workflowActions={workflowActions}
          className="flex items-center justify-end gap-2"
        />
      </div>
    );
  },
};

export const HiddenActions: StoryObj = {
  name: 'Backend-Driven Visibility',
  render: () => {
    const buttonStatus = {
      isEdited: true,
      isDeleted: false,
      isSynchronized: true,
    };

    const workflowActions = useWorkflowActions({
      actions: [
        {
          id: 'close',
          label: 'Close',
          variant: 'outline',
          onExecute: () => {},
        },
        {
          id: 'edit',
          label: 'Edit',
          visible: buttonStatus.isEdited,
          onExecute: () => alert('Edit'),
        },
        {
          id: 'delete',
          label: 'Delete',
          variant: 'destructive',
          visible: buttonStatus.isDeleted,
          onExecute: () => {},
        },
        {
          id: 'sync',
          label: 'Synchronize',
          visible: buttonStatus.isSynchronized,
          onExecute: async () => {
            await new Promise((r) => setTimeout(r, 1000));
            alert('Synchronized!');
          },
        },
      ],
    });

    return (
      <div className="rounded border p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Delete is hidden (isDeleted: false). Edit and Synchronize are visible.
        </p>
        <WorkflowModalFooter
          workflowActions={workflowActions}
          className="flex items-center justify-end gap-2"
        />
      </div>
    );
  },
};
