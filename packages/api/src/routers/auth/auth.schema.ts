import { z } from 'zod';

export const loginInputSchema = z.object({
  userId: z.string().min(4).max(100),
  password: z.string().min(1),
  browser: z.string().nullable().optional(),
  browserVersion: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const tokenSchema = z.object({
  accessToken: z.string().nullable(),
  accessId: z.string().nullable(),
  refreshToken: z.string().nullable(),
  refExpiredDate: z.string().nullable(),
});

export type Token = z.infer<typeof tokenSchema>;
export const featureSchema = z.object({
  featureId: z.number(),
  menuId: z.number(),
  menuCode: z.string(),
  menuName: z.string(),
  featureCode: z.string(),
  featureName: z.string(),
  isGranted: z.boolean(),
});

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

export const menuGroupSchema = z.enum(['ESS', 'MSS', 'CORE']);
export type MenuGroup = z.infer<typeof menuGroupSchema>;

export const authUserSchema = z.object({
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  userLevel: z.string().nullable(),
  userGroup: z.string().nullable(),
  userPicture: z.string().nullable(),
  menus: z.array(menuSchema).nullable(),
  menuGroups: z.array(menuGroupSchema),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginResultSchema = z.object({
  isSuccess: z.literal(true),
  data: z.object({
    token: tokenSchema,
    user: authUserSchema,
  }),
});

export const loginErrorSchema = z.object({
  errorCode: z.string(),
  isSuccess: z.literal(false),
  message: z.string(),
  timestamp: z.string(),
});

export const loginResponseSchema = z.union([loginResultSchema, loginErrorSchema]);

export type LoginResult = z.infer<typeof loginResultSchema>;
export type LoginError = z.infer<typeof loginErrorSchema>;
