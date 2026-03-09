import { router } from './trpc';
import { companyRouter } from './routers/organization-development/company';

export const appRouter = router({
  organizationDevelopment: router({
    company: companyRouter,
  }),
});

export type AppRouter = typeof appRouter;
