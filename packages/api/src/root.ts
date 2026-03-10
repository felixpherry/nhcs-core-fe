import { router } from './trpc';
import { companyRouter } from './routers/organization-development/company';
import { authRouter } from './routers/auth';

export const appRouter = router({
  auth: authRouter,
  organizationDevelopment: router({
    company: companyRouter,
  }),
});

export type AppRouter = typeof appRouter;
