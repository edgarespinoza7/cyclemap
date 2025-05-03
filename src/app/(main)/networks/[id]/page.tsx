import { Button } from "@/components/ui/button";
import Link from "next/link";
import NetworkDetailDisplay from "@/components/NetworkDetailDisplay";
import { getNetworkDetailsById } from "@/lib/api";
import type { Station } from "@/lib/types";
import type { Metadata } from "next";

// Define the props with params as a Promise
interface Props {
  params: Promise<{ id: string }>;
}

// Update the page component to await params
export default async function NetworkDetailPage({ params }: Props) {
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
    <NetworkDetailDisplay networkDetails={networkDetails} stations={stations} />
  );
}

// Update the generateMetadata function to await params
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Network Details - ${id}`,
  };
}
