import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from './form-context';
import { InputField } from './fields/input-field';
import { TextareaField } from './fields/textarea-field';
import { SelectField } from './fields/select-field';
import { ChooserField } from './fields/chooser-field';

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    InputField,
    TextareaField,
    SelectField,
    ChooserField,
  },
  formComponents: {},
  fieldContext,
  formContext,
});
