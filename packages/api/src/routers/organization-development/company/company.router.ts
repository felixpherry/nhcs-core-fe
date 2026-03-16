import qs from 'query-string';
import { z } from 'zod';
import { protectedProcedure, router } from '../../../trpc';
import { backendFetch } from '../../../backend-fetch';
import { registerProcedure, getProcedureMeta } from '@nhcs/registries';
import { companySchema } from './company.schema';

// ── Register procedures ──
registerProcedure('company.list', {
  mode: 'proxy',
  type: 'list',
  criticality: 'critical',
});

registerProcedure('company.changeStatus', {
  mode: 'proxy',
  type: 'mutation',
  criticality: 'critical',
});

registerProcedure('company.remove', {
  mode: 'proxy',
  type: 'mutation',
  criticality: 'critical',
});

registerProcedure('company.save', {
  mode: 'proxy',
  type: 'mutation',
  criticality: 'critical',
});

// ── Input schema ──
const companyListInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  companyCode: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  companyGroupId: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  stateId: z.string().nullable().optional(),
  cityId: z.string().nullable().optional(),
  districtId: z.string().nullable().optional(),
  subDistrictId: z.string().nullable().optional(),
  isActive: z.enum(['T', 'F']).nullable().optional(),
  companyAlias: z.string().nullable().optional(),
  orderBys: z
    .array(
      z.object({
        item1: z.string(),
        item2: z.boolean(),
      }),
    )
    .optional(),
});

const companySaveInput = z.object({
  companyId: z.number(), // 0 for create, real ID for update
  companyCode: z.string(),
  companyName: z.string(),
  companyAlias: z.string(),
  companyGroupId: z.number().nullable(),
  address: z.string(),
  stateId: z.string().nullable(),
  cityId: z.string().nullable(),
  districtId: z.string().nullable(),
  subDistrictId: z.string().nullable(),
  zipCode: z.string().nullable(),
  phoneNumber: z.string(),
  isActive: z.enum(['T', 'F']),
  additionalAttributes: z.record(z.string(), z.unknown()).default({}),
});

// ── Router ──
export const companyRouter = router({
  list: protectedProcedure.input(companyListInput).query(async ({ ctx, input }) => {
    const { page, limit, ...body } = input;

    // backendFetch unwraps envelope → returns inner result
    const result = await backendFetch<{ data: unknown[]; count: number }>({
      method: 'POST',
      path: qs.stringifyUrl({
        url: '/organization-development/api/master-data/company/sort/search',
        query: { page, limit },
      }),
      body,
      headers: ctx.authHeaders,
      meta: getProcedureMeta('company.list'),
    });

    // Contract drift check — validates each company against schema
    const data = z.array(companySchema).parse(result.data);

    return {
      data,
      count: result.count ?? 0,
    };
  }),

  changeStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['T', 'F']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await backendFetch({
        method: 'POST',
        path: qs.stringifyUrl({
          url: '/organization-development/api/master-data/company/changestatus',
          query: { id: input.id, status: input.status },
        }),
        headers: ctx.authHeaders,
        meta: getProcedureMeta('company.changeStatus'),
      });

      return result;
    }),

  remove: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await backendFetch({
        method: 'POST',
        path: `/organization-development/api/master-data/company/delete/${input.id}`,
        headers: ctx.authHeaders,
        meta: getProcedureMeta('company.remove'),
      });

      return result;
    }),

  save: protectedProcedure.input(companySaveInput).mutation(async ({ ctx, input }) => {
    const result = await backendFetch({
      method: 'POST',
      path: '/organization-development/api/master-data/company/save',
      body: input,
      headers: ctx.authHeaders,
      meta: getProcedureMeta('company.save'),
    });

    return result;
  }),
});
