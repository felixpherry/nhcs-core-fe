'use client';

import type { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  label: string;
}

function SortAscIcon() {
  return (
    <svg width="10" height="17" viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.14062 6.6665H7.97396L5.05729 2.08317L2.14062 6.6665Z" fill="#6C757D" />
      <g opacity="0.3">
        <path
          d="M7.85938 10.3335L2.02604 10.3335L4.94271 14.9168L7.85938 10.3335Z"
          fill="#6C757D"
        />
      </g>
    </svg>
  );
}

function SortDescIcon() {
  return (
    <svg width="10" height="17" viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.3">
        <path d="M2.14062 6.6665H7.97396L5.05729 2.08317L2.14062 6.6665Z" fill="#6C757D" />
      </g>
      <path d="M7.85938 10.3335L2.02604 10.3335L4.94271 14.9168L7.85938 10.3335Z" fill="#6C757D" />
    </svg>
  );
}

function SortDefaultIcon() {
  return (
    <svg width="10" height="17" viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.3">
        <path d="M2.14062 6.6665H7.97396L5.05729 2.08317L2.14062 6.6665Z" fill="#6C757D" />
      </g>
      <g opacity="0.3">
        <path
          d="M7.85938 10.3335L2.02604 10.3335L4.94271 14.9168L7.85938 10.3335Z"
          fill="#6C757D"
        />
      </g>
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  label,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const sortDirection = column.getIsSorted();
  const sortIndex = column.getSortIndex();
  const canMultiSort = column.getCanMultiSort();

  if (!canMultiSort) {
    return <div className={cn(className)}>{label}</div>;
  }

  const handleSortToggle = () => {
    column.toggleSorting(sortDirection === 'asc', true);
  };

  return (
    <div className={cn('w-full', className)}>
      <button
        onClick={handleSortToggle}
        className="group flex w-full items-center gap-2.5 whitespace-nowrap text-sub"
      >
        {label}
        <span className="shrink-0 text-neutral-400">
          {sortDirection === 'asc' ? (
            <SortAscIcon />
          ) : sortDirection === 'desc' ? (
            <SortDescIcon />
          ) : (
            <SortDefaultIcon />
          )}
        </span>
        <div className={cn(!sortDirection && 'opacity-0')}>
          <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-sub text-xs leading-none text-sub group-hover:hidden">
            {sortIndex + 1}
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation();
              column.clearSorting();
            }}
            className="hidden size-4 shrink-0 items-center justify-center rounded-full bg-strong text-xs text-white group-hover:flex"
          >
            <ClearIcon />
          </span>
        </div>
      </button>
    </div>
  );
}
