/**
 * Run with: BITCULATOR_API_KEY=... npx tsx examples/quickstart.ts
 * (against local dev, add BITCULATOR_BASE_URL=http://localhost)
 */
import { Bitculator, ApiError } from '../src/index.js';

const client = new Bitculator({
  apiKey: process.env.BITCULATOR_API_KEY ?? '',
  baseUrl: process.env.BITCULATOR_BASE_URL ?? 'https://bitculator.com',
});

async function main(): Promise<void> {
  // Health check.
  await client.meta.ping();

  // Single resource — envelope unwrapped.
  const bitcoin = await client.coins.get('bitcoin');
  console.log('BTC price:', bitcoin.price);

  // Top 5 coins by marketcap.
  const top = await client.coins.list({ perPage: 5, sort: '-marketcap' });
  for (const coin of top.data) {
    console.log(`#${coin.rank}`, coin.symbol, coin.price);
  }

  // Auto-paginate the first ~2 pages of gainers.
  let seen = 0;
  for await (const coin of await client.coins.gainers({ perPage: 20 })) {
    console.log('gainer:', coin.symbol, coin.change_24h);
    if (++seen >= 40) break;
  }

  // A technical indicator.
  const rsi = await client.indicators.rsi('bitcoin', { period: 14 });
  console.log('RSI(14):', rsi);

  console.log('quota:', client.quota);
}

main().catch((err) => {
  if (err instanceof ApiError) console.error(`API ${err.status}:`, err.code, err.message);
  else console.error(err);
  process.exitCode = 1;
});
