"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import countries from "@/data/countries.json";

const countryMap = countries.data.reduce((map, country) => {
  map[country.code] = country.name;
  return map;
}, {} as Record<string, string>);

interface Network {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
  };
}

export default function NetworkList({ networks }: { networks: Network[] }) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const countries = Array.from(new Set(networks.map((n) => n.location.country)))
    .map((code) => ({
      code,
      name: countryMap[code] || code, // Fallback to code if name is not found
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filtered = networks.filter((n) => {
    const matchesSearch = n.name.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter
      ? n.location.country === countryFilter
      : true;
    return matchesSearch && matchesCountry;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search network"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="p-2 border rounded-md ml-2"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          <option value="">All Countries</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <ScrollArea className="h-[70vh] pr-2">
        <div className="space-y-2">
          {paginated.map((network) => (
            <Dialog key={network.id}>
              <DialogTrigger asChild>
                <Card className="hover:shadow transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <h2 className="font-semibold text-lg">{network.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {network.location.city}, {network.location.country}
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{network.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {network.location.city}, {network.location.country}
                  </p>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
