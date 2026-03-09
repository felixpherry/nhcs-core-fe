import { router } from './trpc';
import { companyRouter } from './routers/master-setting';

export const appRouter = router({
  masterSetting: router({
    company: companyRouter,
  }),
});

export type AppRouter = typeof appRouter;
