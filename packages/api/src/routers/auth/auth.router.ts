import CryptoJS from 'crypto-js';
import { publicProcedure, router } from '../../trpc';
import { backendFetch } from '../../backend-fetch';
import { registerProcedure, getProcedureMeta } from '@nhcs/registries';
import { loginInputSchema, loginResponseSchema } from './auth.schema';
import { createSession, destroySession } from '../../session-actions';

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

    // Store in encrypted cookie
    await createSession(parsed.result);

    return {
      userId: parsed.result.userId,
      userName: parsed.result.userName,
      userLevel: parsed.result.userLevel,
    };
  }),

  logout: publicProcedure.mutation(async () => {
    await destroySession();
    return { success: true };
  }),
});
