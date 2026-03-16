import qs from 'query-string';
import { z } from 'zod';
import { protectedProcedure, router } from '../../../trpc';
import { backendFetch } from '../../../backend-fetch';
import { registerProcedure, getProcedureMeta } from '@nhcs/registries';
import { companyGroupSchema } from './company-group.schema';

// ── Register procedures ──
registerProcedure('companyGroup.list', {
  mode: 'proxy',
  type: 'list',
  criticality: 'degradable',
});

// ── Input schema ──
const companyGroupListInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional().default(''),
});

// ── Router ──
export const companyGroupRouter = router({
  list: protectedProcedure.input(companyGroupListInput).query(async ({ ctx, input }) => {
    const result = await backendFetch<{ data: unknown[]; count: number }>({
      method: 'GET',
      path: qs.stringifyUrl({
        url: '/master/organization-development/all',
        query: {
          source: 'company_group',
          page: input.page,
          limit: input.limit,
          search: input.search,
        },
      }),
      headers: ctx.authHeaders,
      meta: getProcedureMeta('companyGroup.list'),
    });

    const data = z.array(companyGroupSchema).parse(result.data);

    return {
      data,
      count: result.count ?? 0,
    };
  }),
});
