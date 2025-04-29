"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import countries from "@/data/countries.json";
import Header from "./Header";
import { CountryFilterModal } from "./CountryFilterModal";

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

interface AdditionalData {
  company: string[];
  stations: number;
}

export default function NetworkList({ networks }: { networks: Network[] }) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const router = useRouter();
  const [additionalData, setAdditionalData] = useState<
    Record<string, AdditionalData>
  >({});
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  const fetchAdditionalData = async (id: string) => {
    try {
      const response = await fetch(`http://api.citybik.es/v2/networks/${id}`, {
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(
          `API request failed for ID ${id} with status ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      setAdditionalData((prev) => ({
        ...prev,
        [id]: {
          company: data.network.company || [],
          stations: data.network.stations?.length || 0,
        },
      }));
      console.log(data);
    } catch (error) {
      console.error(
        `Failed to fetch additional data for network ${id}:`,
        error
      );
    }
  };

  const handleCardClick = (id: string) => {
    router.push(`/networks/${id}`);
  };


  const availableCountries = useMemo(() => {
    return Array.from(new Set(networks.map((n) => n.location.country)))
      .map((code) => ({
        code,
        name: countryMap[code] || code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [networks]); 

  const filtered = networks.filter((n) => {
    const matchesSearch = n.name.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter
      ? n.location.country === countryFilter
      : true;
    return matchesSearch && matchesCountry;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalPages = Math.ceil(filtered.length / pageSize);

  useEffect(() => {
    paginated.forEach((network) => {
      if (!additionalData[network.id]) {
        fetchAdditionalData(network.id);
      }
    });
  }, [paginated, additionalData]);

  // Callback function to update the filter from the modal
  const handleSelectCountry = (countryCode: string) => {
    setCountryFilter(countryCode);
    setPage(1); 
    
  };

  return (
    <div className="space-y-4 px-4 pt-2 overflow-y-auto">
      {/* Sidebar Header */}
      <Header />
      <div className="flex flex-col 2xl:flex-row gap-2">
        <Input
          placeholder="Search network"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          variant="outline"
          onClick={() => setIsCountryModalOpen(true)}
          className="flex-shrink-0" // Prevent button from shrinking too much
        >
          Country
        </Button>
    
      </div>
      {/* Network Cards */}
      <ScrollArea className="h-[70vh]">
        <div className="space-y-2">
          {paginated.map((network) => (
            <Card
              key={network.id}
              className="hover:shadow transition-shadow cursor-pointer"
              onClick={() => handleCardClick(network.id)}
            >
              <CardContent className="p-4">
                <h2 className="font-semibold text-lg">{network.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {network.location.city},{" "}
                  {countryMap[network.location.country] ||
                    network.location.country}
                </p>
                {additionalData[network.id] && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>
                      Company: {additionalData[network.id].company.join(", ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
      {/* Pagination Controls */}
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
      {/* Modal */}
      <CountryFilterModal
        isOpen={isCountryModalOpen}
        onOpenChange={setIsCountryModalOpen} 
        availableCountries={availableCountries}
        selectedCountryCode={countryFilter}
        onSelectCountry={handleSelectCountry} 
      />
    </div>
  );
}
