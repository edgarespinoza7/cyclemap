"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "./Data-table";
import { columns } from "./columns";
import { countryMap } from "@/lib/countryUtils";
import type { Station, NetworkDetailDisplayProps } from "@/lib/types";
import { MoveLeft, MapPin, BriefcaseBusiness } from "lucide-react";
import { useMapInteraction } from "@/context/MapInteractionContext";
import { ScrollArea } from "@/components/ui/scroll-area";

// Component Definition and Props
export default function NetworkDetailDisplay({
  networkDetails,
  stations,
}: NetworkDetailDisplayProps) {
   // Hooks
  const router = useRouter();  // For navigating back
  const { selectStation } = useMapInteraction(); // To tell the map which station is selected

  return (
    <div className="mx-auto bg-primary text-white h-full flex flex-col overflow-y-auto  scrollbar-hide">
      <div className="relative bg-[url('/network-detail-bgimage.jpg')] bg-cover bg-center bg-no-repeat pl-10 py-8 pr-6 h-[252px]">
        <div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent"></div>
          <div className="relative z-10">
            <Button
              className="bg-white text-secondary hover:bg-secondary hover:text-white cursor-pointer rounded-full p-5"
              onClick={() => router.back()}
            >
              <MoveLeft className="w-24 h-24 stroke-2" />
            </Button>
            <div className="mt-10 ">
              <h2 className="font-bold text-3xl">{networkDetails.name}</h2>
              <div className="mt-2 flex flex-col space-y-2">
                {networkDetails.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin />
                    <p className="text-base ">
                      {networkDetails.location.city},{" "}
                      {countryMap[networkDetails.location.country ?? ""] ||
                        networkDetails.location.country}
                    </p>
                  </div>
                )}
                {networkDetails.company &&
                  networkDetails.company.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <BriefcaseBusiness size={20} className="stroke-2" />
                      <p className="text-base">
                        {networkDetails.company.join(", ")}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-10 pb-4">
        <div className="pl-2 py-4">
          <p>
            All{" "}
            <span className="border border-orange-500 rounded p-1">
              {stations.length}
            </span>{" "}
            stations
          </p>
        </div>

        <DataTable
          columns={columns}
          data={stations}
          onRowClick={(station) => selectStation(station as Station)}
        />
      </ScrollArea>
    </div>
  );
}
