"use client";

import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { countryMap } from "@/lib/countryUtils";
import type { NetworkListItem } from "@/lib/types";
import { MapPin, BriefcaseBusiness, MoveRight } from "lucide-react";

// SWR Fetcher function
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    error.message = `API request failed with status ${
      res.status
    }: ${await res.text()}`;
    throw error;
  }
  return res.json();
};

interface NetworkCardProps {
  network: NetworkListItem;
}

export default function NetworkCard({ network }: NetworkCardProps) {
  const router = useRouter();

  // Use SWR to fetch network details
  // The key is the URL, and the fetcher is the function to call
  const {
    data: networkDetails,
    error,
    isLoading,
  } = useSWR(
    `http://api.citybik.es/v2/networks/${network.id}`,
    fetcher, // Use the fetcher function
    {
      revalidateOnFocus: false, // Don't refetch automatically on window focus
    }
  );

  // Extract company and stations count safely from fetched data
  const company = networkDetails?.network?.company ?? [];
  const companyArray = Array.isArray(company) ? company : [company]; // Ensure it's an array
  // const stationsCount = networkDetails?.network?.stations?.length ?? 0; // If needed later

  const handleCardClick = (id: string) => {
    router.push(`/networks/${id}`);
  };

  return (
    <Card
      key={network.id} // Use network.id as the key for the card
      className=" hover:bg-accent transition-colors duration-300 cursor-pointer p-2 border-b-1 border-b-accent"
    >
      <CardContent className="p-2 px-4">
        <CardTitle className="font-semibold text-xl text-primary py-2">
          {network.name}
        </CardTitle>
        <CardDescription className="pb-2 flex gap-2 items-center">
          <div className="text-secondary bg-[#EFF4FE] p-1 rounded-md">
            <MapPin className="stroke-1" />
          </div>
          {network.location.city},{" "}
          {countryMap[network.location.country] || network.location.country}
        </CardDescription>
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 min-h-[40px]">
          {isLoading && <CardDescription>Loading details...</CardDescription>}
          {error && (
            <CardDescription className="text-red-500">
              Failed to load
            </CardDescription>
          )}
          {!isLoading && !error && networkDetails && (
            <>
              <CardDescription className="pb-2 flex gap-2 items-center flex-grow">
                <div className="text-secondary bg-[#EFF4FE] p-1 rounded-md">
                  <BriefcaseBusiness className="stroke-1" />
                </div>
                {companyArray.join(", ") || "N/A"}
              </CardDescription>
              <Button
                className="bg-white text-secondary hover:bg-primary hover:text-white transition-colors duration-300 rounded-full w-10 h-10 flex-shrink-0 md:w-[60px] cursor-pointer shadow-md"
                onClick={() => handleCardClick(network.id)}
              >
                <MoveRight className="stroke-2 antialiased" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
