

import { Button } from "@/components/ui/button";
import Link from "next/link";
import NetworkDetailDisplay from "@/components/NetworkDetailDisplay";
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
    <NetworkDetailDisplay
      networkDetails={networkDetails}
      stations={stations}
    />
  );
}
