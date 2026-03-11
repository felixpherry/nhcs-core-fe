import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormBuilder } from './form-builder';
import type { FormNode } from './types';

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

      render(<FormBuilder nodes={nodes} values={DEFAULT_VALUES} onChange={() => {}} />);

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

      render(
        <FormBuilder
          nodes={nodes}
          values={{ ...DEFAULT_VALUES, firstName: 'John' }}
          onChange={() => {}}
        />,
      );

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

      render(<FormBuilder nodes={nodes} values={DEFAULT_VALUES} onChange={onChange} />);

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

      render(
        <FormBuilder
          nodes={nodes}
          values={DEFAULT_VALUES}
          errors={{ email: ['Email is required'] }}
          onChange={() => {}}
        />,
      );

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

      render(<FormBuilder nodes={nodes} values={DEFAULT_VALUES} mode="view" onChange={() => {}} />);

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

      render(<FormBuilder nodes={nodes} values={DEFAULT_VALUES} onChange={() => {}} />);

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
      ];

      render(<FormBuilder nodes={nodes} values={DEFAULT_VALUES} onChange={() => {}} />);

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
      ];

      render(<FormBuilder nodes={nodes} values={DEFAULT_VALUES} onChange={() => {}} />);

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
          config: {
            id: 'firstName',
            name: 'firstName',
            label: 'First Name',
            type: 'text',
          },
        },
        { type: 'divider' },
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

      render(<FormBuilder nodes={nodes} values={DEFAULT_VALUES} onChange={() => {}} />);

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
              config: {
                id: 'email',
                name: 'email',
                label: 'Email',
                type: 'text',
              },
            },
          ],
        },
      ];

      render(<FormBuilder nodes={nodes} values={DEFAULT_VALUES} onChange={() => {}} />);

      expect(screen.getByText('Contact Details')).toBeInTheDocument();
      expect(screen.getByText('How to reach you')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  // ── Custom nodes ──

  describe('custom nodes', () => {
    it('renders custom content with context', () => {
      const nodes: FormNode<TestForm>[] = [
        {
          type: 'custom',
          render: (ctx) => (
            <div data-testid="custom">
              Mode: {ctx.mode}, Name: {String(ctx.values.firstName)}
            </div>
          ),
        },
      ];

      render(
        <FormBuilder
          nodes={nodes}
          values={{ ...DEFAULT_VALUES, firstName: 'John' }}
          mode="edit"
          onChange={() => {}}
        />,
      );

      expect(screen.getByTestId('custom')).toHaveTextContent('Mode: edit, Name: John');
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

      render(<FormBuilder nodes={nodes} values={DEFAULT_VALUES} onChange={() => {}} />);

      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Name Card')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    });
  });
});
