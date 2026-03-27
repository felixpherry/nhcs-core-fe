'use client';

import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { useAppForm } from '@/components/form';
import { CrudDialog } from '@/components/crud-dialog';
import { Checkbox, DialogBody, Input, Label } from '@/components/ui';
import type { UseCrudDialogReturn } from '@/hooks/use-crud-dialog';
import type { Company } from '@nhcs/api/src/routers/organization-development/company/company.schema';
import type { CompanyGroup } from './company-group-chooser-table';
import { CompanyGroupChooserTable } from './company-group-chooser-table';
import type { Area } from './area-chooser-table';
import { AreaChooserTable } from './area-chooser-table';
import { useValidateCompanyGroupCode } from '../_hooks/use-validate-company-group-code';
import { toast } from 'sonner';

// ── Types ──

interface CompanyGroupValue {
  id: number;
  code: string;
  name: string;
}

interface AreaValue {
  areaId: number;
  stateId: string;
  stateName: string;
  cityId: string;
  cityName: string;
  districtId: string;
  districtName: string;
  subDistrictId: string;
  subDistrictName: string;
  zipCode: string;
}

const emptyCompanyGroup: CompanyGroupValue = { id: 0, code: '', name: '' };

const emptyArea: AreaValue = {
  areaId: 0,
  stateId: '',
  stateName: '',
  cityId: '',
  cityName: '',
  districtId: '',
  districtName: '',
  subDistrictId: '',
  subDistrictName: '',
  zipCode: '',
};

// ── Schema ──

const companyFormSchema = z.object({
  companyId: z.number(),
  companyCode: z
    .string()
    .min(1, 'Company Code is required')
    .max(30, 'Max 30 characters')
    .regex(/^\S+$/, 'No spaces allowed')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Must be alphanumeric'),
  companyName: z.string().min(1, 'Company Name is required').max(80, 'Max 80 characters'),
  companyAlias: z
    .string()
    .min(1, 'Company Alias is required')
    .max(30, 'Max 30 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Must be alphanumeric'),
  companyGroup: z
    .object({ id: z.number(), code: z.string(), name: z.string() })
    .refine((v) => v.id > 0, { message: 'Company Group is required' }),
  address: z.string().min(1, 'Address is required').min(15, 'Min 15 characters'),
  area: z.object({
    areaId: z.number(),
    stateId: z.string(),
    stateName: z.string(),
    cityId: z.string(),
    cityName: z.string(),
    districtId: z.string(),
    districtName: z.string(),
    subDistrictId: z.string(),
    subDistrictName: z.string(),
    zipCode: z.string(),
  }),
  phoneNumber: z
    .string()
    .min(1, 'Phone Number is required')
    .min(10, 'Min 10 digits')
    .regex(/^\d+$/, 'Must be numeric'),
  isActive: z.enum(['T', 'F']),
});

// ── Helpers ──

function createDefaultValues(company: Company | null) {
  if (!company) {
    return {
      companyId: 0,
      companyCode: '',
      companyName: '',
      companyAlias: '',
      companyGroup: emptyCompanyGroup,
      address: '',
      area: emptyArea,
      phoneNumber: '',
      isActive: 'T' as const,
    };
  }

  return {
    companyId: company.companyId,
    companyCode: company.companyCode ?? '',
    companyName: company.companyName ?? '',
    companyAlias: company.companyAlias ?? '',
    companyGroup: company.companyGroupId
      ? {
          id: company.companyGroupId,
          code: company.companyGroupCode ?? '',
          name: company.companyGroupName ?? '',
        }
      : emptyCompanyGroup,
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
      : emptyArea,
    phoneNumber: company.phoneNumber ?? '',
    isActive: (company.isActive ?? 'T') as 'T' | 'F',
  };
}

function toSubmitPayload(values: z.infer<typeof companyFormSchema>) {
  return {
    companyId: values.companyId,
    companyCode: values.companyCode,
    companyName: values.companyName,
    companyAlias: values.companyAlias,
    companyGroupId: values.companyGroup.id,
    address: values.address,
    stateId: values.area.stateId || null,
    cityId: values.area.cityId || null,
    districtId: values.area.districtId || null,
    subDistrictId: values.area.subDistrictId || null,
    zipCode: values.area.zipCode || null,
    phoneNumber: values.phoneNumber,
    isActive: values.isActive,
  };
}

// ── Component ──

