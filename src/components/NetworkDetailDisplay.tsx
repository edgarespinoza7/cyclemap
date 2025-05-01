"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { columns } from "../app/(main)/networks/[id]/columns";
import { countryMap } from "@/lib/countryUtils";
import type { NetworkDetails, Station } from "@/lib/types";
import { MoveLeft, MapPin, BriefcaseBusiness } from "lucide-react";

interface NetworkDetailDisplayProps {
  networkDetails: NetworkDetails;
  stations: Station[];
}

export default function NetworkDetailDisplay({
  networkDetails,
  stations,
}: NetworkDetailDisplayProps) {
  const router = useRouter();

  return (
    <div className="container mx-auto bg-[#363698] text-white">
      <div className="bg-[url('/network-detail-bgimage.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="relative pl-10 pr-6">
          <Button
            className="bg-white text-[#F37B44] hover:bg-[#F37B44] hover:text-white cursor-pointer rounded-full p-5 absolute top-8 left-10"
            onClick={() => router.back()}
          >
            <MoveLeft className="w-24 h-24 stroke-2" />
          </Button>
          <h2 className="font-bold text-3xl pt-6">{networkDetails.name}</h2>
          <div>
            {networkDetails.location && (
              <div className="flex items-center space-x-2 pt-4">
                <MapPin />
                <p className="text-base ">
                  {networkDetails.location.city},{" "}
                  {countryMap[networkDetails.location.country ?? ""] ||
                    networkDetails.location.country}
                </p>
              </div>
            )}
            {networkDetails.company && networkDetails.company.length > 0 && (
              <div className="flex items-start space-x-2 pt-4">
                <BriefcaseBusiness size={30} className="stroke-2" />
                <p>{networkDetails.company.join(", ")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-10 pt-2">
        <div className="pl-2 mb-3">
          <p>
            All{" "}
            <span className="border border-orange-500 rounded p-1">
              {stations.length}
            </span>{" "}
            stations
          </p>
        </div>
        <DataTable columns={columns} data={stations}></DataTable>
      </div>
    </div>
  );
}
