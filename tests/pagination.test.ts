import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jsonResponse, makeHttp, mockFetch } from './helpers.js';

interface Row {
  id: number;
}

const pageBody = (rows: number[], currentPage: number, lastPage: number) => ({
  data: rows.map((id) => ({ id })),
  meta: { current_page: currentPage, last_page: lastPage, per_page: rows.length, total: 6 },
  links: { next: currentPage < lastPage ? `https://api.test/api/v1/coins?page=${currentPage + 1}` : null },
});

test('getPage exposes data, meta and links', async () => {
  const { fetch } = mockFetch(jsonResponse(200, pageBody([1, 2], 1, 3)));
  const { http } = makeHttp(fetch);
  const page = await http.getPage<Row>('/api/v1/coins', { perPage: 2 });
  assert.deepEqual(
    page.data.map((row) => row.id),
    [1, 2],
  );
  assert.equal(page.meta.current_page, 1);
  assert.equal(page.hasMore, true);
});

test('hasMore is false on the last page and nextPage returns null', async () => {
  const { fetch } = mockFetch(jsonResponse(200, pageBody([5, 6], 3, 3)));
  const { http } = makeHttp(fetch);
  const page = await http.getPage<Row>('/api/v1/coins');
  assert.equal(page.hasMore, false);
  assert.equal(await page.nextPage(), null);
});

test('nextPage requests the following page and preserves the original query', async () => {
  const { fetch, calls } = mockFetch(jsonResponse(200, pageBody([1, 2], 1, 3)), jsonResponse(200, pageBody([3, 4], 2, 3)));
  const { http } = makeHttp(fetch);
  const first = await http.getPage<Row>('/api/v1/coins', { perPage: 2, sortBy: 'rank' });
  const second = await first.nextPage();
  assert.ok(second);
  assert.deepEqual(
    second.data.map((row) => row.id),
    [3, 4],
  );
  const url = new URL(calls[1]!.url);
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('per_page'), '2');
  assert.equal(url.searchParams.get('sort_by'), 'rank');
});

test('autoPages lazily walks every page in order', async () => {
  const { fetch, calls } = mockFetch(
    jsonResponse(200, pageBody([1, 2], 1, 3)),
    jsonResponse(200, pageBody([3, 4], 2, 3)),
    jsonResponse(200, pageBody([5, 6], 3, 3)),
  );
  const { http } = makeHttp(fetch);
  const page = await http.getPage<Row>('/api/v1/coins', { perPage: 2 });

  const seen: number[] = [];
  for await (const row of page.autoPages()) seen.push(row.id);
  assert.deepEqual(seen, [1, 2, 3, 4, 5, 6]);
  assert.equal(calls.length, 3);
});

test('the page itself is async-iterable (for await walks all pages)', async () => {
  const { fetch } = mockFetch(jsonResponse(200, pageBody([1], 1, 2)), jsonResponse(200, pageBody([2], 2, 2)));
  const { http } = makeHttp(fetch);
  const page = await http.getPage<Row>('/api/v1/coins');

  const seen: number[] = [];
  for await (const row of page) seen.push(row.id);
  assert.deepEqual(seen, [1, 2]);
});

test('an envelope without meta/links still yields a safe, final page', async () => {
  const { fetch } = mockFetch(jsonResponse(200, { data: [{ id: 9 }] }));
  const { http } = makeHttp(fetch);
  const page = await http.getPage<Row>('/api/v1/coins');
  assert.deepEqual(
    page.data.map((row) => row.id),
    [9],
  );
  assert.equal(page.hasMore, false);
  assert.equal(await page.nextPage(), null);
});

test('an empty data array yields an empty page', async () => {
  const { fetch } = mockFetch(jsonResponse(200, { data: [], meta: { current_page: 1, last_page: 1 }, links: {} }));
  const { http } = makeHttp(fetch);
  const page = await http.getPage<Row>('/api/v1/coins');
  assert.deepEqual(page.data, []);
  assert.equal(page.hasMore, false);
});
