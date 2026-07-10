import { Resource } from './base.js';
import type { Page } from '../pagination.js';
import type { AssetFilters, Json, Pagination } from '../types.js';

/** Wallets: listings, release timeline, comparison, and supported coins. */
export class WalletsResource extends Resource {
  /** List wallets (paginated). */
  list<T = Json>(params?: WalletFilters): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/wallets', params);
  }

  /** Wallet release timeline (paginated). */
  timeline<T = Json>(params?: WalletFilters): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/wallets/timeline', params);
  }

  /** Compare a set of wallets side by side. */
  compare<T = Json>(params?: { slugs?: string | string[] }): Promise<T> {
    return this.http.get<T>('/api/v1/wallets/compare', params);
  }

  /** Get a single wallet by slug. */
  get<T = Json>(slug: string): Promise<T> {
    return this.http.get<T>(`/api/v1/wallets/${this.p(slug)}`);
  }

  /** Coins supported by a wallet (paginated). */
  assets<T = Json>(slug: string, params?: AssetFilters): Promise<Page<T>> {
    return this.http.getPage<T>(`/api/v1/wallets/${this.p(slug)}/assets`, params);
  }
}

/** Filters shared by the wallet list and timeline endpoints. */
export interface WalletFilters extends Pagination {
  search?: string;
  minScore?: number;
  maxScore?: number;
  tags?: string | string[];
  ids?: string | string[];
  slugs?: string | string[];
  sort?: string;
}
