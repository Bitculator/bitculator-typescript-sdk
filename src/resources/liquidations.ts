import { Resource } from './base.js';
import type { Page } from '../pagination.js';
import type { Json, Pagination } from '../types.js';

/** Liquidation feed and aggregates. */
export class LiquidationsResource extends Resource {
  /** Live liquidation feed (paginated). */
  feed<T = Json>(
    params?: Pagination & {
      exchange?: string;
      instrument?: string;
      position?: string;
      order?: string;
      symbol?: string;
      minUsd?: number;
    },
  ): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/liquidations', params);
  }

  /** Hourly liquidation totals. */
  hourly<T = Json>(params?: { hours?: number }): Promise<T> {
    return this.http.get<T>('/api/v1/liquidations/hourly', params);
  }

  /** Daily liquidation totals. */
  daily<T = Json>(params?: { days?: number }): Promise<T> {
    return this.http.get<T>('/api/v1/liquidations/daily', params);
  }

  /** Today's liquidation summary. */
  summary<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/liquidations/summary');
  }

  /** Long/short liquidation netflow. */
  netflow<T = Json>(params?: { days?: number }): Promise<T> {
    return this.http.get<T>('/api/v1/liquidations/netflow', params);
  }

  /** Most-liquidated coins. */
  coins<T = Json>(params?: { hours?: number; limit?: number }): Promise<T> {
    return this.http.get<T>('/api/v1/liquidations/coins', params);
  }
}
