import { Resource } from './base.js';
import type { Page } from '../pagination.js';
import type { Json, Pagination } from '../types.js';

/** Editorial content: articles, videos, and insights. */
export class EditorialResource extends Resource {
  /** Videos for a coin (paginated). */
  coinVideos<T = Json>(
    slug: string,
    params?: Pagination & { type?: string; search?: string },
  ): Promise<Page<T>> {
    return this.http.getPage<T>(`/api/v1/coins/${this.p(slug)}/videos`, params);
  }

  /** Insight timeline for a coin. */
  coinInsights<T = Json>(
    slug: string,
    params?: { locale?: string; offset?: number; limit?: number },
  ): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}/insights`, params);
  }

  /** List articles (paginated). */
  articles<T = Json>(
    params?: Pagination & {
      locale?: string;
      tag?: string;
      coin?: string;
      exchange?: string;
      wallet?: string;
      search?: string;
    },
  ): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/articles', params);
  }

  /** Get a single article by slug. */
  article<T = Json>(slug: string, params?: { locale?: string }): Promise<T> {
    return this.http.get<T>(`/api/v1/articles/${this.p(slug)}`, params);
  }

  /** Submit helpful/unhelpful feedback on an article. */
  submitArticleFeedback<T = Json>(slug: string, body: { helpful: boolean }): Promise<T> {
    return this.http.post<T>(`/api/v1/articles/${this.p(slug)}/feedback`, body);
  }

  /** Get a single video by id. */
  video<T = Json>(id: string | number): Promise<T> {
    return this.http.get<T>(`/api/v1/videos/${this.p(id)}`);
  }

  /** List insights (paginated). */
  insights<T = Json>(
    params?: Pagination & {
      locale?: string;
      type?: string;
      coin?: string;
      search?: string;
      sort?: string;
    },
  ): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/insights', params);
  }

  /** Get a single insight by id. */
  insight<T = Json>(id: string | number, params?: { locale?: string }): Promise<T> {
    return this.http.get<T>(`/api/v1/insights/${this.p(id)}`, params);
  }
}
