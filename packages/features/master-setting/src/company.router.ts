import { z } from 'zod';
import { protectedProcedure, router, backendFetch } from '@nhcs/api';
import { registerProcedure, getProcedureMeta } from '@nhcs/registries';
import { createEnvelopeSchema, createResultWrapperSchema } from '@nhcs/types';
import { companySchema, companyFilterSchema } from './company.schema';

// ── Register procedure ──
registerProcedure('company.list', {
  mode: 'proxy',
  type: 'list',
  criticality: 'critical',
});

// ── What the backend returns for a company list ──
const companyListEnvelope = createEnvelopeSchema(
  createResultWrapperSchema(companySchema),
);

// ── The input shape — what the frontend sends ──
const companyListInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(500).default(10),
  sort: z
    .object({
      field: z.string(),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
  filter: companyFilterSchema.optional(),
});

// ── The router ──
export const companyRouter = router({
  list: protectedProcedure
    .input(companyListInput)
    .query(async ({ ctx, input }) => {
      const result = await backendFetch({
        method: 'POST',
        path: `/company/sort/search?page=${input.page}&limit=${input.limit}`,
        body: {
          sort: input.sort ?? null,
          filter: input.filter ?? null,
        },
        headers: {
          Authorization: `Bearer ${ctx.accessToken}`,
        },
        meta: getProcedureMeta('company.list'),
      });

      // Parse to validate the backend response shape
      const parsed = companyListEnvelope.parse(result);

      if (!parsed.isSuccess) {
        throw new Error(parsed.message ?? 'Failed to fetch companies');
      }

      return parsed.result;
    }),
});
