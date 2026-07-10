/**
 * A single page of a paginated list, plus lazy forward navigation.
 *
 * `page.data` is the current page's rows. `page.autoPages()` (and iterating the
 * page directly with `for await`) transparently walks every following page.
 */
import type { HttpClient } from './http.js';
import type { PageLinks, PaginationMeta } from './types.js';

export class Page<T> {
  /** Rows on this page. */
  readonly data: T[];
  /** Laravel paginator metadata (current_page, last_page, total, ...). */
  readonly meta: PaginationMeta;
  /** Page navigation links. */
  readonly links: PageLinks;

  constructor(
    private readonly http: HttpClient,
    private readonly path: string,
    private readonly query: object | undefined,
    envelope: unknown,
  ) {
    const env = (envelope ?? {}) as { data?: T[]; meta?: PaginationMeta; links?: PageLinks };
    this.data = env.data ?? [];
    this.meta = env.meta ?? ({} as PaginationMeta);
    this.links = env.links ?? ({} as PageLinks);
  }

  /** True if at least one more page exists. */
  get hasMore(): boolean {
    if (this.links.next) return true;
    const { current_page, last_page } = this.meta;
    return current_page != null && last_page != null && current_page < last_page;
  }

  /** Fetch the next page, or `null` if this is the last one. */
  async nextPage(): Promise<Page<T> | null> {
    if (!this.hasMore) return null;
    const nextPageNumber = (this.meta.current_page ?? 1) + 1;
    return this.http.getPage<T>(this.path, { ...this.query, page: nextPageNumber });
  }

  /** Yield every row across this and all following pages, fetching lazily. */
  async *autoPages(): AsyncIterableIterator<T> {
    let page: Page<T> | null = this;
    while (page) {
      yield* page.data;
      page = await page.nextPage();
    }
  }

  /** `for await (const row of page)` walks all pages. */
  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this.autoPages();
  }
}
