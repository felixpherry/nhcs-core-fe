import { z } from 'zod';
import { publicProcedure, router } from '../../trpc';
import { backendFetch } from '../../backend-fetch';
import { registerProcedure, getProcedureMeta } from '@nhcs/registries';
import { loginInputSchema, loginResponseSchema } from './auth.schema';

// ── Register procedures ──
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

export const authRouter = router({
  login: publicProcedure.input(loginInputSchema).mutation(async ({ input }) => {
    const result = await backendFetch({
      method: 'POST',
      path: '/authentication/login',
      body: {
        userId: input.userId.trim(),
        password: input.password,
        browser: input.browser ?? null,
        browserVersion: input.browserVersion ?? null,
        ipAddress: input.ipAddress ?? null,
      },
      meta: getProcedureMeta('auth.login'),
    });

    const parsed = loginResponseSchema.parse(result);

    // Check if it's an error response
    if ('errorCode' in parsed) {
      throw new Error(parsed.message);
    }

    return parsed.data;
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
        path: '/authentication/logout',
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
