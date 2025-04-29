"use client";
import { ColumnDef, Column, HeaderContext } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Reusable Header component/function for sorting
const SortableHeader = <TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>;
  title: string;
}) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="-ml-4" // Adjust margin to align text visually
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

export const columns: ColumnDef<Station>[] = [
  {
    accessorFn: (row) => row.name || row.extra.address,
    header: "Station Name",
  },
  {
    accessorKey: "free_bikes",
    header: ({ column }: HeaderContext<Station, unknown>) => (
      <SortableHeader column={column} title="Free Bikes" />
    ),
    enableSorting: true,
  },
  {
    accessorKey: "empty_slots",
    header: ({ column }) => (
      <SortableHeader column={column} title="Empty Slots" />
    ),
    enableSorting: true,
  },
];
