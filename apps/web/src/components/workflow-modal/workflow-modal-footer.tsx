// 'use client';

// import { Button } from '@/components/ui/button';
// import { ConfirmDialog } from '@/components/confirm-dialog/confirm-dialog';
// import { ActionInputDialog } from './action-input-dialog';
// import type { UseWorkflowActionsReturn } from '../../hooks/use-workflow-actions';

// // ── Props ──

// export interface WorkflowModalFooterProps {
//   /** The useWorkflowActions return object */
//   workflowActions: UseWorkflowActionsReturn;
//   /** Additional className for the footer container */
//   className?: string;
// }

// // ── Component ──

// export function WorkflowModalFooter({ workflowActions, className }: WorkflowModalFooterProps) {
//   const {
//     visibleActions,
//     pipelineState,
//     isExecuting,
//     activeAction,
//     trigger,
//     confirmStep,
//     cancelStep,
//     submitInput,
//   } = workflowActions;

//   return (
//     <>
//       {/* ── Action buttons ── */}
//       <div className={className}>
//         {visibleActions.map((action) => (
//           <Button
//             key={action.id}
//             variant={action.variant ?? 'default'}
//             type={action.type ?? 'button'}
//             disabled={action.disabled || isExecuting}
//             onClick={() => trigger(action.id)}
//           >
//             {action.label}
//           </Button>
//         ))}
//       </div>

//       {/* ── ConfirmDialog (auto-wired to pipeline) ── */}
//       {activeAction?.confirm && (
//         <ConfirmDialog
//           open={pipelineState.step === 'confirm'}
//           onOpenChange={(open) => {
//             if (!open) cancelStep();
//           }}
//           title={activeAction.confirm.title}
//           description={activeAction.confirm.description}
//           confirmLabel={activeAction.confirm.confirmLabel}
//           cancelLabel={activeAction.confirm.cancelLabel}
//           variant={activeAction.confirm.variant}
//           loading={isExecuting}
//           onConfirm={confirmStep}
//           onCancel={cancelStep}
//         />
//       )}

//       {/* ── ActionInputDialog (auto-wired to pipeline) ── */}
//       {activeAction?.input && (
//         <ActionInputDialog
//           open={pipelineState.step === 'input'}
//           inputStep={activeAction.input}
//           onSubmit={submitInput}
//           onCancel={cancelStep}
//           loading={isExecuting}
//         />
//       )}
//     </>
//   );
// }
