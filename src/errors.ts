/**
 * Error hierarchy. Everything the SDK throws derives from {@link BitculatorError},
 * so a single `catch (e) { if (e instanceof BitculatorError) ... }` covers it all.
 * HTTP failures throw a status-specific {@link ApiError} subclass carrying the
 * API's `{ error: { code, message, details } }` envelope.
 */

/** Base class for every error thrown by the SDK. */
export class BitculatorError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    // Native ES2022 error cause — Error itself installs `cause` when present.
    super(message, options);
    this.name = new.target.name;
  }
}

/** The request exceeded the configured timeout (and exhausted retries). */
export class TimeoutError extends BitculatorError {}

/** A 2xx response body that could not be parsed as JSON. */
export class DecodeError extends BitculatorError {}

interface ApiErrorBody {
  code?: string;
  message?: string;
  details?: unknown;
}

/** A non-2xx response. Subclasses map to specific status codes. */
export class ApiError extends BitculatorError {
  /** HTTP status code. */
  readonly status: number;
  /** Machine-readable error code from the API envelope, if present. */
  readonly code: string | null;
  /** Structured error details (e.g. per-field validation messages). */
  readonly details: unknown;
  /** The `X-Request-Id` header, if the API returned one. */
  readonly requestId: string | null;

  constructor(status: number, body: ApiErrorBody | undefined, requestId: string | null) {
    super(body?.message || `HTTP ${status}`);
    this.status = status;
    this.code = body?.code ?? null;
    this.details = body?.details ?? null;
    this.requestId = requestId;
  }

  /** Build the most specific error subclass for a failed response. */
  static from(status: number, json: unknown, headers: Headers): ApiError {
    const body = extractErrorBody(json);
    const requestId = headers.get('x-request-id');
    if (status === 401) return new AuthenticationError(status, body, requestId);
    if (status === 403) return new PermissionError(status, body, requestId);
    if (status === 404) return new NotFoundError(status, body, requestId);
    if (status === 422) return new ValidationError(status, body, requestId);
    if (status === 429) {
      const rawRetryAfter = headers.get('retry-after');
      const retryAfter = rawRetryAfter !== null ? Number(rawRetryAfter) : null;
      return new RateLimitError(status, body, requestId, retryAfter !== null && Number.isFinite(retryAfter) ? retryAfter : null);
    }
    if (status >= 500) return new ServerError(status, body, requestId);
    return new ApiError(status, body, requestId);
  }
}

/** 401 — missing, malformed, or invalid API key. */
export class AuthenticationError extends ApiError {}
/** 403 — the key's plan does not grant access to this endpoint. */
export class PermissionError extends ApiError {}
/** 404 — the requested resource does not exist. */
export class NotFoundError extends ApiError {}
/** 422 — invalid parameters (see {@link ApiError.details}). */
export class ValidationError extends ApiError {}
/** 5xx — an error on the API side. */
export class ServerError extends ApiError {}

/** 429 — quota or rate limit exceeded. */
export class RateLimitError extends ApiError {
  /** Seconds to wait before retrying, from the `Retry-After` header, if present. */
  readonly retryAfter: number | null;
  constructor(status: number, body: ApiErrorBody | undefined, requestId: string | null, retryAfter: number | null) {
    super(status, body, requestId);
    this.retryAfter = retryAfter;
  }
}

function extractErrorBody(json: unknown): ApiErrorBody | undefined {
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    if (obj.error && typeof obj.error === 'object') return obj.error as ApiErrorBody;
    if (typeof obj.message === 'string') return { message: obj.message };
  }
  return undefined;
}
