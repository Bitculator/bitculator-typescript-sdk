import { BitculatorError } from './errors.js';
import { HttpClient } from './http.js';
import { VERSION } from './version.js';
import type { ClientConfig, Quota } from './types.js';
import {
  AlarmsResource,
  CalculatorsResource,
  CoinsResource,
  ConversionResource,
  EditorialResource,
  ExchangesResource,
  GlobalMarketResource,
  IndicatorsResource,
  LiquidationsResource,
  MarketsResource,
  MetaResource,
  PricesResource,
  SentimentResource,
  WalletsResource,
  WebhooksResource,
} from './resources/index.js';

const DEFAULT_BASE_URL = 'https://bitculator.com';

/**
 * The Bitculator Data API client.
 *
 * ```ts
 * const client = new Bitculator({ apiKey: process.env.BITCULATOR_API_KEY! });
 * const bitcoin = await client.coins.get('bitcoin');
 * ```
 *
 * Each API group is a resource on the client: `client.coins`, `client.prices`,
 * `client.exchanges`, and so on.
 */
export class Bitculator {
  readonly coins: CoinsResource;
  readonly prices: PricesResource;
  readonly markets: MarketsResource;
  readonly exchanges: ExchangesResource;
  readonly wallets: WalletsResource;
  readonly globalMarket: GlobalMarketResource;
  readonly sentiment: SentimentResource;
  readonly indicators: IndicatorsResource;
  readonly liquidations: LiquidationsResource;
  readonly conversion: ConversionResource;
  readonly calculators: CalculatorsResource;
  readonly editorial: EditorialResource;
  readonly alarms: AlarmsResource;
  readonly webhooks: WebhooksResource;
  readonly meta: MetaResource;

  private _quota: Quota | null = null;

  constructor(config: ClientConfig) {
    if (!config || !config.apiKey) {
      throw new BitculatorError('A Data API key is required: new Bitculator({ apiKey })');
    }
    const fetchImpl = config.fetch ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : undefined);
    if (!fetchImpl) {
      throw new BitculatorError('No global fetch available. Use Node 18+, a browser, or pass `fetch` in the config.');
    }

    const http = new HttpClient({
      apiKey: config.apiKey,
      baseUrl: (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
      timeout: config.timeout ?? 30_000,
      maxRetries: config.maxRetries ?? 2,
      userAgent: config.userAgent ?? `bitculator-node/${VERSION}`,
      fetch: fetchImpl,
      onQuota: (quota) => {
        this._quota = quota;
      },
    });

    this.coins = new CoinsResource(http);
    this.prices = new PricesResource(http);
    this.markets = new MarketsResource(http);
    this.exchanges = new ExchangesResource(http);
    this.wallets = new WalletsResource(http);
    this.globalMarket = new GlobalMarketResource(http);
    this.sentiment = new SentimentResource(http);
    this.indicators = new IndicatorsResource(http);
    this.liquidations = new LiquidationsResource(http);
    this.conversion = new ConversionResource(http);
    this.calculators = new CalculatorsResource(http);
    this.editorial = new EditorialResource(http);
    this.alarms = new AlarmsResource(http);
    this.webhooks = new WebhooksResource(http);
    this.meta = new MetaResource(http);
  }

  /** Quota (`X-Quota-*`) from the most recent response, or `null` before the first call. */
  get quota(): Quota | null {
    return this._quota;
  }
}
