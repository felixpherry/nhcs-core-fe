import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent font-bold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-neutral-0',
        'primary-soft': 'bg-blue-50 text-primary',
        blue: 'bg-blue-600 text-neutral-0',
        'blue-soft': 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-600 text-neutral-0',
        danger: 'bg-danger text-neutral-0',
        'danger-soft': 'bg-orange-50 text-danger',
        neutral: 'bg-neutral-950 text-neutral-0 dark:bg-neutral-0 dark:text-neutral-950',
        'neutral-soft':
          'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
        warning: 'bg-yellow-600 text-neutral-0',
        'warning-soft': 'bg-yellow-50 text-yellow-600',
        success: 'bg-success text-neutral-0',
        'success-soft': 'bg-green-50 text-success',
        purple: 'bg-purple-500 text-neutral-0',

        // shadcn compatibility aliases
        secondary:
          'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
        destructive: 'bg-orange-50 text-danger',
        outline: 'border-border text-foreground',
        ghost: 'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'p-1 text-xs',
        default: 'px-2 py-[2px] text-xs',
        lg: 'px-3 py-1 text-base',
      },
      rounded: {
        default: 'rounded-full',
        sm: 'rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  size = 'default',
  rounded = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size, rounded }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
