// Network
export interface Network {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  company?: string[];
  stations?: Station[];
}


// Station
export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  free_bikes: number;
  empty_slots: number;
  extra: {
    address?: string; 
    uid?: string; 
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
  };
}


// Type for the country data used in filters/maps
export interface Country {
  code: string;
  name: string;
}

// Type for the country code -> name map
export type CountryCodeMap = Record<string, string>;

// NetworkDetailDisplay

export interface NetworkDetailDisplayProps {
  networkDetails: Network;
  stations: Station[];
}
