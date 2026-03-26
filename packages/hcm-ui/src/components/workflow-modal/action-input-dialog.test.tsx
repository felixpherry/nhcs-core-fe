// import { describe, it, expect, vi } from 'vitest';
// import { render, screen } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';

// import { ActionInputDialog } from './action-input-dialog';
// import type { ActionInputStep } from '../../hooks/use-workflow-actions';

// // ── Helpers ──

// function createInputStep(overrides: Partial<ActionInputStep> = {}): ActionInputStep {
//   return {
//     title: 'Enter Details',
//     fields: [
//       {
//         id: 'reason',
//         name: 'reason',
//         type: 'textarea' as const,
//         label: 'Reason',
//         required: true,
//         rows: 3,
//       },
//     ],
//     ...overrides,
//   };
// }

// function defaultProps() {
//   return {
//     open: true,
//     inputStep: createInputStep(),
//     onSubmit: vi.fn(),
//     onCancel: vi.fn(),
//   };
// }

// // ── Tests ──

// describe('ActionInputDialog', () => {
//   const user = userEvent.setup();

//   // ────────────────────────────────────────
//   // Rendering
//   // ────────────────────────────────────────

//   describe('rendering', () => {
//     it('renders when open is true', () => {
//       render(<ActionInputDialog {...defaultProps()} />);

//       expect(screen.getByText('Enter Details')).toBeInTheDocument();
//     });

//     it('does not render when open is false', () => {
//       render(<ActionInputDialog {...defaultProps()} open={false} />);

//       expect(screen.queryByText('Enter Details')).not.toBeInTheDocument();
//     });

//     it('renders title', () => {
//       render(
//         <ActionInputDialog
//           {...defaultProps()}
//           inputStep={createInputStep({ title: 'Cancel Reason' })}
//         />,
//       );

//       expect(screen.getByText('Cancel Reason')).toBeInTheDocument();
//     });

//     it('renders description when provided', () => {
//       render(
//         <ActionInputDialog
//           {...defaultProps()}
//           inputStep={createInputStep({ description: 'Please explain why' })}
//         />,
//       );

//       expect(screen.getByText('Please explain why')).toBeInTheDocument();
//     });

//     it('does not render description when not provided', () => {
//       render(<ActionInputDialog {...defaultProps()} />);

//       expect(screen.queryByText('Please explain why')).not.toBeInTheDocument();
//     });

//     it('renders form fields', () => {
//       render(<ActionInputDialog {...defaultProps()} />);

//       expect(screen.getByText('Reason')).toBeInTheDocument();
//     });

//     it('renders default button labels', () => {
//       render(<ActionInputDialog {...defaultProps()} />);

//       expect(screen.getByText('Submit')).toBeInTheDocument();
//       expect(screen.getByText('Cancel')).toBeInTheDocument();
//     });

//     it('renders custom button labels', () => {
//       render(
//         <ActionInputDialog
//           {...defaultProps()}
//           inputStep={createInputStep({
//             submitLabel: 'Send',
//             cancelLabel: 'Discard',
//           })}
//         />,
//       );

//       expect(screen.getByText('Send')).toBeInTheDocument();
//       expect(screen.getByText('Discard')).toBeInTheDocument();
//     });

//     it('renders multiple fields', () => {
//       render(
//         <ActionInputDialog
//           {...defaultProps()}
//           inputStep={createInputStep({
//             fields: [
//               { id: 'reason', name: 'reason', type: 'textarea' as const, label: 'Reason' },
//               { id: 'notes', name: 'notes', type: 'text' as const, label: 'Notes' },
//             ],
//           })}
//         />,
//       );

//       expect(screen.getByText('Reason')).toBeInTheDocument();
//       expect(screen.getByText('Notes')).toBeInTheDocument();
//     });
//   });

//   // ────────────────────────────────────────
//   // Submit
//   // ────────────────────────────────────────

//   describe('submit', () => {
//     it('calls onSubmit with form data', async () => {
//       const props = defaultProps();

//       render(<ActionInputDialog {...props} />);

//       const textarea = screen.getByRole('textbox');
//       await user.type(textarea, 'No longer needed');
//       await user.click(screen.getByText('Submit'));

//       expect(props.onSubmit).toHaveBeenCalledWith(
//         expect.objectContaining({ reason: 'No longer needed' }),
//       );
//     });

