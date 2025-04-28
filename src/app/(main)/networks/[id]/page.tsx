// src/app/(main)/networks/[id]/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Example: Fetch specific network data (replace with your actual API call)
async function getNetworkDetails(id: string) {
  try {
    // Use the same API endpoint NetworkList uses for additional data,
    // or a dedicated one if available.
    const response = await fetch(`http://api.citybik.es/v2/networks/${id}`);
    if (!response.ok) {
      throw new Error("Network not found");
    }
    const data = await response.json();
    // You might want to define a more specific type for NetworkDetails
    return data.network;
  } catch (error) {
    console.error(`Failed to fetch details for network ${id}:`, error);
    return null; // Handle error case
  }
}

export default async function NetworkDetailPage({ params }: { params: { id: string } }) {
  const networkDetails = await getNetworkDetails(params.id);

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

  // This content will be rendered inside the {children} of MainLayout
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
      {/* Add more details as needed */}

      {/* Maybe add a list of stations here eventually */}
    </div>
  );
}
