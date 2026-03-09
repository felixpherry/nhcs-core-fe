import { z } from 'zod';

export function createEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z.discriminatedUnion('isSuccess', [
    // Happy path
    z.object({
      isSuccess: z.literal(true),
      data: dataSchema,
      message: z.string(),
    }),
    // Error path
    z.object({
      isSuccess: z.literal(false),
      message: z.string(),
      data: z.unknown().optional(),
      errors: z
        .array(z.object({ field: z.string(), message: z.string() }))
        .optional(),
    }),
  ]);
}

export type BackendEnvelope<T> =
  | { isSuccess: true; data: T; message: string }
  | {
      isSuccess: false;
      message: string;
      data?: unknown;
      errors?: { field: string; message: string }[];
    };
