'use client';

import { useReducer, useCallback, useState, useEffect } from 'react';
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

interface CompanyFormData {
  companyId: number;
  companyCode: string;
  companyName: string;
  companyAlias: string;
  companyGroupId: number | null;
  address: string;
  stateId: string | null;
  cityId: string | null;
  districtId: string | null;
  subDistrictId: string | null;
  zipCode: string | null;
  phoneNumber: string;
  isActive: 'T' | 'F';
  additionalAttributes: Record<string, unknown>;
}

interface CompanyFormState {
  data: CompanyFormData;
  companyGroup: CompanyGroupFormValue | null;
  area: AreaFormValue | null;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

// ── Reducer ──

type FormAction =
  | { type: 'SET_FIELD'; name: keyof CompanyFormData; value: unknown }
  | { type: 'SET_COMPANY_GROUP'; value: CompanyGroupFormValue | null }
  | { type: 'SET_AREA'; value: AreaFormValue | null }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'CLEAR_ERROR'; name: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }
  | { type: 'RESET'; state: CompanyFormState };

function formReducer(state: CompanyFormState, action: FormAction): CompanyFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        data: { ...state.data, [action.name]: action.value },
        errors: { ...state.errors, [action.name]: '' },
      };
    case 'SET_COMPANY_GROUP':
      return {
        ...state,
        companyGroup: action.value,
        data: {
          ...state.data,
          companyGroupId: action.value?.companyGroupId ?? null,
        },
        errors: { ...state.errors, companyGroupId: '' },
      };
    case 'SET_AREA':
      return {
        ...state,
        area: action.value,
        data: {
          ...state.data,
          stateId: action.value?.stateId ?? null,
          cityId: action.value?.cityId ?? null,
          districtId: action.value?.districtId ?? null,
          subDistrictId: action.value?.subDistrictId ?? null,
          zipCode: action.value?.zipCode ?? null,
        },
        errors: { ...state.errors, stateId: '' },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'CLEAR_ERROR':
      return { ...state, errors: { ...state.errors, [action.name]: '' } };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_END':
      return { ...state, isSubmitting: false };
    case 'RESET':
      return action.state;
    default:
      return state;
  }
}

// ── Helpers ──

function createEmptyFormState(): CompanyFormState {
  return {
    data: {
      companyId: 0,
      companyCode: '',
      companyName: '',
      companyAlias: '',
      companyGroupId: null,
      address: '',
      stateId: null,
      cityId: null,
      districtId: null,
      subDistrictId: null,
      zipCode: null,
      phoneNumber: '',
      isActive: 'T',
      additionalAttributes: {},
    },
    companyGroup: null,
    area: null,
    errors: {},
    isSubmitting: false,
  };
}

function companyToFormState(company: Company): CompanyFormState {
  return {
    data: {
      companyId: company.companyId,
      companyCode: company.companyCode ?? '',
      companyName: company.companyName ?? '',
      companyAlias: company.companyAlias ?? '',
      companyGroupId: company.companyGroupId,
      address: company.address ?? '',
      stateId: company.stateId,
      cityId: company.cityId,
      districtId: company.districtId,
      subDistrictId: company.subDistrictId,
      zipCode: company.zipCode,
      phoneNumber: company.phoneNumber ?? '',
      isActive: company.isActive ?? 'T',
      additionalAttributes: (company.additionalAttributes as Record<string, unknown>) ?? {},
    },
    companyGroup: company.companyGroupId
      ? {
          companyGroupId: company.companyGroupId,
          companyGroupCode: company.companyGroupCode ?? '',
          companyGroupName: company.companyGroupName ?? '',
        }
      : null,
    area: company.stateId
      ? {
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
        }
      : null,
    errors: {},
    isSubmitting: false,
  };
}

function validate(data: CompanyFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  // Company Code: required | no_space | max:30 | code pattern (alphanumeric + dash/underscore)
  if (!data.companyCode.trim()) {
    errors.companyCode = 'Company Code is required';
  } else if (/\s/.test(data.companyCode)) {
    errors.companyCode = 'Company Code must not contain spaces';
  } else if (data.companyCode.length > 30) {
    errors.companyCode = 'Company Code must be at most 30 characters';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(data.companyCode)) {
    errors.companyCode = 'Company Code must be alphanumeric (dashes and underscores allowed)';
  }

  // Company Name: required | max:80
  if (!data.companyName.trim()) {
    errors.companyName = 'Company Name is required';
  } else if (data.companyName.length > 80) {
    errors.companyName = 'Company Name must be at most 80 characters';
  }

  // Company Alias: required | alphanumeric | max:30
  if (!data.companyAlias.trim()) {
    errors.companyAlias = 'Company Alias is required';
  } else if (!/^[a-zA-Z0-9]+$/.test(data.companyAlias)) {
    errors.companyAlias = 'Company Alias must be alphanumeric';
  } else if (data.companyAlias.length > 30) {
    errors.companyAlias = 'Company Alias must be at most 30 characters';
  }

  // Company Group: required
  if (data.companyGroupId === null || data.companyGroupId === 0) {
    errors.companyGroupId = 'Company Group is required';
  }

  // Address: required | min:15
  if (!data.address.trim()) {
    errors.address = 'Address is required';
  } else if (data.address.trim().length < 15) {
    errors.address = 'Address must be at least 15 characters';
  }

  // Phone Number: required | numeric | min:10
  if (!data.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone Number is required';
  } else if (!/^\d+$/.test(data.phoneNumber)) {
    errors.phoneNumber = 'Phone Number must be numeric';
  } else if (data.phoneNumber.length < 10) {
    errors.phoneNumber = 'Phone Number must be at least 10 digits';
  }

  return errors;
}

// ── Props ──

export interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormMode;
  /** Company data for edit/view mode. Null for add mode. */
  company: Company | null;
  /** Called after successful save */
  onSuccess: () => void;
}

// ── Field component (reduces repetition) ──

function FormField({
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
    <div className={className}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
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

  // ── Form state ──

  const [state, dispatch] = useReducer(
    formReducer,
    company ? companyToFormState(company) : createEmptyFormState(),
  );

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      dispatch({
        type: 'RESET',
        state: company ? companyToFormState(company) : createEmptyFormState(),
      });
    }
  }, [open, company]);

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

  // ── Submit handler ──

  const handleSubmit = useCallback(() => {
    const errors = validate(state.data);

    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    saveMutation.mutate(state.data, {
      onSettled: () => {
        dispatch({ type: 'SUBMIT_END' });
      },
    });
  }, [state.data, saveMutation]);

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

  // ── Dialog title ──

  const title = mode === 'add' ? 'Add Company' : mode === 'edit' ? 'Edit Company' : 'View Company';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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

        {/* ── Company ID (edit/view only) ── */}
        {!isAdd && (
          <FormField label="Company ID">
            <Input value={state.data.companyId} disabled />
          </FormField>
        )}

        {/* ── Company Code ── */}
        <FormField label="Company Code" required={!isView} error={state.errors.companyCode}>
          <Input
            value={state.data.companyCode}
            onChange={(e) =>
              dispatch({ type: 'SET_FIELD', name: 'companyCode', value: e.target.value })
            }
            disabled={isView || isEdit}
            placeholder="Enter company code"
          />
        </FormField>

        {/* ── Company Name ── */}
        <FormField label="Company Name" required={!isView} error={state.errors.companyName}>
          <Input
            value={state.data.companyName}
            onChange={(e) =>
              dispatch({ type: 'SET_FIELD', name: 'companyName', value: e.target.value })
            }
            disabled={isView}
            placeholder="Enter company name"
          />
        </FormField>

        {/* ── Company Alias ── */}
        <FormField label="Company Alias" required={!isView} error={state.errors.companyAlias}>
          <Input
            value={state.data.companyAlias}
            onChange={(e) =>
              dispatch({ type: 'SET_FIELD', name: 'companyAlias', value: e.target.value })
            }
            disabled={isView}
            placeholder="Enter company alias"
          />
        </FormField>

        {/* ── Company Group (ChooserField) ── */}
        <FormField label="Company Group" required={!isView} error={state.errors.companyGroupId}>
          <CompanyGroupChooser
            value={state.companyGroup}
            onChange={(val) => dispatch({ type: 'SET_COMPANY_GROUP', value: val })}
            listData={cgList.data?.data ?? []}
            listCount={cgList.data?.count ?? 0}
            isLoading={cgList.isLoading}
            onQueryChange={setCgQuery}
            validateCode={validateCompanyGroupCode}
            disabled={isView}
            required
          />
        </FormField>

        {/* ── Address ── */}
        <FormField label="Address" required={!isView} error={state.errors.address}>
          <Textarea
            value={state.data.address}
            onChange={(e) =>
              dispatch({ type: 'SET_FIELD', name: 'address', value: e.target.value })
            }
            disabled={isView}
            placeholder="Enter address (min. 15 characters)"
            rows={3}
          />
        </FormField>

        {/* ── State/Area (ChooserField) ── */}
        <FormField label="State/Area">
          <AreaChooser
            value={state.area}
            onChange={(val) => dispatch({ type: 'SET_AREA', value: val })}
            listData={areaList.data?.data ?? []}
            listCount={areaList.data?.count ?? 0}
            isLoading={areaList.isLoading}
            onQueryChange={setAreaQuery}
            disabled={isView}
          />
        </FormField>

        {/* ── Cascading fields (auto-filled from Area) ── */}
        <FormField label="City">
          <Input value={state.area?.cityName ?? ''} disabled />
        </FormField>

        <FormField label="District">
          <Input value={state.area?.districtName ?? ''} disabled />
        </FormField>

        <FormField label="Sub District">
          <Input value={state.area?.subDistrictName ?? ''} disabled />
        </FormField>

        <FormField label="Zip Code">
          <Input value={state.area?.zipCode ?? ''} disabled />
        </FormField>

        {/* ── Phone Number ── */}
        <FormField label="Phone Number" required={!isView} error={state.errors.phoneNumber}>
          <Input
            value={state.data.phoneNumber}
            onChange={(e) =>
              dispatch({ type: 'SET_FIELD', name: 'phoneNumber', value: e.target.value })
            }
            disabled={isView}
            placeholder="Enter phone number (min. 10 digits)"
          />
        </FormField>

        {/* ── Status (edit/view only) ── */}
        {!isAdd && (
          <FormField label="Status">
            <div className="flex items-center gap-2 pt-1">
              <Checkbox checked={state.data.isActive === 'T'} disabled />
              <span className="text-sm">{state.data.isActive === 'T' ? 'Active' : 'Inactive'}</span>
            </div>
          </FormField>
        )}

        {/* ── Status Changed Date (edit/view only) ── */}
        {!isAdd && company?.onChangeDate && (
          <FormField label="Status Changed Date">
            <Input value={company.onChangeDate} disabled />
          </FormField>
        )}

        {/* ── Audit fields (edit/view only) ── */}
        {!isAdd && (
          <>
            <FormField label="Created By">
              <Input value={company?.createdName ?? '-'} disabled />
            </FormField>
            <FormField label="Updated By">
              <Input value={company?.updatedName ?? '-'} disabled />
            </FormField>
          </>
        )}

        {/* ── Footer ── */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isView ? 'Close' : 'Cancel'}
          </Button>
          {!isView && (
            <Button onClick={handleSubmit} disabled={state.isSubmitting}>
              {state.isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
