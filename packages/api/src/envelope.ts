import { z } from 'zod';

// The standard backend envelope — EVERY endpoint returns this
const backendEnvelopeSchema = z.object({
  statusCode: z.number().optional(),
  isSuccess: z.boolean(),
  isGranted: z.boolean().optional(),
  result: z.unknown(),
  message: z.string().nullable().optional(),
  error: z.unknown().nullable().optional(),
});

export type BackendEnvelopeRaw = z.infer<typeof backendEnvelopeSchema>;

/**
 * Unwrap the backend envelope.
 * - If isSuccess is true, return result
 * - If isSuccess is false, throw with message
 */
export function unwrapEnvelope(raw: unknown): unknown {
  const parsed = backendEnvelopeSchema.safeParse(raw);

  // If it doesn't match the envelope shape, return as-is
  // (some endpoints might not use the envelope)
  if (!parsed.success) {
    return raw;
  }

  const envelope = parsed.data;

  if (!envelope.isSuccess) {
    throw new EnvelopeError((envelope.message as string) ?? 'Backend request failed', envelope);
  }

  return envelope.result;
}

export class EnvelopeError extends Error {
  public readonly envelope: BackendEnvelopeRaw;

  constructor(message: string, envelope: BackendEnvelopeRaw) {
    super(message);
    this.name = 'EnvelopeError';
    this.envelope = envelope;
  }
}
