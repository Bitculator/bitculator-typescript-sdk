import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BitculatorError, DecodeError } from '../src/errors.js';
import { jsonResponse, makeHttp, mockFetch, textResponse } from './helpers.js';

test('sends Bearer auth, Accept and User-Agent headers', async () => {
  const { fetch, calls } = mockFetch(jsonResponse(200, { data: {} }));
  const { http } = makeHttp(fetch);
  await http.get('/api/v1/coins/bitcoin');
  const headers = calls[0]!.headers;
  assert.equal(headers['Authorization'], 'Bearer test-key');
  assert.equal(headers['Accept'], 'application/json');
  assert.equal(headers['User-Agent'], 'bitculator-node/test');
  assert.equal(headers['Content-Type'], undefined);
});

test('POST sends a JSON Content-Type and snake_cases top-level body keys', async () => {
  const { fetch, calls } = mockFetch(jsonResponse(200, { data: {} }));
  const { http } = makeHttp(fetch);
  await http.post('/api/v1/alarms', { assetSlug: 'bitcoin', targetPrice: '65000.10' });
  const call = calls[0]!;
  assert.equal(call.method, 'POST');
  assert.equal(call.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(call.body!), { asset_slug: 'bitcoin', target_price: '65000.10' });
});

test('an unencodable body throws BitculatorError without hitting the network', async () => {
  const { fetch, calls } = mockFetch();
  const { http } = makeHttp(fetch);
  const circular: Record<string, unknown> = {};
  circular['self'] = circular;
  await assert.rejects(http.post('/api/v1/alarms', circular), (err) => {
    assert.ok(err instanceof BitculatorError);
    assert.match(err.message, /Failed to encode request body/);
    return true;
  });
  assert.equal(calls.length, 0);
});

test('unwraps the { data } envelope', async () => {
  const { fetch } = mockFetch(jsonResponse(200, { data: { name: 'Bitcoin', price: '67412.83451201' } }));
  const { http } = makeHttp(fetch);
  const coin = await http.get<{ name: string; price: string }>('/api/v1/coins/bitcoin');
  assert.equal(coin.name, 'Bitcoin');
  assert.equal(coin.price, '67412.83451201');
});

test('passes through bodies that carry no data key', async () => {
  const { fetch } = mockFetch(jsonResponse(200, { openapi: '3.0.0' }));
  const { http } = makeHttp(fetch);
  const spec = await http.get<{ openapi: string }>('/api/v1/openapi.json');
  assert.equal(spec.openapi, '3.0.0');
});

test('an empty 2xx body resolves to undefined', async () => {
  const { fetch } = mockFetch(textResponse(204, ''));
  const { http } = makeHttp(fetch);
  assert.equal(await http.delete('/api/v1/alarms/1'), undefined);
});

test('a malformed 2xx body throws DecodeError', async () => {
  const { fetch } = mockFetch(textResponse(200, '<html>gateway page</html>'));
  const { http } = makeHttp(fetch);
  await assert.rejects(http.get('/api/v1/coins'), (err) => err instanceof DecodeError);
});

test('parses X-Quota-* headers into a typed quota on every response', async () => {
  const { fetch } = mockFetch(
    jsonResponse(200, { data: [] }, { 'X-Quota-Limit': '10000', 'X-Quota-Remaining': '9871', 'X-Quota-Reset': '1720569600' }),
  );
  const { http, quotas } = makeHttp(fetch);
  await http.get('/api/v1/coins');
  assert.equal(quotas.length, 1);
  const quota = quotas[0]!;
  assert.equal(quota.limit, 10000);
  assert.equal(quota.remaining, 9871);
  assert.equal(quota.reset, 1720569600);
  assert.equal(quota.raw['x-quota-limit'], '10000');
});

test('missing quota headers parse to nulls', async () => {
  const { fetch } = mockFetch(jsonResponse(200, { data: [] }));
  const { http, quotas } = makeHttp(fetch);
  await http.get('/api/v1/coins');
  assert.deepEqual(quotas[0], { limit: null, remaining: null, reset: null, raw: {} });
});
