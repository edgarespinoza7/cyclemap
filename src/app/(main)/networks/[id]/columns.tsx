"use client"
import { ColumnDef } from "@tanstack/react-table";


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
    address: string;
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
    accessorKey: "extra.address",
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