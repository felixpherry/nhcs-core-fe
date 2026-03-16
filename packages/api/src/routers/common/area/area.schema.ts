import { z } from 'zod';

export const areaSchema = z.object({
  areaId: z.number(),
  stateId: z.string().nullable(),
  stateName: z.string().nullable(),
  cityId: z.string().nullable(),
  cityName: z.string().nullable(),
  districtId: z.string().nullable(),
  districtName: z.string().nullable(),
  subDistrictId: z.string().nullable(),
  subDistrictName: z.string().nullable(),
  zipCode: z.string().nullable(),
});

export type Area = z.infer<typeof areaSchema>;
