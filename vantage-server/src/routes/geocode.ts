import { Router, Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

interface CacheEntry {
  data: any;
  timestamp: number;
}

const searchCache: Map<string, CacheEntry> = new Map();
const reverseCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const getCached = (cache: Map<string, CacheEntry>, key: string) => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (cache: Map<string, CacheEntry>, key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string') {
    const error = new Error('Search query is required');
    (error as any).statusCode = 400;
    throw error;
  }

  const cacheKey = q.toLowerCase().trim();
  const cached = getCached(searchCache, cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const response = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: {
      q,
      format: 'json',
      limit: 10,
      addressdetails: 1
    },
    headers: {
      'User-Agent': 'Vantage Travel App (https://vantage.app)'
    }
  });

  const results = response.data.map((item: any) => ({
    lat: item.lat,
    lon: item.lon,
    display_name: item.display_name,
    name: item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0],
    type: item.type,
    address: {
      city: item.address?.city,
      town: item.address?.town,
      village: item.address?.village,
      country: item.address?.country,
      country_code: item.address?.country_code
    }
  }));

  setCache(searchCache, cacheKey, results);
  res.json(results);
}));

router.get('/reverse', asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.query;
  
  if (lat == null || lng == null) {
    const error = new Error('lat and lng are required');
    (error as any).statusCode = 400;
    throw error;
  }

  const latNum = parseFloat(lat as string);
  const lngNum = parseFloat(lng as string);
  
  if (isNaN(latNum) || isNaN(lngNum)) {
    const error = new Error('Invalid coordinates');
    (error as any).statusCode = 400;
    throw error;
  }

  const cacheKey = `${latNum.toFixed(4)},${lngNum.toFixed(4)}`;
  const cached = getCached(reverseCache, cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: {
      lat: latNum,
      lon: lngNum,
      format: 'json',
      addressdetails: 1
    },
    headers: {
      'User-Agent': 'Vantage Travel App (https://vantage.app)'
    }
  });

  const result = {
    lat: response.data.lat,
    lon: response.data.lon,
    display_name: response.data.display_name,
    name: response.data.address?.city || response.data.address?.town || response.data.address?.village || response.data.display_name.split(',')[0],
    address: {
      city: response.data.address?.city,
      town: response.data.address?.town,
      village: response.data.address?.village,
      country: response.data.address?.country,
      country_code: response.data.address?.country_code,
      road: response.data.address?.road,
      postcode: response.data.address?.postcode
    }
  };

  setCache(reverseCache, cacheKey, result);
  res.json(result);
}));

export default router;