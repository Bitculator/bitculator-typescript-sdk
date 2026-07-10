/**
 * The DRY transport core. Every request in the SDK flows through
 * {@link HttpClient.request}: URL + query building, auth headers, JSON
 * (de)serialization, the response envelope, quota capture, retries with
 * backoff, timeouts, and error mapping all live here — nowhere else.
 */
import { ApiError, BitculatorError, DecodeError, TimeoutError } from './errors.js';
import { Page } from './pagination.js';
import type { ParamValue, Quota } from './types.js';

/**
 * A bag of query parameters. Widened to `object` at this seam so the strongly
 * typed resource param interfaces (which lack an index signature) can be passed
 * straight through — callers still get full autocomplete on the resource method.
 */
type QueryInput = object;

/** Fully-resolved transport configuration (defaults already applied by the client). */
export interface HttpConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  userAgent: string;
  fetch: typeof fetch;
  onQuota: (quota: Quota) => void;
}

export class HttpClient {
  constructor(private readonly cfg: HttpConfig) {}

  /** GET a single resource; returns the unwrapped `data`. */
  get<T>(path: string, query?: QueryInput): Promise<T> {
    return this.request('GET', path, { query }).then(unwrap) as Promise<T>;
  }

  /** POST a JSON body; returns the unwrapped `data`. */
  post<T>(path: string, body?: unknown, query?: QueryInput): Promise<T> {
    return this.request('POST', path, { query, body }).then(unwrap) as Promise<T>;
  }

  /** DELETE a resource; returns the unwrapped `data` (often `undefined`). */
  delete<T>(path: string, query?: QueryInput): Promise<T> {
    return this.request('DELETE', path, { query }).then(unwrap) as Promise<T>;
  }

  /** GET a paginated list; returns a {@link Page} that can walk subsequent pages. */
  async getPage<T>(path: string, query?: QueryInput): Promise<Page<T>> {
    const envelope = await this.request('GET', path, { query });
    return new Page<T>(this, path, query, envelope);
  }

