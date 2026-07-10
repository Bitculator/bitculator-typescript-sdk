import { Resource } from './base.js';
import type { Json } from '../types.js';

/** Community sentiment and market-wide sentiment indices. */
export class SentimentResource extends Resource {
  /** Community vote tallies for a coin. */
  votes<T = Json>(slug: string): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}/votes`);
  }

  /** Cast a sentiment vote for a coin (`bullish` or `bearish`). */
  vote<T = Json>(slug: string, body: { vote: string }): Promise<T> {
    return this.http.post<T>(`/api/v1/coins/${this.p(slug)}/votes`, body);
  }

  /** Fear & Greed index. */
  fearGreed<T = Json>(params?: { coin?: string }): Promise<T> {
    return this.http.get<T>('/api/v1/sentiment/fear-greed', params);
  }

  /** Bull / Bear index. */
  bullBear<T = Json>(params?: { coin?: string }): Promise<T> {
    return this.http.get<T>('/api/v1/sentiment/bull-bear', params);
  }

  /** Altseason index. */
  altseason<T = Json>(params?: { days?: number }): Promise<T> {
    return this.http.get<T>('/api/v1/sentiment/altseason', params);
  }

  /** Aggregate market indicator tally. */
  indicators<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/sentiment/indicators');
  }
}
