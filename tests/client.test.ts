import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Bitculator, BitculatorError, Page } from '../src/index.js';
import { jsonResponse, mockFetch } from './helpers.js';

test('requires an apiKey', () => {
  assert.throws(() => new Bitculator({} as never), (err) => err instanceof BitculatorError && /apiKey/.test(err.message));
});

test('exposes all 15 resource groups', () => {
  const { fetch } = mockFetch();
  const client = new Bitculator({ apiKey: 'k', fetch });
  const groups = [
    'coins',
    'prices',
    'markets',
    'exchanges',
    'wallets',
    'globalMarket',
    'sentiment',
    'indicators',
    'liquidations',
    'conversion',
    'calculators',
    'editorial',
    'alarms',
    'webhooks',
    'meta',
  ] as const;
  for (const group of groups) assert.ok(client[group], `client.${group} should exist`);
});

test('resource methods hit /api/v1 paths and return a Page for lists', async () => {
  const { fetch, calls } = mockFetch(jsonResponse(200, { data: [{ id: 1 }], meta: { current_page: 1, last_page: 1 } }));
  const client = new Bitculator({ apiKey: 'k', fetch });
  const page = await client.coins.list({ perPage: 1 });
  assert.ok(page instanceof Page);
  const url = new URL(calls[0]!.url);
  assert.equal(url.origin + url.pathname, 'https://bitculator.com/api/v1/coins');
  assert.equal(url.searchParams.get('per_page'), '1');
});

test('percent-encodes dynamic path segments', async () => {
  const { fetch, calls } = mockFetch(jsonResponse(200, { data: {} }));
  const client = new Bitculator({ apiKey: 'k', fetch });
  await client.coins.get('weird/slug name');
  const url = new URL(calls[0]!.url);
  assert.equal(url.pathname, '/api/v1/coins/weird%2Fslug%20name');
});

test('strips trailing slashes from a custom baseUrl', async () => {
  const { fetch, calls } = mockFetch(jsonResponse(200, { data: {} }));
  const client = new Bitculator({ apiKey: 'k', baseUrl: 'https://staging.test///', fetch });
  await client.coins.get('bitcoin');
  assert.ok(calls[0]!.url.startsWith('https://staging.test/api/v1/coins/bitcoin'));
});

test('defaults the User-Agent to bitculator-node/<version>', async () => {
  const { fetch, calls } = mockFetch(jsonResponse(200, { data: {} }));
  const client = new Bitculator({ apiKey: 'k', fetch });
  await client.coins.get('bitcoin');
  assert.match(calls[0]!.headers['User-Agent']!, /^bitculator-node\/\d+\.\d+\.\d+$/);
});

test('client.quota is null before the first call and updates after each response', async () => {
  const { fetch } = mockFetch(
    jsonResponse(200, { data: {} }, { 'X-Quota-Limit': '10000', 'X-Quota-Remaining': '9999' }),
    jsonResponse(200, { data: {} }, { 'X-Quota-Limit': '10000', 'X-Quota-Remaining': '9998' }),
  );
  const client = new Bitculator({ apiKey: 'k', fetch });
  const initial = client.quota;
  assert.equal(initial, null);
  await client.coins.get('bitcoin');
  const afterFirst = client.quota;
  assert.equal(afterFirst?.remaining, 9999);
  await client.coins.get('ethereum');
  const afterSecond = client.quota;
  assert.equal(afterSecond?.remaining, 9998);
});
