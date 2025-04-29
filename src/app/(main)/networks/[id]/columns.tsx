"use client"
import { ColumnDef } from "@tanstack/react-table";
import Station from "./page";

// Define the Station type
interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  free_bikes: number;
  empty_slots: number;
  extra: {
    uid: string;
    renting: number;
    returning: number;
    last_updated: number;
    has_ebikes: boolean;
    ebikes: number;
    payment: string[];
    "payment-terminal": boolean;
    slots: number;
    rental_uris: {
      [key: string]: string;
    };
  };
}


export const columns: ColumnDef<Station, unknown>[] = [
  {
    accessorKey: "station_name",
    header: "Station Name",
  },
  {
    accessorKey: "free_bikes",
    header: "Free Bikes",
    
  },
  {
    accessorKey: "empty_slots",
    header: "Empty Slots",
    
  },
]