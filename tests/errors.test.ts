import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiError,
  AuthenticationError,
  BitculatorError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  ServerError,
  ValidationError,
} from '../src/errors.js';
import { jsonResponse, makeHttp, mockFetch, textResponse } from './helpers.js';

const envelope = (code: string, message: string, details?: unknown) => ({ error: { code, message, details } });

/** One-shot client: no retries, so every status maps straight to its error. */
function oneShot(...responses: Response[]) {
  const { fetch } = mockFetch(...responses);
  return makeHttp(fetch, { maxRetries: 0 }).http;
}

test('maps statuses to the typed error hierarchy', async () => {
  const cases: Array<[number, new (...args: never[]) => ApiError]> = [
    [401, AuthenticationError],
    [403, PermissionError],
    [404, NotFoundError],
    [422, ValidationError],
    [429, RateLimitError],
    [500, ServerError],
    [503, ServerError],
  ];
  for (const [status, expected] of cases) {
    const http = oneShot(jsonResponse(status, envelope('some_code', `status ${status}`)));
    await assert.rejects(http.get('/api/v1/coins'), (err) => {
      assert.ok(err instanceof expected, `status ${status} should map to ${expected.name}, got ${(err as Error).constructor.name}`);
      assert.ok(err instanceof BitculatorError, 'every API error derives from BitculatorError');
      assert.equal((err as ApiError).status, status);
      return true;
    });
  }
});

test('an unmapped 4xx falls back to plain ApiError', async () => {
  const http = oneShot(jsonResponse(418, envelope('teapot', 'I am a teapot')));
  await assert.rejects(http.get('/api/v1/coins'), (err) => {
    assert.equal((err as Error).constructor, ApiError);
    return true;
  });
});

test('carries code, message and details from the error envelope', async () => {
  const details = { per_page: ['must not be greater than 100'] };
  const http = oneShot(jsonResponse(422, envelope('validation_failed', 'Invalid parameters.', details)));
  await assert.rejects(http.get('/api/v1/coins'), (err) => {
    const apiErr = err as ValidationError;
    assert.equal(apiErr.code, 'validation_failed');
    assert.equal(apiErr.message, 'Invalid parameters.');
    assert.deepEqual(apiErr.details, details);
    return true;
  });
});

test('falls back to a top-level message, then to HTTP <status>', async () => {
  const withMessage = oneShot(jsonResponse(500, { message: 'Whoops.' }));
  await assert.rejects(withMessage.get('/api/v1/coins'), (err) => (err as ApiError).message === 'Whoops.');

  const rawText = oneShot(textResponse(502, 'Bad Gateway'));
  await assert.rejects(rawText.get('/api/v1/coins'), (err) => {
    assert.equal((err as ApiError).message, 'HTTP 502');
    assert.equal((err as ApiError).code, null);
    return true;
  });
});

test('captures the X-Request-Id header', async () => {
  const http = oneShot(jsonResponse(500, envelope('server_error', 'boom'), { 'X-Request-Id': 'req_123' }));
  await assert.rejects(http.get('/api/v1/coins'), (err) => (err as ApiError).requestId === 'req_123');
});

test('RateLimitError exposes retryAfter from the Retry-After header', async () => {
  const http = oneShot(jsonResponse(429, envelope('rate_limited', 'Slow down'), { 'Retry-After': '30' }));
  await assert.rejects(http.get('/api/v1/coins'), (err) => {
    assert.ok(err instanceof RateLimitError);
    assert.equal(err.retryAfter, 30);
    return true;
  });
});

test('RateLimitError retryAfter is null when the header is absent or unparsable', async () => {
  const absent = oneShot(jsonResponse(429, envelope('rate_limited', 'Slow down')));
  await assert.rejects(absent.get('/api/v1/coins'), (err) => (err as RateLimitError).retryAfter === null);

  const garbage = oneShot(jsonResponse(429, envelope('rate_limited', 'Slow down'), { 'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT' }));
  await assert.rejects(garbage.get('/api/v1/coins'), (err) => (err as RateLimitError).retryAfter === null);
});
