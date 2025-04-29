"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose, 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Country {
  code: string;
  name: string;
}

interface CountryFilterModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void; // Control modal visibility
  availableCountries: Country[];
  selectedCountryCode: string; // Current filter value
  onSelectCountry: (countryCode: string) => void; // Callback to update filter
}

export function CountryFilterModal({
  isOpen,
  onOpenChange,
  availableCountries,
  selectedCountryCode,
  onSelectCountry,
}: CountryFilterModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCountries = useMemo(() => {
    if (!searchTerm) {
      return availableCountries;
    }
    return availableCountries.filter((country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCountries, searchTerm]);

  const handleCountryClick = (countryCode: string) => {
    onSelectCountry(countryCode);
    // No need to call onOpenChange(false) here if using DialogClose below
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <VisuallyHidden>
          <DialogHeader>
          <DialogTitle>Filter by Country</DialogTitle>
          <DialogDescription>
            Select a country to filter the network list.
          </DialogDescription>
        </DialogHeader>
        </VisuallyHidden>
        <div className="py-4 space-y-4">
          <Input
            placeholder="Search country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search countries"
          />
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-2 space-y-1">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  // Use DialogClose to automatically close the dialog on click
                  <DialogClose key={country.code} asChild>
                    <Button
                      variant={selectedCountryCode === country.code ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleCountryClick(country.code)}
                    >
                      {country.name}
                    </Button>
                  </DialogClose>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground p-4">
                  No countries match your search.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
