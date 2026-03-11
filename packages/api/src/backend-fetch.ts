import { getPolicy, type ProcedureMeta } from '@nhcs/registries';
import { BackendError, CallerAbortError, TimeoutError } from './errors';
import { sleep, isMutation } from './utils';
import { unwrapEnvelope } from './envelope';

const BACKEND_API_URL = process.env.BACKEND_API_URL!;

interface BackendFetchOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  meta: ProcedureMeta;
}

export async function backendFetch<T>(options: BackendFetchOptions): Promise<T> {
  const policy = getPolicy(options.meta.requestClass);
  const correlationId = crypto.randomUUID();
  let lastError: unknown;

  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    // Fresh AbortController per attempt
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), policy.timeout);

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

      // 5xx — retryable
      if (res.status >= 500) {
        lastError = new BackendError(res.status, await res.json().catch(() => ({})), correlationId);
        if (attempt < policy.maxRetries) {
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }

      // 4xx — NOT retryable, throw immediately
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new BackendError(res.status, body, correlationId);
      }

      // Success path
      const json = await res.json();
      return unwrapEnvelope(json) as T;
    } catch (err) {
      clearTimeout(timeoutId);

      // Caller abort — NEVER retry
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (options.signal?.aborted) {
          throw new CallerAbortError(correlationId);
        }

        // Our timeout — retry if allowed, but NEVER retry mutations
        if (isMutation(options.meta)) {
          throw new TimeoutError(correlationId);
        }

        lastError = new TimeoutError(correlationId);
        if (attempt < policy.maxRetries) {
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        throw lastError;
      }

      // If it's already one of our errors (like BackendError from
      // the 5xx/4xx handling above), just rethrow
      throw err;
    }
  }

  throw lastError;
}
