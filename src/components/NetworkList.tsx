"use client";

import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { countryMap } from "@/lib/countryUtils";
import Header from "./Header";
import type { Network, Country } from "@/lib/types";
import { Check, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import NetworkCard from "./NetworkCard"; // Import the new component
import { usePathname, useSearchParams, useRouter } from "next/navigation";

// Component Definition and Props
export default function NetworkList({ networks }: { networks: Network[] }) {
  const router = useRouter(); // For programmatic navigation (updating URL)
  const pathname = usePathname(); // Gets the current URL path
  const searchParams = useSearchParams(); // Gets the current URL query parameters

  // State for the search input, initialized from URL query param 'search' or empty
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  // State for the selected country filter, initialized from URL query param 'country' or empty
  const [countryFilter, setCountryFilter] = useState(
    () => searchParams.get("country") || ""
  );
  // State for the current page number in pagination
  const [page, setPage] = useState(1); // Current page number
  const pageSize = 7; // How many network cards to show per page

  // State to control whether the country filter combobox (popover) is open
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // Memoized calculation for available countries
  const availableCountries = useMemo(() => {
    return Array.from(new Set(networks.map((n) => n.location.country)))
      .map(
        (code): Country => ({
          code,
          name: countryMap[code] || code,
        })
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [networks]);

  // Memoized calculation for filtered networks
  // This recalculates whenever 'networks', 'search', or 'countryFilter' changes
  const filtered = useMemo(() => {
    return networks.filter((n) => {
      const matchesCountry = countryFilter
        ? n.location.country === countryFilter
        : true;
      if (!matchesCountry) return false;

      const searchTermLower = search.toLowerCase();
      if (!searchTermLower) return true;

      // Check if network name matches search term
      const matchesName = n.name.toLowerCase().includes(searchTermLower);

      // Check if any company name matches search term
      const matchesCompany = (n.company ?? []).some((c) =>
        c.toLowerCase().includes(searchTermLower)
      );

      // Filter by city (if needed)
      // const matchesCity = n.location.city.toLowerCase().includes(searchTermLower);
      return matchesName || matchesCompany;
    });
  }, [networks, search, countryFilter]);

  // Memoized calculation for paginated networks
  // This takes the 'filtered' list and slices it for the current 'page'.
  // It also handles resetting the page to 1 if filters change and the current page becomes invalid.
  const paginated = useMemo(() => {
    const newTotalPages = Math.ceil(filtered.length / pageSize);
    // If current page is beyond the new total pages (and there are pages), reset to page 1
    if (page > newTotalPages && newTotalPages > 0) {
      setPage(1);
    } else if (newTotalPages === 0 && page !== 1) {
      // If no results, reset to page 1
      setPage(1);
    }
    // Slice the filtered array to get items for the current page
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  // Memoized calculation for total pages
  // Recalculates if 'filtered' or 'pageSize' changes.
  const totalPages = useMemo(
    () => Math.ceil(filtered.length / pageSize),
    [filtered, pageSize]
  );

  // --Event Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Updates the 'countryFilter' state when a country is selected from the combobox
  const handleSelectCountry = (countryCode: string) => {
    setCountryFilter(countryCode);
    setIsComboboxOpen(false);
  };

  // Helper function to generate pagination range ( 1 ... 5 6 7 ... 10)
  // This logic is identical to the one in Data-table.tsx, might be good to centralize it
  const getPaginationRange = (
    currentPage: number,
    totalPages: number,
    siblingCount = 1
  ): (number | string)[] => {
    const totalPageNumbers = siblingCount + 5;

    // Case 1: If the number of pages is less than the page numbers we want to show
    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case 2: No left dots to show, jus right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    // Case 3: No right dots to show, just left dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + 1 + i
      );
      return [firstPageIndex, "...", ...rightRange];
    }

    // Case 4: Both left and right dots to be shown
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  // Memoized calculation for the actual pagination range to display
  const paginationRange = useMemo(() => {
    return getPaginationRange(page, totalPages);
  }, [page, totalPages]);

  // 12. Callback to update URL query parameters
  // Wrapped in useCallback to memoize the function itself
  const updateQueryParams = useCallback(
    (newSearch: string, newCountry: string) => {
      const params = new URLSearchParams(searchParams.toString()); // Create mutable copy

      // Set or delete 'search' param
      if (newSearch) {
        params.set("search", newSearch);
      } else {
        params.delete("search");
      }
      // Set or delete 'country' param
      if (newCountry) {
        params.set("country", newCountry);
      } else {
        params.delete("country");
      }

      params.delete("page"); // Always remove 'page' param from URL for simplicity

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // useEffect to sync local filter state with URL query parameters
  // This runs when 'search', 'countryFilter', 'updateQueryParams', or 'searchParams' changes.
  useEffect(() => {
    const currentSearchInUrl = searchParams.get("search") || "";
    const currentCountryInUrl = searchParams.get("country") || "";

    if (
      search !== currentSearchInUrl ||
      countryFilter !== currentCountryInUrl
    ) {
      updateQueryParams(search, countryFilter);
    }
  }, [search, countryFilter, updateQueryParams, searchParams]);

  // useEffect to reset page to 1 when filters change
  // This ensures users see the first page of new results
  useEffect(() => {
    setPage(1); // Reset page to 1 when networks change
  }, [search, countryFilter]);

  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] items-center justify-center text-3xl">
          Loading...
        </div>
      }
    >
      <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
        {/* Sidebar Header */}
        <div className="px-10 pt-10 pb-4">
          <Header />
        </div>

        <div className="px-10 pb-4 flex flex-col 2xl:flex-row gap-2">
          {/* Wrapper for Input and Country filters */}
          <div className="relative flex-grow">
            {" "}
            {/* Use flex-grow to take available space */}
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary"
              aria-hidden="true"
            />
            <Input
              placeholder="Search network"
              value={search}
              onChange={handleSearchChange}
              className="border-accent !bg-white border-1 rounded-full h-12 pl-12 text-primary"
            />
          </div>
          <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                role="combobox"
                aria-expanded={isComboboxOpen}
                className="bg-white hover:bg-accent rounded-full h-12 w-full sm:w-[114px] justify-start flex-shrink-0 text-primary border-accent border-1 overflow-hidden cursor-pointer"
                onClick={() => setIsComboboxOpen((prev) => !prev)} // Toggle combobox open state
              >
                <MapPin className="left-4 size-4 shrink-0 text-primary" />
                {countryFilter
                  ? countryMap[countryFilter] || countryFilter // Display selected country name
                  : "Country"}{" "}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
              <Command>
                <CommandInput placeholder="Search country..." />
                {/* Wrap CommandList around group/empty/items for scrolling */}
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {/* Option to clear filter */}
                    <CommandItem
                      key="all-countries"
                      value="All Countries" // Use empty string for "All"
                      onSelect={() => {
                        handleSelectCountry(""); // Call handler with empty string
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          countryFilter === "" ? "opacity-100" : "opacity-0" // Show check if "" is selected
                        )}
                      />
                      All Countries
                    </CommandItem>
                    {/* Map available countries */}
                    {availableCountries.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={country.name} // Use code as the value for selection logic
                        className="hover:bg-accent cursor-pointer"
                        onSelect={(currentValue) => {
                          const selectedCountry = availableCountries.find(
                            (c) => c.name === currentValue
                          );

                          const codeToSet = selectedCountry
                            ? selectedCountry.code
                            : "";

                          const shouldClear = countryFilter === codeToSet;

                          handleSelectCountry(shouldClear ? "" : codeToSet);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            countryFilter === country.code
                              ? "opacity-100"
                              : "opacity-0" // Show check if this country is selected
                          )}
                        />
                        {country.name} {/* Display the country name */}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {/* Network Cards */}
        <ScrollArea className="flex-1 px-10">
          <div className="space-y-4">
            {paginated.map((network) => (
              <NetworkCard key={network.id} network={network} />
            ))}
          </div>

          {/* Pagination Controls */}
          {/* Only show if there are multiple pages */}
          {totalPages > 1 && (
            <div className="py-4 sticky bottom-0 bg-background z-10 border-t border-accent">
              {" "}
              {/* Center the pagination */}
              <Pagination>
                <PaginationContent>
                  {/* Previous Button */}
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      // Add aria-disabled for accessibility, Shadcn might style based on this
                      aria-disabled={page === 1}
                      // Add Tailwind class for visual disabling
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {/* Page Numbers and Ellipses */}
                  {paginationRange.map((pageNumber, index) => (
                    <PaginationItem key={index}>
                      {typeof pageNumber === "string" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setPage(pageNumber)}
                          isActive={page === pageNumber}
                          aria-current={
                            page === pageNumber ? "page" : undefined
                          }
                          className="cursor-pointer text-primary hover:bg-accent transition-colors duration-300" // Ensure links look clickable
                        >
                          {pageNumber}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  {/* Next Button */}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      aria-disabled={page === totalPages}
                      className={
                        page === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </ScrollArea>
      </div>
    </Suspense>
  );
}
