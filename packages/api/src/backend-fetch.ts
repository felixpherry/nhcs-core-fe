import { getPolicy, type ProcedureMeta } from '@nhcs/registries';
import { BackendError } from './errors';

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

interface BackendFetchOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  meta: ProcedureMeta;
}

export async function backendFetch<T>(
  options: BackendFetchOptions,
): Promise<T> {
  const policy = getPolicy(options.meta.requestClass);
  const correlationId = crypto.randomUUID();

  const res = await fetch(`${BACKEND_API_URL}${options.path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-Id': correlationId,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // If backend returned an error status, throw
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new BackendError(res.status, body, correlationId);
  }

  // Happy path — parse and return
  return (await res.json()) as T;
}
