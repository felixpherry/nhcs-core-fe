import { z } from 'zod';

// ── Login input ──
export const loginInputSchema = z.object({
  userId: z.string().min(4).max(100),
  password: z.string().min(1),
  browser: z.string().nullable().optional(),
  browserVersion: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// ── Feature / Permission ──
export const featureSchema = z.object({
  featureId: z.number(),
  menuId: z.number(),
  menuCode: z.string(),
  menuName: z.string(),
  featureCode: z.string(),
  featureName: z.string(),
  isGranted: z.boolean(),
});

// ── Menu (recursive) ──
export interface Menu {
  menuId: number;
  menuCode: string;
  menuName: string;
  iconMenu: string;
  uri: string | null;
  urlGuide: string;
  menus: Menu[];
  features: z.infer<typeof featureSchema>[];
  isContainer: 'T' | 'F';
  isSection: 'T' | 'F';
}

const baseMenuSchema = z.object({
  menuId: z.number(),
  menuCode: z.string(),
  menuName: z.string(),
  iconMenu: z.string(),
  uri: z.string().nullable(),
  urlGuide: z.string(),
  features: z.array(featureSchema),
  isContainer: z.enum(['T', 'F']),
  isSection: z.enum(['T', 'F']),
});

export const menuSchema: z.ZodType<Menu> = baseMenuSchema.extend({
  menus: z.lazy(() => z.array(menuSchema)),
});

// ── Login result — flat, matches actual backend response ──
export const loginResultDataSchema = z.object({
  menus: z.array(menuSchema).nullable(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  userLevel: z.string().nullable(),
  userGroup: z.string().nullable(),
  isSuperior: z.boolean().nullable().optional(),
  isEmployee: z.boolean().nullable().optional(),
  fgEss: z.enum(['T', 'F']).nullable().optional(),
  fgCore: z.enum(['T', 'F']).nullable().optional(),
  fgMss: z.enum(['T', 'F']).nullable().optional(),
  accessToken: z.string().nullable(),
  accessId: z.string().nullable(),
  refreshToken: z.string().nullable(),
  refExpiredDate: z.string().nullable(),
  isPkd: z.boolean().nullable().optional(),
});

export type LoginResultData = z.infer<typeof loginResultDataSchema>;

// ── Full login response envelope
export const loginResponseSchema = z.discriminatedUnion('isSuccess', [
  z.object({
    statusCode: z.number(),
    isSuccess: z.literal(true),
    isGranted: z.boolean().optional(),
    result: loginResultDataSchema,
    message: z.string().nullable(),
    error: z.unknown().nullable(),
  }),
  z.object({
    statusCode: z.number().optional(),
    isSuccess: z.literal(false),
    isGranted: z.boolean().optional(),
    result: z.unknown().nullable().optional(),
    message: z.string().nullable(),
    error: z.unknown().nullable(),
  }),
]);

export type LoginResponse = z.infer<typeof loginResponseSchema>;
