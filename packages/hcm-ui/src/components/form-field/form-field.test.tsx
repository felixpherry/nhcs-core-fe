import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormField } from './form-field';
import type { FormFieldConfig } from './types';

type TestForm = {
  name: string;
  age: number | null;
  status: string;
  bio: string;
  agree: boolean;
  notify: boolean;
};

describe('FormField', () => {
  // ── Text field ──

  describe('text field', () => {
    const config: FormFieldConfig<TestForm> = {
      id: 'name',
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Enter name',
    };

    it('renders label and input', () => {
      render(<FormField config={config} value="" onChange={() => {}} onBlur={() => {}} />);

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    });

    it('calls onChange on input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FormField config={config} value="" onChange={onChange} onBlur={() => {}} />);

      await user.type(screen.getByPlaceholderText('Enter name'), 'A');
      expect(onChange).toHaveBeenCalledWith('A');
    });

    it('shows errors', () => {
      render(
        <FormField
          config={config}
          value=""
          onChange={() => {}}
          onBlur={() => {}}
          errors={['Name is required']}
        />,
      );

      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    it('shows required indicator', () => {
      const requiredConfig: FormFieldConfig<TestForm> = {
        ...config,
        required: true,
      };

      render(<FormField config={requiredConfig} value="" onChange={() => {}} onBlur={() => {}} />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('disables input when disabled', () => {
      render(<FormField config={config} value="" onChange={() => {}} onBlur={() => {}} disabled />);

      expect(screen.getByPlaceholderText('Enter name')).toBeDisabled();
    });
  });

  // ── Number field ──

  describe('number field', () => {
    const config: FormFieldConfig<TestForm> = {
      id: 'age',
      name: 'age',
      label: 'Age',
      type: 'number',
      placeholder: 'Enter age',
      min: 0,
      max: 150,
    };

    it('renders number input', () => {
      render(<FormField config={config} value={25} onChange={() => {}} onBlur={() => {}} />);

      const input = screen.getByPlaceholderText('Enter age');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveValue(25);
    });

    it('converts empty to null', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FormField config={config} value={25} onChange={onChange} onBlur={() => {}} />);

      const input = screen.getByPlaceholderText('Enter age');
      await user.clear(input);
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });

  // ── Select field ──

  describe('select field', () => {
    const config: FormFieldConfig<TestForm> = {
      id: 'status',
      name: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'Choose status',
      options: [
        { label: 'Active', value: 'T' },
        { label: 'Inactive', value: 'F' },
      ],
    };

    it('renders select with label', () => {
      render(<FormField config={config} value="" onChange={() => {}} onBlur={() => {}} />);

      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  // ── Checkbox field ──

  describe('checkbox field', () => {
    const config: FormFieldConfig<TestForm> = {
      id: 'agree',
      name: 'agree',
      label: 'Agreement',
      type: 'checkbox',
      checkboxLabel: 'I agree to the terms',
    };

    it('renders checkbox with label', () => {
      render(<FormField config={config} value={false} onChange={() => {}} onBlur={() => {}} />);

      expect(screen.getByText('Agreement')).toBeInTheDocument();
      expect(screen.getByText('I agree to the terms')).toBeInTheDocument();
    });

    it('calls onChange on check', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<FormField config={config} value={false} onChange={onChange} onBlur={() => {}} />);

      await user.click(screen.getByRole('checkbox'));
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  // ── Textarea field ──

  describe('textarea field', () => {
    const config: FormFieldConfig<TestForm> = {
      id: 'bio',
      name: 'bio',
      label: 'Bio',
      type: 'textarea',
      placeholder: 'Tell us about yourself',
      rows: 5,
    };

    it('renders textarea', () => {
      render(<FormField config={config} value="" onChange={() => {}} onBlur={() => {}} />);

      const textarea = screen.getByPlaceholderText('Tell us about yourself');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('rows', '5');
    });
  });

  // ── Conditional visibility ──

  describe('conditional visibility', () => {
    it('hides field when visibleWhen returns false', () => {
      const config: FormFieldConfig<TestForm> = {
        id: 'bio',
        name: 'bio',
        label: 'Bio',
        type: 'textarea',
        visibleWhen: (values) => values.status === 'T',
      };

      const { container } = render(
        <FormField
          config={config}
          value=""
          onChange={() => {}}
          onBlur={() => {}}
          formValues={{ name: '', age: null, status: 'F', bio: '', agree: false, notify: false }}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('shows field when visibleWhen returns true', () => {
      const config: FormFieldConfig<TestForm> = {
        id: 'bio',
        name: 'bio',
        label: 'Bio',
        type: 'textarea',
        visibleWhen: (values) => values.status === 'T',
      };

      render(
        <FormField
          config={config}
          value=""
          onChange={() => {}}
          onBlur={() => {}}
          formValues={{ name: '', age: null, status: 'T', bio: '', agree: false, notify: false }}
        />,
      );

      expect(screen.getByText('Bio')).toBeInTheDocument();
    });
  });

  // ── Conditional required ──

  describe('conditional required', () => {
    it('shows required indicator when requiredWhen returns true', () => {
      const config: FormFieldConfig<TestForm> = {
        id: 'bio',
        name: 'bio',
        label: 'Bio',
        type: 'textarea',
        requiredWhen: (values) => values.status === 'T',
      };

      render(
        <FormField
          config={config}
          value=""
          onChange={() => {}}
          onBlur={() => {}}
          formValues={{ name: '', age: null, status: 'T', bio: '', agree: false, notify: false }}
        />,
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  // ── Custom field ──

  describe('custom field', () => {
    it('renders custom content', () => {
      const config: FormFieldConfig<TestForm> = {
        id: 'name',
        name: 'name',
        label: 'Custom Name',
        type: 'custom',
        render: ({ value, onChange }) => (
          <div data-testid="custom-field">
            Custom: {String(value)}
            <button onClick={() => onChange('clicked')}>Click</button>
          </div>
        ),
      };

      render(<FormField config={config} value="hello" onChange={() => {}} onBlur={() => {}} />);

      expect(screen.getByTestId('custom-field')).toBeInTheDocument();
      expect(screen.getByText('Custom: hello')).toBeInTheDocument();
    });
  });

  // ── Description ──

  describe('description', () => {
    it('renders description text', () => {
      const config: FormFieldConfig<TestForm> = {
        id: 'name',
        name: 'name',
        label: 'Name',
        type: 'text',
        description: 'Enter your full legal name',
      };

      render(<FormField config={config} value="" onChange={() => {}} onBlur={() => {}} />);

      expect(screen.getByText('Enter your full legal name')).toBeInTheDocument();
    });
  });
});
