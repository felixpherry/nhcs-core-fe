'use client';

import { useAppForm } from '@/components/form';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(80, 'Max 80 characters'),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(30, 'Max 30 characters')
    .regex(/^\S+$/, 'No spaces allowed'),
  notes: z.string().min(10, 'At least 10 characters'),
});

export default function TestFormPage() {
  const form = useAppForm({
    defaultValues: {
      name: '',
      code: '',
      notes: '',
    },
    validators: {
      onBlur: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">Test Form</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.AppField name="code">
          {(field) => (
            <field.InputField labelProps={{ children: 'Code' }} required placeholder="Enter code" />
          )}
        </form.AppField>

        <form.AppField name="name">
          {(field) => (
            <field.InputField labelProps={{ children: 'Name' }} required placeholder="Enter name" />
          )}
        </form.AppField>

        <form.AppField name="notes">
          {(field) => (
            <field.TextareaField
              labelProps={{ children: 'Notes' }}
              required
              placeholder="Enter notes (min 10 chars)"
              rows={4}
            />
          )}
        </form.AppField>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </form.Subscribe>
      </form>

      <form.Subscribe selector={(state) => state.values}>
        {(values) => (
          <pre className="mt-6 rounded bg-muted p-3 text-xs">{JSON.stringify(values, null, 2)}</pre>
        )}
      </form.Subscribe>
    </div>
  );
}
