/**
 * Test doubles for the transport seam. The SDK takes any `fetch`-compatible
 * function, so tests inject one that serves queued canned responses and
 * records every call — no network, no mocking framework.
 */
import { HttpClient, type HttpConfig } from '../src/http.js';
import type { Quota } from '../src/types.js';

export interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}

/** A queued step: a canned Response, an Error to throw (network failure), or a factory. */
export type Step = Response | Error | (() => Response);

export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

export function textResponse(status: number, text: string, headers: Record<string, string> = {}): Response {
  // Null-body statuses (204/205/304) reject any body, even an empty string.
  return new Response(text === '' ? null : text, { status, headers });
}

/** A fetch double that shifts one queued step per call and records each call. */
export function mockFetch(...steps: Step[]): { fetch: typeof fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const impl = async (input: unknown, init: RequestInit = {}): Promise<Response> => {
    calls.push({
      url: String(input),
      method: init.method ?? 'GET',
      headers: { ...((init.headers ?? {}) as Record<string, string>) },
      body: init.body as string | undefined,
    });
    const step = steps.shift();
    if (!step) throw new Error('mockFetch: no more queued responses');
    if (step instanceof Error) throw step;
    return typeof step === 'function' ? step() : step;
  };
  return { fetch: impl as typeof fetch, calls };
}

/** A fetch double that never resolves; rejects with an AbortError when the signal fires. */
export function hangingFetch(): { fetch: typeof fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const impl = (input: unknown, init: RequestInit = {}): Promise<Response> => {
    calls.push({
      url: String(input),
      method: init.method ?? 'GET',
      headers: { ...((init.headers ?? {}) as Record<string, string>) },
      body: init.body as string | undefined,
    });
    return new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' })));
    });
  };
  return { fetch: impl as typeof fetch, calls };
}

/** An HttpClient wired to the given fetch double, with test-friendly defaults. */
export function makeHttp(
  fetchImpl: typeof fetch,
  overrides: Partial<Omit<HttpConfig, 'fetch' | 'onQuota'>> = {},
): { http: HttpClient; quotas: Quota[] } {
  const quotas: Quota[] = [];
  const http = new HttpClient({
    apiKey: 'test-key',
    baseUrl: 'https://api.test',
    timeout: 2000,
    maxRetries: 2,
    userAgent: 'bitculator-node/test',
    fetch: fetchImpl,
    onQuota: (quota) => {
      quotas.push(quota);
    },
    ...overrides,
  });
  return { http, quotas };
}
