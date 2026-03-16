import qs from 'query-string';
import { z } from 'zod';
import { protectedProcedure, router } from '../../../trpc';
import { backendFetch } from '../../../backend-fetch';
import { registerProcedure, getProcedureMeta } from '@nhcs/registries';
import { areaSchema } from './area.schema';

// ── Register procedures ──
registerProcedure('area.list', {
  mode: 'proxy',
  type: 'list',
  criticality: 'degradable',
});

// ── Input schema ──
const areaListInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  searchBy: z.enum(['state', 'city', 'district', 'subdistrict']).optional().default('state'),
  value: z.string().optional().default(''),
});

// ── Router ──
export const areaRouter = router({
  list: protectedProcedure.input(areaListInput).query(async ({ ctx, input }) => {
    const result = await backendFetch<{ data: unknown[]; count: number }>({
      method: 'GET',
      path: qs.stringifyUrl({
        url: '/master/area/all',
        query: {
          page: input.page,
          limit: input.limit,
          searchBy: input.searchBy,
          value: input.value,
        },
      }),
      headers: ctx.authHeaders,
      meta: getProcedureMeta('area.list'),
    });

    const data = z.array(areaSchema).parse(result.data);

    return {
      data,
      count: result.count ?? 0,
    };
  }),
});
