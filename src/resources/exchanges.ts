import { Resource } from './base.js';
import type { Page } from '../pagination.js';
import type { AssetFilters, CandleParams, Json, Pagination, TickerFilters } from '../types.js';

/** Exchanges: listings, trust score, history, markets, and listed assets. */
export class ExchangesResource extends Resource {
  /** List exchanges (paginated). */
  list<T = Json>(
    params?: Pagination & {
      type?: string;
      search?: string;
      minPairs?: number;
      maxPairs?: number;
      minAssets?: number;
      maxAssets?: number;
      minVolume?: number;
      maxVolume?: number;
      ids?: string | string[];
      slugs?: string | string[];
      sort?: string;
    },
  ): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/exchanges', params);
  }

  /** Get a single exchange by slug. */
  get<T = Json>(slug: string): Promise<T> {
    return this.http.get<T>(`/api/v1/exchanges/${this.p(slug)}`);
  }

  /** Get an exchange's trust score. */
  trustScore<T = Json>(slug: string): Promise<T> {
    return this.http.get<T>(`/api/v1/exchanges/${this.p(slug)}/trust-score`);
  }

  /** Volume/history for an exchange. */
  history<T = Json>(slug: string, params?: CandleParams): Promise<T> {
    return this.http.get<T>(`/api/v1/exchanges/${this.p(slug)}/history`, params);
  }

  /** Sparkline for an exchange. */
  sparkline<T = Json>(slug: string, params?: { period?: string }): Promise<T> {
    return this.http.get<T>(`/api/v1/exchanges/${this.p(slug)}/sparkline`, params);
  }

  /** Markets (tickers) on an exchange (paginated). */
  tickers<T = Json>(slug: string, params?: TickerFilters): Promise<Page<T>> {
    return this.http.getPage<T>(`/api/v1/exchanges/${this.p(slug)}/tickers`, params);
  }

  /** Coins listed on an exchange (paginated). */
  assets<T = Json>(slug: string, params?: AssetFilters): Promise<Page<T>> {
    return this.http.getPage<T>(`/api/v1/exchanges/${this.p(slug)}/assets`, params);
  }
}
