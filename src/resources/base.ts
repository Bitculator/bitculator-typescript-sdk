import type { HttpClient } from '../http.js';

/** Shared base for every resource group: holds the transport and encodes path segments. */
export abstract class Resource {
  constructor(protected readonly http: HttpClient) {}

  /** Percent-encode a dynamic path segment (slug or id) so it is URL-safe. */
  protected p(value: string | number): string {
    return encodeURIComponent(String(value));
  }
}
