import { Router, Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

interface CacheEntry {
  data: any;
  timestamp: number;
}

const ratesCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 60 * 60 * 1000;

const getCachedRates = (base: string) => {
  const entry = ratesCache.get(base);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  ratesCache.delete(base);
  return null;
};

const setCacheRates = (base: string, data: any) => {
  ratesCache.set(base, { data, timestamp: Date.now() });
};

const fallbackRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.15,
  BRL: 4.97,
  KRW: 1320.50,
  SGD: 1.34,
  HKD: 7.82,
  NOK: 10.62,
  SEK: 10.42,
  DKK: 6.87,
  NZD: 1.64,
  ZAR: 18.65,
  RUB: 89.50,
  MMK: 2100,
  THB: 35.50,
  VND: 24500,
  IDR: 15700,
  MYR: 4.72,
  PHP: 56.20,
  BND: 1.34,
  KHR: 4100,
  LAK: 20700,
  PKR: 278.50,
  LKR: 322.00,
  NPR: 133.00,
  BTN: 83.12,
  MVR: 15.42,
  AFN: 71.50,
  TJS: 10.95,
  UZS: 12350,
  KZT: 450.50,
  KGS: 89.20,
  TMT: 3.50,
  AZN: 1.70,
  GEL: 2.68,
  AMD: 405.00,
  ILS: 3.65,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  BHD: 0.38,
  KWD: 0.31,
  OMR: 0.38,
  EGP: 30.90,
  TND: 3.12,
  MAD: 10.05,
  DZD: 134.50,
  NGN: 775.00,
  GHS: 12.35,
  KES: 153.50,
  UGX: 3780,
  TZS: 2510,
  ZMW: 26.50,
  BWP: 13.65,
  MZN: 63.75,
  MUR: 44.50,
  SCR: 13.25,
  ETB: 56.80,
  XOF: 603.50,
  XAF: 603.50,
  AOA: 825.00,
  CDF: 2750,
  MDL: 17.85,
  UAH: 37.50,
  BYN: 3.25,
  PLN: 4.02,
  CZK: 22.85,
  HUF: 358.50,
  RON: 4.58,
  BGN: 1.80,
  HRK: 6.95,
  RSD: 108.00,
  BAM: 1.80,
  MKD: 56.80,
  ALL: 95.50,
  CLP: 925.00,
  COP: 3950,
  PEN: 3.72,
  UYU: 39.25,
  ARS: 875.00,
  BOB: 6.91,
  PYG: 7285,
  CUP: 24.00,
  GTQ: 7.82,
  HNL: 24.65,
  NIO: 36.65,
  CRC: 525.00,
  PAB: 1.00,
  DOP: 57.25,
  HTG: 131.50,
  JMD: 155.00,
  TTD: 6.78,
  BBD: 2.00,
  BSD: 1.00,
  BZD: 2.00,
  GYD: 209.00,
  SRD: 37.85,
  AWG: 1.79,
  ANG: 1.79,
  XCD: 2.70,
  FJD: 2.24,
  VUV: 119.00,
  WST: 2.72,
  TOP: 2.36,
  SBD: 8.45,
  PGK: 3.72
};

const validCurrencies = Object.keys(fallbackRates);

router.get('/rates', asyncHandler(async (req: Request, res: Response) => {
  const base = (req.query.base as string)?.toUpperCase() || 'USD';
  
  if (!validCurrencies.includes(base)) {
    const error = new Error('Invalid base currency');
    (error as any).statusCode = 400;
    throw error;
  }

  const cached = getCachedRates(base);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/' + base, {
      timeout: 5000
    });

    if (response.data && response.data.rates) {
      const result = {
        base: base,
        date: response.data.time_last_update_utc || new Date().toISOString().split('T')[0],
        rates: response.data.rates,
        timestamp: Date.now()
      };

      setCacheRates(base, result);
      return res.json(result);
    }
    throw new Error('Invalid response');
  } catch (error: any) {
    const rates: Record<string, number> = {};
    const baseRate = fallbackRates[base] || 1;
    
    for (const [currency, rate] of Object.entries(fallbackRates)) {
      rates[currency] = rate / baseRate;
    }

    const fallbackResult = {
      base: base,
      date: new Date().toISOString().split('T')[0],
      rates: rates,
      timestamp: Date.now(),
      fallback: true
    };
    
    setCacheRates(base, fallbackResult);
    return res.json(fallbackResult);
  }
}));

router.get('/currencies', asyncHandler(async (_req: Request, res: Response) => {
  const cached = ratesCache.get('_currencies');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  const currencies = validCurrencies;
    
  ratesCache.set('_currencies', { 
    data: currencies, 
    timestamp: Date.now() 
  });
    
  res.json(currencies);
}));

export default router;