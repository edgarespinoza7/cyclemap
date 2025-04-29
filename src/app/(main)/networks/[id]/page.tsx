import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { countryMap } from "@/lib/countryUtils";
import type { NetworkDetails, Station } from "@/lib/types";




async function getNetworkDetails(id: string): Promise<NetworkDetails | null> {
  try {
    const response = await fetch(`http://api.citybik.es/v2/networks/${id}`, {
      next: { revalidate: 600 },
    });
    if (!response.ok) {
      console.error(
        `API Error for ${id}: ${response.status} ${response.statusText}`
      );
      return null;
    }
    const data = await response.json();

    return data.network as NetworkDetails;
  } catch (error) {
    console.error(`Failed to fetch details for network ${id}:`, error);
    return null;
  }
}

export default async function NetworkDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="p-4">
        <p>Invalid network ID provided.</p>
        <Button asChild variant="link">
          <Link href="/">Back to list</Link>
        </Button>
      </div>
    );
  }

  const networkDetails = await getNetworkDetails(id);

  if (!networkDetails) {
    return (
      <div className="p-4">
        <p>Network not found or failed to load.</p>
        <Button asChild variant="link">
          <Link href="/">Back to list</Link>
        </Button>
      </div>
    );
  }

  const stations: Station[] = networkDetails.stations || [];

  return (
    <div className="container mx-auto py-10 px-4 space-y-6">
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link href="/">← Back to List</Link>
      </Button>
      <h2 className="text-3xl font-bold tracking-tight">
        {networkDetails.name}
      </h2>
      <div className="text-muted-foreground space-x-2">
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
      <p>
        All{" "}
        <span className="border border-orange-500 rounded p-1">
          {stations.length}
        </span>{" "}
        Stations
      </p>
      <div className="mt-8">
        <DataTable columns={columns} data={stations} />
      </div>
    </div>
  );
}
