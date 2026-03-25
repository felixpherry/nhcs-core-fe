'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { CrudDialog, Input, Checkbox, Textarea, FormFieldLayout } from '@nhcs/hcm-ui';
import type { FormMode } from '@nhcs/hcm-ui';
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

// ── Re-export FormMode for company-list.tsx ──

export type { FormMode } from '@nhcs/hcm-ui';

// ── Zod schema ──

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
  companyGroupId: z
    .number({ message: 'Company Group is required' })
    .min(1, 'Company Group is required'),
  address: z
    .string()
    .min(1, 'Address is required')
    .min(15, 'Address must be at least 15 characters'),
  stateId: z.string().nullable(),
  cityId: z.string().nullable(),
  districtId: z.string().nullable(),
  subDistrictId: z.string().nullable(),
  zipCode: z.string().nullable(),
  phoneNumber: z
    .string()
    .min(1, 'Phone Number is required')
    .min(10, 'Phone Number must be at least 10 digits')
    .regex(/^\d+$/, 'Phone Number must be numeric'),
  isActive: z.enum(['T', 'F']),
  additionalAttributes: z.record(z.string(), z.unknown()),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

// ── Helpers ──

function createDefaultValues(company: Company | null): CompanyFormValues {
  if (!company) {
    return {
      companyId: 0,
      companyCode: '',
      companyName: '',
      companyAlias: '',
      companyGroupId: 0,
      address: '',
      stateId: null,
      cityId: null,
      districtId: null,
      subDistrictId: null,
      zipCode: null,
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
    companyGroupId: company.companyGroupId ?? 0,
    address: company.address ?? '',
    stateId: company.stateId,
    cityId: company.cityId,
    districtId: company.districtId,
    subDistrictId: company.subDistrictId,
    zipCode: company.zipCode,
    phoneNumber: company.phoneNumber ?? '',
    isActive: company.isActive ?? 'T',
    additionalAttributes: (company.additionalAttributes as Record<string, unknown>) ?? {},
  };
}

function companyToCompanyGroup(company: Company | null): CompanyGroupFormValue | null {
  if (!company?.companyGroupId) return null;
  return {
    companyGroupId: company.companyGroupId,
    companyGroupCode: company.companyGroupCode ?? '',
    companyGroupName: company.companyGroupName ?? '',
  };
}

function companyToArea(company: Company | null): AreaFormValue | null {
  if (!company?.stateId) return null;
  return {
    areaId: 0,
    stateId: company.stateId ?? '',
    stateName: company.stateName ?? '',
    cityId: company.cityId ?? '',
    cityName: company.cityName ?? '',
    districtId: company.districtId ?? '',
    districtName: company.districtName ?? '',
    subDistrictId: company.subDistrictId ?? '',
    subDistrictName: company.subDistrictName ?? '',
    zipCode: company.zipCode ?? '',
  };
}

// ── Props ──

export interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormMode;
  company: Company | null;
  onSuccess: () => void;
}

// ── Component ──

