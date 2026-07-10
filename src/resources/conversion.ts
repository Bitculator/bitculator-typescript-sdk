import { Resource } from './base.js';
import type { Json } from '../types.js';

/** Asset conversion and reference rates. */
export class ConversionResource extends Resource {
  /** Convert an amount between two assets. */
  convert<T = Json>(params?: { from?: string; to?: string; amount?: number }): Promise<T> {
    return this.http.get<T>('/api/v1/convert', params);
  }

  /** List supported fiat currencies. */
  fiats<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/fiats');
  }

  /** List conversion rates. */
  rates<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/rates');
  }
}
