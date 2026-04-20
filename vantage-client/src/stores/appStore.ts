import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Trip, POI } from '../types';

interface AppState {
  user: User | null;
  trips: Trip[];
  currentTrip: Trip | null;
  isAuthenticated: boolean;
  presenceCount: number;
  
  setUser: (user: User | null) => void;
  setTrips: (trips: Trip[]) => void;
  setCurrentTrip: (trip: Trip | null) => void;
  setPresenceCount: (count: number) => void;
  logout: () => void;
  
  addPOI: (poi: POI) => void;
  updatePOI: (poiId: string, poi: Partial<POI>) => void;
  removePOI: (poiId: string) => void;
  promotePOI: (poiId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      trips: [],
      currentTrip: null,
      isAuthenticated: false,
      presenceCount: 0,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTrips: (trips) => set({ trips }),
      setCurrentTrip: (trip) => set({ currentTrip: trip }),
      setPresenceCount: (count) => set({ presenceCount: count }),
      logout: () => set({ 
        user: null, 
        trips: [], 
        currentTrip: null, 
        isAuthenticated: false,
        presenceCount: 0 
      }),

      addPOI: (poi) => set((state) => {
        if (!state.currentTrip) return state;
        return {
          currentTrip: {
            ...state.currentTrip,
            pois: [...state.currentTrip.pois, poi]
          }
        };
      }),

      updatePOI: (poiId, updatedPOI) => set((state) => {
        if (!state.currentTrip) return state;
        return {
          currentTrip: {
            ...state.currentTrip,
            pois: state.currentTrip.pois.map((poi) =>
              poi._id === poiId ? { ...poi, ...updatedPOI } : poi
            )
          }
        };
      }),

      removePOI: (poiId) => set((state) => {
        if (!state.currentTrip) return state;
        return {
          currentTrip: {
            ...state.currentTrip,
            pois: state.currentTrip.pois.filter((poi) => poi._id !== poiId)
          }
        };
      }),

      promotePOI: (poiId) => set((state) => {
        if (!state.currentTrip) return state;
        return {
          currentTrip: {
            ...state.currentTrip,
            pois: state.currentTrip.pois.map((poi) =>
              poi._id === poiId ? { ...poi, status: 'confirmed' as const } : poi
            )
          }
        };
      })
    }),
    {
      name: 'vantage-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);