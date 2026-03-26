import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui';

export type ListOfErrors = Array<string | null | undefined> | null | undefined;

export function ErrorList({ id, errors }: { id?: string; errors?: ListOfErrors }) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) return null;
  return (
    <ul id={id} className="flex flex-col gap-1">
      {errorsToRender.map((e) => (
        <li key={e} className="text-sm text-destructive">
          {e}
        </li>
      ))}
    </ul>
  );
}

export function BaseField({
  id,
  labelProps,
  required,
  children,
  errors,
  description,
  className,
}: {
  id: string;
  labelProps?: React.ComponentProps<typeof Label>;
  required?: boolean;
  children: ReactNode;
  errors?: ListOfErrors;
  description?: string;
  className?: string;
}) {
  const errorId = errors?.length ? `${id}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {labelProps && (
        <Label
          htmlFor={id}
          {...labelProps}
          className={cn(
            labelProps.className,
            required && "after:content-['_*'] after:text-destructive",
          )}
        />
      )}
      {children}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {errorId && <ErrorList id={errorId} errors={errors} />}
    </div>
  );
}
