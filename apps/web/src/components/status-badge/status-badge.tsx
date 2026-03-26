'use client';

import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';

// ── Types ──

export type BadgeVariant = ComponentProps<typeof Badge>['variant'];

export interface StatusBadgeProps {
  /** The raw status value (e.g., 'APPROVED', 'DRAFT') */
  status: string;
  /** Override display text. Default: capitalizes status (APPROVED → Approved) */
  label?: string;
  /** Badge variant override. Default: 'secondary' */
  variant?: BadgeVariant;
  /** Map of status → variant for automatic variant resolution.
   *  If provided and status matches, overrides the variant prop.
   *  Example: { APPROVED: 'default', REJECTED: 'destructive' } */
  variantMap?: Record<string, BadgeVariant>;
  /** Additional className */
  className?: string;
}

// ── Helpers ──

/** APPROVED → Approved, IN_PROGRESS → In Progress */
function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ── Component ──

export function StatusBadge({
  status,
  label,
  variant = 'secondary',
  variantMap,
  className,
}: StatusBadgeProps) {
  const resolvedVariant = variantMap?.[status] ?? variant;
  const displayLabel = label ?? formatStatus(status);

  return (
    <Badge variant={resolvedVariant} className={className}>
      {displayLabel}
    </Badge>
  );
}
