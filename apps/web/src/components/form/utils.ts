import type { AnyFieldApi } from '@tanstack/react-form';

export function getErrorMessages(field: AnyFieldApi): string[] {
  if (!field.state.meta.isTouched) return [];
  return field.state.meta.errors.map((e) => (typeof e === 'string' ? e : e.message));
}
