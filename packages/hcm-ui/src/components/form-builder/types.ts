import type { ReactNode } from 'react';
import type { FormFieldConfig } from '../form-field/types';

// ── Node types ──

export interface FieldNode<TForm extends Record<string, unknown>> {
  type: 'field';
  config: FormFieldConfig<TForm>;
}

export interface SectionNode<TForm extends Record<string, unknown>> {
  type: 'section';
  title: string;
  description?: string;
  children: FormNode<TForm>[];
}

export interface GridNode<TForm extends Record<string, unknown>> {
  type: 'grid';
  columns: 1 | 2 | 3 | 4;
  children: FormNode<TForm>[];
}

export interface GroupNode<TForm extends Record<string, unknown>> {
  type: 'group';
  children: FormNode<TForm>[];
}

export interface DividerNode {
  type: 'divider';
}

export interface CardNode<TForm extends Record<string, unknown>> {
  type: 'card';
  title?: string;
  description?: string;
  children: FormNode<TForm>[];
}

export interface CustomNode<TForm extends Record<string, unknown>> {
  type: 'custom';
  render: (ctx: FormBuilderContext<TForm>) => ReactNode;
}

// ── Union ──

export type FormNode<TForm extends Record<string, unknown>> =
  | FieldNode<TForm>
  | SectionNode<TForm>
  | GridNode<TForm>
  | GroupNode<TForm>
  | DividerNode
  | CardNode<TForm>
  | CustomNode<TForm>;

// ── Context passed to custom nodes ──

export interface FormBuilderContext<TForm extends Record<string, unknown>> {
  values: TForm;
  mode: 'create' | 'edit' | 'view';
  setValue: <K extends keyof TForm>(key: K, value: TForm[K]) => void;
}
