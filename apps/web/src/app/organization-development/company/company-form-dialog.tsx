'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { z } from 'zod';
import {
  CrudDialog,
  CrudFormBridge,
  FieldWrapper,
  FormFieldLayout,
  getInputProps,
  getTextareaProps,
  getChooserProps,
  Input,
  Checkbox,
  Textarea,
  Label,
  useFormContext,
} from '@nhcs/hcm-ui';
import type { UseCrudDialogReturn } from '@nhcs/hcm-ui';
import {
  CompanyGroupChooser,
  type CompanyGroupFormValue,
  type CompanyGroupQueryParams,
  AreaChooser,
  type AreaFormValue,
  type AreaQueryParams,
} from '@nhcs/features';
import type { Company } from '@nhcs/api/src/routers/organization-development/company/company.schema';
import { toast } from 'sonner';
import { useValidateCompanyGroupCode } from './hooks/use-validate-company-group-code';

const companyFormSchema = z.object({
  companyId: z.number(),
  companyCode: z
    .string()
    .min(1, 'Company Code is required')
    .max(30, 'Company Code must be at most 30 characters')
    .regex(/^\S+$/, 'Company Code must not contain spaces')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Company Code must be alphanumeric (dashes and underscores allowed)',
    ),
  companyName: z
    .string()
    .min(1, 'Company Name is required')
    .max(80, 'Company Name must be at most 80 characters'),
  companyAlias: z
    .string()
    .min(1, 'Company Alias is required')
    .max(30, 'Company Alias must be at most 30 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Company Alias must be alphanumeric'),
  companyGroup: z
    .custom<CompanyGroupFormValue>()
    .refine((v) => v !== null && v !== undefined, 'Company Group is required'),
  address: z
    .string()
    .min(1, 'Address is required')
    .min(15, 'Address must be at least 15 characters'),
  area: z.custom<AreaFormValue>().nullable(),
  phoneNumber: z
    .string()
    .min(1, 'Phone Number is required')
    .min(10, 'Phone Number must be at least 10 digits')
    .regex(/^\d+$/, 'Phone Number must be numeric'),
  isActive: z.enum(['T', 'F']),
  additionalAttributes: z.record(z.string(), z.unknown()),
});

type CompanyForm = z.infer<typeof companyFormSchema>;

function createDefaultValues(company: Company | null): CompanyForm {
  if (!company) {
    return {
      companyId: 0,
      companyCode: '',
      companyName: '',
      companyAlias: '',
      companyGroup: null as unknown as CompanyGroupFormValue,
      address: '',
      area: null,
      phoneNumber: '',
      isActive: 'T',
      additionalAttributes: {},
    };
  }

  return {
    companyId: company.companyId,
    companyCode: company.companyCode ?? '',
    companyName: company.companyName ?? '',
    companyAlias: company.companyAlias ?? '',
    companyGroup: company.companyGroupId
      ? {
          companyGroupId: company.companyGroupId,
          companyGroupCode: company.companyGroupCode ?? '',
          companyGroupName: company.companyGroupName ?? '',
        }
      : (null as unknown as CompanyGroupFormValue),
    address: company.address ?? '',
    area: company.stateId
      ? {
          areaId: 0,
          stateId: company.stateId,
          stateName: company.stateName ?? '',
          cityId: company.cityId ?? '',
          cityName: company.cityName ?? '',
          districtId: company.districtId ?? '',
          districtName: company.districtName ?? '',
          subDistrictId: company.subDistrictId ?? '',
          subDistrictName: company.subDistrictName ?? '',
          zipCode: company.zipCode ?? '',
        }
      : null,
    phoneNumber: company.phoneNumber ?? '',
    isActive: company.isActive ?? 'T',
    additionalAttributes: (company.additionalAttributes as Record<string, unknown>) ?? {},
  };
}

function toSubmitPayload(values: CompanyForm) {
  return {
    companyId: values.companyId,
    companyCode: values.companyCode,
    companyName: values.companyName,
    companyAlias: values.companyAlias,
    companyGroupId: values.companyGroup?.companyGroupId ?? 0,
    address: values.address,
    stateId: values.area?.stateId ?? null,
    cityId: values.area?.cityId ?? null,
    districtId: values.area?.districtId ?? null,
    subDistrictId: values.area?.subDistrictId ?? null,
    zipCode: values.area?.zipCode ?? null,
    phoneNumber: values.phoneNumber,
    isActive: values.isActive,
    additionalAttributes: values.additionalAttributes,
  };
}

export interface CompanyFormDialogProps {
  crud: UseCrudDialogReturn<Company>;
}

export function CompanyFormDialog({ crud }: CompanyFormDialogProps) {
  const saveMutation = trpc.organizationDevelopment.company.save.useMutation({
    onSuccess: () => {
      toast.success(
        crud.mode === 'create' ? 'Company created successfully' : 'Company updated successfully',
      );
      crud.requestClose();
    },
    onError: (error) => toast.error(error.message || 'Failed to save company'),
  });

  if (!crud.isOpen) return null;

  return (
    <CrudDialog crud={crud} isSubmitting={saveMutation.isPending} entityName="Company">
      <CrudFormBridge
        crud={crud}
        defaultValues={createDefaultValues(crud.mode === 'create' ? null : crud.editData)}
        onSubmit={(values) => saveMutation.mutate(toSubmitPayload(values))}
        isSubmitting={saveMutation.isPending}
        validators={{ onBlur: companyFormSchema, onSubmit: companyFormSchema }}
      >
        <CompanyFormFields crud={crud} />
      </CrudFormBridge>
    </CrudDialog>
  );
}

