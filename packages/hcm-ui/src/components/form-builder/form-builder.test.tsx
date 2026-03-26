import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormBuilder } from './form-builder';
import type { FormNode } from './types';
import { StandaloneFormProvider } from '../../contexts/form-context';

type TestForm = {
  firstName: string;
  lastName: string;
  email: string;
  age: number | null;
  bio: string;
  isActive: boolean;
};

const DEFAULT_VALUES: TestForm = {
  firstName: '',
  lastName: '',
  email: '',
  age: null,
  bio: '',
  isActive: false,
};

/** Helper: render FormBuilder inside a StandaloneFormProvider */
function renderFormBuilder(opts: {
  nodes: FormNode<TestForm>[];
  values?: TestForm;
  errors?: Record<string, string[]>;
  mode?: 'create' | 'edit' | 'view';
  onChange?: <K extends keyof TestForm>(key: K, value: TestForm[K]) => void;
  onBlur?: (name: string) => void;
}) {
  const {
    nodes,
    values = DEFAULT_VALUES,
    errors = {},
    mode = 'create',
    onChange = () => {},
    onBlur,
  } = opts;

  return render(
    <StandaloneFormProvider
      values={values}
      onChange={onChange}
      errors={errors}
      mode={mode}
      onBlur={onBlur}
    >
      <FormBuilder nodes={nodes} />
    </StandaloneFormProvider>,
  );
}

