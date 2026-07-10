import { Resource } from './base.js';
import type { Page } from '../pagination.js';
import type { AssetFilters, CandleParams, Json } from '../types.js';

/** Coins & tokens: listings, movers, detail, and history. */
export class CoinsResource extends Resource {
  /** List coins (paginated). */
  list<T = Json>(params?: AssetFilters): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/coins', params);
  }

  /** Recently added coins (paginated). */
  recentlyAdded<T = Json>(params?: AssetFilters): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/coins/recently-added', params);
  }

  /** Top gainers (paginated). */
  gainers<T = Json>(params?: AssetFilters): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/coins/gainers', params);
  }

  /** Top losers (paginated). */
  losers<T = Json>(params?: AssetFilters): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/coins/losers', params);
  }

  /** Trending coins. */
  trending<T = Json>(params?: { limit?: number }): Promise<T> {
    return this.http.get<T>('/api/v1/coins/trending', params);
  }

  /** Get a single coin by slug. */
  get<T = Json>(slug: string, params?: { locale?: string }): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}`, params);
  }

  /** OHLC candle history for a coin. */
  history<T = Json>(slug: string, params?: CandleParams): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}/history`, params);
  }

  /** Marketcap history for a coin. */
  marketcapHistory<T = Json>(slug: string, params?: CandleParams): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}/marketcap-history`, params);
  }

  /** Price sparkline for a coin. */
  sparkline<T = Json>(slug: string, params?: { period?: string }): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}/sparkline`, params);
  }
}
