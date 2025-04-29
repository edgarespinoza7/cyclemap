import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RentalUris {
  android: string;
  ios: string;
}

interface StationExtra {
  uid: string;
  renting: number;
  returning: number;
  last_updated: number;
  has_ebikes: boolean;
  ebikes: number;
  payment: string[];
  "payment-terminal": boolean;
  slots: number;
  rental_uris: RentalUris;
}

interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  free_bikes: number;
  empty_slots: number;
  extra: StationExtra;
}

interface NetworkDetails {
  name: string;
  location?: { city: string; country: string };
  company?: string[];
  stations?: Station[];
}
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

  return (
    <div className="p-4 space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/">← Back to List</Link>
      </Button>
      <h2 className="text-2xl font-bold">{networkDetails.name}</h2>
      <p className="text-muted-foreground">
        {networkDetails.location?.city}, {networkDetails.location?.country}
      </p>
      <p>Company: {networkDetails.company?.join(", ") || "N/A"}</p>
      <p>Stations: {networkDetails.stations?.length || 0}</p>
    </div>
  );
}
