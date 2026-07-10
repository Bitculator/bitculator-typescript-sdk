import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jsonResponse, makeHttp, mockFetch } from './helpers.js';

const ok = () => jsonResponse(200, { data: [] });

async function urlFor(query: object | undefined): Promise<URL> {
  const { fetch, calls } = mockFetch(ok());
  const { http } = makeHttp(fetch);
  await http.get('/api/v1/coins', query);
  return new URL(calls[0]!.url);
}

test('camelCase params go on the wire as snake_case', async () => {
  const url = await urlFor({ perPage: 5, sortBy: 'rank' });
  assert.equal(url.searchParams.get('per_page'), '5');
  assert.equal(url.searchParams.get('sort_by'), 'rank');
  assert.equal(url.searchParams.has('perPage'), false);
});

test('array params serialize to CSV', async () => {
  const url = await urlFor({ symbols: ['btc', 'eth', 'sol'] });
  assert.equal(url.searchParams.get('symbols'), 'btc,eth,sol');
});

test('empty arrays and nullish params are dropped', async () => {
  const url = await urlFor({ symbols: [], locale: null, period: undefined, page: 1 });
  assert.equal(url.searchParams.has('symbols'), false);
  assert.equal(url.searchParams.has('locale'), false);
  assert.equal(url.searchParams.has('period'), false);
  assert.equal(url.searchParams.get('page'), '1');
});

test('no params means no query string', async () => {
  const url = await urlFor(undefined);
  assert.equal(url.search, '');
});

test('booleans serialize as true/false', async () => {
  const url = await urlFor({ includeInactive: true });
  assert.equal(url.searchParams.get('include_inactive'), 'true');
});

test('tiny floats are expanded to plain decimals, never scientific notation', async () => {
  const url = await urlFor({ minPrice: 1e-7, maxPrice: -2.5e-8 });
  assert.equal(url.searchParams.get('min_price'), '0.0000001');
  assert.equal(url.searchParams.get('max_price'), '-0.000000025');
});

test('huge floats are expanded to plain decimals', async () => {
  const url = await urlFor({ minMarketcap: 1e21 });
  assert.equal(url.searchParams.get('min_marketcap'), '1000000000000000000000');
});

test('ordinary numbers keep their shortest representation', async () => {
  const url = await urlFor({ minPrice: 0.1, page: 42 });
  assert.equal(url.searchParams.get('min_price'), '0.1');
  assert.equal(url.searchParams.get('page'), '42');
});
