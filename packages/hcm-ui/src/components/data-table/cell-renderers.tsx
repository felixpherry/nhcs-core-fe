import type { ReactNode } from 'react';
import { Badge } from '../ui/badge';

// ── Status Badge: 'T' → green Active, 'F' → red Inactive ──

export function StatusBadgeCell({ value }: { value: unknown }): ReactNode {
  const isActive = value === 'T' || value === true;
  const label = isActive ? 'Active' : 'Inactive';

  return <Badge variant={isActive ? 'default' : 'secondary'}>{label}</Badge>;
}

// ── Date cell: format date string ──

export function DateCell({ value }: { value: unknown }): ReactNode {
  if (!value || typeof value !== 'string') return <span>-</span>;

  try {
    const date = new Date(value);
    return <span>{date.toLocaleDateString()}</span>;
  } catch {
    return <span>{String(value)}</span>;
  }
}

// ── Number cell: format with locale ──

export function NumberCell({ value }: { value: unknown }): ReactNode {
  if (value === null || value === undefined) return <span>-</span>;
  const num = Number(value);
  if (isNaN(num)) return <span>{String(value)}</span>;
  return <span>{num.toLocaleString()}</span>;
}
