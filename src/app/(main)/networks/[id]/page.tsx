

import { Button } from "@/components/ui/button";
import Link from "next/link";
import NetworkDetailDisplay from "@/components/NetworkDetailDisplay";
import { getNetworkDetailsById } from "@/lib/api";
import type { Station } from "@/lib/types";




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

  const networkDetails = await getNetworkDetailsById(id);

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
