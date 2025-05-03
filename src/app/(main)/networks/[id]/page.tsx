import { Button } from "@/components/ui/button";
import Link from "next/link";
import NetworkDetailDisplay from "@/components/NetworkDetailDisplay";
import { getNetworkDetailsById } from "@/lib/api";
import type { Station } from "@/lib/types";
import { ReactElement } from "react";

// Define an explicit type for the props
type NetworkDetailPageProps = {
  params: { id: string };
};

export default async function NetworkDetailPage({ params }: NetworkDetailPageProps): Promise<ReactElement> {
  const { id } = params;

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
    <NetworkDetailDisplay networkDetails={networkDetails} stations={stations} />
  );
}