  private async request(
    method: string,
    path: string,
    opts: { query?: QueryInput; body?: unknown },
  ): Promise<unknown> {
    const url = this.cfg.baseUrl + path + serializeQuery(opts.query);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.cfg.apiKey}`,
      Accept: 'application/json',
      'User-Agent': this.cfg.userAgent,
    };
    let payload: string | undefined;
    if (opts.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      try {
        payload = JSON.stringify(snakeKeys(opts.body));
      } catch (err) {
        throw new BitculatorError(`Failed to encode request body: ${errorMessage(err)}`, { cause: err });
      }
    }

    // GET/DELETE are idempotent and safe to auto-retry; POST is not — a retried
    // POST can silently duplicate a create the server already processed.
    const isIdempotent = method === 'GET' || method === 'DELETE';

    let attempt = 0;
    for (;;) {
      // Deliberately a manual AbortController + ref'd setTimeout, NOT
      // AbortSignal.timeout(): that helper's timer is unref'd in Node, so with
      // an injected `fetch` that holds no I/O handles the event loop can drain
      // and the timeout would never fire. A ref'd timer guarantees it does.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.cfg.timeout);
      let res: Response;
      let text: string;
      try {
        res = await this.cfg.fetch(url, { method, headers, body: payload, signal: controller.signal });
        // Read the body while the timeout is still armed so a stalled body
        // read is time-bounded too, not just the initial header exchange.
        text = await res.text();
      } catch (err) {
        // Network / timeout / connection errors: retry only for idempotent
        // methods so a POST is never silently re-sent.
        if (isIdempotent && attempt < this.cfg.maxRetries) {
          await sleep(backoffMs(attempt++));
          continue;
        }
        if (err instanceof Error && err.name === 'AbortError') {
          throw new TimeoutError(`Request to ${path} timed out after ${this.cfg.timeout}ms`);
        }
        throw new BitculatorError(`Network error requesting ${path}: ${errorMessage(err)}`, { cause: err });
      } finally {
        clearTimeout(timer);
      }

      this.cfg.onQuota(parseQuota(res.headers));

      if (res.ok) {
        // A successful response with a non-empty body must be valid JSON;
        // error bodies below stay lenient (raw text feeds the error message).
        if (!text) return undefined;
        try {
          return JSON.parse(text);
        } catch (err) {
          throw new DecodeError(`Failed to decode response body from ${path}: ${errorMessage(err)}`, { cause: err });
        }
      }

      const json = text ? safeJson(text) : undefined;

      // 429 is always retryable (the server did not process the request);
      // 5xx is retryable only for idempotent methods.
      const retryable = res.status === 429 || (res.status >= 500 && isIdempotent);
      if (retryable && attempt < this.cfg.maxRetries) {
        // Honor Retry-After, but cap it at 60s — a misbehaving proxy must not
        // block a synchronous call for an hour.
        const retryAfter = Number(res.headers.get('retry-after'));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 60) * 1000 : backoffMs(attempt);
        attempt++;
        await sleep(waitMs);
        continue;
      }
      throw ApiError.from(res.status, json, res.headers);
    }
  }
}

// ── helpers (all pure; the single place these concerns are implemented) ─────

const camelToSnake = (key: string): string => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Extract a human-readable message from an unknown caught value. */
const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/** Serialize params to a query string: camelCase→snake_case keys, arrays→CSV, nullish dropped. */
function serializeQuery(params?: QueryInput): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [rawKey, rawValue] of Object.entries(params)) {
    const value = rawValue as ParamValue;
    if (value === undefined || value === null) continue;
    const key = camelToSnake(rawKey);
    if (isReadonlyArray(value)) {
      if (value.length > 0) search.append(key, value.map(paramToString).join(','));
    } else {
      search.append(key, paramToString(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** `Array.isArray` typed so the else branch narrows `ReadonlyArray` away too. */
const isReadonlyArray = (value: unknown): value is ReadonlyArray<string | number> => Array.isArray(value);

/** Stringify a scalar param; numbers always go on the wire as plain decimals. */
function paramToString(value: string | number | boolean): string {
  return typeof value === 'number' ? plainNumberString(value) : String(value);
}

/**
 * Expand a number's shortest repr to plain decimal when `String()` uses
 * exponent notation (e.g. `1e-7` → `"0.0000001"`), by shifting the decimal
 * point of the mantissa — no `toFixed`, which would introduce precision
 * garbage. Keeps the wire format identical across the SDK family (Java, .NET
 * and Rust already emit plain decimals).
 */
function plainNumberString(n: number): string {
  const repr = String(n);
  if (!repr.includes('e') && !repr.includes('E')) return repr;
  const [mantissa = '', expPart = ''] = repr.split(/[eE]/);
  const exp = Number(expPart);
  const sign = mantissa.startsWith('-') ? '-' : '';
  const [intPart = '', fracPart = ''] = mantissa.replace('-', '').split('.');
  const digits = intPart + fracPart;
  const pointIndex = intPart.length + exp;
  if (pointIndex <= 0) return `${sign}0.${'0'.repeat(-pointIndex)}${digits}`;
  if (pointIndex >= digits.length) return sign + digits + '0'.repeat(pointIndex - digits.length);
  return `${sign}${digits.slice(0, pointIndex)}.${digits.slice(pointIndex)}`;
}

/** Convert a request body's top-level keys to snake_case to match the API. */
function snakeKeys(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) out[camelToSnake(key)] = value;
  return out;
}

/** Collect the `x-quota-*` headers into a typed {@link Quota}. */
function parseQuota(headers: Headers): Quota {
  const raw: Record<string, string> = {};
  for (const [key, value] of headers) {
    // Header names are already lower-cased by Headers iteration per spec;
    // toLowerCase() guards custom fetch doubles that hand-build entries.
    if (key.toLowerCase().startsWith('x-quota-')) raw[key.toLowerCase()] = value;
  }
  const num = (name: string): number | null => {
    const v = raw[name];
    return v !== undefined && v !== '' ? Number(v) : null;
  };
  return { limit: num('x-quota-limit'), remaining: num('x-quota-remaining'), reset: num('x-quota-reset'), raw };
}

/** Unwrap the `{ data }` envelope; pass through bodies that have no `data` key. */
function unwrap(envelope: unknown): unknown {
  return envelope && typeof envelope === 'object' && 'data' in envelope
    ? (envelope as { data: unknown }).data
    : envelope;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Exponential backoff with jitter, capped at 8s. */
function backoffMs(attempt: number): number {
  return Math.min(8000, 250 * 2 ** attempt) + Math.floor(Math.random() * 100);
}
