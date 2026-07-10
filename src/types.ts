/**
 * Public types for the Bitculator Data API SDK.
 *
 * Response payloads (`data`) are returned as decoded JSON. The API does not
 * publish per-endpoint response schemas, so we keep `data` permissive (`Json`)
 * and let callers bring their own type via the method generic, e.g.
 * `client.coins.get<MyCoin>('bitcoin')`. The stable envelope — pagination
 * meta, links, quota, errors — is fully typed.
 */

/** Decoded JSON payload. Override per-call with a generic for stronger typing. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

/** Configuration for {@link Bitculator}. Only `apiKey` is required. */
export interface ClientConfig {
  /** Your Data API key (Bearer token with the `data-api` ability). Keep it server-side. */
  apiKey: string;
  /** API origin. Defaults to `https://bitculator.com`. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Defaults to `30000`. */
  timeout?: number;
  /** Automatic retries for 429 / 5xx / network errors. Defaults to `2` (set `0` to disable). */
  maxRetries?: number;
  /** Overrides the `User-Agent` header. */
  userAgent?: string;
  /** Inject a custom `fetch` (tests, proxies, non-global runtimes). Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/** Laravel paginator metadata attached to every paginated list response. */
export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

/** Page navigation links attached to every paginated list response. */
export interface PageLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

/** Quota headers (`X-Quota-*`) from the most recent response. */
export interface Quota {
  /** Monthly request allowance for the key's plan, or `null` if not reported. */
  limit: number | null;
  /** Requests remaining in the current window, or `null` if not reported. */
  remaining: number | null;
  /** Window reset time (epoch seconds), or `null` if not reported. */
  reset: number | null;
  /** Every `x-quota-*` header, lower-cased, verbatim. */
  raw: Record<string, string>;
}

/** A value accepted as a query-string parameter. Arrays are serialized as CSV. */
export type ParamValue = string | number | boolean | ReadonlyArray<string | number> | null | undefined;

/** A bag of query-string parameters (camelCase keys are converted to snake_case). */
export type QueryParams = Record<string, ParamValue>;

// ── Shared parameter shapes (DRY — reused across resources) ─────────────────

/** Page controls common to every paginated endpoint. */
export interface Pagination {
  /** 1-based page number. */
  page?: number;
  /** Rows per page. The cap is plan-based; exceeding it returns HTTP 422. */
  perPage?: number;
}

/** Filters shared by coin/asset listings (coins, exchange assets, wallet assets). */
export interface AssetFilters extends Pagination {
  /** Restrict to a single asset type: `coin` or `token`. */
  type?: string;
  /** Listing status: `active`, `delisted`, `untracked`, `progress`. */
  status?: string;
  /** Free-text match on name or symbol. */
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minMarketcap?: number;
  maxMarketcap?: number;
  minVolume?: number;
  maxVolume?: number;
  /** Specific coin ids (array or CSV, up to 100). */
  ids?: string | string[];
  /** Specific coin slugs (array or CSV, up to 100). */
  slugs?: string | string[];
  /** Specific coin symbols (array or CSV). */
  symbols?: string | string[];
  /** Comma-separated sort fields; prefix with `-` for descending. */
  sort?: string;
  /** Movers window (used by gainers/losers): e.g. `24h`, `7d`. */
  interval?: string;
}

/** Filters shared by market/ticker listings. */
export interface TickerFilters extends Pagination {
  exchange?: string;
  pair?: number;
  instrument?: string;
  search?: string;
  minVolume?: number;
  maxVolume?: number;
  minChange?: number;
  maxChange?: number;
  sort?: string;
}

/** Time-series window shared by candle/history endpoints. */
export interface CandleParams {
  /** Candle interval, e.g. `1h`, `1d`. */
  interval?: string;
  /** ISO-8601 start bound. */
  start?: string;
  /** ISO-8601 end bound. */
  end?: string;
  /** Max number of points. */
  limit?: number;
}

/** Window shared by period-based indicators (RSI, SMA, CCI, ...). */
export interface IndicatorParams {
  /** Look-back period (number of candles). */
  period?: number;
  start?: string;
  end?: string;
  limit?: number;
}

/** Window shared by series indicators without a period (MACD, OBV, ADX, VWAP, CMF). */
export interface SeriesParams {
  start?: string;
  end?: string;
  limit?: number;
}