function CompanyFormFields({ crud }: { crud: UseCrudDialogReturn<Company> }) {
  const form = useFormContext();
  const isView = crud.mode === 'view';
  const isEdit = crud.mode === 'edit';
  const isCreate = crud.mode === 'create';
  const company = crud.editData;

  const [cgQuery, setCgQuery] = useState<CompanyGroupQueryParams>({
    page: 1,
    limit: 10,
    search: '',
  });

  const [areaQuery, setAreaQuery] = useState<AreaQueryParams>({
    page: 1,
    limit: 10,
    searchBy: 'state',
    value: '',
  });

  const cgList = trpc.common.companyGroup.list.useQuery(cgQuery, { enabled: !isView });
  const areaList = trpc.common.area.list.useQuery(areaQuery, { enabled: !isView });
  const validateCompanyGroupCode = useValidateCompanyGroupCode();

  const area = form.state.values.area as AreaFormValue | null;

  return (
    <div className="space-y-4">
      {!isCreate && (
        <FormFieldLayout label="Company ID">
          <Input value={company?.companyId ?? ''} disabled />
        </FormFieldLayout>
      )}

      <form.AppField name="companyCode">
        {(field) => (
          <FieldWrapper label="Company Code" required={!isView}>
            <Input
              {...getInputProps(field, { disabled: isView || isEdit })}
              placeholder="Enter company code"
            />
          </FieldWrapper>
        )}
      </form.AppField>

      <form.AppField name="companyName">
        {(field) => (
          <FieldWrapper label="Company Name" required={!isView}>
            <Input
              {...getInputProps(field, { disabled: isView })}
              placeholder="Enter company name"
            />
          </FieldWrapper>
        )}
      </form.AppField>

      <form.AppField name="companyAlias">
        {(field) => (
          <FieldWrapper label="Company Alias" required={!isView}>
            <Input
              {...getInputProps(field, { disabled: isView })}
              placeholder="Enter company alias"
            />
          </FieldWrapper>
        )}
      </form.AppField>

      <form.AppField name="companyGroup">
        {(field) => (
          <FieldWrapper label="Company Group" required={!isView}>
            <CompanyGroupChooser
              {...getChooserProps<CompanyGroupFormValue>(field, { disabled: isView })}
              listData={cgList.data?.data ?? []}
              listCount={cgList.data?.count ?? 0}
              isLoading={cgList.isLoading}
              onQueryChange={setCgQuery}
              validateCode={validateCompanyGroupCode}
              required
            />
          </FieldWrapper>
        )}
      </form.AppField>

      <form.AppField name="address">
        {(field) => (
          <FieldWrapper label="Address" required={!isView}>
            <Textarea
              {...getTextareaProps(field, { disabled: isView })}
              placeholder="Enter address (min. 15 characters)"
              rows={3}
            />
          </FieldWrapper>
        )}
      </form.AppField>

      <form.AppField name="area">
        {(field) => (
          <FieldWrapper label="State/Area">
            <AreaChooser
              {...getChooserProps<AreaFormValue>(field, { disabled: isView })}
              listData={areaList.data?.data ?? []}
              listCount={areaList.data?.count ?? 0}
              isLoading={areaList.isLoading}
              onQueryChange={setAreaQuery}
            />
          </FieldWrapper>
        )}
      </form.AppField>

      <div className="grid grid-cols-2 gap-4">
        <FormFieldLayout label="City">
          <Input value={area?.cityName ?? ''} disabled />
        </FormFieldLayout>
        <FormFieldLayout label="District">
          <Input value={area?.districtName ?? ''} disabled />
        </FormFieldLayout>
        <FormFieldLayout label="Sub District">
          <Input value={area?.subDistrictName ?? ''} disabled />
        </FormFieldLayout>
        <FormFieldLayout label="Zip Code">
          <Input value={area?.zipCode ?? ''} disabled />
        </FormFieldLayout>
      </div>

      <form.AppField name="phoneNumber">
        {(field) => (
          <FieldWrapper label="Phone Number" required={!isView}>
            <Input
              {...getInputProps(field, { disabled: isView })}
              placeholder="Enter phone number (min. 10 digits)"
            />
          </FieldWrapper>
        )}
      </form.AppField>

      {!isCreate && (
        <FormFieldLayout label="Status">
          <div className="flex items-center gap-2 pt-1">
            <Checkbox checked={company?.isActive === 'T'} disabled />
            <Label>{company?.isActive === 'T' ? 'Active' : 'Inactive'}</Label>
          </div>
        </FormFieldLayout>
      )}

      {!isCreate && company?.onChangeDate && (
        <FormFieldLayout label="Status Changed Date">
          <Input value={company.onChangeDate} disabled />
        </FormFieldLayout>
      )}

      {!isCreate && (
        <div className="grid grid-cols-2 gap-4">
          <FormFieldLayout label="Created By">
            <Input value={company?.createdName ?? '-'} disabled />
          </FormFieldLayout>
          <FormFieldLayout label="Updated By">
            <Input value={company?.updatedName ?? '-'} disabled />
          </FormFieldLayout>
        </div>
      )}
    </div>
  );
}
