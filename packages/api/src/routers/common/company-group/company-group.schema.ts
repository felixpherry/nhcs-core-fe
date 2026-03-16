import { z } from 'zod';

export const companyGroupSchema = z.object({
  companyGroupId: z.number(),
  companyGroupCode: z.string().nullable(),
  companyGroupName: z.string().nullable(),
});

export type CompanyGroup = z.infer<typeof companyGroupSchema>;
