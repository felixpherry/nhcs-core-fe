// 'use client';

// import { createContext, useContext, useState, type ReactNode } from 'react';
// import { Button } from '../ui/button';
// import { Badge } from '../ui/badge';
// import { Checkbox } from '../ui/checkbox';
// import { Label } from '../ui/label';
// import { FormField } from '../form-field/form-field';
// import type { FormFieldConfig } from '../form-field/types';
// import type { UseFilterReturn } from '../../hooks/use-filter';
// import type { UseFieldVisibilityReturn } from '../../hooks/use-field-visibility';

// // ── Types ──

// export interface FilterPanelProps<TFilter extends Record<string, unknown>> {
//   /** Field definitions for the filter form */
//   fields: FormFieldConfig<TFilter>[];
//   /** Filter hook return value */
//   filter: UseFilterReturn<TFilter>;
//   /** Field visibility hook return value */
//   visibility: UseFieldVisibilityReturn;
//   /** Wrapper children (compose with sub-components) */
//   children: ReactNode;
// }

// // ── Context ──

// interface FilterPanelContextValue {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   fields: FormFieldConfig<any>[];
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   filter: UseFilterReturn<any>;
//   visibility: UseFieldVisibilityReturn;
// }

// const FilterPanelContext = createContext<FilterPanelContextValue | null>(null);

// function useFilterPanelContext(): FilterPanelContextValue {
//   const ctx = useContext(FilterPanelContext);
//   if (!ctx) {
//     throw new Error('FilterPanel sub-components must be used within <FilterPanel>');
//   }
//   return ctx;
// }

// // ── FilterPanel (root) ──

// export function FilterPanel<TFilter extends Record<string, unknown>>({
//   fields,
//   filter,
//   visibility,
//   children,
// }: FilterPanelProps<TFilter>) {
//   return (
//     <FilterPanelContext.Provider value={{ fields, filter, visibility }}>
//       <div data-slot="filter-panel" className="space-y-4">
//         {children}
//       </div>
//     </FilterPanelContext.Provider>
//   );
// }

// // ── FilterPanelFields ──

// export interface FilterPanelFieldsProps {
//   /** CSS grid columns class. Default: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' */
//   gridClassName?: string;
// }

// export function FilterPanelFields({ gridClassName }: FilterPanelFieldsProps) {
//   const { fields, filter, visibility } = useFilterPanelContext();

//   const visibleFields = fields.filter((f) => visibility.isVisible(f.id));

//   if (visibleFields.length === 0) {
//     return (
//       <p className="text-muted-foreground text-sm">
//         No filters visible. Use the field toggle to add filters.
//       </p>
//     );
//   }

//   return (
//     <div
//       data-slot="filter-panel-fields"
//       className={`grid gap-4 ${gridClassName ?? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}
//     >
//       {visibleFields.map((fieldConfig) => (
//         <FormField
//           key={fieldConfig.id}
//           config={fieldConfig}
//           value={filter.draft[fieldConfig.name as keyof typeof filter.draft]}
//           onChange={(value) =>
//             filter.setDraftFieldValue(
//               fieldConfig.name as keyof typeof filter.draft,
//               value as (typeof filter.draft)[keyof typeof filter.draft],
//             )
//           }
//           onBlur={() => {}}
//           formValues={filter.draft}
//         />
//       ))}
//     </div>
//   );
// }

// // ── FilterPanelActions ──

// export interface FilterPanelActionsProps {
//   /** Label for the apply button. Default: 'Apply' */
//   applyLabel?: string;
//   /** Label for the reset button. Default: 'Reset' */
//   resetLabel?: string;
// }

// export function FilterPanelActions({
//   applyLabel = 'Apply',
//   resetLabel = 'Reset',
// }: FilterPanelActionsProps) {
//   const { filter } = useFilterPanelContext();

//   return (
//     <div data-slot="filter-panel-actions" className="flex items-center gap-2">
//       <Button
//         variant="default"
//         size="sm"
//         disabled={!filter.isDirty}
//         onClick={() => filter.apply()}
//       >
//         {applyLabel}
//       </Button>
//       <Button
//         variant="outline"
//         size="sm"
//         disabled={!filter.hasActiveFilters}
//         onClick={() => filter.resetApplied()}
//       >
//         {resetLabel}
//       </Button>
//       {filter.activeCount > 0 && (
//         <Badge variant="secondary" data-testid="active-filter-count">
//           {filter.activeCount} active
//         </Badge>
//       )}
//     </div>
//   );
// }

// // ── FilterPanelFieldToggle ──

// export interface FilterPanelFieldToggleProps {
//   /** Label for the toggle trigger. Default: 'Add Filter' */
//   label?: string;
// }

// export function FilterPanelFieldToggle({ label = 'Add Filter' }: FilterPanelFieldToggleProps) {
//   const { fields, visibility } = useFilterPanelContext();
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div data-slot="filter-panel-field-toggle">
//       <Button
//         variant="ghost"
//         size="sm"
//         onClick={() => setIsOpen((prev) => !prev)}
//         aria-expanded={isOpen}
//       >
//         {label}
//         {visibility.visibleCount < visibility.totalCount && (
//           <Badge variant="secondary" className="ml-1">
//             {visibility.visibleCount}/{visibility.totalCount}
//           </Badge>
//         )}
//       </Button>

//       {isOpen && (
//         <div
//           data-slot="filter-panel-field-toggle-list"
//           className="bg-muted/50 mt-2 space-y-2 rounded-md border p-3"
//         >
//           <div className="mb-2 flex items-center justify-between">
//             <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
//               Toggle Filters
//             </span>
//             <div className="flex gap-1">
//               <Button
//                 variant="ghost"
//                 size="xs"
//                 onClick={() => visibility.showAll()}
//                 disabled={visibility.areAllVisible}
//               >
//                 Show All
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="xs"
//                 onClick={() => visibility.hideAll()}
//                 disabled={visibility.areNoneVisible}
//               >
//                 Hide All
//               </Button>
//             </div>
//           </div>

//           {fields.map((field) => (
//             <div key={field.id} className="flex items-center gap-2">
//               <Checkbox
//                 id={`toggle-${field.id}`}
//                 checked={visibility.isVisible(field.id)}
//                 onCheckedChange={() => visibility.toggle(field.id)}
//               />
//               <Label htmlFor={`toggle-${field.id}`} className="cursor-pointer text-sm">
//                 {field.label}
//               </Label>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
