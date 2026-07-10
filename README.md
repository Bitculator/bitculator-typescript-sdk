# Bitculator Data API — TypeScript / JavaScript SDK

The official SDK for the [Bitculator Data API](https://bitculator.com). Fully typed,
zero runtime dependencies (uses the platform `fetch`), works in Node 18+, Deno,
Bun, and the browser.

> Keep your API key server-side. It is a Bearer token with the `data-api` ability
> and is not meant for client-side embedding.

## Install

```bash
npm install @bitculator/sdk
```

## Quick start

```ts
import { Bitculator } from '@bitculator/sdk';

const client = new Bitculator({ apiKey: process.env.BITCULATOR_API_KEY! });

// Single resource — the `{ data }` envelope is unwrapped for you.
const bitcoin = await client.coins.get('bitcoin');
console.log(bitcoin.price); // "63520.780763913" — a decimal string, never rounded

// A paginated list.
const page = await client.coins.list({ perPage: 50, sort: '-marketcap' });
console.log(page.data, page.meta.total);
```

## Prices are decimal strings

Prices, rates, and supplies are returned as **strings** (e.g. `"63520.780763913"`)
to preserve full precision. Parse them with a big-decimal library if you need to do
math — do **not** pass them through `Number()`, which silently loses precision.

## Pagination

Every paginated method returns a `Page`. Read one page, or stream them all lazily:

```ts
// One page at a time.
let page = await client.exchanges.list({ perPage: 100 });
while (page) {
  for (const exchange of page.data) console.log(exchange.name);
  page = (await page.nextPage()) ?? null;
}

// Or auto-paginate across every page (await the first page, then iterate it).
for await (const coin of await client.coins.list({ sort: '-marketcap' })) {
  console.log(coin.symbol);
}
```

## Errors

Every failure derives from `BitculatorError`; HTTP failures throw a status-specific
subclass carrying the `{ error: { code, message, details } }` envelope.

```ts
import { ValidationError, RateLimitError, ApiError } from '@bitculator/sdk';

try {
  await client.coins.list({ perPage: 9999 }); // over the plan cap → 422
} catch (err) {
  if (err instanceof ValidationError) console.error(err.code, err.details);
  else if (err instanceof RateLimitError) console.error('retry after', err.retryAfter);
  else if (err instanceof ApiError) console.error(err.status, err.message);
  else throw err;
}
```

| Status | Error |
| ------ | ----- |
| 401 | `AuthenticationError` |
| 403 | `PermissionError` (plan does not include this endpoint) |
| 404 | `NotFoundError` |
| 422 | `ValidationError` (`.details` holds the field errors) |
| 429 | `RateLimitError` (`.retryAfter`) |
| 5xx | `ServerError` |

## Quota

Every response carries `X-Quota-*` headers, surfaced on the client after each call:

```ts
await client.coins.list();
console.log(client.quota); // { limit, remaining, reset, raw }
```

## Configuration

```ts
new Bitculator({
  apiKey: '...',                      // required
  baseUrl: 'https://bitculator.com',  // default
  timeout: 30_000,                    // ms, default
  maxRetries: 2,                      // auto-retry 429 / 5xx / network; 0 to disable
  fetch: customFetch,                 // optional: inject a fetch (proxies, tests)
});
```

## Typing responses

The API does not publish per-endpoint response schemas, so `data` is returned as
permissive JSON. Bring your own type per call with the method generic:

```ts
interface Coin { slug: string; name: string; price: string; rank: number }
const btc = await client.coins.get<Coin>('bitcoin'); // btc: Coin
```

## Resources

`coins` · `prices` · `markets` · `exchanges` · `wallets` · `globalMarket` ·
`sentiment` · `indicators` · `liquidations` · `conversion` · `calculators` ·
`editorial` · `alarms` · `webhooks` · `meta`

Full endpoint reference: <https://bitculator.com/en/documentation/api/v1>.

## License

MIT