//     it('calls onSubmit with multiple field values', async () => {
//       const props = defaultProps();
//       props.inputStep = createInputStep({
//         fields: [
//           { id: 'reason', name: 'reason', type: 'text' as const, label: 'Reason', required: true },
//           { id: 'notes', name: 'notes', type: 'text' as const, label: 'Notes' },
//         ],
//       });

//       render(<ActionInputDialog {...props} />);

//       const inputs = screen.getAllByRole('textbox');
//       await user.type(inputs[0]!, 'Budget cut');
//       await user.type(inputs[1]!, 'Effective immediately');
//       await user.click(screen.getByText('Submit'));

//       expect(props.onSubmit).toHaveBeenCalledWith(
//         expect.objectContaining({
//           reason: 'Budget cut',
//           notes: 'Effective immediately',
//         }),
//       );
//     });
//   });

//   // ────────────────────────────────────────
//   // Validation
//   // ────────────────────────────────────────

//   describe('validation', () => {
//     it('blocks submit when required field is empty', async () => {
//       const props = defaultProps();

//       render(<ActionInputDialog {...props} />);

//       // Submit without filling required field
//       await user.click(screen.getByText('Submit'));

//       expect(props.onSubmit).not.toHaveBeenCalled();
//     });

//     it('shows error message for required field', async () => {
//       render(<ActionInputDialog {...defaultProps()} />);

//       await user.click(screen.getByText('Submit'));

//       expect(screen.getByText('Reason is required')).toBeInTheDocument();
//     });

//     it('clears error when user starts typing', async () => {
//       render(<ActionInputDialog {...defaultProps()} />);

//       // Trigger validation error
//       await user.click(screen.getByText('Submit'));
//       expect(screen.getByText('Reason is required')).toBeInTheDocument();

//       // Start typing — error should clear
//       const textarea = screen.getByRole('textbox');
//       await user.type(textarea, 'A');

//       expect(screen.queryByText('Reason is required')).not.toBeInTheDocument();
//     });

//     it('allows submit after fixing required field', async () => {
//       const props = defaultProps();

//       render(<ActionInputDialog {...props} />);

//       // First attempt — blocked
//       await user.click(screen.getByText('Submit'));
//       expect(props.onSubmit).not.toHaveBeenCalled();

//       // Fix the field
//       const textarea = screen.getByRole('textbox');
//       await user.type(textarea, 'Fixed reason');
//       await user.click(screen.getByText('Submit'));

//       expect(props.onSubmit).toHaveBeenCalledWith(
//         expect.objectContaining({ reason: 'Fixed reason' }),
//       );
//     });

//     it('does not block submit for non-required fields', async () => {
//       const props = defaultProps();
//       props.inputStep = createInputStep({
//         fields: [
//           { id: 'notes', name: 'notes', type: 'text' as const, label: 'Notes', required: false },
//         ],
//       });

//       render(<ActionInputDialog {...props} />);

//       await user.click(screen.getByText('Submit'));

//       expect(props.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ notes: '' }));
//     });
//   });

//   // ────────────────────────────────────────
//   // Cancel
//   // ────────────────────────────────────────

//   describe('cancel', () => {
//     it('calls onCancel when cancel button clicked', async () => {
//       const props = defaultProps();

//       render(<ActionInputDialog {...props} />);

//       await user.click(screen.getByText('Cancel'));

//       expect(props.onCancel).toHaveBeenCalledTimes(1);
//     });

//     it('calls onCancel when dialog is dismissed via Escape', async () => {
//       const props = defaultProps();

//       render(<ActionInputDialog {...props} />);

//       await user.keyboard('{Escape}');

//       expect(props.onCancel).toHaveBeenCalledTimes(1);
//     });
//   });

//   // ────────────────────────────────────────
//   // Loading state
//   // ────────────────────────────────────────

//   describe('loading', () => {
//     it('shows "Processing..." on submit button when loading', () => {
//       render(<ActionInputDialog {...defaultProps()} loading={true} />);

//       expect(screen.getByText('Processing...')).toBeInTheDocument();
//       expect(screen.queryByText('Submit')).not.toBeInTheDocument();
//     });

//     it('disables submit button when loading', () => {
//       render(<ActionInputDialog {...defaultProps()} loading={true} />);

//       expect(screen.getByText('Processing...')).toBeDisabled();
//     });

//     it('disables cancel button when loading', () => {
//       render(<ActionInputDialog {...defaultProps()} loading={true} />);

//       expect(screen.getByText('Cancel')).toBeDisabled();
//     });
//   });
// });
