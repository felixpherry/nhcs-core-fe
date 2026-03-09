// Base class — all our errors extend this
export class BackendFetchError extends Error {
  public readonly correlationId: string;

  constructor(message: string, correlationId: string) {
    super(message);
    this.name = 'BackendFetchError';
    this.correlationId = correlationId;
  }
}

// Backend returned 4xx or 5xx
export class BackendError extends BackendFetchError {
  public readonly status: number;
  public readonly body: unknown;

  constructor(status: number, body: unknown, correlationId: string) {
    super(`Backend responded with ${status}`, correlationId);
    this.name = 'BackendError';
    this.status = status;
    this.body = body;
  }
}

// Backend returned 429 (too many requests)
export class RateLimitError extends BackendFetchError {
  public readonly retryAfter: number | null;

  constructor(body: unknown, correlationId: string, retryAfter: number | null) {
    super('Rate limited by backend', correlationId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// Our internal timeout fired (not the backend — WE gave up waiting)
export class TimeoutError extends BackendFetchError {
  constructor(correlationId: string) {
    super('Request timed out', correlationId);
    this.name = 'TimeoutError';
  }
}

// User navigated away or component unmounted — caller cancelled
export class CallerAbortError extends BackendFetchError {
  constructor(correlationId: string) {
    super('Request aborted by caller', correlationId);
    this.name = 'CallerAbortError';
  }
}

// A mutation was aborted — dangerous, can't safely retry
export class MutationAbortError extends BackendFetchError {
  constructor(correlationId: string) {
    super('Mutation aborted — cannot safely retry', correlationId);
    this.name = 'MutationAbortError';
  }
}
