// src/types/index.ts

// --- Location ---
export interface LocationInfo {
  city: string;
  country: string; // Usually the 2-letter code from the API
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// --- Station ---
// Represents a single bike station, often part of NetworkDetails
export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  free_bikes: number;
  empty_slots: number;
  extra: {
    address?: string; // Make optional if not always present
    uid?: string; // Make optional if not always present
    renting?: number;
    returning?: number;
    last_updated?: number;
    has_ebikes?: boolean;
    ebikes?: number;
    payment?: string[];
    "payment-terminal"?: boolean;
    slots?: number;
    rental_uris?: {
      [key: string]: string;
    };
    // Add any other potential fields in 'extra' as optional
  };
}

// --- Network ---

export interface Network {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
}

// Basic network info, often used in lists
export interface NetworkListItem {
  id: string;
  name: string;
  location: LocationInfo;
}

// Network info specifically for map markers, requires coordinates
export interface NetworkMapSummary {
  id: string;
  name: string;
  location: LocationInfo & Coordinates; // Combines LocationInfo and Coordinates
}

// Detailed network info, typically fetched for a specific network page
export interface NetworkDetails {
  id: string; // Assuming ID is available even if not explicitly typed before
  name: string;
  location?: LocationInfo; // Location might be optional in some API responses
  company?: string[];
  stations?: Station[];
}

// --- Component-Specific State ---

// Represents the additional data fetched asynchronously for the NetworkList
export interface NetworkListAdditionalData {
  company: string[];
  stations: number; // Station count
}

// Type for the country data used in filters/maps
export interface Country {
  code: string;
  name: string;
}

// Type for the country code -> name map
export type CountryCodeMap = Record<string, string>;

