export interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface POI {
  _id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  category: POICategory;
  cost?: number;
  currency?: string;
  addedBy: string | { _id: string; name: string; email?: string };
  status: 'suggestion' | 'confirmed';
  votes: string[];
  createdAt: string;
}

export type POICategory =
  | 'restaurant'
  | 'hotel'
  | 'activity'
  | 'transport'
  | 'attractions'
  | 'other';

export interface TripMember {
  user: User | string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Trip {
  _id: string;
  name: string;
  description?: string;
  destination: {
    name: string;
    lat: number;
    lng: number;
  };
  startDate: string;
  endDate: string;
  budget: {
    total: number;
    currency: string;
  };
  createdBy: string;
  inviteCode: string;
  members: TripMember[];
  pois: POI[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
  };
}

export interface CurrencyRates {
  [key: string]: number;
}