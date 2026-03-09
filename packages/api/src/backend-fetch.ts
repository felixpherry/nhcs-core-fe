import { getPolicy, type ProcedureMeta } from '@nhcs/registries';
import { BackendError, CallerAbortError, TimeoutError } from './errors';
import { sleep } from './utils';

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

interface BackendFetchOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  meta: ProcedureMeta;
}

export async function backendFetch<T>(
  options: BackendFetchOptions,
): Promise<T> {
  const policy = getPolicy(options.meta.requestClass);
  const correlationId = crypto.randomUUID();

  // ── Timeout setup
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), policy.timeout);

  // If the caller ALSO passed a signal (e.g. user navigated away),
  // combine both — whichever fires first wins
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const res = await fetch(`${BACKEND_API_URL}${options.path}`, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new BackendError(res.status, body, correlationId);
    }

    return (await res.json()) as T;
  } catch (err) {
    clearTimeout(timeoutId);

    // Was the request aborted?
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Was it the CALLER's signal or OUR timeout?
      if (options.signal?.aborted) {
        throw new CallerAbortError(correlationId);
      }
      throw new TimeoutError(correlationId);
    }

    throw err;
  }
}
