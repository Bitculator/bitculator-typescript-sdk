import { Resource } from './base.js';
import type { Json } from '../types.js';

/** Global market aggregates. */
export class GlobalMarketResource extends Resource {
  /** Global market snapshot (total marketcap, volume, dominance, ...). */
  snapshot<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/global');
  }

  /** Market heatmap data. */
  heatmap<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/global/heatmap');
  }

  /** Global marketcap or volume history. `metric` is e.g. `marketcap` or `volume`. */
  history<T = Json>(metric: string, params?: { period?: string }): Promise<T> {
    return this.http.get<T>(`/api/v1/global/history/${this.p(metric)}`, params);
  }
}
