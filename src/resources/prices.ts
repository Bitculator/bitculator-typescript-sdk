import { Resource } from './base.js';
import type { Json } from '../types.js';

/** Lightweight price lookups. */
export class PricesResource extends Resource {
  /** Get prices for many coins at once. */
  list<T = Json>(params?: {
    ids?: string | string[];
    slugs?: string | string[];
    symbols?: string | string[];
    convert?: string;
  }): Promise<T> {
    return this.http.get<T>('/api/v1/prices', params);
  }

  /** Get the price of a single coin. */
  get<T = Json>(slug: string, params?: { convert?: string }): Promise<T> {
    return this.http.get<T>(`/api/v1/prices/${this.p(slug)}`, params);
  }

  /** Historical price of a coin on a given date. */
  historical<T = Json>(params?: { slug?: string; date?: string }): Promise<T> {
    return this.http.get<T>('/api/v1/historical-price', params);
  }
}
