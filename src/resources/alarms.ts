import { Resource } from './base.js';
import type { Page } from '../pagination.js';
import type { Json, Pagination } from '../types.js';

/** Price alarms owned by the API key. */
export class AlarmsResource extends Resource {
  /** List your alarms (paginated). */
  list<T = Json>(
    params?: Pagination & { status?: string; direction?: string; notification?: string },
  ): Promise<Page<T>> {
    return this.http.getPage<T>('/api/v1/alarms', params);
  }

  /** Create an alarm. */
  create<T = Json>(body: {
    name: string;
    coin: string;
    metric: string;
    direction: string;
    target: number;
    notification: string;
  }): Promise<T> {
    return this.http.post<T>('/api/v1/alarms', body);
  }

  /** Delete an alarm by id. */
  delete<T = Json>(id: string | number): Promise<T> {
    return this.http.delete<T>(`/api/v1/alarms/${this.p(id)}`);
  }
}
