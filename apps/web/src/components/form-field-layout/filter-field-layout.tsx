import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

export interface FilterFieldLayoutProps {
  /** Field label text */
  label: string;
  /** Field content */
  children: ReactNode;
  /** Additional className */
  className?: string;
}

export function FilterFieldLayout({ label, children, className }: FilterFieldLayoutProps) {
  return (
    <div className={className}>
      <Label className="font-semibold">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
