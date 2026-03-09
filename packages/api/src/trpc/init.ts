import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';

// Initialize tRPC — this is done ONCE for the whole app
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

// ── Building blocks ──

// Router — groups procedures together
export const router = t.router;

// Public procedure — no auth check
// Used for: login, health check, public config
export const publicProcedure = t.procedure;
export { TRPCError };

// Protected procedure — requires a valid session
// Used for: everything else
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.accessToken || !ctx.sessionId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  // After this check, TypeScript knows these are NOT null
  return next({
    ctx: {
      accessToken: ctx.accessToken,
      sessionId: ctx.sessionId,
    },
  });
});
