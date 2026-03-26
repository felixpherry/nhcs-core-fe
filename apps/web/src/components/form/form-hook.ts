import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from './form-context';
import { InputField } from './fields/input-field';
import { TextareaField } from './fields/textarea-field';
import { SelectField } from './fields/select-field';

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    InputField,
    TextareaField,
    SelectField,
  },
  formComponents: {},
  fieldContext,
  formContext,
});
