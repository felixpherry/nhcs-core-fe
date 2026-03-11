import { z } from 'zod';

const dataHistorySchema = z.object({
  onChangeDate: z.string().nullable().optional(),
  onChangeTime: z.string().nullable().optional(),
  onChangeName: z.string().nullable().optional(),
  createdDate: z.string().nullable(),
  createdTime: z.string().nullable(),
  createdName: z.string().nullable(),
  updatedDate: z.string().nullable(),
  updatedTime: z.string().nullable(),
  updatedName: z.string().nullable(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  onChangeAt: z.string().nullable().optional(),
});

export const companySchema = dataHistorySchema.extend({
  companyId: z.number(),
  companyCode: z.string().nullable(),
  companyName: z.string().nullable(),
  companyAlias: z.string().nullable(),
  companyGroupId: z.number().nullable(),
  companyGroupCode: z.string().nullable(),
  companyGroupName: z.string().nullable(),
  address: z.string().nullable(),
  zipCode: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  stateId: z.string().nullable(),
  stateName: z.string().nullable(),
  cityId: z.string().nullable(),
  cityName: z.string().nullable(),
  districtId: z.string().nullable(),
  districtName: z.string().nullable(),
  subDistrictId: z.string().nullable(),
  subDistrictName: z.string().nullable(),
  isActive: z.enum(['T', 'F']).nullable(),
  additionalAttributes: z.record(z.string(), z.unknown()).nullable().optional(),
  additionalAttributesMaster: z.unknown().nullable().optional(),
});

export type Company = z.infer<typeof companySchema>;

export const companyFilterSchema = z.object({
  companyCode: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  companyGroupId: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  stateId: z.string().nullable().optional(),
  cityId: z.string().nullable().optional(),
  districtId: z.string().nullable().optional(),
  subDistrictId: z.string().nullable().optional(),
  isActive: z.enum(['T', 'F']).nullable().optional(),
  companyAlias: z.string().nullable().optional(),
});

export type CompanyFilter = z.infer<typeof companyFilterSchema>;