describe('FormBuilder', () => {
  // ── Field nodes ──

  describe('field nodes', () => {
    it('renders a single field', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'field',
          config: {
            id: 'firstName',
            name: 'firstName',
            label: 'First Name',
            type: 'text',
            placeholder: 'Enter first name',
          },
        },
      ];

      renderFormBuilder({ nodes });
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    });

    it('passes value from form values', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'field',
          config: {
            id: 'firstName',
            name: 'firstName',
            label: 'First Name',
            type: 'text',
          },
        },
      ];

      renderFormBuilder({ nodes, values: { ...DEFAULT_VALUES, firstName: 'John' } });
      expect(screen.getByLabelText('First Name')).toHaveValue('John');
    });

    it('calls onChange with field name and value', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const nodes: FormNode<TestForm>[] = [
        {
          type: 'field',
          config: {
            id: 'firstName',
            name: 'firstName',
            label: 'First Name',
            type: 'text',
          },
        },
      ];

      renderFormBuilder({ nodes, onChange });

      await user.type(screen.getByLabelText('First Name'), 'J');
      expect(onChange).toHaveBeenCalledWith('firstName', 'J');
    });

    it('passes errors to the field', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'field',
          config: {
            id: 'email',
            name: 'email',
            label: 'Email',
            type: 'text',
          },
        },
      ];

      renderFormBuilder({ nodes, errors: { email: ['Email is required'] } });
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('disables all fields in view mode', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'field',
          config: {
            id: 'firstName',
            name: 'firstName',
            label: 'First Name',
            type: 'text',
          },
        },
      ];

      renderFormBuilder({ nodes, mode: 'view' });
      expect(screen.getByLabelText('First Name')).toBeDisabled();
    });
  });

  // ── Section nodes ──

  describe('section nodes', () => {
    it('renders title and children', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'section',
          title: 'Personal Info',
          description: 'Basic information',
          children: [
            {
              type: 'field',
              config: {
                id: 'firstName',
                name: 'firstName',
                label: 'First Name',
                type: 'text',
              },
            },
          ],
        },
      ];

      renderFormBuilder({ nodes });
      expect(screen.getByText('Personal Info')).toBeInTheDocument();
      expect(screen.getByText('Basic information')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    });
  });

  // ── Grid nodes ──

  describe('grid nodes', () => {
    it('renders children in a grid', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'grid',
          columns: 2,
          children: [
            {
              type: 'field',
              config: { id: 'firstName', name: 'firstName', label: 'First Name', type: 'text' },
            },
            {
              type: 'field',
              config: { id: 'lastName', name: 'lastName', label: 'Last Name', type: 'text' },
            },
          ],
        },
      ];

      renderFormBuilder({ nodes });
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    });
  });

  // ── Group nodes ──

  describe('group nodes', () => {
    it('renders children in a row', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'group',
          children: [
            {
              type: 'field',
              config: { id: 'firstName', name: 'firstName', label: 'First Name', type: 'text' },
            },
            {
              type: 'field',
              config: { id: 'lastName', name: 'lastName', label: 'Last Name', type: 'text' },
            },
          ],
        },
      ];

      renderFormBuilder({ nodes });
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    });
  });

  // ── Divider nodes ──

  describe('divider nodes', () => {
    it('renders a separator', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'field',
          config: { id: 'firstName', name: 'firstName', label: 'First Name', type: 'text' },
        },
        { type: 'divider' },
        {
          type: 'field',
          config: { id: 'email', name: 'email', label: 'Email', type: 'text' },
        },
      ];

      renderFormBuilder({ nodes });
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(document.querySelector('[data-slot="separator"]')).toBeInTheDocument();
    });
  });

  // ── Card nodes ──

  describe('card nodes', () => {
    it('renders card with title and children', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'card',
          title: 'Contact Details',
          description: 'How to reach you',
          children: [
            {
              type: 'field',
              config: { id: 'email', name: 'email', label: 'Email', type: 'text' },
            },
          ],
        },
      ];

      renderFormBuilder({ nodes });
      expect(screen.getByText('Contact Details')).toBeInTheDocument();
      expect(screen.getByText('How to reach you')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  // ── Custom nodes ──

  describe('custom nodes', () => {
    it('renders custom content with full form context', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'custom',
          render: (ctx) => (
            <div data-testid="custom">
              Mode: {ctx.mode}, Name: {String(ctx.values.firstName)}, Dirty: {String(ctx.isDirty)}
            </div>
          ),
        },
      ];

      renderFormBuilder({
        nodes,
        values: { ...DEFAULT_VALUES, firstName: 'John' },
        mode: 'edit',
      });

      const el = screen.getByTestId('custom');
      expect(el).toHaveTextContent('Mode: edit, Name: John, Dirty: false');
    });

    it('custom node can access errors from context', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'custom',
          render: (ctx) => {
            const emailErrors = ctx.errors['email'] ?? [];
            return <div data-testid="custom">{emailErrors.length} errors</div>;
          },
        },
      ];

      renderFormBuilder({
        nodes,
        errors: { email: ['Required', 'Invalid format'] },
      });

      expect(screen.getByTestId('custom')).toHaveTextContent('2 errors');
    });
  });

  // ── Nested nodes ──

  describe('nested nodes', () => {
    it('renders deeply nested structure', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'section',
          title: 'Details',
          children: [
            {
              type: 'card',
              title: 'Name Card',
              children: [
                {
                  type: 'grid',
                  columns: 2,
                  children: [
                    {
                      type: 'field',
                      config: {
                        id: 'firstName',
                        name: 'firstName',
                        label: 'First Name',
                        type: 'text',
                      },
                    },
                    {
                      type: 'field',
                      config: {
                        id: 'lastName',
                        name: 'lastName',
                        label: 'Last Name',
                        type: 'text',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      renderFormBuilder({ nodes });

      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Name Card')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    });
  });

  // ── Context requirement ──

  describe('context requirement', () => {
    it('throws when used outside a provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const nodes: FormNode<TestForm>[] = [
        {
          type: 'field',
          config: { id: 'firstName', name: 'firstName', label: 'First Name', type: 'text' },
        },
      ];

      expect(() => render(<FormBuilder nodes={nodes} />)).toThrow(
        'FormBuilder must be used within <CrudFormProvider> or <StandaloneFormProvider>',
      );

      consoleSpy.mockRestore();
    });
  });
});
