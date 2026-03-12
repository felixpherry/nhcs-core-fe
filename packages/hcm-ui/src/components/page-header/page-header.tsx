import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemPrimitive,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

// ── Types ──

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Link path. If omitted, rendered as current page (no link). */
  href?: string;
}

export interface PageHeaderProps {
  /** Page title */
  title: ReactNode;
  /** Optional description below the title */
  description?: ReactNode;
  /** Structured breadcrumb items. Last item without href is treated as current page. */
  breadcrumbs?: BreadcrumbItem[];
  /** Additional className for the container */
  className?: string;
}

// ── Component ──

export function PageHeader({ title, description, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <BreadcrumbItemPrimitive key={item.label}>
                  {isLast || !item.href ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItemPrimitive>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
