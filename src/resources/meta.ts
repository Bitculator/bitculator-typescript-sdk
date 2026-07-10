import { Resource } from './base.js';
import type { Json } from '../types.js';

/** Service metadata: spec, health, and key usage. */
export class MetaResource extends Resource {
  /** The raw OpenAPI specification for the API. */
  openapi<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/openapi.json');
  }

  /** Health check. */
  ping<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/ping');
  }

  /** Current key usage and quota. */
  usage<T = Json>(): Promise<T> {
    return this.http.get<T>('/api/v1/usage');
  }
}
