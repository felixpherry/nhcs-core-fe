'use client';

import type { ReactNode } from 'react';
import { FormField } from '../form-field/form-field';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { FormNode } from './types';
import type { FormContextValue } from '../../contexts/form-context';
import { useFormContext } from '../../contexts/form-context';
import { cn } from '../../lib/utils';

export interface FormBuilderProps<TForm extends Record<string, unknown>> {
  nodes: FormNode<TForm>[];
}

export function FormBuilder<TForm extends Record<string, unknown>>(props: FormBuilderProps<TForm>) {
  const { nodes } = props;
  const ctx = useFormContext<TForm>();

  return <>{nodes.map((node, i) => renderNode(node, i, ctx))}</>;
}

function renderNode<TForm extends Record<string, unknown>>(
  node: FormNode<TForm>,
  index: number,
  ctx: FormContextValue<TForm>,
): ReactNode {
  switch (node.type) {
    case 'field':
      return (
        <FormField
          key={node.config.id}
          config={node.config}
          value={ctx.values[node.config.name]}
          onChange={(val) => ctx.setFieldValue(node.config.name, val as TForm[keyof TForm])}
          onBlur={() => ctx.onBlur?.(node.config.name)}
          errors={ctx.errors[node.config.name]}
          disabled={ctx.isLoading || ctx.mode === 'view'}
          readOnly={ctx.mode === 'view'}
          formValues={ctx.values}
        />
      );

    case 'section':
      return (
        <div key={`section-${index}`} className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{node.title}</h3>
            {node.description && (
              <p className="text-sm text-muted-foreground">{node.description}</p>
            )}
          </div>
          {node.children.map((child, i) => renderNode(child, i, ctx))}
        </div>
      );

    case 'grid':
      return (
        <div
          key={`grid-${index}`}
          className={cn('grid gap-4', {
            'grid-cols-1': node.columns === 1,
            'grid-cols-2': node.columns === 2,
            'grid-cols-3': node.columns === 3,
            'grid-cols-4': node.columns === 4,
          })}
        >
          {node.children.map((child, i) => renderNode(child, i, ctx))}
        </div>
      );

    case 'group':
      return (
        <div key={`group-${index}`} className="flex gap-4">
          {node.children.map((child, i) => (
            <div key={i} className="flex-1">
              {renderNode(child, i, ctx)}
            </div>
          ))}
        </div>
      );

    case 'divider':
      return <Separator key={`divider-${index}`} className="my-4" />;

    case 'card':
      return (
        <Card key={`card-${index}`}>
          {(node.title || node.description) && (
            <CardHeader>
              {node.title && <CardTitle>{node.title}</CardTitle>}
              {node.description && <CardDescription>{node.description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent className="space-y-4">
            {node.children.map((child, i) => renderNode(child, i, ctx))}
          </CardContent>
        </Card>
      );

    case 'custom':
      return <div key={`custom-${index}`}>{node.render(ctx)}</div>;

    default:
      return null;
  }
}
