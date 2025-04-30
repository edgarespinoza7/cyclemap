"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { columns } from "../app/(main)/networks/[id]/columns";
import { countryMap } from "@/lib/countryUtils";
import type { NetworkDetails, Station } from "@/lib/types";

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
    <div className="container mx-auto p-4 py-10 space-y-6">
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => router.back()}
      >
        ← Back to List
      </Button>
      <h2>{networkDetails.name}</h2>
      <div>
        {networkDetails.location && (
          <p>
            {networkDetails.location.city},{" "}
            {countryMap[networkDetails.location.country ?? ""] ||
              networkDetails.location.country}
          </p>
        )}
        {networkDetails.company && networkDetails.company.length > 0 && (
          <p>{networkDetails.company.join(", ")}</p>
        )}
      </div>
      <p>All{" "} <span className="border border-orange-500 rounded p-1">{stations.length}</span>{" "}stations</p>
      <div className="mt-8">
         <DataTable columns={columns} data={stations}></DataTable>
      </div>
    </div>
  );
}
