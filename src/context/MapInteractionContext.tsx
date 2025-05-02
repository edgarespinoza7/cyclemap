'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { Station } from '@/lib/types';

interface MapInteractionContextType {
  selectedStation: Station | null; // Store the whole station object for easier access in Map
  selectStation: (station: Station | null) => void;
}

const MapInteractionContext = createContext<MapInteractionContextType | undefined>(undefined);

export const MapInteractionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const selectStation = useCallback((station: Station | null) => {
    setSelectedStation(station);
  }, []);

  return (
    <MapInteractionContext.Provider value={{ selectedStation, selectStation }}>
      {children}
    </MapInteractionContext.Provider>
  );
};

export const useMapInteraction = () => {
  const context = useContext(MapInteractionContext);
  if (context === undefined) {
    throw new Error('useMapInteraction must be used within a MapInteractionProvider');
  }
  return context;
};