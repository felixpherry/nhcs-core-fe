'use client';

import type { ReactNode } from 'react';
import { FormField } from '../form-field/form-field';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import type { FormNode, FormBuilderContext } from './types';
import { cn } from '../../lib/utils';

// ── Props ──

export interface FormBuilderProps<TForm extends Record<string, unknown>> {
  nodes: FormNode<TForm>[];
  values: TForm;
  errors?: Record<string, string[]>;
  mode?: 'create' | 'edit' | 'view';
  disabled?: boolean;
  onChange: <K extends keyof TForm>(key: K, value: TForm[K]) => void;
  onBlur?: (name: string) => void;
}

// ── Component ──

export function FormBuilder<TForm extends Record<string, unknown>>(props: FormBuilderProps<TForm>) {
  const { nodes, values, errors = {}, mode = 'create', disabled = false, onChange, onBlur } = props;

  const ctx: FormBuilderContext<TForm> = {
    values,
    mode,
    setValue: onChange,
  };

  return <>{nodes.map((node, i) => renderNode(node, i, ctx, props))}</>;
}

// ── Recursive node renderer ──

function renderNode<TForm extends Record<string, unknown>>(
  node: FormNode<TForm>,
  index: number,
  ctx: FormBuilderContext<TForm>,
  props: FormBuilderProps<TForm>,
): ReactNode {
  switch (node.type) {
    case 'field':
      return (
        <FormField
          key={node.config.id}
          config={node.config}
          value={props.values[node.config.name]}
          onChange={(val) => props.onChange(node.config.name, val as TForm[keyof TForm])}
          onBlur={() => props.onBlur?.(node.config.name)}
          errors={props.errors?.[node.config.name]}
          disabled={props.disabled || props.mode === 'view'}
          readOnly={props.mode === 'view'}
          formValues={props.values}
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
          {node.children.map((child, i) => renderNode(child, i, ctx, props))}
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
          {node.children.map((child, i) => renderNode(child, i, ctx, props))}
        </div>
      );

    case 'group':
      return (
        <div key={`group-${index}`} className="flex gap-4">
          {node.children.map((child, i) => (
            <div key={i} className="flex-1">
              {renderNode(child, i, ctx, props)}
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
            {node.children.map((child, i) => renderNode(child, i, ctx, props))}
          </CardContent>
        </Card>
      );

    case 'custom':
      return <div key={`custom-${index}`}>{node.render(ctx)}</div>;

    default:
      return null;
  }
}
