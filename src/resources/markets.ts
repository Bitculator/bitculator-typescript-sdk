import { Resource } from './base.js';
import type { Page } from '../pagination.js';
import type { Json, Pagination, TickerFilters } from '../types.js';

/** Markets, tickers, and trading pairs. */
export class MarketsResource extends Resource {
  /** Markets (tickers) for a coin (paginated). */
  coinMarkets<T = Json>(slug: string, params?: TickerFilters): Promise<Page<T>> {
    return this.http.getPage<T>(`/api/v1/coins/${this.p(slug)}/markets`, params);
  }

  /** Trading symbols for a coin. */
  coinSymbols<T = Json>(slug: string): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}/symbols`);
  }

  /** List tickers across the market (paginated). */
  tickers<T = Json>(params?: TickerFilters): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/tickers', params);
  }

  /** List trading pairs (paginated). */
  pairs<T = Json>(
    params?: Pagination & {
      search?: string;
      coin?: string;
      minVolume?: number;
      maxVolume?: number;
      sort?: string;
    },
  ): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/pairs', params);
  }

  /** Get a single trading pair by id. */
  pair<T = Json>(id: string | number): Promise<T> {
    return this.http.get<T>(`/api/v1/pairs/${this.p(id)}`);
  }
}
