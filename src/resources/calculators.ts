import { Resource } from './base.js';
import type { Json } from '../types.js';

/** Financial calculators. */
export class CalculatorsResource extends Resource {
  /** Dollar-cost-averaging calculator. */
  dca<T = Json>(params?: {
    slug?: string;
    amount?: number;
    interval?: string;
    start?: string;
    end?: string;
    series?: boolean;
  }): Promise<T> {
    return this.http.get<T>('/api/v1/calculators/dca', params);
  }

  /** Profit / loss calculator. */
  profitLoss<T = Json>(params?: {
    slug?: string;
    amount?: number;
    buyDate?: string;
    sellDate?: string;
    buyFee?: number;
    sellFee?: number;
  }): Promise<T> {
    return this.http.get<T>('/api/v1/calculators/profit-loss', params);
  }

  /** Compound interest calculator. */
  compoundInterest<T = Json>(params?: {
    principal?: number;
    rate?: number;
    duration?: number;
    durationUnit?: string;
    compoundFrequency?: string;
    contribution?: number;
    contributionFrequency?: string;
  }): Promise<T> {
    return this.http.get<T>('/api/v1/calculators/compound-interest', params);
  }

  /** Loan-vs-sell calculator. */
  loan<T = Json>(params?: {
    slug?: string;
    cryptoAmount?: number;
    neededCash?: number;
    termMonths?: number;
    interestRate?: number;
    ltv?: number;
    expectedGrowth?: number;
    taxRate?: number;
  }): Promise<T> {
    return this.http.get<T>('/api/v1/calculators/loan', params);
  }

  /** Staking rewards calculator. */
  staking<T = Json>(params?: {
    amount?: number;
    period?: number;
    periodUnit?: string;
    apy?: number;
    compoundFrequency?: string;
    commission?: number;
  }): Promise<T> {
    return this.http.get<T>('/api/v1/calculators/staking', params);
  }
}
