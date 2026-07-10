import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BitculatorError, ServerError, TimeoutError } from '../src/errors.js';
import { hangingFetch, jsonResponse, makeHttp, mockFetch } from './helpers.js';

const ok = (body: unknown = { data: 'ok' }) => jsonResponse(200, body);
const fail = (status: number, headers?: Record<string, string>) =>
  jsonResponse(status, { error: { code: 'err', message: 'nope' } }, headers);

test('GET retries a 5xx and succeeds', async () => {
  const { fetch, calls } = mockFetch(fail(500), ok());
  const { http } = makeHttp(fetch);
  assert.equal(await http.get('/api/v1/coins'), 'ok');
  assert.equal(calls.length, 2);
});

test('GET retries a network error and succeeds', async () => {
  const { fetch, calls } = mockFetch(new TypeError('fetch failed'), ok());
  const { http } = makeHttp(fetch);
  assert.equal(await http.get('/api/v1/coins'), 'ok');
  assert.equal(calls.length, 2);
});

test('DELETE retries a 5xx (idempotent) and succeeds', async () => {
  const { fetch, calls } = mockFetch(fail(500), ok());
  const { http } = makeHttp(fetch);
  assert.equal(await http.delete('/api/v1/alarms/1'), 'ok');
  assert.equal(calls.length, 2);
});

test('POST never retries a 5xx — one attempt, then ServerError', async () => {
  const { fetch, calls } = mockFetch(fail(500), ok());
  const { http } = makeHttp(fetch);
  await assert.rejects(http.post('/api/v1/alarms', { assetSlug: 'bitcoin' }), (err) => err instanceof ServerError);
  assert.equal(calls.length, 1);
});

test('POST never retries a network error — one attempt, then BitculatorError', async () => {
  const { fetch, calls } = mockFetch(new TypeError('fetch failed'), ok());
  const { http } = makeHttp(fetch);
  await assert.rejects(http.post('/api/v1/alarms', { assetSlug: 'bitcoin' }), (err) => {
    assert.ok(err instanceof BitculatorError);
    assert.match((err as Error).message, /Network error/);
    return true;
  });
  assert.equal(calls.length, 1);
});

test('POST does retry a 429 — the server did not process the request', async () => {
  const { fetch, calls } = mockFetch(fail(429), ok());
  const { http } = makeHttp(fetch);
  assert.equal(await http.post('/api/v1/alarms', { assetSlug: 'bitcoin' }), 'ok');
  assert.equal(calls.length, 2);
});

test('gives up after maxRetries and throws the final error', async () => {
  const { fetch, calls } = mockFetch(fail(500), fail(500), fail(500), ok());
  const { http } = makeHttp(fetch, { maxRetries: 2 });
  await assert.rejects(http.get('/api/v1/coins'), (err) => err instanceof ServerError);
  assert.equal(calls.length, 3); // initial attempt + 2 retries; the queued 200 is never reached
});

test('honors Retry-After seconds on a 429', async () => {
  const { fetch, calls } = mockFetch(fail(429, { 'Retry-After': '1' }), ok());
  const { http } = makeHttp(fetch);
  const started = Date.now();
  assert.equal(await http.get('/api/v1/coins'), 'ok');
  assert.ok(Date.now() - started >= 900, 'should have slept ~1s as instructed by Retry-After');
  assert.equal(calls.length, 2);
});

test('a timed-out GET throws TimeoutError once retries are exhausted', async () => {
  const { fetch, calls } = hangingFetch();
  const { http } = makeHttp(fetch, { timeout: 50, maxRetries: 1 });
  await assert.rejects(http.get('/api/v1/coins'), (err) => err instanceof TimeoutError);
  assert.equal(calls.length, 2); // the timeout is a transport failure, so the idempotent GET retried once
});

test('a timed-out POST throws TimeoutError without retrying', async () => {
  const { fetch, calls } = hangingFetch();
  const { http } = makeHttp(fetch, { timeout: 50 });
  await assert.rejects(http.post('/api/v1/alarms', { assetSlug: 'bitcoin' }), (err) => err instanceof TimeoutError);
  assert.equal(calls.length, 1);
});
