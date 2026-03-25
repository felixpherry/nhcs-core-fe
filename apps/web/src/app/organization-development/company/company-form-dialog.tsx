'use client';

import { useState, useCallback } from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
  Label,
  Checkbox,
  Textarea,
  ConfirmDialog,
  cn,
} from '@nhcs/hcm-ui';
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

// ── Types ──

export type FormMode = 'add' | 'edit' | 'view';

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

// ── Field wrapper ──

function FormFieldWrapper({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label className={cn(required && "after:content-['*'] after:text-destructive")}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
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
  const isAdd = mode === 'add';

  // ── Dirty close protection state ──

  const [showDirtyConfirm, setShowDirtyConfirm] = useState(false);

  // ── Chooser display state (separate from form values) ──

  const [companyGroup, setCompanyGroup] = useState<CompanyGroupFormValue | null>(
    companyToCompanyGroup(company),
  );
  const [area, setArea] = useState<AreaFormValue | null>(companyToArea(company));

  // ── TanStack Form ──

  const form = useForm({
    defaultValues: createDefaultValues(company),
    validators: {
      onSubmit: companyFormSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  // ── Reset when dialog opens with new data ──
  // TanStack Form doesn't have a built-in reset on prop change,
  // so we key the dialog content on open+company to remount

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
    enabled: open,
  });
  const areaList = trpc.common.area.list.useQuery(areaQuery, {
    enabled: open,
  });

  // ── Save mutation ──

  const saveMutation = trpc.organizationDevelopment.company.save.useMutation({
    onSuccess: () => {
      toast.success(isAdd ? 'Company created successfully' : 'Company updated successfully');
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save company');
    },
  });

  // ── Validate company group code ──

  const utils = trpc.useUtils();
  const validateCompanyGroupCode = useCallback(
    async (code: string): Promise<CompanyGroupFormValue | null> => {
      try {
        const result = await utils.common.companyGroup.list.fetch({
          page: 1,
          limit: 2,
          search: code,
        });

        const exactMatch = result.data.find((item) => item.companyGroupCode === code);
        if (!exactMatch) return null;

        return {
          companyGroupId: exactMatch.companyGroupId,
          companyGroupCode: exactMatch.companyGroupCode ?? '',
          companyGroupName: exactMatch.companyGroupName ?? '',
        };
      } catch {
        return null;
      }
    },
    [utils],
  );

  // ── Close handler with dirty check (5c) ──

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isView && form.state.isDirty) {
        setShowDirtyConfirm(true);
        return;
      }
      onOpenChange(nextOpen);
    },
    [isView, form.state.isDirty, onOpenChange],
  );

  const handleForceClose = useCallback(() => {
    setShowDirtyConfirm(false);
    form.reset();
    onOpenChange(false);
  }, [form, onOpenChange]);

  // ── Dialog title ──

  const title = mode === 'add' ? 'Add Company' : mode === 'edit' ? 'Edit Company' : 'View Company';

  // Remount form content when company changes
  const formKey = company ? `${company.companyId}-${mode}` : `new-${mode}`;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" key={formKey}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {isAdd
                ? 'Fill in the details to create a new company.'
                : isEdit
                  ? 'Update the company details.'
                  : 'View company details.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* ── Company ID (edit/view only) ── */}
            {!isAdd && (
              <FormFieldWrapper label="Company ID">
                <Input value={company?.companyId ?? ''} disabled />
              </FormFieldWrapper>
            )}

            {/* ── Company Code ── */}
            <form.Field name="companyCode">
              {(field) => (
                <FormFieldWrapper
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
                </FormFieldWrapper>
              )}
            </form.Field>

            {/* ── Company Name ── */}
            <form.Field name="companyName">
              {(field) => (
                <FormFieldWrapper
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
                </FormFieldWrapper>
              )}
            </form.Field>

            {/* ── Company Alias ── */}
            <form.Field name="companyAlias">
              {(field) => (
                <FormFieldWrapper
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
                </FormFieldWrapper>
              )}
            </form.Field>

            {/* ── Company Group (ChooserField) ── */}
            <form.Field name="companyGroupId">
              {(field) => (
                <FormFieldWrapper
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
                </FormFieldWrapper>
              )}
            </form.Field>

            {/* ── Address ── */}
            <form.Field name="address">
              {(field) => (
                <FormFieldWrapper
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
                </FormFieldWrapper>
              )}
            </form.Field>

            {/* ── State/Area (ChooserField) ── */}
            <FormFieldWrapper label="State/Area">
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
            </FormFieldWrapper>

            {/* ── Cascading fields (auto-filled from Area) ── */}
            <div className="grid grid-cols-2 gap-4">
              <FormFieldWrapper label="City">
                <Input value={area?.cityName ?? ''} disabled />
              </FormFieldWrapper>

              <FormFieldWrapper label="District">
                <Input value={area?.districtName ?? ''} disabled />
              </FormFieldWrapper>

              <FormFieldWrapper label="Sub District">
                <Input value={area?.subDistrictName ?? ''} disabled />
              </FormFieldWrapper>

              <FormFieldWrapper label="Zip Code">
                <Input value={area?.zipCode ?? ''} disabled />
              </FormFieldWrapper>
            </div>

            {/* ── Phone Number ── */}
            <form.Field name="phoneNumber">
              {(field) => (
                <FormFieldWrapper
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
                </FormFieldWrapper>
              )}
            </form.Field>

            {/* ── Status (edit/view only) ── */}
            {!isAdd && (
              <FormFieldWrapper label="Status">
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox checked={company?.isActive === 'T'} disabled />
                  <span className="text-sm">
                    {company?.isActive === 'T' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </FormFieldWrapper>
            )}

            {/* ── Status Changed Date (edit/view only) ── */}
            {!isAdd && company?.onChangeDate && (
              <FormFieldWrapper label="Status Changed Date">
                <Input value={company.onChangeDate} disabled />
              </FormFieldWrapper>
            )}

            {/* ── Audit fields (edit/view only) ── */}
            {!isAdd && (
              <div className="grid grid-cols-2 gap-4">
                <FormFieldWrapper label="Created By">
                  <Input value={company?.createdName ?? '-'} disabled />
                </FormFieldWrapper>
                <FormFieldWrapper label="Updated By">
                  <Input value={company?.updatedName ?? '-'} disabled />
                </FormFieldWrapper>
              </div>
            )}

            {/* ── Footer ── */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                {isView ? 'Close' : 'Cancel'}
              </Button>
              {!isView && (
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
                      {isSubmitting || saveMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </form.Subscribe>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 5c: Dirty close protection ── */}
      <ConfirmDialog
        open={showDirtyConfirm}
        onOpenChange={setShowDirtyConfirm}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to close? Your changes will be lost."
        variant="destructive"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        onConfirm={handleForceClose}
      />
    </>
  );
}
