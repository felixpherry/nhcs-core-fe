import { z } from 'zod';

// Paginated wrapper — your backend wraps lists in { data: T[], count: number }
export function createResultWrapperSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    count: z.number().optional(),
  });
}

// The top-level envelope — matches your .NET APIResponse<T>
export function createEnvelopeSchema<T extends z.ZodType>(resultSchema: T) {
  return z.discriminatedUnion('isSuccess', [
    z.object({
      isSuccess: z.literal(true),
      isGranted: z.boolean().optional(),
      result: resultSchema,
      message: z.string().nullable(),
    }),
    z.object({
      isSuccess: z.literal(false),
      isGranted: z.boolean().optional(),
      result: z.unknown().optional(),
      message: z.string().nullable(),
      error: z
        .object({
          info: z.string(),
          version: z.string(),
          date: z.string(),
        })
        .nullable()
        .optional(),
    }),
  ]);
}

// TypeScript-only types (for when you don't need runtime validation)
export interface ResultWrapper<T> {
  data: T[];
  count?: number;
}

export type BackendEnvelope<T> =
  | {
      isSuccess: true;
      isGranted?: boolean;
      result: T;
      message: string | null;
    }
  | {
      isSuccess: false;
      isGranted?: boolean;
      result?: unknown;
      message: string | null;
      error?: { info: string; version: string; date: string } | null;
    };

export type Flag = 'T' | 'F';
