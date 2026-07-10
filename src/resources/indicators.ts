import { Resource } from './base.js';
import type { IndicatorParams, Json, SeriesParams } from '../types.js';

/** Technical indicators for a coin. */
export class IndicatorsResource extends Resource {
  private period<T>(slug: string, name: string, params?: IndicatorParams): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}/indicators/${name}`, params);
  }

  private series<T>(slug: string, name: string, params?: SeriesParams): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}/indicators/${name}`, params);
  }

  /** All indicators for a coin at a glance. */
  snapshot<T = Json>(slug: string): Promise<T> {
    return this.http.get<T>(`/api/v1/coins/${this.p(slug)}/indicators`);
  }

  /** Relative Strength Index. */
  rsi<T = Json>(slug: string, params?: IndicatorParams): Promise<T> {
    return this.period<T>(slug, 'rsi', params);
  }

  /** Stochastic RSI. */
  stochRsi<T = Json>(slug: string, params?: IndicatorParams): Promise<T> {
    return this.period<T>(slug, 'stoch-rsi', params);
  }

  /** Simple Moving Average. */
  sma<T = Json>(slug: string, params?: IndicatorParams): Promise<T> {
    return this.period<T>(slug, 'sma', params);
  }

  /** Commodity Channel Index. */
  cci<T = Json>(slug: string, params?: IndicatorParams): Promise<T> {
    return this.period<T>(slug, 'cci', params);
  }

  /** Money Flow Index. */
  mfi<T = Json>(slug: string, params?: IndicatorParams): Promise<T> {
    return this.period<T>(slug, 'mfi', params);
  }

  /** Williams %R. */
  williamsR<T = Json>(slug: string, params?: IndicatorParams): Promise<T> {
    return this.period<T>(slug, 'williams-r', params);
  }

  /** Price volatility. */
  priceVolatility<T = Json>(slug: string, params?: IndicatorParams): Promise<T> {
    return this.period<T>(slug, 'price-volatility', params);
  }

  /** Volume volatility. */
  volumeVolatility<T = Json>(slug: string, params?: IndicatorParams): Promise<T> {
    return this.period<T>(slug, 'volume-volatility', params);
  }

  /** Moving Average Convergence Divergence. */
  macd<T = Json>(slug: string, params?: SeriesParams): Promise<T> {
    return this.series<T>(slug, 'macd', params);
  }

  /** On-Balance Volume. */
  obv<T = Json>(slug: string, params?: SeriesParams): Promise<T> {
    return this.series<T>(slug, 'obv', params);
  }

  /** Average Directional Index. */
  adx<T = Json>(slug: string, params?: SeriesParams): Promise<T> {
    return this.series<T>(slug, 'adx', params);
  }

  /** Volume-Weighted Average Price. */
  vwap<T = Json>(slug: string, params?: SeriesParams): Promise<T> {
    return this.series<T>(slug, 'vwap', params);
  }

  /** Chaikin Money Flow. */
  cmf<T = Json>(slug: string, params?: SeriesParams): Promise<T> {
    return this.series<T>(slug, 'cmf', params);
  }
}
