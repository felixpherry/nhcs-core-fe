import { z } from 'zod';
import CryptoJS from 'crypto-js';
import { publicProcedure, router } from '../../trpc';
import { backendFetch } from '../../backend-fetch';
import { registerProcedure, getProcedureMeta } from '@nhcs/registries';
import { loginInputSchema, loginResponseSchema } from './auth.schema';

registerProcedure('auth.login', {
  mode: 'proxy',
  type: 'command',
  criticality: 'critical',
});

registerProcedure('auth.logout', {
  mode: 'proxy',
  type: 'command',
  criticality: 'critical',
});

function encryptPassword(password: string): string {
  const secret = process.env.AUTH_SECRET!;
  return CryptoJS.AES.encrypt(password, CryptoJS.enc.Utf8.parse(secret), {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
    iv: CryptoJS.lib.WordArray.create([0, 0, 0, 0], 16),
  }).toString();
}

export const authRouter = router({
  login: publicProcedure.input(loginInputSchema).mutation(async ({ input }) => {
    const raw = await backendFetch({
      method: 'POST',
      path: '/authentication/api/auth/login',
      body: {
        userId: input.userId.trim(),
        password: encryptPassword(input.password),
        browser: input.browser ?? null,
        browserVersion: input.browserVersion ?? null,
        ipAddress: input.ipAddress ?? null,
      },
      meta: getProcedureMeta('auth.login'),
    });

    const parsed = loginResponseSchema.parse(raw);

    if (!parsed.isSuccess) {
      throw new Error(parsed.message ?? 'Login failed');
    }

    return parsed.result;
  }),

  logout: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        accessId: z.string(),
        userId: z.string(),
        userLevel: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await backendFetch({
        method: 'POST',
        path: '/authentication/api/auth/logout',
        body: {
          accessId: input.accessId,
        },
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          'user-id': `${input.userId}_${input.accessId}_${input.userLevel}`,
        },
        meta: getProcedureMeta('auth.logout'),
      });

      return result;
    }),
});
