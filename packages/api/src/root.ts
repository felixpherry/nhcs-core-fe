import { router } from './trpc';
import { companyRouter } from './routers/organization-development/company';
import { authRouter } from './routers/auth';
import { companyGroupRouter } from './routers/common/company-group';
import { areaRouter } from './routers/common/area';

export const appRouter = router({
  auth: authRouter,
  organizationDevelopment: router({
    company: companyRouter,
  }),
  common: router({
    companyGroup: companyGroupRouter,
    area: areaRouter,
  }),
});

export type AppRouter = typeof appRouter;