export function CompanyFormDialog({
  open,
  onOpenChange,
  mode,
  company,
  onSuccess,
}: CompanyFormDialogProps) {
  const isView = mode === 'view';
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  // ── Chooser display state ──

  const [companyGroup, setCompanyGroup] = useState<CompanyGroupFormValue | null>(
    companyToCompanyGroup(company),
  );
  const [area, setArea] = useState<AreaFormValue | null>(companyToArea(company));

  // ── TanStack Form ──

  const form = useForm({
    defaultValues: createDefaultValues(company),
    validators: {
      onBlur: companyFormSchema,
      onSubmit: companyFormSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  // ── Chooser query states ──

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

  const cgList = trpc.common.companyGroup.list.useQuery(cgQuery, {
    enabled: open && !isView,
  });
  const areaList = trpc.common.area.list.useQuery(areaQuery, {
    enabled: open && !isView,
  });

  // ── Save mutation ──

  const saveMutation = trpc.organizationDevelopment.company.save.useMutation({
    onSuccess: () => {
      toast.success(isCreate ? 'Company created successfully' : 'Company updated successfully');
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save company');
    },
  });

  // ── Validate company group code ──

  const validateCompanyGroupCode = useValidateCompanyGroupCode();

  return (
    <CrudDialog
      isOpen={open}
      mode={mode}
      entityName="Company"
      isDirty={form.state.isDirty}
      isSubmitting={saveMutation.isPending}
      onClose={() => onOpenChange(false)}
      onForceClose={() => onOpenChange(false)}
      onSubmit={() => form.handleSubmit()}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {/* ── Company ID (edit/view only) ── */}
        {!isCreate && (
          <FormFieldLayout label="Company ID">
            <Input value={company?.companyId ?? ''} disabled />
          </FormFieldLayout>
        )}

        {/* ── Company Code ── */}
        <form.Field name="companyCode">
          {(field) => (
            <FormFieldLayout
              label="Company Code"
              required={!isView}
              error={field.state.meta.errors?.[0]?.toString()}
            >
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isView || isEdit}
                placeholder="Enter company code"
              />
            </FormFieldLayout>
          )}
        </form.Field>

        {/* ── Company Name ── */}
        <form.Field name="companyName">
          {(field) => (
            <FormFieldLayout
              label="Company Name"
              required={!isView}
              error={field.state.meta.errors?.[0]?.toString()}
            >
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isView}
                placeholder="Enter company name"
              />
            </FormFieldLayout>
          )}
        </form.Field>

        {/* ── Company Alias ── */}
        <form.Field name="companyAlias">
          {(field) => (
            <FormFieldLayout
              label="Company Alias"
              required={!isView}
              error={field.state.meta.errors?.[0]?.toString()}
            >
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isView}
                placeholder="Enter company alias"
              />
            </FormFieldLayout>
          )}
        </form.Field>

        {/* ── Company Group (ChooserField) ── */}
        <form.Field name="companyGroupId">
          {(field) => (
            <FormFieldLayout
              label="Company Group"
              required={!isView}
              error={field.state.meta.errors?.[0]?.toString()}
            >
              <CompanyGroupChooser
                value={companyGroup}
                onChange={(val) => {
                  setCompanyGroup(val);
                  field.handleChange(val?.companyGroupId ?? 0);
                }}
                listData={cgList.data?.data ?? []}
                listCount={cgList.data?.count ?? 0}
                isLoading={cgList.isLoading}
                onQueryChange={setCgQuery}
                validateCode={validateCompanyGroupCode}
                disabled={isView}
                required
              />
            </FormFieldLayout>
          )}
        </form.Field>

        {/* ── Address ── */}
        <form.Field name="address">
          {(field) => (
            <FormFieldLayout
              label="Address"
              required={!isView}
              error={field.state.meta.errors?.[0]?.toString()}
            >
              <Textarea
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isView}
                placeholder="Enter address (min. 15 characters)"
                rows={3}
              />
            </FormFieldLayout>
          )}
        </form.Field>

        {/* ── State/Area (ChooserField) ── */}
        <FormFieldLayout label="State/Area">
          <AreaChooser
            value={area}
            onChange={(val) => {
              setArea(val);
              form.setFieldValue('stateId', val?.stateId ?? null);
              form.setFieldValue('cityId', val?.cityId ?? null);
              form.setFieldValue('districtId', val?.districtId ?? null);
              form.setFieldValue('subDistrictId', val?.subDistrictId ?? null);
              form.setFieldValue('zipCode', val?.zipCode ?? null);
            }}
            listData={areaList.data?.data ?? []}
            listCount={areaList.data?.count ?? 0}
            isLoading={areaList.isLoading}
            onQueryChange={setAreaQuery}
            disabled={isView}
          />
        </FormFieldLayout>

        {/* ── Cascading fields (auto-filled from Area) ── */}
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

        {/* ── Phone Number ── */}
        <form.Field name="phoneNumber">
          {(field) => (
            <FormFieldLayout
              label="Phone Number"
              required={!isView}
              error={field.state.meta.errors?.[0]?.toString()}
            >
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isView}
                placeholder="Enter phone number (min. 10 digits)"
              />
            </FormFieldLayout>
          )}
        </form.Field>

        {/* ── Status (edit/view only) ── */}
        {!isCreate && (
          <FormFieldLayout label="Status">
            <div className="flex items-center gap-2 pt-1">
              <Checkbox checked={company?.isActive === 'T'} disabled />
              <span className="text-sm">{company?.isActive === 'T' ? 'Active' : 'Inactive'}</span>
            </div>
          </FormFieldLayout>
        )}

        {/* ── Status Changed Date (edit/view only) ── */}
        {!isCreate && company?.onChangeDate && (
          <FormFieldLayout label="Status Changed Date">
            <Input value={company.onChangeDate} disabled />
          </FormFieldLayout>
        )}

        {/* ── Audit fields (edit/view only) ── */}
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
      </form>
    </CrudDialog>
  );
}
