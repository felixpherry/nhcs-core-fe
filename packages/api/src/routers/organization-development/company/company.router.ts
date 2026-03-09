import qs from 'query-string';
import { z } from 'zod';
import { protectedProcedure, router } from '../../../trpc';
import { backendFetch } from '../../../backend-fetch';
import { registerProcedure, getProcedureMeta } from '@nhcs/registries';
import { createEnvelopeSchema, createResultWrapperSchema } from '@nhcs/types';
import { companySchema } from './company.schema';

// ── Register procedure ──
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

// ── What the backend returns for a company list ──
const companyListEnvelope = createEnvelopeSchema(createResultWrapperSchema(companySchema));

// ── The input shape — what the frontend sends matches what the backend actually expects ──
const companyListInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  // Filter fields — flat, not nested
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
  // Sorting
  orderBys: z
    .array(
      z.object({
        item1: z.string(), // column name
        item2: z.boolean(), // true = ascending
      }),
    )
    .optional(),
});

// ── The router ──
export const companyRouter = router({
  list: protectedProcedure.input(companyListInput).query(async ({ ctx, input }) => {
    const { page, limit, ...body } = input;

    const result = await backendFetch({
      method: 'POST',
      path: qs.stringifyUrl({
        url: '/company/sort/search',
        query: { page, limit },
      }),

      body,
      headers: {
        Authorization: `Bearer ${ctx.accessToken}`,
      },
      meta: getProcedureMeta('company.list'),
    });

    const parsed = companyListEnvelope.parse(result);

    if (!parsed.isSuccess) {
      throw new Error(parsed.message ?? 'Failed to fetch companies');
    }

    return parsed.result;
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
          url: '/company/changestatus',
          query: { id: input.id, status: input.status },
        }),

        headers: {
          Authorization: `Bearer ${ctx.accessToken}`,
        },
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
        path: `/company/delete/${input.id}`,
        headers: {
          Authorization: `Bearer ${ctx.accessToken}`,
        },
        meta: getProcedureMeta('company.remove'),
      });

      return result;
    }),
});
