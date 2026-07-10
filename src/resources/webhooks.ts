import { Resource } from './base.js';
import type { Page } from '../pagination.js';
import type { Json, Pagination } from '../types.js';

/** Webhook endpoints and their delivery log. */
export class WebhooksResource extends Resource {
  /** List your webhook endpoints. */
  list<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/webhooks');
  }

  /** Register a webhook endpoint for a set of events. */
  create<T = Json>(body: { url: string; events: string[] }): Promise<T> {
    return this.http.post<T>('/api/v1/webhooks', body);
  }

  /** Delete a webhook endpoint by id. */
  delete<T = Json>(id: string | number): Promise<T> {
    return this.http.delete<T>(`/api/v1/webhooks/${this.p(id)}`);
  }

  /** Send a test event to a webhook endpoint. */
  test<T = Json>(id: string | number): Promise<T> {
    return this.http.post<T>(`/api/v1/webhooks/${this.p(id)}/test`);
  }

  /** Delivery log for a webhook endpoint (paginated). */
  deliveries<T = Json>(id: string | number, params?: Pagination): Promise<Page<T>> {
    return this.http.getPage<T>(`/api/v1/webhooks/${this.p(id)}/deliveries`, params);
  }
}