export function CompanyFormDialog({ crud }: { crud: UseCrudDialogReturn<Company> }) {
  const isView = crud.mode === 'view';
  const isEdit = crud.mode === 'edit';
  const isCreate = crud.mode === 'create';
  const company = crud.editData;

  const validateCompanyGroupCode = useValidateCompanyGroupCode();

  const saveMutation = trpc.organizationDevelopment.company.save.useMutation({
    onSuccess: () => {
      toast.success(isCreate ? 'Company created successfully' : 'Company updated successfully');
      crud.requestClose();
    },
    onError: (error) => toast.error(error.message || 'Failed to save company'),
  });

  const form = useAppForm({
    defaultValues: createDefaultValues(isCreate ? null : company),
    validators: {
      onBlur: companyFormSchema,
      onSubmit: companyFormSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(toSubmitPayload(value));
    },
  });

  crud.syncIsDirty(form.state.isDirty);

  if (!crud.isOpen) return null;

  return (
    <CrudDialog crud={crud} isSubmitting={saveMutation.isPending} entityName="Company">
      <form
        id="crud-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <DialogBody className="space-y-4">
          {!isCreate && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Company ID</Label>
              <Input value={company?.companyId ?? ''} disabled />
            </div>
          )}

          <form.AppField name="companyCode">
            {(field) => (
              <field.InputField
                labelProps={{ children: 'Company Code' }}
                required={!isView}
                placeholder="Enter company code"
                disabled={isView || isEdit}
              />
            )}
          </form.AppField>

          <form.AppField name="companyName">
            {(field) => (
              <field.InputField
                labelProps={{ children: 'Company Name' }}
                required={!isView}
                placeholder="Enter company name"
                disabled={isView}
              />
            )}
          </form.AppField>

          <form.AppField name="companyAlias">
            {(field) => (
              <field.InputField
                labelProps={{ children: 'Company Alias' }}
                required={!isView}
                placeholder="Enter company alias"
                disabled={isView}
              />
            )}
          </form.AppField>

          <form.AppField name="companyGroup">
            {(field) => (
              <field.ChooserField<CompanyGroup, CompanyGroupValue>
                labelProps={{ children: 'Company Group' }}
                required={!isView}
                placeholder="Type code or search..."
                dialogTitle="Select Company Group"
                dialogClassName="max-w-2xl"
                empty={emptyCompanyGroup}
                getDisplay={(v) => (v.code ? `${v.code} - ${v.name}` : '')}
                getRowId={(row) => String(row.companyGroupId)}
                getValueId={(v) => String(v.id)}
                transformToValue={(row) => ({
                  id: row.companyGroupId,
                  code: row.companyGroupCode ?? '',
                  name: row.companyGroupName ?? '',
                })}
                validateInput={validateCompanyGroupCode}
                invalidMessage="Company group code not found"
                disableInput={isView}
              >
                {(ctx) => (
                  <CompanyGroupChooserTable
                    isSelected={ctx.isSelected}
                    toggleRow={ctx.toggleRow}
                    enabled={!isView}
                  />
                )}
              </field.ChooserField>
            )}
          </form.AppField>

          <form.AppField name="address">
            {(field) => (
              <field.TextareaField
                labelProps={{ children: 'Address' }}
                required={!isView}
                placeholder="Enter address (min 15 characters)"
                rows={3}
                disabled={isView}
              />
            )}
          </form.AppField>

          <form.AppField name="area">
            {(field) => (
              <field.ChooserField<Area, AreaValue>
                labelProps={{ children: 'State/Area' }}
                disableInput
                placeholder="Click to search"
                dialogTitle="Select Area"
                dialogClassName="max-w-4xl"
                empty={emptyArea}
                getDisplay={(v) =>
                  v.stateName ? `${v.stateName} - ${v.cityName} - ${v.districtName}` : ''
                }
                getRowId={(row) => String(row.areaId)}
                getValueId={(v) => String(v.areaId)}
                transformToValue={(row) => ({
                  areaId: row.areaId,
                  stateId: row.stateId ?? '',
                  stateName: row.stateName ?? '',
                  cityId: row.cityId ?? '',
                  cityName: row.cityName ?? '',
                  districtId: row.districtId ?? '',
                  districtName: row.districtName ?? '',
                  subDistrictId: row.subDistrictId ?? '',
                  subDistrictName: row.subDistrictName ?? '',
                  zipCode: row.zipCode ?? '',
                })}
              >
                {(ctx) => (
                  <AreaChooserTable
                    isSelected={ctx.isSelected}
                    toggleRow={ctx.toggleRow}
                    enabled={!isView}
                  />
                )}
              </field.ChooserField>
            )}
          </form.AppField>

          <form.Subscribe selector={(state) => state.values.area}>
            {(area) =>
              area.stateId && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">City</Label>
                    <Input value={area.cityName} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">District</Label>
                    <Input value={area.districtName} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Sub District</Label>
                    <Input value={area.subDistrictName} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Zip Code</Label>
                    <Input value={area.zipCode} disabled />
                  </div>
                </div>
              )
            }
          </form.Subscribe>

          <form.AppField name="phoneNumber">
            {(field) => (
              <field.InputField
                labelProps={{ children: 'Phone Number' }}
                required={!isView}
                placeholder="Enter phone number (min 10 digits)"
                disabled={isView}
              />
            )}
          </form.AppField>

          {!isCreate && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox checked={company?.isActive === 'T'} disabled />
                <Label>{company?.isActive === 'T' ? 'Active' : 'Inactive'}</Label>
              </div>
            </div>
          )}

          {!isCreate && company?.onChangeDate && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Status Changed Date</Label>
              <Input value={company.onChangeDate} disabled />
            </div>
          )}

          {!isCreate && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Created By</Label>
                <Input value={company?.createdName ?? '-'} disabled />
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Updated By</Label>
                <Input value={company?.updatedName ?? '-'} disabled />
              </div>
            </div>
          )}
        </DialogBody>
      </form>
    </CrudDialog>
  );
}
