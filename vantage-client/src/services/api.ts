import axios from 'axios';
import type { AuthResponse, Trip, GeocodingResult, CurrencyRates } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const auth = {
  register: async (email: string, password: string, name: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/register', { email, password, name });
    return data;
  },
  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
    return data;
  },
  logout: async () => {
    await api.post('/api/auth/logout');
  },
  me: async () => {
    const { data } = await api.get('/api/auth/me');
    return data;
  }
};

export const trips = {
  create: async (trip: Partial<Trip>) => {
    const { data } = await api.post<Trip>('/api/trips', trip);
    return data;
  },
  getAll: async () => {
    const { data } = await api.get<Trip[]>('/api/trips');
    return data;
  },
  getById: async (id: string) => {
    const { data } = await api.get<Trip>(`/api/trips/${id}`);
    return data;
  },
  update: async (id: string, trip: Partial<Trip>) => {
    const { data } = await api.put<Trip>(`/api/trips/${id}`, trip);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/api/trips/${id}`);
  },
  join: async (code: string) => {
    const trip = await api.get<Trip>(`/api/trips/by-code/${code}`);
    const { data } = await api.post<Trip>(`/api/trips/${trip.data._id}/join`, { code });
    return data;
  },
  getByCode: async (code: string) => {
    const { data } = await api.get<Trip>(`/api/trips/by-code/${code}`);
    return data;
  }
};

export const pois = {
  add: async (tripId: string, poi: object) => {
    const { data } = await api.post(`/api/trips/${tripId}/pois`, poi);
    return data;
  },
  update: async (tripId: string, poiId: string, poi: object) => {
    const { data } = await api.put(`/api/trips/${tripId}/pois/${poiId}`, poi);
    return data;
  },
  delete: async (tripId: string, poiId: string) => {
    await api.delete(`/api/trips/${tripId}/pois/${poiId}`);
  },
  vote: async (tripId: string, poiId: string) => {
    const { data } = await api.post(`/api/trips/${tripId}/pois/${poiId}/vote`);
    return data;
  },
  confirm: async (tripId: string, poiId: string) => {
    const { data } = await api.post(`/api/trips/${tripId}/pois/${poiId}/confirm`);
    return data;
  }
};

export const geocode = {
  search: async (query: string) => {
    const { data } = await api.get<GeocodingResult[]>('/api/geocode/search', {
      params: { q: query }
    });
    return data;
  },
  reverse: async (lat: number, lng: number) => {
    const { data } = await api.get<GeocodingResult>('/api/geocode/reverse', {
      params: { lat, lng }
    });
    return data;
  }
};

export const currency = {
  getRates: async (baseCurrency: string = 'USD') => {
    const { data } = await api.get<CurrencyRates>('/api/currency/rates', {
      params: { base: baseCurrency }
    });
    return data;
  }
};

export default api;